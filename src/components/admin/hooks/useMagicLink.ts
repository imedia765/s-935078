
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/utils/email";
import { getBaseUrl, isValidDomain } from "@/utils/urlUtils";

interface MagicLinkResponse {
  success: boolean;
  email?: string;
  token?: string;
  error?: string;
}

export const useMagicLink = () => {
  const { toast } = useToast();

  const generateMagicLink = async (userId: string) => {
    try {
      console.log("Generating magic link for user:", userId);

      const { data, error } = await supabase.rpc('generate_magic_link', {
        p_user_id: userId
      });

      if (error) {
        console.error("Magic link generation error:", error);
        throw error;
      }

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid response format from magic link generation');
      }

      const isMagicLinkResponse = (obj: unknown): obj is MagicLinkResponse => {
        const response = obj as Partial<MagicLinkResponse>;
        return typeof response.success === 'boolean';
      };

      if (!isMagicLinkResponse(data)) {
        throw new Error('Invalid magic link response format');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate magic link');
      }

      const baseUrl = getBaseUrl();
      console.log("Using base URL for magic link:", baseUrl);

      const magicLink = `${baseUrl}/reset-password?token=${data.token}`;
      console.log("Generated magic link:", magicLink);

      return {
        magicLink,
        email: data.email,
        token: data.token,
      };
    } catch (error: any) {
      console.error('Error generating magic link:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const sendMagicLinkEmail = async (email: string, link: string) => {
    try {
      await sendEmail({
        to: email,
        subject: 'Your Login Link',
        html: `<p>Here's your magic login link: <a href="${link}">${link}</a></p>`,
      });

      toast({
        title: "Success",
        description: "Magic link sent successfully",
      });
    } catch (error: any) {
      console.error('Error sending magic link email:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "Magic link copied to clipboard",
      });
    } catch (error: any) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPasswordToMemberNumber = async (userId: string, memberNumber: string) => {
    try {
      console.log("Resetting password to member number for user:", userId);

      const { data, error } = await supabase.functions.invoke('reset-password-to-member-number', {
        body: {
          user_id: userId,
          member_number: memberNumber
        }
      });

      if (error) {
        console.error("Password reset error:", error);
        throw error;
      }

      // Log the action in audit_logs
      await supabase.from('audit_logs').insert([{
        table_name: 'auth.users',
        operation: 'UPDATE',
        record_id: userId,
        new_values: {
          action: 'password_reset_to_member_number',
          member_number: memberNumber
        }
      }]);

      // Verify the member record is still correctly associated
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('member_number', memberNumber)
        .single();

      if (memberError || !memberData) {
        console.error("Error verifying member data after reset:", memberError);
        throw new Error("Failed to verify member data after password reset");
      }

      toast({
        title: "Success",
        description: "Password has been reset to member number",
      });

      return true;
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { 
    generateMagicLink, 
    sendMagicLinkEmail, 
    copyToClipboard,
    resetPasswordToMemberNumber 
  };
};

