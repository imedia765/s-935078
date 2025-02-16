
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

if (!Deno.env.get('SUPABASE_URL')) {
  throw new Error('SUPABASE_URL environment variable is not set');
}

if (!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
}

// Initialize the Supabase admin client
export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
