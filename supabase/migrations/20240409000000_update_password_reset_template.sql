
-- Update Password Reset template with standardized variables and improved design
BEGIN;

UPDATE email_templates
SET subject = 'Reset Your PWA Burton Password',
    body = '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
    <div style="background-color: #6C5DD3; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">PWA Burton</h1>
    </div>
    
    <div style="text-align: center; padding: 20px; font-size: 24px; color: #333; font-family: ''Traditional Arabic'', serif;">
        بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
    </div>
    
    <div style="background-color: white; padding: 30px; border-radius: 8px; margin: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Password Reset Request 🔑</h2>
        
        <div style="color: #34495e; margin-bottom: 20px;">
            <p>We received a request to reset your PWA Burton account password.</p>
            <p><strong>Member Number:</strong> {memberNumber}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{resetUrl}" style="background-color: #6C5DD3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; color: #666;">
            <p style="margin: 0;"><strong>Important:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn''t request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
            </ul>
        </div>

        <p style="color: #34495e;">For security reasons, if you did not request a password reset, please contact us immediately.</p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #666; font-size: 14px; background-color: #f1f1f1;">
        <p>Professional Women''s Association Burton</p>
        <p>Supporting and empowering women in our community</p>
        <p>Contact us: <a href="mailto:burtonpwa@gmail.com" style="color: #6C5DD3;">burtonpwa@gmail.com</a></p>
    </div>
</div>',
    variables = '{"memberNumber": "string", "resetUrl": "string"}'::jsonb
WHERE name = 'Password Reset';

-- Update Loops template ID if needed
UPDATE loops_integration
SET password_reset_template_id = COALESCE(password_reset_template_id, 'cm73c7rki01n6i16s6vle80mc')
WHERE is_active = true;

-- Log the template update
INSERT INTO audit_logs (
    operation,
    table_name,
    new_values,
    severity
) VALUES (
    'update',
    'email_templates',
    jsonb_build_object(
        'template', 'Password Reset',
        'updated_at', now(),
        'variables_standardized', true
    ),
    'info'
);

COMMIT;
