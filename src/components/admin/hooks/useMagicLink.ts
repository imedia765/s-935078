
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useMagicLink() {
  const { toast } = useToast();
  
  const resetPasswordToMemberNumber = async (userId: string, memberNumber: string) => {
    try {
      const { data, error } = await supabase.rpc(
        'reset_password_to_member_number',
        {
          p_user_id: userId,
          p_member_number: memberNumber
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }

      toast({
        title: "Success",
        description: "Password has been reset to the member number.",
      });

      return data;
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password",
      });
      throw error;
    }
  };

  return {
    resetPasswordToMemberNumber
  };
}
