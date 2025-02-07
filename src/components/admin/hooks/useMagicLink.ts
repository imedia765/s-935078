
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/utils/email";

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

      // Using window.location.origin to get the current domain
      const magicLink = `${window.location.origin}/reset-password?token=${data.token}`;

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

  return { generateMagicLink, sendMagicLinkEmail, copyToClipboard };
};
