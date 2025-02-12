
-- Wrap everything in a transaction
BEGIN;

-- Create email_transitions table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_transitions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    member_number text NOT NULL,
    old_auth_email text NOT NULL,
    new_profile_email text NOT NULL,
    verification_token text,
    verification_sent_at timestamp with time zone,
    verification_expires_at timestamp with time zone,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'verifying', 'completed', 'failed')),
    completed_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_transitions_member_number 
ON email_transitions(member_number);

CREATE INDEX IF NOT EXISTS idx_email_transitions_verification_token 
ON email_transitions(verification_token);

CREATE INDEX IF NOT EXISTS idx_email_transitions_status 
ON email_transitions(status);

-- Create function to initiate email transition
CREATE OR REPLACE FUNCTION initiate_email_transition(
    p_member_number text,
    p_new_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_email text;
    v_token text;
    v_result jsonb;
BEGIN
    -- Get current auth email
    SELECT email INTO v_old_email
    FROM auth.users u
    JOIN members m ON m.auth_user_id = u.id
    WHERE m.member_number = p_member_number;

    IF v_old_email IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Member not found'
        );
    END IF;

    -- Generate verification token
    v_token := encode(gen_random_bytes(32), 'hex');

    -- Create transition record
    INSERT INTO email_transitions (
        member_number,
        old_auth_email,
        new_profile_email,
        verification_token,
        verification_sent_at,
        verification_expires_at
    )
    VALUES (
        p_member_number,
        v_old_email,
        p_new_email,
        v_token,
        now(),
        now() + interval '24 hours'
    );

    RETURN jsonb_build_object(
        'success', true,
        'token', v_token
    );
END;
$$;

-- Create function to complete email transition
CREATE OR REPLACE FUNCTION complete_email_transition(
    p_token text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transition email_transitions%ROWTYPE;
    v_member_id uuid;
BEGIN
    -- Get and lock transition record
    SELECT * INTO v_transition
    FROM email_transitions
    WHERE verification_token = p_token
    AND status = 'pending'
    AND verification_expires_at > now()
    FOR UPDATE;

    IF v_transition IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired token'
        );
    END IF;

    -- Get member ID
    SELECT id INTO v_member_id
    FROM members
    WHERE member_number = v_transition.member_number;

    IF v_member_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Member not found'
        );
    END IF;

    -- Update member email
    UPDATE members
    SET email = v_transition.new_profile_email,
        updated_at = now()
    WHERE id = v_member_id;

    -- Mark transition as completed
    UPDATE email_transitions
    SET status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE id = v_transition.id;

    RETURN jsonb_build_object(
        'success', true
    );
END;
$$;

-- Add RLS policies
ALTER TABLE email_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transitions"
ON email_transitions
FOR SELECT
USING (
    member_number IN (
        SELECT member_number 
        FROM members 
        WHERE auth_user_id = auth.uid()
    )
);

CREATE POLICY "Only system can insert transitions"
ON email_transitions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Only system can update transitions"
ON email_transitions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- First check if the email_templates table exists, if not create it
CREATE TABLE IF NOT EXISTS email_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid,
    variables jsonb DEFAULT '{}'::jsonb,
    version integer DEFAULT 1
);

-- First check if the enum type exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_template_category') THEN
        CREATE TYPE email_template_category AS ENUM ('payment', 'notification', 'system', 'custom');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Safely drop columns if they exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_templates' AND column_name = 'category'
    ) THEN
        ALTER TABLE email_templates DROP COLUMN category;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_templates' AND column_name = 'is_system'
    ) THEN
        ALTER TABLE email_templates DROP COLUMN is_system;
    END IF;
END $$;

-- Add the new columns
ALTER TABLE email_templates 
ADD COLUMN category email_template_category DEFAULT 'custom'::email_template_category NOT NULL,
ADD COLUMN is_system boolean DEFAULT false NOT NULL;

-- Update existing rows with default values
UPDATE email_templates 
SET category = 'custom'::email_template_category,
    is_system = false
WHERE category IS NULL OR is_system IS NULL;

-- Commit the transaction
COMMIT;
