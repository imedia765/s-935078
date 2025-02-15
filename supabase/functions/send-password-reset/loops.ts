
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface LoopsConfig {
  has_api_key: boolean;
  is_active: boolean;
}

interface LoopsIntegration {
  api_key: string;
  password_reset_template_id: string;
}

export async function validateLoopsConfig(): Promise<void> {
  const { data: loopsConfig, error: configCheckError } = await supabaseAdmin
    .rpc('check_loops_config') as { data: LoopsConfig[], error: any };

  if (configCheckError) {
    console.error('Error checking Loops config:', configCheckError);
    throw new Error('Failed to check Loops configuration');
  }

  if (!loopsConfig?.[0]?.has_api_key || !loopsConfig?.[0]?.is_active) {
    console.error('Loops integration is not properly configured:', loopsConfig);
    throw new Error('Loops integration is not properly configured or is inactive');
  }
}

export async function getLoopsIntegration(): Promise<LoopsIntegration> {
  const { data: loopsIntegration, error: integrationError } = await supabaseAdmin
    .from('loops_integration')
    .select('*')
    .single();

  if (integrationError) {
    console.error('Error fetching Loops integration:', integrationError);
    throw new Error('Failed to get Loops integration details');
  }

  if (!loopsIntegration?.api_key || !loopsIntegration?.password_reset_template_id) {
    console.error('Missing required Loops configuration:', {
      hasApiKey: !!loopsIntegration?.api_key,
      hasTemplateId: !!loopsIntegration?.password_reset_template_id
    });
    throw new Error('Incomplete Loops configuration');
  }

  return loopsIntegration;
}

export async function sendLoopsEmail(
  loopsIntegration: LoopsIntegration, 
  email: string, 
  memberNumber: string,
  actionLink: string,
  isVerification: boolean
): Promise<any> {
  const response = await fetch('https://app.loops.so/api/v1/transactional', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${loopsIntegration.api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      transactionalId: loopsIntegration.password_reset_template_id,
      email: email,
      dataVariables: {
        resetUrl: actionLink,
        memberNumber: memberNumber,
        isVerification: isVerification
      }
    })
  });

  if (!response.ok) {
    const errorContent = await response.text();
    throw new Error(`Loops API error (${response.status}): ${errorContent}`);
  }

  return await response.json();
}
