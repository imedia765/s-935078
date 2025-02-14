
-- Create email status type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
        CREATE TYPE email_status AS ENUM ('pending', 'sent', 'failed', 'queued');
    END IF;
END $$;

-- Create email_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    status email_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    loops_message_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    template_id TEXT,
    member_number TEXT REFERENCES members(member_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_member ON email_logs(member_number);

-- Create email metrics table
CREATE TABLE IF NOT EXISTS email_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    details JSONB DEFAULT '{}'::jsonb
);

-- Create index for metrics
CREATE INDEX IF NOT EXISTS idx_email_metrics_recorded_at ON email_metrics(recorded_at);

-- Add template management to loops_integration
ALTER TABLE loops_integration
ADD COLUMN IF NOT EXISTS templates JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- Function to calculate email metrics
CREATE OR REPLACE FUNCTION calculate_email_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Calculate delivery success rate
    INSERT INTO email_metrics (metric_name, metric_value, details)
    SELECT 
        'delivery_success_rate',
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(*) FILTER (WHERE status = 'sent')::float / COUNT(*)::float) * 100
            ELSE 0
        END,
        jsonb_build_object(
            'total_emails', COUNT(*),
            'delivered', COUNT(*) FILTER (WHERE status = 'sent'),
            'failed', COUNT(*) FILTER (WHERE status = 'failed')
        )
    FROM email_logs
    WHERE created_at > now() - interval '24 hours';
END;
$$;

-- Create a trigger to update metrics when email status changes
CREATE OR REPLACE FUNCTION update_email_metrics()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_email_metrics();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_metrics_update
AFTER INSERT OR UPDATE ON email_logs
FOR EACH STATEMENT
EXECUTE FUNCTION update_email_metrics();

-- Add RLS policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_metrics ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view logs and metrics
CREATE POLICY "Allow authenticated users to view email_logs"
    ON email_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to view email_metrics"
    ON email_metrics FOR SELECT
    TO authenticated
    USING (true);

-- Allow system to insert and update logs
CREATE POLICY "Allow system to manage email_logs"
    ON email_logs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow system to manage metrics
CREATE POLICY "Allow system to manage email_metrics"
    ON email_metrics FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
