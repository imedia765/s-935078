
-- Create queue_priority type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_priority') THEN
        CREATE TYPE queue_priority AS ENUM ('critical', 'high', 'normal', 'low', 'bulk');
    END IF;
END $$;

-- Enhance email_logs table with additional tracking fields
ALTER TABLE email_logs 
ADD COLUMN IF NOT EXISTS priority queue_priority DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS template_name text,
ADD COLUMN IF NOT EXISTS open_tracking_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS opened_at timestamptz,
ADD COLUMN IF NOT EXISTS clicked_at timestamptz,
ADD COLUMN IF NOT EXISTS processing_duration interval,
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'loops',
ADD COLUMN IF NOT EXISTS provider_message_id text;

-- Create index for better queue performance
CREATE INDEX IF NOT EXISTS idx_email_logs_queue 
ON email_logs(status, priority, next_attempt_at) 
WHERE status = 'pending' OR status = 'queued';

-- Create email_events table for detailed tracking
CREATE TABLE IF NOT EXISTS email_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email_log_id uuid REFERENCES email_logs(id),
    event_type text NOT NULL,
    occurred_at timestamptz DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create index for email events
CREATE INDEX IF NOT EXISTS idx_email_events_log_id ON email_events(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);

-- Add RLS policies
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view events
CREATE POLICY "Allow authenticated to view email events"
    ON email_events
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow system to insert events
CREATE POLICY "Allow system to insert email events"
    ON email_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create function to track email metrics
CREATE OR REPLACE FUNCTION track_email_event(
    p_email_log_id uuid,
    p_event_type text,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert event
    INSERT INTO email_events (
        email_log_id,
        event_type,
        metadata
    ) VALUES (
        p_email_log_id,
        p_event_type,
        p_metadata
    );

    -- Update email_logs based on event type
    CASE p_event_type
        WHEN 'opened' THEN
            UPDATE email_logs 
            SET opened_at = now()
            WHERE id = p_email_log_id;
        WHEN 'clicked' THEN
            UPDATE email_logs 
            SET clicked_at = now()
            WHERE id = p_email_log_id;
        WHEN 'delivered' THEN
            UPDATE email_logs 
            SET status = 'sent',
                processing_duration = now() - created_at
            WHERE id = p_email_log_id;
        WHEN 'failed' THEN
            UPDATE email_logs 
            SET 
                status = 'failed',
                attempts = attempts + 1,
                last_attempt_at = now(),
                next_attempt_at = CASE 
                    WHEN attempts < 3 THEN now() + (attempts * interval '1 hour')
                    ELSE NULL
                END
            WHERE id = p_email_log_id;
    END CASE;
END;
$$;

-- Create function to process email queue
CREATE OR REPLACE FUNCTION process_email_queue()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update metrics
    PERFORM calculate_email_metrics();
    
    -- Process queue based on priority and retry logic
    UPDATE email_logs
    SET status = 'pending',
        next_attempt_at = now() + interval '5 minutes'
    WHERE status = 'queued'
    AND (next_attempt_at IS NULL OR next_attempt_at <= now())
    AND attempts < 3
    ORDER BY 
        CASE priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
            WHEN 'bulk' THEN 5
        END,
        created_at ASC
    LIMIT 50;
END;
$$;

-- Create scheduled task to process queue
SELECT cron.schedule(
    'process-email-queue',
    '* * * * *',  -- Run every minute
    $$
    SELECT process_email_queue();
    $$
);

COMMIT;

