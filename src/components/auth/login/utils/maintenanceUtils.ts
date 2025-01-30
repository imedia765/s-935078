import { supabase } from "@/integrations/supabase/client";

export const checkMaintenanceMode = async () => {
  const { data: maintenanceData, error: maintenanceError } = await supabase
    .from('maintenance_settings')
    .select('is_enabled, message')
    .single();

  if (maintenanceError) {
    console.error('[Login] Error checking maintenance mode:', maintenanceError);
    throw new Error('Unable to verify system status');
  }

  return maintenanceData;
};

export const validateAdminAccess = async (signInData: any) => {
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', signInData.user.id);

  return roles?.some(r => r.role === 'admin');
};