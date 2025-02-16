
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

-- Create new policies
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
