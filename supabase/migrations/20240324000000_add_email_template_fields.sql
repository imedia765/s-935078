
-- Wrap everything in a transaction
BEGIN;

-- First ensure the table exists
CREATE TABLE IF NOT EXISTS email_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid,
    variables jsonb DEFAULT '{}'::jsonb,
    version integer DEFAULT 1
);

-- First drop the type if it exists to avoid conflicts
DROP TYPE IF EXISTS email_template_category CASCADE;

-- Create the enum type
CREATE TYPE email_template_category AS ENUM ('payment', 'notification', 'system', 'custom');

-- Drop the columns if they exist
DO $$ 
BEGIN
    -- Try to drop the columns if they exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_templates' AND column_name = 'category'
    ) THEN
        ALTER TABLE email_templates DROP COLUMN category;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_templates' AND column_name = 'is_system'
    ) THEN
        ALTER TABLE email_templates DROP COLUMN is_system;
    END IF;
END $$;

-- Add the columns with proper type constraints
ALTER TABLE email_templates 
ADD COLUMN category email_template_category NOT NULL DEFAULT 'custom',
ADD COLUMN is_system boolean NOT NULL DEFAULT false;

-- Update existing rows to have default values
UPDATE email_templates 
SET category = 'custom', is_system = false;

-- Commit the transaction
COMMIT;
