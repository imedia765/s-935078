
-- This migration ensures all required columns exist and have proper indexes

-- Add status column to email_audit table if it doesn't exist
ALTER TABLE IF EXISTS public.email_audit
ADD COLUMN IF NOT EXISTS status TEXT;

-- Add metadata column to email_audit table if it doesn't exist
ALTER TABLE IF EXISTS public.email_audit
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to audit_logs table if it doesn't exist
ALTER TABLE IF EXISTS public.audit_logs
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add indices for better query performance
CREATE INDEX IF NOT EXISTS idx_email_audit_status ON public.email_audit(status);
CREATE INDEX IF NOT EXISTS idx_email_audit_metadata ON public.email_audit USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON public.audit_logs USING gin (metadata);

-- Update RLS policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'email_audit' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" 
        ON public.email_audit
        FOR SELECT
        USING (auth.uid() = auth_user_id);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'email_audit' 
        AND policyname = 'Enable insert access for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert access for authenticated users" 
        ON public.email_audit
        FOR INSERT
        WITH CHECK (auth.uid() = auth_user_id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.email_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.email_audit TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

