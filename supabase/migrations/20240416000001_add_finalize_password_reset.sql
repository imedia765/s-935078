
CREATE OR REPLACE FUNCTION public.finalize_password_reset(
    token_value text,
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
        'message', 'Password reset finalized'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Failed to finalize password reset: ' || SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION finalize_password_reset TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_password_reset TO anon;
