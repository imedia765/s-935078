
-- Add function to handle password reset with token
CREATE OR REPLACE FUNCTION public.handle_password_reset_with_token(
    token_value text,
    new_password text,
    ip_address text,
    user_agent text,
    client_info jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token_record password_reset_tokens%ROWTYPE;
    v_member_record members%ROWTYPE;
    v_hashed_password text;
BEGIN
    -- Get and validate token
    SELECT *
    INTO v_token_record
    FROM password_reset_tokens
    WHERE token = token_value
    AND used_at IS NULL
    AND invalidated_at IS NULL
    AND expires_at > now();

    IF v_token_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired token'
        );
    END IF;

    -- Get member info
    SELECT *
    INTO v_member_record
    FROM members
    WHERE member_number = v_token_record.member_number;

    IF v_member_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Member not found'
        );
    END IF;

    -- Hash the new password using Supabase's native password hashing
    v_hashed_password := crypt(new_password, gen_salt('bf'));

    -- Update the password in auth.users
    UPDATE auth.users
    SET 
        encrypted_password = v_hashed_password,
        raw_app_meta_data = raw_app_meta_data || 
            jsonb_build_object(
                'password_reset_at', extract(epoch from now()),
                'force_password_change', false
            ),
        updated_at = now()
    WHERE id = v_token_record.user_id;

    -- Mark token as used
    UPDATE password_reset_tokens
    SET 
        used_at = now(),
        attempts = attempts + 1
    WHERE id = v_token_record.id;

    -- Log the password change
    INSERT INTO audit_logs (
        operation,
        table_name,
        record_id,
        metadata,
        severity
    ) VALUES (
        'UPDATE',
        'auth.users',
        v_token_record.user_id::text,
        jsonb_build_object(
            'action', 'password_reset',
            'member_number', v_token_record.member_number,
            'ip_address', ip_address,
            'user_agent', user_agent,
            'client_info', client_info,
            'timestamp', now()
        ),
        'info'
    );

    -- Reset rate limits for this member/IP combination
    PERFORM reset_password_rate_limit(
        v_token_record.member_number,
        ip_address
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Password reset successful'
    );

EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO audit_logs (
        operation,
        table_name,
        record_id,
        metadata,
        severity
    ) VALUES (
        'ERROR',
        'password_reset_tokens',
        coalesce(v_token_record.id::text, 'unknown'),
        jsonb_build_object(
            'error', SQLERRM,
            'member_number', coalesce(v_token_record.member_number, 'unknown'),
            'ip_address', ip_address,
            'timestamp', now()
        ),
        'error'
    );

    RETURN jsonb_build_object(
        'success', false,
        'error', 'Failed to reset password: ' || SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_password_reset_with_token TO authenticated;
GRANT EXECUTE ON FUNCTION handle_password_reset_with_token TO anon;

