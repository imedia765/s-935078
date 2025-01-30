import { useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useRoleSync = () => {
  const { toast } = useToast();

  const syncRolesMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Starting role sync for user:', userId);
      
      try {
        const { data, error } = await supabase
          .rpc('perform_user_roles_sync');

        if (error) {
          console.error('Error syncing roles:', error);
          throw error;
        }

        console.log('Role sync completed successfully:', data);
        return data;
      } catch (error: any) {
        console.error('Error in role sync mutation:', error);
        toast({
          title: "Role Sync Failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
    },
    meta: {
      errorMessage: "Failed to sync user roles"
    }
  });

  return {
    syncRoles: syncRolesMutation.mutate,
    isLoading: syncRolesMutation.isPending,
    error: syncRolesMutation.error
  };
};