
-- First, ensure we have the proper extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies
BEGIN;
    DROP POLICY IF EXISTS "Allow authenticated users to read their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to upload their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to update their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to delete their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to access the bucket" ON storage.buckets;
    DROP POLICY IF EXISTS "Allow service role to access buckets" ON storage.buckets;
COMMIT;

-- Reset permissions
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Ensure the bucket exists (this will run as postgres)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
    VALUES ('profile_documents', 'profile_documents', NULL, NOW(), NOW(), false)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Create policies for objects
BEGIN;
    CREATE POLICY "Allow authenticated users to read their own documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'profile_documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

    CREATE POLICY "Allow authenticated users to upload their own documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile_documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

    CREATE POLICY "Allow authenticated users to update their own documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profile_documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

    CREATE POLICY "Allow authenticated users to delete their own documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profile_documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
COMMIT;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO postgres;
GRANT ALL ON storage.buckets TO postgres;

-- Create the bucket if it doesn't exist using a function to ensure proper permissions
CREATE OR REPLACE FUNCTION create_storage_bucket()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profile_documents', 'profile_documents', false)
    ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Execute the function
SELECT create_storage_bucket();
