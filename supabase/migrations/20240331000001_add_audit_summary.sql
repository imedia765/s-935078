
-- Add audit summary function for aggregating audit log data
CREATE OR REPLACE FUNCTION get_audit_activity_summary(
  start_date timestamptz DEFAULT (now() - interval '7 days'),
  end_date timestamptz DEFAULT now(),
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
    created_at >= start_date
    AND created_at <= end_date
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

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs (created_at);

-- Add index for table name queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name 
ON audit_logs (table_name);

-- Add index for operation queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation 
ON audit_logs (operation);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite 
ON audit_logs (created_at, operation, table_name);
