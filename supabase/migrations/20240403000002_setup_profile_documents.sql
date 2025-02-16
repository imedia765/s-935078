
-- Create profile_documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_documents', 'profile_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Update bucket configuration
UPDATE storage.buckets
SET 
    file_size_limit = 52428800, -- 50MB limit
    allowed_mime_types = ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
WHERE id = 'profile_documents';

-- Clear existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read their documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload their documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage their documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to manage their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to list their own documents" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow users to list their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'profile_documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to manage their own documents"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'profile_documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'profile_documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Create a policy for bucket access
CREATE POLICY "Allow authenticated users to use bucket"
ON storage.buckets FOR ALL
TO authenticated
USING (id = 'profile_documents')
WITH CHECK (id = 'profile_documents');

-- Enable RLS on buckets
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Ensure email_audit table has proper RLS
CREATE POLICY IF NOT EXISTS "Users can read their own audit records"
ON email_audit FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Grant necessary permissions for email_audit
GRANT SELECT ON email_audit TO authenticated;
