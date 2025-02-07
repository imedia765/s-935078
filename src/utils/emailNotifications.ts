
import { sendEmail } from '@/utils/email';
import { Payment } from '@/components/admin/financial/types';
import { format } from 'date-fns';

interface EmailTemplate {
  subject: string;
  html: string;
}

const emailWrapper = (content: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
    <!-- Header -->
    <div style="background-color: #6C5DD3; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">PWA Burton</h1>
    </div>
    
    <!-- Bismillah -->
    <div style="text-align: center; padding: 20px; font-size: 24px; color: #333; font-family: 'Traditional Arabic', serif;">
      بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
    </div>
    
    <!-- Main Content -->
    <div style="background-color: white; padding: 30px; border-radius: 8px; margin: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #666; font-size: 14px; background-color: #f1f1f1;">
      <p>Professional Women's Association Burton</p>
      <p>Supporting and empowering women in our community</p>
      <p>Contact us: <a href="mailto:burtonpwa@gmail.com" style="color: #6C5DD3;">burtonpwa@gmail.com</a></p>
    </div>
  </div>
`;

export function getPaymentConfirmationTemplate(payment: Payment): EmailTemplate {
  return {
    subject: `Payment Confirmation - PWA Burton ${payment.payment_number}`,
    html: emailWrapper(`
      <h2 style="color: #2c3e50; margin-bottom: 20px;">Payment Confirmation</h2>
      <p style="color: #34495e;">Dear ${payment.members?.full_name},</p>
      <p style="color: #34495e;">We are pleased to confirm that we have received your payment successfully.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-bottom: 10px;">Payment Details</h3>
        <ul style="list-style: none; padding: 0; color: #34495e;">
          <li style="margin-bottom: 8px;">📝 Payment Number: ${payment.payment_number}</li>
          <li style="margin-bottom: 8px;">💷 Amount: £${payment.amount.toFixed(2)}</li>
          <li style="margin-bottom: 8px;">📅 Date: ${format(new Date(payment.created_at), 'dd/MM/yyyy')}</li>
          <li style="margin-bottom: 8px;">💳 Payment Method: ${payment.payment_method}</li>
        </ul>
      </div>
      <p style="color: #34495e;">Thank you for your continued support of PWA Burton. Your contribution helps us maintain and improve our services for the community.</p>
      <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
    `)
  };
}

export function getPaymentReminderTemplate(payment: Payment, dueDate: string): EmailTemplate {
  return {
    subject: 'Payment Reminder - PWA Burton Membership',
    html: emailWrapper(`
      <h2 style="color: #2c3e50; margin-bottom: 20px;">Payment Reminder</h2>
      <p style="color: #34495e;">Dear ${payment.members?.full_name},</p>
      <p style="color: #34495e;">This is a friendly reminder about an upcoming payment for your PWA Burton membership.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-bottom: 10px;">Payment Details</h3>
        <ul style="list-style: none; padding: 0; color: #34495e;">
          <li style="margin-bottom: 8px;">💷 Amount Due: £${payment.amount.toFixed(2)}</li>
          <li style="margin-bottom: 8px;">📅 Due Date: ${format(new Date(dueDate), 'dd/MM/yyyy')}</li>
          <li style="margin-bottom: 8px;">📋 Payment Type: ${payment.payment_type}</li>
        </ul>
      </div>
      <p style="color: #34495e;">Please ensure your payment is made by the due date to maintain your membership benefits. If you have any questions or concerns, please don't hesitate to contact us.</p>
      <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
    `)
  };
}

export function getLatePaymentTemplate(payment: Payment, daysLate: number): EmailTemplate {
  return {
    subject: 'Important: Outstanding Payment Notice - PWA Burton',
    html: emailWrapper(`
      <h2 style="color: #2c3e50; margin-bottom: 20px;">Outstanding Payment Notice</h2>
      <p style="color: #34495e;">Dear ${payment.members?.full_name},</p>
      <p style="color: #34495e;">We hope this email finds you well. We noticed that a payment is currently overdue by ${daysLate} days.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-bottom: 10px;">Payment Details</h3>
        <ul style="list-style: none; padding: 0; color: #34495e;">
          <li style="margin-bottom: 8px;">📝 Payment Number: ${payment.payment_number}</li>
          <li style="margin-bottom: 8px;">💷 Amount: £${payment.amount.toFixed(2)}</li>
          <li style="margin-bottom: 8px;">📋 Payment Type: ${payment.payment_type}</li>
        </ul>
      </div>
      <p style="color: #34495e;">To maintain your membership status and continue accessing PWA Burton's services, please arrange for the payment to be made at your earliest convenience.</p>
      <p style="color: #34495e;">If you have already made the payment, please disregard this notice and accept our thanks.</p>
      <p style="color: #34495e;">If you're experiencing any difficulties or need to discuss payment arrangements, please don't hesitate to contact us.</p>
      <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
    `)
  };
}

export async function sendPaymentNotification(
  payment: Payment, 
  notificationType: 'confirmation' | 'reminder' | 'late',
  options?: { dueDate?: string; daysLate?: number }
) {
  if (!payment.members?.full_name || !payment.members?.email) {
    console.error('Member information or email missing from payment');
    return;
  }

  let template: EmailTemplate;
  
  switch (notificationType) {
    case 'confirmation':
      template = getPaymentConfirmationTemplate(payment);
      break;
    case 'reminder':
      if (!options?.dueDate) throw new Error('Due date required for payment reminders');
      template = getPaymentReminderTemplate(payment, options.dueDate);
      break;
    case 'late':
      if (typeof options?.daysLate !== 'number') throw new Error('Days late required for late notices');
      template = getLatePaymentTemplate(payment, options.daysLate);
      break;
    default:
      throw new Error('Invalid notification type');
  }

  await sendEmail({
    to: payment.members.email,
    subject: template.subject,
    html: template.html
  });
}
