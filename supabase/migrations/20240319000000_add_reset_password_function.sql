
create or replace function reset_password_to_member_number(
  p_user_id uuid,
  p_member_number text
)
returns json
language plpgsql
security definer
as $$
declare
  v_hashed_password text;
begin
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

  -- Reset failed attempts in your members table if you have such a column
  update members
  set failed_login_attempts = 0
  where auth_user_id = p_user_id;

  return json_build_object(
    'success', true,
    'message', 'Password reset successful'
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'message', SQLERRM
    );
end;
$$;
