
-- Create an enum type for email template categories
DO $$ BEGIN
    CREATE TYPE email_template_category AS ENUM ('payment', 'notification', 'system', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add category and is_system columns if they don't exist
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS category email_template_category DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;

-- Update existing rows to have default values
UPDATE email_templates 
SET category = 'custom', is_system = false 
WHERE category IS NULL OR is_system IS NULL;

