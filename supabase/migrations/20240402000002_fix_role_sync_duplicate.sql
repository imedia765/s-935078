-- Function to fix collector role sync with improved error handling and retry logic
CREATE OR REPLACE FUNCTION public.sync_all_collectors_roles()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_collector RECORD;
    v_success_count integer := 0;
    v_failed_count integer := 0;
    v_results jsonb[] := ARRAY[]::jsonb[];
BEGIN
    -- Reset any stuck sync statuses older than 1 hour
    UPDATE sync_status
    SET status = 'pending'
    WHERE status = 'pending'
    AND sync_started_at < now() - interval '1 hour';

    -- Process each active collector
    FOR v_collector IN (
        SELECT DISTINCT m.member_number
        FROM members m
        JOIN members_collectors mc ON mc.member_number = m.member_number
        WHERE mc.active = true
        ORDER BY m.member_number
    ) LOOP
        DECLARE
            v_result jsonb;
        BEGIN
            v_result := fix_collector_role_sync(v_collector.member_number);
            
            IF (v_result->>'success')::boolean THEN
                v_success_count := v_success_count + 1;
            ELSE
                v_failed_count := v_failed_count + 1;
            END IF;

            v_results := array_append(v_results, v_result);

        EXCEPTION WHEN OTHERS THEN
            v_failed_count := v_failed_count + 1;
            v_results := array_append(v_results, jsonb_build_object(
                'success', false,
                'member_number', v_collector.member_number,
                'error', SQLERRM
            ));
        END;
    END LOOP;

    -- Log the bulk sync operation
    INSERT INTO audit_logs (
        operation,
        table_name,
        new_values,
        severity
    ) VALUES (
        'bulk_update',
        'user_roles',
        jsonb_build_object(
            'action', 'bulk_role_sync',
            'success_count', v_success_count,
            'failed_count', v_failed_count,
            'timestamp', now()
        ),
        'info'
    );

    RETURN jsonb_build_object(
        'success', true,
        'total_processed', v_success_count + v_failed_count,
        'success_count', v_success_count,
        'failed_count', v_failed_count,
        'results', v_results,
        'timestamp', now()::text
    );
END;
$$;

-- Keep the existing fix_collector_role_sync function as is
-- Function to fix collector role sync with improved error handling and retry logic
CREATE OR REPLACE FUNCTION public.fix_collector_role_sync(p_member_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auth_user_id uuid;
    v_collector_record RECORD;
    v_retry_count integer := 0;
    v_max_retries constant integer := 3;
BEGIN
    -- Get collector info and auth_user_id
    SELECT m.*, mc.active, m.auth_user_id INTO v_collector_record
    FROM members m
    JOIN members_collectors mc ON mc.member_number = m.member_number
    WHERE m.member_number = p_member_number;

    IF v_collector_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Collector not found'
        );
    END IF;

    -- Store auth_user_id for easier reference
    v_auth_user_id := v_collector_record.auth_user_id;

    -- Reset any stuck sync status
    UPDATE sync_status
    SET 
        status = 'pending',
        sync_started_at = now(),
        last_attempted_sync_at = now(),
        store_status = 'ready',
        error_message = NULL
    WHERE user_id = v_auth_user_id;

    -- First verify if the role already exists
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = v_auth_user_id 
        AND role = 'collector'
    ) THEN
        -- If role exists, just update sync status and return success
        UPDATE sync_status
        SET 
            status = 'completed',
            sync_started_at = now(),
            last_attempted_sync_at = now(),
            store_status = 'ready',
            error_message = NULL
        WHERE user_id = v_auth_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Role verification completed - collector role already assigned',
            'auth_user_id', v_auth_user_id,
            'member_number', p_member_number
        );
    END IF;

    -- Update sync status to mark sync as started
    INSERT INTO sync_status (
        user_id,
        status,
        sync_started_at,
        last_attempted_sync_at,
        store_status
    ) VALUES (
        v_auth_user_id,
        'pending',
        now(),
        now(),
        'ready'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        sync_started_at = now(),
        last_attempted_sync_at = now(),
        status = 'pending',
        store_status = 'ready',
        error_message = NULL;

    -- Add the collector role with retry logic
    WHILE v_retry_count < v_max_retries LOOP
        BEGIN
            INSERT INTO user_roles (user_id, role)
            VALUES (v_auth_user_id, 'collector')
            ON CONFLICT (user_id, role) DO NOTHING;

            -- Update sync status to completed
            UPDATE sync_status
            SET 
                status = 'completed',
                last_attempted_sync_at = now(),
                store_status = 'ready',
                error_message = NULL
            WHERE user_id = v_auth_user_id;

            -- Log the sync operation
            INSERT INTO audit_logs (
                operation,
                table_name,
                record_id,
                new_values,
                severity
            ) VALUES (
                'update',
                'user_roles',
                v_auth_user_id,
                jsonb_build_object(
                    'action', 'role_sync',
                    'member_number', p_member_number,
                    'timestamp', now(),
                    'retry_count', v_retry_count
                ),
                'info'
            );

            -- If we reach here, sync was successful
            EXIT;

        EXCEPTION WHEN OTHERS THEN
            -- Increment retry counter
            v_retry_count := v_retry_count + 1;
            
            IF v_retry_count >= v_max_retries THEN
                -- Update sync status to failed after max retries
                UPDATE sync_status
                SET 
                    status = 'failed',
                    error_message = SQLERRM || ' (After ' || v_retry_count || ' retries)',
                    last_attempted_sync_at = now()
                WHERE user_id = v_auth_user_id;

                RETURN jsonb_build_object(
                    'success', false,
                    'error', SQLERRM,
                    'retries', v_retry_count
                );
            END IF;

            -- Wait for a short time before retrying (exponential backoff)
            PERFORM pg_sleep(pow(2, v_retry_count)::integer);
        END;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Role sync completed successfully',
        'auth_user_id', v_auth_user_id,
        'member_number', p_member_number,
        'retries', v_retry_count
    );
END;
$$;
