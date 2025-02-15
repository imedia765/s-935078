
-- Drop policies first to avoid conflicts
BEGIN;
    DROP POLICY IF EXISTS "Allow authenticated users to read their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to upload their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to update their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to access the bucket" ON storage.buckets;
    DROP POLICY IF EXISTS "Allow authenticated users to create buckets" ON storage.buckets;
COMMIT;

-- Reset ownership to postgres to ensure we have proper permissions
ALTER TABLE storage.objects OWNER TO postgres;
ALTER TABLE storage.buckets OWNER TO postgres;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create bucket policies first
BEGIN;
    -- Allow authenticated users to create and access buckets
    CREATE POLICY "Allow authenticated users to create buckets"
    ON storage.buckets FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
    );

    CREATE POLICY "Allow authenticated users to access the bucket"
    ON storage.buckets FOR SELECT
    USING (
        auth.role() = 'authenticated'
    );
COMMIT;

-- Create the bucket after policies are in place
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'profile_documents'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES (
            'profile_documents',
            'profile_documents',
            false
        );
    END IF;
END $$;

-- Create storage object policies
BEGIN;
    CREATE POLICY "Allow authenticated users to read their own documents"
    ON storage.objects FOR SELECT
    USING (
        auth.role() = 'authenticated' 
        AND bucket_id = 'profile_documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Allow authenticated users to upload their own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' 
        AND bucket_id = 'profile_documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Allow authenticated users to update their own documents"
    ON storage.objects FOR UPDATE
    USING (
        auth.role() = 'authenticated' 
        AND bucket_id = 'profile_documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

    CREATE POLICY "Allow authenticated users to delete their own documents"
    ON storage.objects FOR DELETE
    USING (
        auth.role() = 'authenticated' 
        AND bucket_id = 'profile_documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
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
