
-- Drop the conflicting function if it exists
DROP FUNCTION IF EXISTS public.generate_magic_link(uuid);
DROP FUNCTION IF EXISTS public.generate_magic_link(text);

-- Create password_reset_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    token text NOT NULL UNIQUE,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    member_number text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    invalidated_at timestamp with time zone,
    attempts integer DEFAULT 0
);

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);

-- Add RLS policies
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow system to manage tokens
CREATE POLICY "System manage tokens" ON public.password_reset_tokens
    USING (true)
    WITH CHECK (true);

-- Create or replace the handle_password_reset_request function
CREATE OR REPLACE FUNCTION public.handle_password_reset_request(
    p_member_number text,
    p_email text,
    p_new_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_record RECORD;
    v_is_temp_email BOOLEAN;
    v_token TEXT;
    v_transition_id UUID;
BEGIN
    -- Get member info
    SELECT * INTO v_member_record
    FROM members
    WHERE member_number = p_member_number;

    IF v_member_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Member not found'
        );
    END IF;

    -- Check if current email is temporary
    v_is_temp_email := public.is_temp_email(v_member_record.email);

    -- Validate email scenarios
    IF v_is_temp_email THEN
        -- Temp email case - require new personal email
        IF p_new_email IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'New email required for temporary email address'
            );
        END IF;

        -- Validate new email
        IF public.is_temp_email(p_new_email) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Cannot use temporary email as new email'
            );
        END IF;

        -- Track email transition
        INSERT INTO password_reset_email_transitions (
            member_number,
            old_email,
            new_email,
            transition_type
        ) VALUES (
            p_member_number,
            v_member_record.email,
            p_new_email,
            'temp_to_personal'
        ) RETURNING id INTO v_transition_id;

        -- Generate reset token
        v_token := encode(digest(gen_random_uuid()::text, 'sha256'), 'base64');
        
        INSERT INTO password_reset_tokens (
            token,
            user_id,
            member_number,
            expires_at
        ) VALUES (
            v_token,
            v_member_record.auth_user_id,
            p_member_number,
            now() + interval '1 hour'
        );

        -- Update member email
        UPDATE members
        SET email = p_new_email
        WHERE member_number = p_member_number;

        -- Update auth.users email
        UPDATE auth.users
        SET email = p_new_email,
            updated_at = now()
        WHERE id = v_member_record.auth_user_id;

    ELSE
        -- Personal email case - must match exactly
        IF v_member_record.email != p_email THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Email does not match our records'
            );
        END IF;

        -- Generate reset token
        v_token := encode(digest(gen_random_uuid()::text, 'sha256'), 'base64');
        
        INSERT INTO password_reset_tokens (
            token,
            user_id,
            member_number,
            expires_at
        ) VALUES (
            v_token,
            v_member_record.auth_user_id,
            p_member_number,
            now() + interval '1 hour'
        );
    END IF;

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'token', v_token,
        'email', COALESCE(p_new_email, p_email),
        'transition_id', v_transition_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Log error if transition was created
    IF v_transition_id IS NOT NULL THEN
        UPDATE password_reset_email_transitions
        SET status = 'failed',
            error_message = SQLERRM,
            completed_at = now()
        WHERE id = v_transition_id;
    END IF;

    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Create or replace the validate_reset_token function
CREATE OR REPLACE FUNCTION public.validate_reset_token(token_value text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_token_record password_reset_tokens%ROWTYPE;
    v_user_data jsonb;
BEGIN
    -- Get token record
    SELECT * INTO v_token_record
    FROM password_reset_tokens
    WHERE token = token_value
    AND used_at IS NULL
    AND invalidated_at IS NULL
    AND expires_at > now();

    -- If no valid token found
    IF v_token_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Invalid or expired token'
        );
    END IF;

    -- Get user data
    SELECT jsonb_build_object(
        'user_id', m.auth_user_id,
        'email', m.email,
        'member_number', m.member_number
    ) INTO v_user_data
    FROM members m
    WHERE m.auth_user_id = v_token_record.user_id;

    -- Return success with user data
    RETURN jsonb_build_object(
        'valid', true,
        'user', v_user_data
    );
END;
$$;

-- Drop the duplicate function type
DROP TYPE IF EXISTS public.magic_link_token CASCADE;
