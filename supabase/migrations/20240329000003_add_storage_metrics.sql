
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS analyze_storage_metrics();

-- Create function to analyze storage metrics
CREATE OR REPLACE FUNCTION analyze_storage_metrics()
RETURNS TABLE (
    table_name text,
    total_size bigint,
    bloat_percentage numeric,
    recommendations jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r record;
    rec record;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS temp_metrics AS
    SELECT 
        n.nspname AS schema_name,
        c.relname AS table_name,
        pg_total_relation_size(c.oid) AS total_bytes,
        CASE 
            WHEN c.reltuples > 0
            THEN CAST((pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) * 100.0 / 
                NULLIF(pg_total_relation_size(c.oid), 0) AS numeric(10,1))
            ELSE 0::numeric
        END AS bloat_percentage,
        c.reltuples::bigint AS row_count,
        age(c.relfrozenxid) AS xid_age
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND c.relkind = 'r';

    FOR rec IN SELECT * FROM temp_metrics
    LOOP
        RETURN QUERY
        SELECT 
            rec.table_name::text,
            rec.total_bytes::bigint,
            rec.bloat_percentage::numeric,
            jsonb_build_object(
                'needs_vacuum', rec.bloat_percentage > 20,
                'needs_analyze', rec.row_count > 10000 AND rec.xid_age > 100000000,
                'large_indexes', false,
                'suggested_actions', 
                CASE 
                    WHEN rec.bloat_percentage > 20 AND rec.row_count > 10000 
                    THEN jsonb_build_array(
                        'Consider running VACUUM FULL to reclaim space',
                        'Run ANALYZE to update statistics'
                    )
                    WHEN rec.bloat_percentage > 20 
                    THEN jsonb_build_array('Consider running VACUUM FULL to reclaim space')
                    WHEN rec.row_count > 10000 AND rec.xid_age > 100000000 
                    THEN jsonb_build_array('Run ANALYZE to update statistics')
                    ELSE jsonb_build_array()
                END
            )::jsonb;
    END LOOP;

    DROP TABLE IF EXISTS temp_metrics;
    RETURN;
END;
$$;

-- Revoke any existing permissions
REVOKE ALL ON FUNCTION analyze_storage_metrics() FROM PUBLIC;
REVOKE ALL ON FUNCTION analyze_storage_metrics() FROM authenticated;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION analyze_storage_metrics() TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION analyze_storage_metrics() IS 'Analyzes database table storage metrics and provides optimization recommendations';
