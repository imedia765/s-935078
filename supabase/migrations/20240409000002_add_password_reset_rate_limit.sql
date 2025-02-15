
-- Add password reset rate limiting table and functions
BEGIN;

-- Create table to track rate limits
CREATE TABLE IF NOT EXISTS password_reset_rate_limits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_number text NOT NULL,
    ip_address text NOT NULL,
    attempts integer DEFAULT 1,
    last_attempt timestamp with time zone DEFAULT now(),
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(member_number, ip_address)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_rate_limits_lookup 
ON password_reset_rate_limits(member_number, ip_address);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_password_reset_rate_limit(
    p_member_number text,
    p_ip_address text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rate_limit record;
    v_max_attempts integer := 5;
    v_lockout_duration interval := interval '15 minutes';
BEGIN
    -- Get or create rate limit record
    INSERT INTO password_reset_rate_limits (member_number, ip_address)
    VALUES (p_member_number, p_ip_address)
    ON CONFLICT (member_number, ip_address) 
    DO UPDATE SET 
        attempts = password_reset_rate_limits.attempts + 1,
        last_attempt = now()
    RETURNING * INTO v_rate_limit;

    -- Check if locked
    IF v_rate_limit.locked_until IS NOT NULL AND v_rate_limit.locked_until > now() THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'locked_until', v_rate_limit.locked_until,
            'remaining_time', extract(epoch from (v_rate_limit.locked_until - now()))::integer
        );
    END IF;

    -- Check attempts and lock if needed
    IF v_rate_limit.attempts >= v_max_attempts THEN
        UPDATE password_reset_rate_limits
        SET locked_until = now() + v_lockout_duration
        WHERE id = v_rate_limit.id;

        RETURN jsonb_build_object(
            'allowed', false,
            'locked_until', now() + v_lockout_duration,
            'remaining_time', extract(epoch from v_lockout_duration)::integer
        );
    END IF;

    -- Calculate remaining attempts
    RETURN jsonb_build_object(
        'allowed', true,
        'attempts', v_rate_limit.attempts,
        'remaining_attempts', v_max_attempts - v_rate_limit.attempts
    );
END;
$$;

-- Add RLS policies
ALTER TABLE password_reset_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow system to manage rate limits"
    ON password_reset_rate_limits
    USING (true)
    WITH CHECK (true);

-- Add function to reset rate limits
CREATE OR REPLACE FUNCTION reset_password_rate_limit(
    p_member_number text,
    p_ip_address text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM password_reset_rate_limits
    WHERE member_number = p_member_number
    AND ip_address = p_ip_address;
END;
$$;

COMMIT;
