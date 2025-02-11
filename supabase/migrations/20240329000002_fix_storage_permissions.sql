
-- Add storage bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM storage.buckets WHERE id = 'profile_documents'
    ) THEN
        INSERT INTO storage.buckets (id, name)
        VALUES ('profile_documents', 'profile_documents');
    END IF;
END $$;

-- Update storage bucket RLS policies
BEGIN;
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated users to read their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to upload their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to update their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON storage.objects;

    -- Create new policies
    CREATE POLICY "Allow authenticated users to read their own documents"
    ON storage.objects FOR SELECT
    USING (
        auth.role() = 'authenticated' AND 
        bucket_id = 'profile_documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Allow authenticated users to upload their own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        bucket_id = 'profile_documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Allow authenticated users to update their own documents"
    ON storage.objects FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND 
        bucket_id = 'profile_documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Allow authenticated users to delete their own documents"
    ON storage.objects FOR DELETE
    USING (
        auth.role() = 'authenticated' AND 
        bucket_id = 'profile_documents' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );
COMMIT;

-- Add metadata columns to audit tables
ALTER TABLE IF EXISTS public.email_audit 
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.audit_logs 
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Enable RLS on tables
ALTER TABLE public.email_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for audit tables
DO $$
BEGIN
    -- Email Audit policies
    DROP POLICY IF EXISTS "Users can read their own audit logs" ON public.email_audit;
    CREATE POLICY "Users can read their own audit logs"
    ON public.email_audit FOR SELECT
    USING (auth.uid() = auth_user_id);

    DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.email_audit;
    CREATE POLICY "Users can insert their own audit logs"
    ON public.email_audit FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

    -- Audit Logs policies
    DROP POLICY IF EXISTS "Users can read their own logs" ON public.audit_logs;
    CREATE POLICY "Users can read their own logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert their own logs" ON public.audit_logs;
    CREATE POLICY "Users can insert their own logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
END
$$;

-- Grant permissions
GRANT ALL ON public.email_audit TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
