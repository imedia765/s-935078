
-- Create receipts bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM storage.buckets WHERE id = 'receipts'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('receipts', 'receipts', true);
    END IF;
END $$;

-- Update storage bucket RLS policies
BEGIN;
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated read access to receipts" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to upload receipts" ON storage.objects;
    DROP POLICY IF EXISTS "Allow collectors to access their members' receipts" ON storage.objects;

    -- Create new policies
    CREATE POLICY "Allow authenticated read access to receipts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts' AND
        auth.role() = 'authenticated'
    );

    CREATE POLICY "Allow authenticated users to upload receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts' AND
        auth.role() = 'authenticated'
    );

    -- Allow users to manage their own receipts
    CREATE POLICY "Allow users to manage their own receipts"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'receipts' AND
        auth.uid() = auth.uid()
    )
    WITH CHECK (
        bucket_id = 'receipts' AND
        auth.uid() = auth.uid()
    );
END;
