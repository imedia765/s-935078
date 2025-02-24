
export interface RequestBody {
  email: string;
  memberNumber: string;
  token: string;
  isVerification: boolean;
}

export function validateRequest(data: any): RequestBody {
  const { email, memberNumber, token, isVerification } = data as RequestBody;

  if (!email || !memberNumber || !token) {
    throw new Error('Missing required fields');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  return { email, memberNumber, token, isVerification };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const validateEnvironment = () => {
  const requiredVars = ['APP_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredVars.filter(varName => !Deno.env.get(varName));
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate APP_URL format
  const appUrl = Deno.env.get('APP_URL')!;
  try {
    new URL(appUrl);
  } catch {
    throw new Error(`Invalid APP_URL format: ${appUrl}`);
  }
};

export const ALLOWED_ORIGINS = [
  'https://www.pwaburton.co.uk',
  'http://localhost:5173',
  'https://*.lovableproject.com'
];

export const PRODUCTION_URL = 'https://www.pwaburton.co.uk';

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(origin);
    }
    return pattern === origin;
  });
}
