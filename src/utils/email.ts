
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
      throw new Error('Loops integration is not properly configured');
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
