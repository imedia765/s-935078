
-- First drop the existing policy that's causing recursion
DROP POLICY IF EXISTS "members_access_policy" ON members;

-- Create a new, non-recursive policy for members table
CREATE POLICY "members_access_policy" ON members
FOR ALL TO authenticated
USING (
  -- Direct user access - user viewing their own record
  (auth_user_id = auth.uid())
  OR 
  -- Collector access - using a direct join without recursion
  (collector_id IN (
    SELECT id 
    FROM members_collectors 
    WHERE auth_user_id = auth.uid() 
    AND active = true
  ))
  OR
  -- Admin access - using a direct role check
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add policy for audit logs to handle UUID validation
CREATE OR REPLACE FUNCTION public.handle_audit_log() 
RETURNS trigger AS $$
BEGIN
  -- Ensure we're handling non-UUID member_number properly
  IF NEW.member_number ~ '^[A-Za-z0-9]+$' THEN
    -- Convert member number to a deterministic UUID using MD5
    NEW.record_id := md5(NEW.member_number)::uuid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit logs
DROP TRIGGER IF EXISTS audit_log_member_number_trigger ON audit_logs;
CREATE TRIGGER audit_log_member_number_trigger
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION handle_audit_log();
