
-- Create the permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    category text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Add some default permissions
INSERT INTO public.permissions (name, description, category) VALUES
    ('view_audit_logs', 'Can view audit logs', 'audit'),
    ('manage_audit_retention', 'Can manage audit log retention policy', 'audit'),
    ('manage_roles', 'Can manage user roles', 'roles'),
    ('manage_members', 'Can manage member accounts', 'members'),
    ('view_analytics', 'Can view analytics dashboards', 'analytics'),
    ('manage_email_templates', 'Can manage email templates', 'email'),
    ('manage_smtp', 'Can manage SMTP settings', 'email'),
    ('manage_maintenance', 'Can manage system maintenance', 'maintenance'),
    ('manage_backups', 'Can manage database backups', 'database')
ON CONFLICT (name) DO NOTHING;

-- Function to update role permissions
CREATE OR REPLACE FUNCTION public.update_role_permissions(
    permissions_array jsonb
) RETURNS void AS $$
BEGIN
    -- Clear existing permissions
    DELETE FROM public.role_permissions;
    
    -- Insert new permissions
    INSERT INTO public.role_permissions (role, permission_name)
    SELECT 
        (jsonb_array_elements(permissions_array)->>'role')::text,
        (jsonb_array_elements(permissions_array)->>'permission_name')::text
    WHERE (jsonb_array_elements(permissions_array)->>'granted')::boolean = true;
    
    -- Log the change
    INSERT INTO public.audit_logs (
        operation,
        table_name,
        user_id,
        old_values,
        new_values
    ) VALUES (
        'UPDATE',
        'role_permissions',
        auth.uid(),
        null,
        permissions_array
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set audit log retention
CREATE OR REPLACE FUNCTION public.set_audit_log_retention(
    p_retention_period text
) RETURNS void AS $$
DECLARE
    v_days integer;
BEGIN
    -- Convert period to days
    v_days := CASE p_retention_period
        WHEN '30days' THEN 30
        WHEN '90days' THEN 90
        WHEN '180days' THEN 180
        WHEN '1year' THEN 365
        WHEN '2years' THEN 730
        ELSE 90
    END;
    
    -- Delete logs older than retention period
    DELETE FROM public.audit_logs
    WHERE created_at < now() - (v_days || ' days')::interval;
    
    -- Log the change
    INSERT INTO public.audit_logs (
        operation,
        table_name,
        user_id,
        new_values
    ) VALUES (
        'UPDATE',
        'audit_logs',
        auth.uid(),
        jsonb_build_object('retention_period', p_retention_period)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view permissions"
    ON public.permissions FOR SELECT
    TO authenticated
    USING (true);

