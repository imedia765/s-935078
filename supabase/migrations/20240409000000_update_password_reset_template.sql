
-- Update Password Reset template with standardized variables and improved design
BEGIN;

UPDATE email_templates
SET subject = 'Reset Your PWA Burton Password',
    body = '
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!--<![endif]-->
</head>
<body style="margin: 0; padding: 0; min-width: 100%; background-color: #f8f9fa;">
    <!--[if mso]>
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
    <td>
    <![endif]-->
    <div style="font-family: Arial, ''Helvetica Neue'', Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <!-- Header with PWA Brand -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td style="background-color: #6C5DD3; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px; font-family: Arial, sans-serif; mso-line-height-rule: exactly;">PWA Burton</h1>
                </td>
            </tr>
        </table>
        
        <!-- Bismillah -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td style="text-align: center; padding: 20px;">
                    <div style="font-size: 24px; color: #333333; font-family: ''Traditional Arabic'', Arial, sans-serif;">
                        بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                    </div>
                </td>
            </tr>
        </table>
        
        <!-- Main Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: white; border-radius: 8px;">
                        <tr>
                            <td style="padding: 30px;">
                                <h2 style="color: #2c3e50; margin-bottom: 20px; font-family: Arial, sans-serif;">Password Reset Request 🔑</h2>
                                
                                <div style="color: #34495e; margin-bottom: 20px;">
                                    <p style="margin: 0 0 10px 0;">We received a request to reset your PWA Burton account password.</p>
                                    <p style="margin: 0;"><strong>Member Number:</strong> {DATA_VARIABLE:memberNumber}</p>
                                </div>

                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center" style="padding: 30px 0;">
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="background-color: #6C5DD3; border-radius: 5px;">
                                                        <a href="{DATA_VARIABLE:resetUrl}" style="display: inline-block; padding: 12px 24px; color: white; text-decoration: none; font-family: Arial, sans-serif;">Reset Password</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; color: #666666;">
                                    <p style="margin: 0;"><strong>Important:</strong></p>
                                    <ul style="margin: 10px 0; padding-left: 20px;">
                                        <li style="margin-bottom: 5px;">This link will expire in 1 hour</li>
                                        <li style="margin-bottom: 5px;">If you didn''t request this reset, please ignore this email</li>
                                        <li style="margin-bottom: 5px;">Never share this link with anyone</li>
                                    </ul>
                                </div>

                                <p style="color: #34495e; margin: 20px 0 0 0;">For security reasons, if you did not request a password reset, please contact us immediately.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td style="text-align: center; padding: 20px; background-color: #f1f1f1;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">Professional Women''s Association Burton</p>
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">Supporting and empowering women in our community</p>
                    <p style="margin: 0; color: #666666; font-size: 14px;">Contact us: <a href="mailto:burtonpwa@gmail.com" style="color: #6C5DD3; text-decoration: underline;">burtonpwa@gmail.com</a></p>
                </td>
            </tr>
        </table>
    </div>
    <!--[if mso]>
    </td>
    </tr>
    </table>
    <![endif]-->
</body>
</html>',
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

