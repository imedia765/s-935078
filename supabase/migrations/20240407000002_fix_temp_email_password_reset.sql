
-- Drop existing function to redefine it with transaction handling
DROP FUNCTION IF EXISTS public.handle_password_reset_request(text, text, text);

-- Create or replace the updated function with proper transaction handling
CREATE OR REPLACE FUNCTION public.handle_password_reset_request(
    p_member_number text,
    p_email text,
    p_new_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_member_record RECORD;
    v_is_temp_email BOOLEAN;
    v_token TEXT;
    v_transition_id UUID;
    v_existing_email BOOLEAN;
BEGIN
    -- Start transaction
    BEGIN
        -- Get member info
        SELECT * INTO v_member_record
        FROM members
        WHERE member_number = p_member_number
        FOR UPDATE;  -- Lock the row

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

            -- Check if email is already in use
            SELECT EXISTS (
                SELECT 1 FROM auth.users
                WHERE email = p_new_email
                AND id != v_member_record.auth_user_id
            ) INTO v_existing_email;

            IF v_existing_email THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Email address is already in use'
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
            
            -- Insert token record
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
            
            -- Insert token record
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

        -- Commit transaction
        COMMIT;

        -- Return success response
        RETURN jsonb_build_object(
            'success', true,
            'token', v_token,
            'email', COALESCE(p_new_email, p_email),
            'transition_id', v_transition_id
        );

    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction
        ROLLBACK;
        
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
END;
$$;

