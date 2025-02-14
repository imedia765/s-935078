-- Create function to update role permissions with a different name that matches the schema
CREATE OR REPLACE FUNCTION public.sync_permissions(
    permissions_array jsonb
) RETURNS void AS $$
BEGIN
    -- Begin transaction
    BEGIN
        -- Clear existing permissions
        DELETE FROM public.role_permissions;
        
        -- Insert new permissions
        INSERT INTO public.role_permissions (role, permission_name)
        SELECT 
            (jsonb_array_elements(permissions_array)->>'role')::text,
            (jsonb_array_elements(permissions_array)->>'permission_name')::text
        WHERE (jsonb_array_elements(permissions_array)->>'granted')::boolean = true
        ON CONFLICT (role, permission_name) DO NOTHING;
        
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

    EXCEPTION WHEN OTHERS THEN
        -- Log error and re-raise
        INSERT INTO public.audit_logs (
            operation,
            table_name,
            user_id,
            old_values,
            new_values,
            severity
        ) VALUES (
            'ERROR',
            'role_permissions',
            auth.uid(),
            null,
            jsonb_build_object(
                'error', SQLERRM,
                'permissions', permissions_array
            ),
            'error'
        );
        RAISE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.sync_permissions(jsonb) TO authenticated;

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

-- Create role_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role text NOT NULL,
    permission_name text NOT NULL REFERENCES permissions(name),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(role, permission_name)
);

-- Add RLS policies
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view permissions"
    ON public.permissions FOR SELECT
    TO authenticated
    USING (true);
