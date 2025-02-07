
-- Wrap everything in a transaction
BEGIN;

-- First check if the email_templates table exists, if not create it
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

-- First check if the enum type exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_template_category') THEN
        CREATE TYPE email_template_category AS ENUM ('payment', 'notification', 'system', 'custom');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Safely drop columns if they exist
DO $$ 
BEGIN
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

-- Add the new columns
ALTER TABLE email_templates 
ADD COLUMN category email_template_category DEFAULT 'custom'::email_template_category NOT NULL,
ADD COLUMN is_system boolean DEFAULT false NOT NULL;

-- Update existing rows with default values
UPDATE email_templates 
SET category = 'custom'::email_template_category,
    is_system = false
WHERE category IS NULL OR is_system IS NULL;

-- Commit the transaction
COMMIT;
