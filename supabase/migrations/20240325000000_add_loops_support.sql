
-- Add loops_integration table to store Loops-specific settings
CREATE TABLE IF NOT EXISTS loops_integration (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key text,
    template_id text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert initial row if table is empty
INSERT INTO loops_integration (api_key, template_id, is_active)
SELECT '', '', false
WHERE NOT EXISTS (SELECT 1 FROM loops_integration);

-- Add RLS policies
ALTER TABLE loops_integration ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view/edit Loops integration settings
CREATE POLICY "Allow admins to manage Loops integration" ON loops_integration
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Add an audit log specifically for email provider changes
CREATE TABLE IF NOT EXISTS email_provider_audit (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider text NOT NULL,
    event_type text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies for audit logs
ALTER TABLE email_provider_audit ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view email provider audit logs
CREATE POLICY "Allow admins to view email provider audit" ON email_provider_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Function to toggle Loops integration
CREATE OR REPLACE FUNCTION toggle_loops_integration(p_is_active boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_previous_state boolean;
BEGIN
    -- Get current state
    SELECT is_active INTO v_previous_state
    FROM loops_integration
    LIMIT 1;

    -- Update state
    UPDATE loops_integration
    SET 
        is_active = p_is_active,
        updated_at = now()
    WHERE id = (SELECT id FROM loops_integration LIMIT 1);

    -- Log the change
    INSERT INTO email_provider_audit (
        provider,
        event_type,
        details,
        user_id
    ) VALUES (
        'Loops',
        CASE 
            WHEN p_is_active THEN 'enabled'
            ELSE 'disabled'
        END,
        jsonb_build_object(
            'previous_state', v_previous_state,
            'new_state', p_is_active
        ),
        auth.uid()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Loops integration ' || 
                   CASE WHEN p_is_active THEN 'enabled' ELSE 'disabled' END,
        'is_active', p_is_active
    );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_loops_integration TO authenticated;
