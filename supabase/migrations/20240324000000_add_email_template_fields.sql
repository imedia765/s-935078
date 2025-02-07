
-- First drop the type if it exists to avoid conflicts
DROP TYPE IF EXISTS email_template_category CASCADE;

-- Create the enum type
CREATE TYPE email_template_category AS ENUM ('payment', 'notification', 'system', 'custom');

-- Drop the columns if they exist
ALTER TABLE email_templates 
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS is_system;

-- Add the columns with proper type constraints
ALTER TABLE email_templates 
ADD COLUMN category email_template_category NOT NULL DEFAULT 'custom',
ADD COLUMN is_system boolean NOT NULL DEFAULT false;

-- Update existing rows to have default values
UPDATE email_templates 
SET category = 'custom', is_system = false;

