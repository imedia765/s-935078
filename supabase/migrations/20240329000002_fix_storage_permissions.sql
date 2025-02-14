
-- Drop policies first to avoid conflicts
BEGIN;
    DROP POLICY IF EXISTS "Allow authenticated users to read their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to upload their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to update their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to access the bucket" ON storage.buckets;
COMMIT;

-- Reset ownership to postgres to ensure we have proper permissions
ALTER TABLE storage.objects OWNER TO postgres;
ALTER TABLE storage.buckets OWNER TO postgres;

-- Create bucket with proper ownership
INSERT INTO storage.buckets (id, name, owner)
SELECT 'profile_documents', 'profile_documents', (
    SELECT oid FROM pg_roles WHERE rolname = 'postgres'
)
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'profile_documents'
);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create bucket policies
BEGIN;
    -- Create a policy to allow authenticated users to access the bucket first
    CREATE POLICY "Allow authenticated users to access the bucket"
    ON storage.buckets FOR SELECT
    USING (
        auth.role() = 'authenticated' AND 
        id = 'profile_documents'
    );

    -- Then create object policies
    CREATE POLICY "Allow authenticated users to read their own documents"
    ON storage.objects FOR SELECT
    USING (
        auth.role() = 'authenticated' AND 
        bucket_id = 'profile_documents' AND 
        (
            -- Allow listing the root folder
            name = '' OR
            -- Allow listing any folder (needed for root bucket access)
            position('/' in name) = 0 OR
            -- Allow access to user's own folder
            storage.foldername(name)[1] = auth.uid()::text
        )
    );

    CREATE POLICY "Allow authenticated users to upload their own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        bucket_id = 'profile_documents' AND 
        storage.foldername(name)[1] = auth.uid()::text
    );

    CREATE POLICY "Allow authenticated users to update their own documents"
    ON storage.objects FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND 
        bucket_id = 'profile_documents' AND 
        storage.foldername(name)[1] = auth.uid()::text
    );

    CREATE POLICY "Allow authenticated users to delete their own documents"
    ON storage.objects FOR DELETE
    USING (
        auth.role() = 'authenticated' AND 
        bucket_id = 'profile_documents' AND 
        storage.foldername(name)[1] = auth.uid()::text
    );
COMMIT;

-- Grant permissions to authenticated users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Grant permissions to postgres role (for admin operations)
GRANT ALL ON storage.objects TO postgres;
GRANT ALL ON storage.buckets TO postgres;

-- Reset ownership to postgres
ALTER TABLE storage.objects OWNER TO postgres;
ALTER TABLE storage.buckets OWNER TO postgres;
