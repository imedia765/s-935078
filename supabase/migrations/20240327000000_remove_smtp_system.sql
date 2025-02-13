
-- Wrap everything in a transaction
BEGIN;

-- Drop SMTP-related tables
DROP TABLE IF EXISTS smtp_health_checks;
DROP TABLE IF EXISTS smtp_configurations;

-- Remove any related RLS policies (they will be automatically dropped with tables)

-- Clean up any orphaned data or references
DELETE FROM audit_logs WHERE table_name IN ('smtp_health_checks', 'smtp_configurations');

COMMIT;
