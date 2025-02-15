
-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the function with proper crypto
CREATE OR REPLACE FUNCTION public.initiate_email_transition_with_reset(
    p_member_number text,
    p_new_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member RECORD;
    v_rate_limit_check jsonb;
    v_email text;
    v_reset_token text;
    v_verification_token text;
    v_transition_id uuid;
BEGIN
    -- Get member info
    SELECT * INTO v_member
    FROM members
    WHERE member_number = p_member_number;

    IF v_member IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Member not found'
        );
    END IF;

    -- Check rate limits using client IP from request context
    SELECT check_password_reset_rate_limit(p_member_number, coalesce(inet_client_addr()::text, 'localhost'))
    INTO v_rate_limit_check;

    IF NOT (v_rate_limit_check->>'allowed')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Too many attempts. Please try again later.',
            'code', 'RATE_LIMIT_EXCEEDED',
            'remaining_time', v_rate_limit_check->>'remaining_time'
        );
    END IF;

    -- Generate reset token using crypto secure method
    v_reset_token := encode(gen_random_uuid()::text::bytea, 'base64');
    
    -- Insert into password_reset_tokens
    INSERT INTO password_reset_tokens (
        token,
        user_id,
        member_number,
        expires_at
    ) VALUES (
        v_reset_token,
        v_member.auth_user_id,
        p_member_number,
        now() + interval '1 hour'
    );

    -- Handle email transition if needed
    IF p_new_email IS NOT NULL THEN
        -- Generate verification token
        v_verification_token := encode(gen_random_uuid()::text::bytea, 'base64');
        
        -- Track transition
        INSERT INTO password_reset_email_transitions (
            member_number,
            old_email,
            new_email,
            verification_token,
            transition_type
        ) VALUES (
            p_member_number,
            v_member.email,
            p_new_email,
            v_verification_token,
            'temp_to_personal'
        ) RETURNING id INTO v_transition_id;

        RETURN jsonb_build_object(
            'success', true,
            'email', p_new_email,
            'requires_verification', true,
            'verification_token', v_verification_token,
            'reset_token', v_reset_token,
            'transition_id', v_transition_id
        );
    END IF;

    -- No email transition needed
    RETURN jsonb_build_object(
        'success', true,
        'email', v_member.email,
        'requires_verification', false,
        'reset_token', v_reset_token
    );
END;
$$;

