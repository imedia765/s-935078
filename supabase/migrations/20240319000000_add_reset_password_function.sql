
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
  v_previous_auth_user_id uuid;
begin
  -- Start transaction
  begin;
    -- Get the member's ID and current auth_user_id
    select id, auth_user_id
    into v_member_id, v_auth_user_id
    from members
    where member_number = p_member_number;

    -- Store the previous auth_user_id
    v_previous_auth_user_id := v_auth_user_id;

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

    -- Ensure the member record maintains the auth_user_id association
    update members
    set 
      auth_user_id = p_user_id,
      failed_login_attempts = 0,
      updated_at = now()
    where id = v_member_id;

    -- Verify the update was successful
    if not found then
      raise exception 'Failed to update member record';
    end if;

    -- Log the action with detailed information
    insert into audit_logs (table_name, operation, record_id, new_values)
    values (
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

    -- Commit transaction
    commit;

    return json_build_object(
      'success', true,
      'message', 'Password reset successful',
      'member_id', v_member_id,
      'auth_user_id', p_user_id
    );

  exception when others then
    -- Rollback transaction on error
    rollback;
    return json_build_object(
      'success', false,
      'message', SQLERRM,
      'member_number', p_member_number
    );
  end;
end;
$$;

-- Add function to fix broken auth associations
create or replace function fix_member_auth_association(
  p_member_number text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_auth_user_id uuid;
  v_latest_auth_id uuid;
begin
  -- Start transaction
  begin;
    -- Get the member's current information
    select id, auth_user_id
    into v_member_id, v_auth_user_id
    from members
    where member_number = p_member_number;

    -- Get the latest auth_user_id from audit logs
    select (new_values->>'auth_user_id')::uuid
    into v_latest_auth_id
    from audit_logs
    where table_name = 'members'
    and record_id = v_member_id
    and new_values->>'action' = 'password_reset'
    order by created_at desc
    limit 1;

    -- Update the member record with the correct auth_user_id
    if v_latest_auth_id is not null then
      update members
      set 
        auth_user_id = v_latest_auth_id,
        updated_at = now()
      where id = v_member_id;

      -- Log the recovery action
      insert into audit_logs (table_name, operation, record_id, new_values)
      values (
        'members',
        'RECOVERY',
        v_member_id,
        jsonb_build_object(
          'action', 'auth_association_recovery',
          'member_number', p_member_number,
          'previous_auth_user_id', v_auth_user_id,
          'recovered_auth_user_id', v_latest_auth_id
        )
      );

      commit;
      return json_build_object(
        'success', true,
        'message', 'Auth association recovered successfully',
        'member_id', v_member_id,
        'auth_user_id', v_latest_auth_id
      );
    else
      return json_build_object(
        'success', false,
        'message', 'No valid auth association found in audit logs',
        'member_number', p_member_number
      );
    end if;

  exception when others then
    rollback;
    return json_build_object(
      'success', false,
      'message', SQLERRM,
      'member_number', p_member_number
    );
  end;
end;
$$;

-- Grant execute permissions
grant execute on function reset_password_to_member_number to authenticated;
grant execute on function fix_member_auth_association to authenticated;

