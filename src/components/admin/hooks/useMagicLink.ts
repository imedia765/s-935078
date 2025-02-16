
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RPCResponse } from "@/components/reset-password/types";

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

      // Cast the response to our RPCResponse type
      const response = data as RPCResponse;

      if (!response.success) {
        throw new Error(response.error || 'Failed to reset password');
      }

      toast({
        title: "Success",
        description: "Password has been reset to the member number.",
      });

      return response;
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
