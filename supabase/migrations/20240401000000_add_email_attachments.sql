
-- Create storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('email_attachments', 'email_attachments', false);

-- Create policies for the email_attachments bucket
CREATE POLICY "Email attachments are readable by admin and collectors" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'email_attachments' AND
  EXISTS (
    SELECT 1 FROM auth.users u
    JOIN user_roles ur ON ur.user_id = u.id
    WHERE auth.uid() = u.id
    AND ur.role IN ('admin', 'collector')
  )
);

CREATE POLICY "Email attachments are insertable by admin and collectors" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email_attachments' AND
  EXISTS (
    SELECT 1 FROM auth.users u
    JOIN user_roles ur ON ur.user_id = u.id
    WHERE auth.uid() = u.id
    AND ur.role IN ('admin', 'collector')
  )
);

-- Create table for tracking email attachments
CREATE TABLE email_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'sent')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster lookups
CREATE INDEX idx_email_attachments_email_id ON email_attachments(email_id);

-- Add trigger for updated_at
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON email_attachments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger for email attachments
CREATE TRIGGER audit_email_attachments_changes
AFTER INSERT OR UPDATE OR DELETE ON email_attachments
FOR EACH ROW
EXECUTE FUNCTION log_audit_event();

-- Update email_logs table to include attachment information
ALTER TABLE email_logs
ADD COLUMN has_attachments BOOLEAN DEFAULT false,
ADD COLUMN total_attachment_size BIGINT DEFAULT 0;

-- Create function to handle attachment cleanup
CREATE OR REPLACE FUNCTION cleanup_orphaned_attachments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete attachments for failed or deleted emails older than 7 days
    DELETE FROM email_attachments
    WHERE (status = 'failed' OR email_id NOT IN (SELECT id FROM email_logs))
    AND created_at < now() - interval '7 days';
END;
$$;

-- Schedule attachment cleanup
SELECT cron.schedule(
    'cleanup-email-attachments',
    '0 0 * * *',  -- Run daily at midnight
    $$SELECT cleanup_orphaned_attachments()$$
);

