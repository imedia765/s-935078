
-- Add loops_integration table to store Loops-specific settings
CREATE TABLE IF NOT EXISTS loops_integration (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key text,
    template_id text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Always ensure there's exactly one row
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

-- Add function to ensure single row
CREATE OR REPLACE FUNCTION ensure_single_loops_config()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM loops_integration) > 1 THEN
        DELETE FROM loops_integration
        WHERE id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to maintain single row
CREATE TRIGGER ensure_single_loops_config_trigger
AFTER INSERT OR UPDATE ON loops_integration
FOR EACH ROW
EXECUTE FUNCTION ensure_single_loops_config();

-- Grant necessary permissions
GRANT ALL ON TABLE loops_integration TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_single_loops_config TO authenticated;
