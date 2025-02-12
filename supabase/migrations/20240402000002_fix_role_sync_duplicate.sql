
CREATE OR REPLACE FUNCTION public.fix_collector_role_sync(p_member_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auth_user_id uuid;
    v_collector_record RECORD;
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

    -- Add the collector role
    INSERT INTO user_roles (user_id, role)
    VALUES (v_auth_user_id, 'collector');

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
            'timestamp', now()
        ),
        'info'
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Role sync completed successfully',
        'auth_user_id', v_auth_user_id,
        'member_number', p_member_number
    );
EXCEPTION WHEN OTHERS THEN
    -- Update sync status to failed
    UPDATE sync_status
    SET 
        status = 'failed',
        error_message = SQLERRM,
        last_attempted_sync_at = now()
    WHERE user_id = v_auth_user_id;

    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
