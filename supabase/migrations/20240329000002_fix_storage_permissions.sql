
-- Create profile_documents bucket if it doesn't exist
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

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Reset ownership and permissions
ALTER TABLE storage.objects OWNER TO authenticated;
ALTER TABLE storage.buckets OWNER TO authenticated;
