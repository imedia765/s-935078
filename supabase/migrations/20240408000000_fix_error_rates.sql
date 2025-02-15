
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS check_error_rates();

-- Create the updated function
CREATE OR REPLACE FUNCTION check_error_rates()
RETURNS TABLE (
    recorded_at timestamptz,
    severity text,
    message text,
    source text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.created_at as recorded_at,
        al.severity,
        COALESCE(al.metadata->>'message', '') as message,
        COALESCE(al.metadata->>'source', 'system') as source
    FROM audit_logs al
    WHERE al.severity IN ('error', 'warning', 'info')
    AND al.created_at >= NOW() - INTERVAL '24 hours'
    ORDER BY al.created_at DESC
    LIMIT 100;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_error_rates() TO authenticated;
