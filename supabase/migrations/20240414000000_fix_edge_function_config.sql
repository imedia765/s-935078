
-- Create table for edge function configuration if it doesn't exist
CREATE TABLE IF NOT EXISTS edge_function_config (
    key text PRIMARY KEY,
    value text NOT NULL,
    is_secret boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Function to get edge function config
CREATE OR REPLACE FUNCTION get_edge_function_config(p_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT value FROM edge_function_config WHERE key = p_key);
END;
$$;

-- Create RLS policies
ALTER TABLE edge_function_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage edge function config"
ON edge_function_config
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Insert essential configuration
INSERT INTO edge_function_config (key, value, is_secret) VALUES
('APP_URL', 'https://www.pwaburton.co.uk', false)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Create a view to check edge function configuration status
CREATE OR REPLACE VIEW edge_function_status AS
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM edge_function_config 
            WHERE key IN ('APP_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY')
        ) THEN true
        ELSE false
    END as is_configured,
    array_agg(key) as configured_keys,
    now() as checked_at
FROM edge_function_config;
