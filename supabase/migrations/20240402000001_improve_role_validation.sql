
-- Create validation_status and sync_status enums if they don't exist
DO $$ BEGIN
    CREATE TYPE validation_status AS ENUM ('valid', 'invalid', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('completed', 'failed', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create role validation logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.role_validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL,
    validation_status validation_status NOT NULL DEFAULT 'pending',
    sync_status sync_status NOT NULL DEFAULT 'pending',
    last_checked_at TIMESTAMPTZ DEFAULT now(),
    last_synced_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indices for better query performance
CREATE INDEX IF NOT EXISTS idx_role_validation_user_id ON public.role_validation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_role_validation_status ON public.role_validation_logs(validation_status);
CREATE INDEX IF NOT EXISTS idx_role_validation_sync_status ON public.role_validation_logs(sync_status);

-- Enable RLS
ALTER TABLE public.role_validation_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Enable read access for authenticated users" ON public.role_validation_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for authenticated users" ON public.role_validation_logs
    FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- Function to validate and sync collector roles
CREATE OR REPLACE FUNCTION public.validate_and_sync_collector_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update existing role validations
    WITH role_checks AS (
        SELECT 
            ur.user_id,
            ur.role,
            CASE 
                WHEN mc.active IS NOT NULL THEN 
                    CASE 
                        WHEN mc.active = true AND ur.role = 'collector' THEN 'valid'
                        WHEN mc.active = false AND ur.role = 'collector' THEN 'invalid'
                        ELSE 'valid'
                    END
                ELSE 'valid'
            END as validation_status
        FROM user_roles ur
        LEFT JOIN members m ON m.auth_user_id = ur.user_id
        LEFT JOIN members_collectors mc ON mc.member_number = m.member_number
    )
    INSERT INTO role_validation_logs (
        user_id,
        role,
        validation_status,
        sync_status,
        last_checked_at,
        metadata
    )
    SELECT 
        rc.user_id,
        rc.role,
        rc.validation_status::validation_status,
        CASE 
            WHEN rc.validation_status = 'valid' THEN 'completed'
            ELSE 'failed'
        END::sync_status,
        now(),
        jsonb_build_object(
            'checked_at', now(),
            'validation_type', 'automated'
        )
    FROM role_checks rc
    ON CONFLICT (id) 
    DO UPDATE SET
        validation_status = EXCLUDED.validation_status,
        sync_status = EXCLUDED.sync_status,
        last_checked_at = now(),
        updated_at = now();

    -- Log the validation run
    INSERT INTO audit_logs (
        operation,
        table_name,
        new_values,
        severity
    ) VALUES (
        'update',
        'role_validation_logs',
        jsonb_build_object(
            'action', 'role_validation',
            'timestamp', now()
        ),
        'info'
    );
END;
$$;

-- Function to fix specific role sync issues
CREATE OR REPLACE FUNCTION public.fix_collector_role_sync(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_collector_record RECORD;
    v_result jsonb;
BEGIN
    -- Get collector info
    SELECT m.*, mc.active
    INTO v_collector_record
    FROM members m
    JOIN members_collectors mc ON mc.member_number = m.member_number
    WHERE m.auth_user_id = p_user_id;

    IF v_collector_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Collector not found'
        );
    END IF;

    -- Update role validation status
    UPDATE role_validation_logs
    SET 
        validation_status = 'valid',
        sync_status = 'completed',
        last_synced_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id
    AND role = 'collector';

    -- Ensure collector role exists
    INSERT INTO user_roles (user_id, role)
    VALUES (p_user_id, 'collector')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Role sync completed successfully'
    );
END;
$$;

-- Run initial validation for existing roles
SELECT validate_and_sync_collector_roles();
