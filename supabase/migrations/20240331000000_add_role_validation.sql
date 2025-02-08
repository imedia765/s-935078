
-- Create role validation logs table
CREATE TABLE IF NOT EXISTS public.role_validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    role TEXT NOT NULL,
    validation_status TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending',
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

CREATE POLICY "Enable insert for authenticated users" ON public.role_validation_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON public.role_validation_logs
    FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- Create function to perform role validation
CREATE OR REPLACE FUNCTION public.validate_and_sync_roles()
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
        rc.validation_status,
        CASE 
            WHEN rc.validation_status = 'valid' THEN 'completed'
            ELSE 'failed'
        END,
        now(),
        jsonb_build_object(
            'checked_at', now(),
            'validation_type', 'automated'
        )
    FROM role_checks rc
    ON CONFLICT (user_id, role) 
    DO UPDATE SET
        validation_status = EXCLUDED.validation_status,
        sync_status = CASE 
            WHEN EXCLUDED.validation_status = 'valid' THEN 'completed'
            ELSE 'failed'
        END,
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

-- Create function to fix role sync issues
CREATE OR REPLACE FUNCTION public.fix_role_sync_issues(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Validate roles for the user
    PERFORM validate_and_sync_roles();
    
    -- Get the validation results
    SELECT 
        jsonb_build_object(
            'user_id', p_user_id,
            'roles', jsonb_agg(
                jsonb_build_object(
                    'role', role,
                    'validation_status', validation_status,
                    'sync_status', sync_status,
                    'last_checked', last_checked_at
                )
            ),
            'status', 'completed',
            'timestamp', now()
        )
    INTO v_result
    FROM role_validation_logs
    WHERE user_id = p_user_id;

    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'status', 'error',
        'message', SQLERRM,
        'timestamp', now()
    );
END;
$$;

-- Create function to fix all role sync issues
CREATE OR REPLACE FUNCTION public.fix_all_role_sync_issues()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Run validation for all roles
    PERFORM validate_and_sync_roles();
    
    -- Get summary of results
    SELECT 
        jsonb_build_object(
            'total_processed', count(*),
            'valid_count', count(*) FILTER (WHERE validation_status = 'valid'),
            'invalid_count', count(*) FILTER (WHERE validation_status = 'invalid'),
            'sync_completed', count(*) FILTER (WHERE sync_status = 'completed'),
            'sync_failed', count(*) FILTER (WHERE sync_status = 'failed'),
            'timestamp', now()
        )
    INTO v_result
    FROM role_validation_logs;

    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'status', 'error',
        'message', SQLERRM,
        'timestamp', now()
    );
END;
$$;

-- Add trigger to automatically validate roles on changes
CREATE OR REPLACE FUNCTION public.trigger_role_validation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM validate_and_sync_roles();
    RETURN NEW;
END;
$$;

-- Create trigger on user_roles table
CREATE TRIGGER validate_roles_on_change
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_role_validation();

-- Run initial validation for existing roles
SELECT validate_and_sync_roles();
