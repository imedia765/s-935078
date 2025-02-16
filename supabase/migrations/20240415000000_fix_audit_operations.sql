
-- First, create a backup of existing audit logs
CREATE TABLE IF NOT EXISTS audit_logs_backup AS
SELECT * FROM audit_logs;

-- Add new values to the audit_operation enum
ALTER TYPE audit_operation ADD VALUE IF NOT EXISTS 'email_update';
ALTER TYPE audit_operation ADD VALUE IF NOT EXISTS 'email_verify';
ALTER TYPE audit_operation ADD VALUE IF NOT EXISTS 'email_reset';

-- Update the audit logs table with new metadata validation
ALTER TABLE audit_logs
ADD CONSTRAINT valid_operation_metadata CHECK (
  CASE operation
    WHEN 'email_update' THEN 
      metadata ? 'email' AND metadata ? 'success'
    WHEN 'email_verify' THEN 
      metadata ? 'email' AND metadata ? 'isVerification'
    WHEN 'email_reset' THEN 
      metadata ? 'email' AND metadata ? 'success'
    ELSE true
  END
);
