
-- Add category and is_system columns
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT false;

-- Add check constraint for category values
ALTER TABLE email_templates 
ADD CONSTRAINT email_templates_category_check 
CHECK (category IN ('payment', 'notification', 'system', 'custom'));
