
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
    DROP POLICY IF EXISTS "Allow public read access to receipts" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to upload receipts" ON storage.objects;
    DROP POLICY IF EXISTS "Allow collectors to access their members' receipts" ON storage.objects;

    -- Create new policies
    CREATE POLICY "Allow public read access to receipts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts'
    );

    CREATE POLICY "Allow authenticated users to upload receipts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'receipts' AND
        auth.role() = 'authenticated'
    );

    -- Create policy for collectors to access their members' receipts
    CREATE POLICY "Allow collectors to access their members' receipts"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'receipts' AND
        EXISTS (
            SELECT 1 FROM members_collectors mc
            JOIN payment_requests pr ON pr.collector_id = mc.id
            WHERE mc.auth_user_id = auth.uid()
            AND storage.foldername(name)[1] = pr.payment_number
        )
    );
END;
