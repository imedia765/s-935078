
-- Rename the text-parameter version of generate_magic_link
ALTER FUNCTION public.generate_magic_link(p_user_id text) 
RENAME TO generate_magic_link_text_param;

-- Drop and recreate the UUID version to ensure it's the only one with the original name
CREATE OR REPLACE FUNCTION public.generate_magic_link(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_email TEXT;
    v_token TEXT;
BEGIN
    -- Get user's email from members table
    SELECT email INTO v_email
    FROM members
    WHERE auth_user_id = p_user_id;

    IF v_email IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No email found for user'
        );
    END IF;

    -- Generate token using existing function
    v_token := generate_magic_link_token(v_email, 'magiclink'::token_type);

    IF v_token IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Failed to generate token'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'email', v_email,
        'token', v_token
    );
END;
$function$;
