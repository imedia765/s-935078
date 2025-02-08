
-- Create the tables if they don't exist
CREATE TABLE IF NOT EXISTS public.email_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id),
    member_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    operation TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    severity TEXT DEFAULT 'info'
);

-- Add metadata column to email_audit table
ALTER TABLE IF EXISTS public.email_audit
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add metadata column to audit_logs table
ALTER TABLE IF EXISTS public.audit_logs
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add status column to email_audit table
ALTER TABLE IF EXISTS public.email_audit
ADD COLUMN IF NOT EXISTS status TEXT;

-- Add index on metadata columns for better query performance
CREATE INDEX IF NOT EXISTS idx_email_audit_metadata ON public.email_audit USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON public.audit_logs USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_email_audit_status ON public.email_audit(status);

-- Update RLS policies
ALTER POLICY IF EXISTS "Enable read access for authenticated users" ON public.email_audit
    USING (auth.uid() = auth_user_id);

ALTER POLICY IF EXISTS "Enable insert access for authenticated users" ON public.email_audit
    USING (auth.uid() = auth_user_id);

-- Create RLS policies if they don't exist
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

