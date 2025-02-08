
-- Create enum for alert severity levels
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

-- Create monitoring_alert_configs table
CREATE TABLE monitoring_alert_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    threshold NUMERIC NOT NULL,
    severity alert_severity NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create active_alerts table
CREATE TABLE active_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    current_value NUMERIC NOT NULL,
    threshold NUMERIC NOT NULL,
    severity alert_severity NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    details JSONB NOT NULL DEFAULT '{"message": "", "timestamp": ""}'::jsonb
);

-- Add some initial alert configurations
INSERT INTO monitoring_alert_configs (metric_name, threshold, severity, enabled) VALUES
    ('CPU Usage', 80, 'warning', true),
    ('Memory Usage', 90, 'critical', true),
    ('Disk Space', 85, 'warning', true),
    ('Error Rate', 5, 'critical', true),
    ('API Latency', 1000, 'warning', true);

-- Add RLS policies
ALTER TABLE monitoring_alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_alerts ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view alerts
CREATE POLICY "Allow authenticated users to view alert configs" ON monitoring_alert_configs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view active alerts" ON active_alerts
    FOR SELECT TO authenticated USING (true);

-- Only admin users can manage alert configs
CREATE POLICY "Allow admins to manage alert configs" ON monitoring_alert_configs
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ));

-- Only system can insert/update active alerts
CREATE POLICY "Allow system to manage active alerts" ON active_alerts
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    ));
