
-- Create DNS check types
CREATE TYPE dns_record_type AS ENUM ('MX', 'SPF', 'DKIM', 'DMARC');
CREATE TYPE dns_check_status AS ENUM ('success', 'warning', 'error');

-- Create DNS check results table
CREATE TABLE dns_check_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type dns_record_type NOT NULL,
    domain TEXT NOT NULL,
    status dns_check_status NOT NULL,
    value TEXT,
    error_message TEXT,
    check_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    validity_period INTERVAL NOT NULL DEFAULT INTERVAL '1 hour',
    last_success_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create delivery metrics table
CREATE TABLE email_delivery_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    details JSONB DEFAULT '{}'::jsonb,
    configuration_id UUID REFERENCES smtp_configurations(id)
);

-- Add indices for better query performance
CREATE INDEX idx_dns_check_results_timestamp ON dns_check_results(check_timestamp DESC);
CREATE INDEX idx_dns_check_results_domain ON dns_check_results(domain);
CREATE INDEX idx_email_delivery_metrics_recorded ON email_delivery_metrics(recorded_at DESC);

-- Add quota tracking to smtp_health_checks
ALTER TABLE smtp_health_checks
ADD COLUMN IF NOT EXISTS quota_remaining INTEGER,
ADD COLUMN IF NOT EXISTS bounce_rate NUMERIC;

-- Create function to check DNS records
CREATE OR REPLACE FUNCTION check_dns_records(p_domain TEXT)
RETURNS TABLE (
    record_type dns_record_type,
    status dns_check_status,
    value TEXT,
    error_message TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- This is a placeholder that will be replaced by Edge Function
    -- We'll store results in dns_check_results table
    RETURN QUERY
    SELECT 
        'MX'::dns_record_type,
        'success'::dns_check_status,
        'placeholder'::TEXT,
        NULL::TEXT;
END;
$$;

-- Add RLS policies
ALTER TABLE dns_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view dns_check_results"
    ON dns_check_results FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view email_delivery_metrics"
    ON email_delivery_metrics FOR SELECT TO authenticated USING (true);

-- Function to aggregate monitoring metrics
CREATE OR REPLACE FUNCTION get_email_health_metrics(
    p_timeframe INTERVAL DEFAULT INTERVAL '24 hours'
)
RETURNS TABLE (
    metric_name TEXT,
    current_value NUMERIC,
    status TEXT,
    details JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.metric_type,
        m.value,
        CASE 
            WHEN m.value > 90 THEN 'healthy'
            WHEN m.value > 70 THEN 'warning'
            ELSE 'critical'
        END,
        m.details
    FROM email_delivery_metrics m
    WHERE m.recorded_at >= now() - p_timeframe
    ORDER BY m.recorded_at DESC
    LIMIT 1;
END;
$$;
