
-- Add the reset_password_to_member_number function
create or replace function reset_password_to_member_number(
  p_user_id uuid,
  p_member_number text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hashed_password text;
  v_member_id uuid;
  v_auth_user_id uuid;
begin
  -- Get the member's ID and current auth_user_id
  select id, auth_user_id
  into v_member_id, v_auth_user_id
  from members
  where member_number = p_member_number;

  -- Store the auth_user_id temporarily if it exists
  if v_auth_user_id is not null then
    -- Hash the member number to use as password
    v_hashed_password := crypt(p_member_number, gen_salt('bf'));
    
    -- Update the user's password
    update auth.users
    set 
      encrypted_password = v_hashed_password,
      raw_app_meta_data = raw_app_meta_data || 
        jsonb_build_object(
          'force_password_change', true,
          'password_reset_at', extract(epoch from now())
        )
    where id = p_user_id;

    -- Ensure the member record maintains the auth_user_id
    update members
    set 
      auth_user_id = p_user_id,
      failed_login_attempts = 0,
      updated_at = now()
    where id = v_member_id;

    -- Reset failed attempts
    update members
    set failed_login_attempts = 0
    where id = v_member_id;

    -- Log the action
    insert into audit_logs (table_name, operation, record_id, new_values)
    values (
      'members',
      'UPDATE',
      v_member_id,
      jsonb_build_object(
        'action', 'password_reset',
        'member_number', p_member_number,
        'auth_user_id', p_user_id
      )
    );

    return json_build_object(
      'success', true,
      'message', 'Password reset successful'
    );
  else
    return json_build_object(
      'success', false,
      'message', 'Member not found or invalid auth_user_id'
    );
  end if;
exception
  when others then
    return json_build_object(
      'success', false,
      'message', SQLERRM
    );
end;
$$;

-- Grant execute permissions
grant execute on function reset_password_to_member_number to authenticated;

