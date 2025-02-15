
-- Drop function if exists
DROP FUNCTION IF EXISTS get_audit_activity_summary;

-- Create function with proper parameter types
CREATE OR REPLACE FUNCTION get_audit_activity_summary(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL,
  operation_filter text DEFAULT NULL,
  severity_filter text DEFAULT NULL
)
RETURNS TABLE (
  hour_bucket timestamptz,
  operation text,
  count bigint,
  severity text,
  table_name text,
  user_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('hour', created_at) as hour_bucket,
    operation,
    COUNT(*) as count,
    severity,
    table_name,
    user_id
  FROM audit_logs
  WHERE
    (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date)
    AND (operation_filter IS NULL OR operation = operation_filter)
    AND (severity_filter IS NULL OR severity = severity_filter)
  GROUP BY
    date_trunc('hour', created_at),
    operation,
    severity,
    table_name,
    user_id
  ORDER BY
    hour_bucket DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_audit_activity_summary TO authenticated;
