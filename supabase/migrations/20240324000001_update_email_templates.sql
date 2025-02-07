
BEGIN;

-- Update Welcome Email template
UPDATE email_templates
SET subject = 'Welcome to PWA Burton',
    body = '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
    <div style="background-color: #6C5DD3; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">PWA Burton</h1>
    </div>
    
    <div style="text-align: center; padding: 20px; font-size: 24px; color: #333; font-family: ''Traditional Arabic'', serif;">
        بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
    </div>
    
    <div style="background-color: white; padding: 30px; border-radius: 8px; margin: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Welcome to PWA Burton! 🎉</h2>
        <p style="color: #34495e;">Dear {member_name},</p>
        <p style="color: #34495e;">Welcome to the Professional Women''s Association Burton! We''re delighted to have you as a member of our community.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Your Membership Details</h3>
            <ul style="list-style: none; padding: 0; color: #34495e;">
                <li style="margin-bottom: 8px;">👤 Member Number: {member_number}</li>
                <li style="margin-bottom: 8px;">📅 Join Date: {join_date}</li>
            </ul>
        </div>

        <p style="color: #34495e;">As a member, you''ll have access to:</p>
        <ul style="color: #34495e;">
            <li>Regular community events and workshops</li>
            <li>Networking opportunities</li>
            <li>Support services and resources</li>
            <li>Member-exclusive benefits</li>
        </ul>

        <p style="color: #34495e;">We look forward to supporting you and growing together as a community.</p>
        <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #666; font-size: 14px; background-color: #f1f1f1;">
        <p>Professional Women''s Association Burton</p>
        <p>Supporting and empowering women in our community</p>
        <p>Contact us: <a href="mailto:burtonpwa@gmail.com" style="color: #6C5DD3;">burtonpwa@gmail.com</a></p>
    </div>
</div>',
    variables = '{"member_name": "string", "member_number": "string", "join_date": "date"}'::jsonb
WHERE name = 'Welcome Email';

-- Update Account Verification template
UPDATE email_templates
SET subject = 'Verify Your PWA Burton Account',
    body = '
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
    <div style="background-color: #6C5DD3; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">PWA Burton</h1>
    </div>
    
    <div style="text-align: center; padding: 20px; font-size: 24px; color: #333; font-family: ''Traditional Arabic'', serif;">
        بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
    </div>
    
    <div style="background-color: white; padding: 30px; border-radius: 8px; margin: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Verify Your Account 🔐</h2>
        <p style="color: #34495e;">Dear {member_name},</p>
        <p style="color: #34495e;">Thank you for registering with PWA Burton. To complete your account setup and access all member features, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_link}" style="background-color: #6C5DD3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
        </div>

        <p style="color: #34495e; font-size: 13px;">If the button doesn''t work, you can copy and paste this link into your browser:</p>
        <p style="color: #34495e; font-size: 13px; word-break: break-all;">{verification_link}</p>
        
        <p style="color: #34495e;">This link will expire in 24 hours. If you didn''t request this verification, please ignore this email.</p>
        <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #666; font-size: 14px; background-color: #f1f1f1;">
        <p>Professional Women''s Association Burton</p>
        <p>Supporting and empowering women in our community</p>
        <p>Contact us: <a href="mailto:burtonpwa@gmail.com" style="color: #6C5DD3;">burtonpwa@gmail.com</a></p>
    </div>
</div>',
    variables = '{"member_name": "string", "verification_link": "string"}'::jsonb
WHERE name = 'Account Verification';

-- Update Password Reset template
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
        <p style="color: #34495e;">Dear {member_name},</p>
        <p style="color: #34495e;">We received a request to reset your PWA Burton account password. Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #6C5DD3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>

        <p style="color: #34495e; font-size: 13px;">If the button doesn''t work, you can copy and paste this link into your browser:</p>
        <p style="color: #34495e; font-size: 13px; word-break: break-all;">{reset_link}</p>
        
        <p style="color: #34495e;">This link will expire in 1 hour. If you didn''t request a password reset, please ignore this email and ensure your account is secure.</p>
        <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #666; font-size: 14px; background-color: #f1f1f1;">
        <p>Professional Women''s Association Burton</p>
        <p>Supporting and empowering women in our community</p>
        <p>Contact us: <a href="mailto:burtonpwa@gmail.com" style="color: #6C5DD3;">burtonpwa@gmail.com</a></p>
    </div>
</div>',
    variables = '{"member_name": "string", "reset_link": "string"}'::jsonb
WHERE name = 'Password Reset';

COMMIT;

