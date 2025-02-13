
import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Add retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Email attempt ${attempt} of ${maxRetries} to ${to}`);
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              to,
              subject,
              html,
              text,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          
          // If rate limited, wait longer before retry
          if (response.status === 429) {
            await new Promise(resolve => setTimeout(resolve, attempt * 5000));
          }
          
          throw new Error(error.message || 'Failed to send email');
        }

        const result = await response.json();
        console.log('Email sent successfully:', result);
        return result;
      } catch (error: any) {
        lastError = error;
        
        // If it's not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        throw error;
      }
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw error;
  }
}
