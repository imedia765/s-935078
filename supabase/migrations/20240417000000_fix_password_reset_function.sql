
-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop and recreate the function with proper schema references
CREATE OR REPLACE FUNCTION reset_password_to_member_number(
  p_user_id uuid,
  p_member_number text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hashed_password text;
  v_member_id uuid;
  v_auth_user_id uuid;
  v_previous_auth_user_id uuid;
  v_result jsonb;
BEGIN
  -- Get the member's ID and current auth_user_id
  SELECT id, auth_user_id
  INTO v_member_id, v_auth_user_id
  FROM members
  WHERE member_number = p_member_number;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Member not found',
      'member_number', p_member_number
    );
  END IF;

  -- Store the previous auth_user_id
  v_previous_auth_user_id := v_auth_user_id;

  -- Hash the member number to use as password with explicit schema reference
  v_hashed_password := extensions.crypt(p_member_number, extensions.gen_salt('bf'));

  BEGIN
    -- Start explicit transaction
    START TRANSACTION;

    -- Update the user's password
    UPDATE auth.users
    SET 
      encrypted_password = v_hashed_password,
      raw_app_meta_data = raw_app_meta_data || 
        jsonb_build_object(
          'force_password_change', true,
          'password_reset_at', extract(epoch from now())
        )
    WHERE id = p_user_id;

    IF NOT FOUND THEN
      ROLLBACK;
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Auth user not found',
        'member_number', p_member_number
      );
    END IF;

    -- Ensure the member record maintains the auth_user_id association
    UPDATE members
    SET 
      auth_user_id = p_user_id,
      failed_login_attempts = 0,
      updated_at = now()
    WHERE id = v_member_id;

    IF NOT FOUND THEN
      ROLLBACK;
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Failed to update member record',
        'member_number', p_member_number
      );
    END IF;

    -- Log the action with detailed information
    INSERT INTO audit_logs (
      table_name,
      operation,
      record_id,
      new_values
    ) VALUES (
      'members',
      'UPDATE',
      v_member_id,
      jsonb_build_object(
        'action', 'password_reset',
        'member_number', p_member_number,
        'auth_user_id', p_user_id,
        'previous_auth_user_id', v_previous_auth_user_id
      )
    );

    -- Build success result
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Password reset successful',
      'member_id', v_member_id,
      'auth_user_id', p_user_id
    );

    -- Commit transaction
    COMMIT;

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction on error
    ROLLBACK;
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'member_number', p_member_number
    );
  END;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION reset_password_to_member_number TO authenticated;
