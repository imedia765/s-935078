
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
AS $$
DECLARE
    r record;
BEGIN
    FOR r IN 
        SELECT 
            n.nspname AS schema_name,
            c.relname AS table_name,
            pg_total_relation_size(c.oid) AS total_bytes,
            pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
            CASE 
                WHEN c.reltuples > 0
                THEN CAST((pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) * 100.0 / 
                    NULLIF(pg_total_relation_size(c.oid), 0) AS numeric(10,1))
                ELSE 0
            END AS bloat_percentage,
            c.reltuples::bigint AS row_count,
            age(c.relfrozenxid) AS xid_age,
            c.relkind
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND c.relkind = 'r'
    LOOP
        -- Initialize recommendations
        recommendations := jsonb_build_object(
            'needs_vacuum', FALSE,
            'needs_analyze', FALSE,
            'large_indexes', FALSE,
            'suggested_actions', jsonb_build_array()
        );
        
        -- Check for high bloat
        IF r.bloat_percentage > 20 THEN
            recommendations := jsonb_set(
                recommendations,
                '{needs_vacuum}',
                'true'::jsonb
            );
            recommendations := jsonb_set(
                recommendations,
                '{suggested_actions}',
                (recommendations->>'suggested_actions')::jsonb || 
                jsonb_build_array('Consider running VACUUM FULL to reclaim space')
            );
        END IF;

        -- Check for outdated statistics
        IF r.row_count > 10000 AND r.xid_age > 100000000 THEN
            recommendations := jsonb_set(
                recommendations,
                '{needs_analyze}',
                'true'::jsonb
            );
            recommendations := jsonb_set(
                recommendations,
                '{suggested_actions}',
                (recommendations->>'suggested_actions')::jsonb || 
                jsonb_build_array('Run ANALYZE to update statistics')
            );
        END IF;

        RETURN QUERY SELECT 
            r.table_name::text,
            r.total_bytes::bigint,
            r.bloat_percentage::numeric,
            recommendations::jsonb;
    END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION analyze_storage_metrics() TO authenticated;
