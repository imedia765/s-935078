
-- Add metadata column to email_audit table
ALTER TABLE IF EXISTS public.email_audit
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to audit_logs table
ALTER TABLE IF EXISTS public.audit_logs
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index on metadata columns for better query performance
CREATE INDEX IF NOT EXISTS idx_email_audit_metadata ON public.email_audit USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON public.audit_logs USING gin (metadata);

-- Update RLS policies to include metadata column
ALTER POLICY IF EXISTS "Enable read access for authenticated users" ON public.email_audit
    USING (auth.uid() = auth_user_id);

ALTER POLICY IF EXISTS "Enable insert access for authenticated users" ON public.email_audit
    USING (auth.uid() = auth_user_id);

-- Grant necessary permissions
GRANT ALL ON public.email_audit TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

