
import { sendEmail } from '@/utils/email';
import { Payment } from '@/components/admin/financial/types';
import { format } from 'date-fns';

interface EmailTemplate {
  subject: string;
  html: string;
}

export function getPaymentConfirmationTemplate(payment: Payment): EmailTemplate {
  return {
    subject: `Payment Confirmation - ${payment.payment_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Confirmation</h2>
        <p>Dear ${payment.members?.full_name},</p>
        <p>We confirm receipt of your payment:</p>
        <ul>
          <li>Payment Number: ${payment.payment_number}</li>
          <li>Amount: £${payment.amount.toFixed(2)}</li>
          <li>Date: ${format(new Date(payment.created_at), 'dd/MM/yyyy')}</li>
          <li>Payment Method: ${payment.payment_method}</li>
        </ul>
        <p>Thank you for your payment.</p>
        <p>Best regards,<br>PWA Burton Team</p>
      </div>
    `
  };
}

export function getPaymentReminderTemplate(payment: Payment, dueDate: string): EmailTemplate {
  return {
    subject: 'Payment Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Reminder</h2>
        <p>Dear ${payment.members?.full_name},</p>
        <p>This is a friendly reminder that a payment is due:</p>
        <ul>
          <li>Amount: £${payment.amount.toFixed(2)}</li>
          <li>Due Date: ${format(new Date(dueDate), 'dd/MM/yyyy')}</li>
          <li>Payment Type: ${payment.payment_type}</li>
        </ul>
        <p>Please ensure timely payment to avoid any interruption in services.</p>
        <p>Best regards,<br>PWA Burton Team</p>
      </div>
    `
  };
}

export function getLatePaymentTemplate(payment: Payment, daysLate: number): EmailTemplate {
  return {
    subject: 'Late Payment Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Late Payment Notice</h2>
        <p>Dear ${payment.members?.full_name},</p>
        <p>Our records indicate that your payment is ${daysLate} days overdue:</p>
        <ul>
          <li>Payment Number: ${payment.payment_number}</li>
          <li>Amount: £${payment.amount.toFixed(2)}</li>
          <li>Payment Type: ${payment.payment_type}</li>
        </ul>
        <p>Please arrange for immediate payment to maintain your membership status.</p>
        <p>If you have already made the payment, please disregard this notice.</p>
        <p>Best regards,<br>PWA Burton Team</p>
      </div>
    `
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

