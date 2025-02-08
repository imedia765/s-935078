
-- First ensure the tables exist
CREATE TABLE IF NOT EXISTS public.email_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id),
    member_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    status TEXT
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

-- Add metadata columns if they don't exist
DO $$ 
BEGIN
    -- Add metadata column to email_audit if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'email_audit' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.email_audit ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add metadata column to audit_logs if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.audit_logs ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Add indices for better query performance
CREATE INDEX IF NOT EXISTS idx_email_audit_status ON public.email_audit(status);
CREATE INDEX IF NOT EXISTS idx_email_audit_metadata ON public.email_audit USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON public.audit_logs USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_email_audit_auth_user_id ON public.email_audit(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Update RLS policies
DO $$ 
BEGIN
    -- Email Audit Policies
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

    -- Audit Logs Policies
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'audit_logs' 
        AND policyname = 'Enable read access for own logs'
    ) THEN
        CREATE POLICY "Enable read access for own logs" 
        ON public.audit_logs
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'audit_logs' 
        AND policyname = 'Enable insert for own logs'
    ) THEN
        CREATE POLICY "Enable insert for own logs" 
        ON public.audit_logs
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.email_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.email_audit TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

