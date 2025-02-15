
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
    DROP POLICY IF EXISTS "Allow users to list their own documents" ON storage.objects;
COMMIT;

-- Reset permissions
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Ensure the bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile_documents',
    'profile_documents',
    NULL,
    NOW(),
    NOW(),
    false,
    52428800, -- 50MB limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create bucket access policies
CREATE POLICY "Allow authenticated users to use bucket"
ON storage.buckets FOR ALL
TO authenticated
USING (name = 'profile_documents');

-- Create object-level policies
BEGIN;
    -- Allow users to list their own documents
    CREATE POLICY "Allow users to list their own documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'profile_documents' AND
        (
            -- Allow users to list their own directory
            auth.uid()::text = (storage.foldername(name))[1] OR
            -- Allow users to see the root directory
            name = '.keep'
        )
    );

    -- Allow users to read their own documents
    CREATE POLICY "Allow authenticated users to read their own documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'profile_documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

    -- Allow users to upload documents to their own directory
    CREATE POLICY "Allow authenticated users to upload their own documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile_documents' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        (octet_length(CASE WHEN content_length IS NULL THEN NULL ELSE content::bytea END) <= 52428800)
    );

    -- Allow users to update their own documents
    CREATE POLICY "Allow authenticated users to update their own documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profile_documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

    -- Allow users to delete their own documents
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

-- Initialize storage quotas if not exists
CREATE TABLE IF NOT EXISTS storage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_name TEXT NOT NULL UNIQUE,
    max_size_bytes BIGINT NOT NULL,
    warning_threshold_percent INTEGER NOT NULL DEFAULT 80,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set default quota for profile_documents
INSERT INTO storage_quotas (bucket_name, max_size_bytes, warning_threshold_percent)
VALUES ('profile_documents', 524288000, 80) -- 500MB per bucket
ON CONFLICT (bucket_name) DO UPDATE SET
    max_size_bytes = EXCLUDED.max_size_bytes,
    warning_threshold_percent = EXCLUDED.warning_threshold_percent;
