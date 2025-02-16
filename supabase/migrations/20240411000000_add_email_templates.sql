
BEGIN;

-- Insert or update verification email template
INSERT INTO email_templates (name, subject, body, variables, category, is_system)
VALUES (
    'Email Verification',
    'Verify Your PWA Burton Email Address',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6C5DD3;">PWA Burton</h1>
        <div style="font-size: 24px; color: #333333; font-family: ''Traditional Arabic'', Arial, sans-serif;">
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
        </div>
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 15px;">Verify Your Email Address</h2>
        <p>We received a request to update the email address for your PWA Burton account.</p>
        <p><strong>Member Number:</strong> {DATA_VARIABLE:memberNumber}</p>
        <p><strong>New Email:</strong> {DATA_VARIABLE:newEmail}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{DATA_VARIABLE:verificationUrl}" 
               style="background-color: #6C5DD3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
            </a>
        </div>

        <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0;"><strong>Important:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 24 hours</li>
                <li>If you didn''t request this change, please contact us immediately</li>
                <li>This verification is required to complete your password reset</li>
            </ul>
        </div>
    </div>

    <div style="text-align: center; color: #666; font-size: 14px;">
        <p>Professional Women''s Association Burton</p>
        <p>Questions? Contact us at <a href="mailto:burtonpwa@gmail.com" style="color: #6C5DD3;">burtonpwa@gmail.com</a></p>
    </div>
</body>
</html>',
    '{"memberNumber": "string", "newEmail": "string", "verificationUrl": "string"}'::jsonb,
    'system',
    true
)
ON CONFLICT (name) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    category = EXCLUDED.category,
    is_system = EXCLUDED.is_system;

-- Insert or update password reset email template
INSERT INTO email_templates (name, subject, body, variables, category, is_system)
VALUES (
    'Password Reset',
    'Reset Your PWA Burton Password',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6C5DD3;">PWA Burton</h1>
        <div style="font-size: 24px; color: #333333; font-family: ''Traditional Arabic'', Arial, sans-serif;">
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
        </div>
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 15px;">Password Reset Instructions</h2>
        <p>A password reset was requested for your PWA Burton account.</p>
        <p><strong>Member Number:</strong> {DATA_VARIABLE:memberNumber}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{DATA_VARIABLE:resetUrl}" 
               style="background-color: #6C5DD3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
            </a>
        </div>

        <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0;"><strong>Password Requirements:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Minimum 8 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one number</li>
                <li>At least one special character</li>
            </ul>
            <p style="margin: 10px 0 0 0;"><strong>Security Notice:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn''t request this reset, please contact us</li>
                <li>Never share this link with anyone</li>
            </ul>
        </div>
    </div>

    <div style="text-align: center; color: #666; font-size: 14px;">
        <p>Professional Women''s Association Burton</p>
        <p>Questions? Contact us at <a href="mailto:burtonpwa@gmail.com" style="color: #6C5DD3;">burtonpwa@gmail.com</a></p>
    </div>
</body>
</html>',
    '{"memberNumber": "string", "resetUrl": "string"}'::jsonb,
    'system',
    true
)
ON CONFLICT (name) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    category = EXCLUDED.category,
    is_system = EXCLUDED.is_system;

-- Insert or update confirmation email template
INSERT INTO email_templates (name, subject, body, variables, category, is_system)
VALUES (
    'Password Reset Confirmation',
    'Password Reset Successful - PWA Burton',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #6C5DD3;">PWA Burton</h1>
        <div style="font-size: 24px; color: #333333; font-family: ''Traditional Arabic'', Arial, sans-serif;">
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
        </div>
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 15px;">Password Reset Successful</h2>
        <p>Your password has been successfully reset.</p>
        <p><strong>Member Number:</strong> {DATA_VARIABLE:memberNumber}</p>
        <p><strong>Email:</strong> {DATA_VARIABLE:email}</p>
        
        <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0;"><strong>Next Steps:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>You can now log in with your new password</li>
                <li>Keep your password secure and don''t share it</li>
                <li>If you didn''t make this change, contact us immediately</li>
            </ul>
        </div>
    </div>

    <div style="text-align: center; color: #666; font-size: 14px;">
        <p>Professional Women''s Association Burton</p>
        <p>Questions? Contact us at <a href="mailto:burtonpwa@gmail.com" style="color: #6C5DD3;">burtonpwa@gmail.com</a></p>
    </div>
</body>
</html>',
    '{"memberNumber": "string", "email": "string"}'::jsonb,
    'system',
    true
)
ON CONFLICT (name) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    variables = EXCLUDED.variables,
    category = EXCLUDED.category,
    is_system = EXCLUDED.is_system;

-- Update Loops template IDs if needed
UPDATE loops_integration
SET 
    verification_template_id = COALESCE(verification_template_id, 'cm73c7rki01n6i16s6vle80mc'),
    password_reset_template_id = COALESCE(password_reset_template_id, 'cm73c7rki01n6i16s6vle80mc'),
    confirmation_template_id = COALESCE(confirmation_template_id, 'cm73c7rki01n6i16s6vle80mc')
WHERE is_active = true;

-- Log the template updates
INSERT INTO audit_logs (
    operation,
    table_name,
    new_values,
    severity
) VALUES (
    'update',
    'email_templates',
    jsonb_build_object(
        'templates_updated', jsonb_build_array('Email Verification', 'Password Reset', 'Password Reset Confirmation'),
        'updated_at', now()
    ),
    'info'
);

COMMIT;
