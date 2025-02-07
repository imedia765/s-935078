
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

interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  member_id?: string;
  auth_user_id?: string;
}

interface AuthFixResponse {
  success: boolean;
  message?: string;
  member_id?: string;
  auth_user_id?: string;
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

      // Always use production URL for magic links
      const baseUrl = getBaseUrl(true);
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
      console.log("[resetPasswordToMemberNumber] Starting password reset for:", {
        userId,
        memberNumber
      });

      // First, verify the member exists
      const { data: memberData, error: memberLookupError } = await supabase
        .from('members')
        .select('id, auth_user_id')
        .eq('member_number', memberNumber)
        .single();

      if (memberLookupError) {
        console.error("[resetPasswordToMemberNumber] Member lookup error:", memberLookupError);
        throw new Error('Member not found');
      }

      console.log("[resetPasswordToMemberNumber] Found member:", memberData);

      // Update auth_user_id in members table first
      const { error: updateError } = await supabase
        .from('members')
        .update({ auth_user_id: userId })
        .eq('id', memberData.id);

      if (updateError) {
        console.error("[resetPasswordToMemberNumber] Failed to update member auth_user_id:", updateError);
        throw updateError;
      }

      console.log("[resetPasswordToMemberNumber] Updated member auth_user_id");

      // Now perform the password reset
      const { data: resetData, error: resetError } = await (supabase.rpc as any)('reset_password_to_member_number', {
        p_user_id: userId,
        p_member_number: memberNumber
      }) as { data: ResetPasswordResponse, error: any };

      if (resetError) {
        console.error("[resetPasswordToMemberNumber] Password reset error:", resetError);
        throw resetError;
      }

      console.log("[resetPasswordToMemberNumber] Password reset response:", resetData);

      // Verify member data immediately after reset
      const { data: verifyMember, error: verifyError } = await supabase
        .from('members')
        .select('*')
        .eq('member_number', memberNumber)
        .single();

      console.log("[resetPasswordToMemberNumber] Member verification result:", {
        verifyMember,
        verifyError
      });

      if (verifyError || !verifyMember) {
        console.error("[resetPasswordToMemberNumber] Error verifying member data after reset:", verifyError);
        
        // Attempt to recover auth association
        console.log("[resetPasswordToMemberNumber] Attempting to recover auth association...");
        const { data: recoveryData, error: recoveryError } = await (supabase.rpc as any)('fix_member_auth_association', {
          p_member_number: memberNumber
        }) as { data: AuthFixResponse, error: any };

        console.log("[resetPasswordToMemberNumber] Recovery attempt result:", {
          recoveryData,
          recoveryError
        });

        if (recoveryError) {
          console.error("[resetPasswordToMemberNumber] Recovery attempt failed:", recoveryError);
          throw new Error("Failed to recover member data after password reset");
        }

        if (!recoveryData?.success) {
          throw new Error(recoveryData?.message || "Failed to recover member data");
        }
      }

      toast({
        title: "Success",
        description: "Password has been reset to member number",
      });

      return true;
    } catch (error: any) {
      console.error('[resetPasswordToMemberNumber] Error resetting password:', error);
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
