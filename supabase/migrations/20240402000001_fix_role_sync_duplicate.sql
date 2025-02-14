
-- Drop function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS public.assign_collector_role();

-- Create function to assign collector roles
CREATE OR REPLACE FUNCTION public.assign_collector_role()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
    v_collector record;
    v_success_count integer := 0;
    v_failed_count integer := 0;
    v_results jsonb[] := array[]::jsonb[];
BEGIN
    -- Process each active collector
    FOR v_collector IN (
        SELECT 
            m.auth_user_id,
            m.member_number,
            mc.active
        FROM members_collectors mc
        JOIN members m ON m.member_number = mc.member_number
        WHERE mc.active = true
        AND m.auth_user_id IS NOT NULL
    )
    LOOP
        BEGIN
            -- Remove any existing collector role
            DELETE FROM user_roles 
            WHERE user_id = v_collector.auth_user_id 
            AND role = 'collector';

            -- Add collector role
            INSERT INTO user_roles (user_id, role)
            VALUES (v_collector.auth_user_id, 'collector');

            -- Log success
            v_success_count := v_success_count + 1;
            v_results := array_append(v_results, jsonb_build_object(
                'member_number', v_collector.member_number,
                'success', true
            ));

            -- Add audit log
            INSERT INTO audit_logs (
                operation,
                table_name,
                record_id,
                new_values,
                severity
            ) VALUES (
                'update',
                'user_roles',
                v_collector.auth_user_id,
                jsonb_build_object(
                    'action', 'collector_role_sync',
                    'member_number', v_collector.member_number,
                    'status', 'success'
                ),
                'info'
            );

        EXCEPTION WHEN OTHERS THEN
            -- Log failure
            v_failed_count := v_failed_count + 1;
            v_results := array_append(v_results, jsonb_build_object(
                'member_number', v_collector.member_number,
                'success', false,
                'error', SQLERRM
            ));

            -- Add error to audit log
            INSERT INTO audit_logs (
                operation,
                table_name,
                record_id,
                new_values,
                severity
            ) VALUES (
                'update',
                'user_roles',
                v_collector.auth_user_id,
                jsonb_build_object(
                    'action', 'collector_role_sync',
                    'member_number', v_collector.member_number,
                    'status', 'error',
                    'error', SQLERRM
                ),
                'error'
            );
        END;
    END LOOP;

    -- Build final result
    SELECT jsonb_build_object(
        'success', true,
        'total_processed', v_success_count + v_failed_count,
        'success_count', v_success_count,
        'failed_count', v_failed_count,
        'results', jsonb_agg(value),
        'timestamp', now()
    )
    INTO v_result
    FROM unnest(v_results) value;

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_collector_role() TO authenticated;
