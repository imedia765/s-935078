
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

-- Function to validate edge function configuration
CREATE OR REPLACE FUNCTION validate_edge_function_config()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    missing_keys text[];
    config_status jsonb;
BEGIN
    SELECT array_agg(k)
    INTO missing_keys
    FROM unnest(ARRAY['APP_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) k
    WHERE NOT EXISTS (
        SELECT 1 FROM edge_function_config WHERE key = k
    );

    config_status := jsonb_build_object(
        'is_valid', missing_keys IS NULL,
        'missing_keys', missing_keys,
        'checked_at', now()
    );

    -- Log the validation result
    INSERT INTO audit_logs (
        operation,
        table_name,
        new_values,
        severity
    ) VALUES (
        'validate_config',
        'edge_function_config',
        config_status,
        CASE 
            WHEN missing_keys IS NULL THEN 'info'
            ELSE 'warning'
        END
    );

    RETURN config_status;
END;
$$;

-- Function to test edge function connectivity
CREATE OR REPLACE FUNCTION test_edge_function_connectivity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Verify configuration
    v_result := validate_edge_function_config();
    
    IF NOT (v_result->>'is_valid')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Missing configuration',
            'details', v_result
        );
    END IF;

    -- If all checks pass
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Edge function configuration is valid',
        'app_url', (SELECT value FROM edge_function_config WHERE key = 'APP_URL'),
        'checked_at', now()
    );
END;
$$;

-- Notify admins about missing configuration
DO $$
DECLARE
    config_status jsonb;
BEGIN
    config_status := validate_edge_function_config();
    
    IF NOT (config_status->>'is_valid')::boolean THEN
        INSERT INTO system_announcements (
            title,
            message,
            severity,
            is_active
        ) VALUES (
            'Edge Function Configuration Required',
            'Some required edge function configuration is missing. Please check the configuration status.',
            'warning',
            true
        );
    END IF;
END $$;
