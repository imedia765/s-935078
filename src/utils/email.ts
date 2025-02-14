import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, any>;
}

export async function sendEmail({ to, subject, html, text, templateId, variables }: SendEmailParams) {
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

    // Create email log entry first
    const { data: emailLog, error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient_email: to,
        subject,
        status: 'pending',
        email_category: templateId ? 'template' : 'transactional',
        email_type: templateId ? 'notification' : 'system_announcement',
        daily_counter: 1,
        delivery_meta: {},
        priority: 'normal'
      })
      .select()
      .single();

    if (logError) throw logError;

    const payload = templateId ? {
      transactionalId: templateId,
      email: to,
      dataVariables: {
        ...variables
      }
    } : {
      transactionalId: loopsConfig.template_id,
      email: to,
      dataVariables: {
        subject,
        content: html,
        text_content: text
      }
    };

    // Send via Loops API
    console.log('Sending email via Loops');
    const loopsResponse = await fetch('https://api.loops.so/v1/transactional', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loopsConfig.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!loopsResponse.ok) {
      const errorData = await loopsResponse.json();
      console.error('Loops API error:', errorData);
      
      // Update log with error
      await supabase
        .from('email_logs')
        .update({
          status: 'failed',
          error_message: errorData.message || 'Failed to send email through Loops'
        })
        .eq('id', emailLog.id);
        
      throw new Error('Failed to send email through Loops');
    }

    const result = await loopsResponse.json();

    // Update email log with Loops message ID
    await supabase
      .from('email_logs')
      .update({
        provider_message_id: result.emailId,
        status: 'pending'
      })
      .eq('id', emailLog.id);

    console.log('Email sent successfully via Loops:', result);
    return result;
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function previewTemplate(templateId: string, variables: Record<string, any> = {}) {
  try {
    const { data: loopsConfig, error: configError } = await supabase
      .from('loops_integration')
      .select('*')
      .limit(1)
      .single();

    if (configError) throw configError;

    if (!loopsConfig?.api_key) {
      throw new Error('Loops API key not configured');
    }

    const response = await fetch(`https://api.loops.so/v1/preview/${templateId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loopsConfig.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ variables })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to preview template: ${errorData.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error previewing template:', error);
    throw error;
  }
}
