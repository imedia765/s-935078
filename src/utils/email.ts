
import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  try {
    // Get Loops configuration
    const { data: loopsConfig, error: configError } = await supabase
      .from('loops_integration')
      .select('*')
      .limit(1)
      .single();

    if (configError) throw configError;

    if (!loopsConfig?.is_active || !loopsConfig?.api_key) {
      console.log('Loops not configured, falling back to default email method');
      // Fallback to old email method
      const { data: { session } } = await supabase.auth.getSession();
      
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
        throw new Error(error.message || 'Failed to send email');
      }

      return await response.json();
    }

    // Use Loops API
    console.log('Sending email via Loops');
    const loopsResponse = await fetch('https://api.loops.so/v1/transactional', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loopsConfig.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transactionalId: loopsConfig.template_id,
        email: to,
        dataVariables: {
          subject,
          content: html,
          text_content: text
        }
      })
    });

    if (!loopsResponse.ok) {
      const errorData = await loopsResponse.json();
      console.error('Loops API error:', errorData);
      throw new Error('Failed to send email through Loops');
    }

    const result = await loopsResponse.json();
    console.log('Email sent successfully via Loops:', result);
    return result;
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw error;
  }
}
