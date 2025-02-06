
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
      
      // Cast the string ID to UUID type explicitly for the function call
      const { data, error } = await supabase
        .rpc('generate_magic_link', { 
          p_user_id: userId as unknown as `${string}-${string}-${string}-${string}-${string}` // UUID format
        });

      if (error) {
        console.error("Magic link generation error:", error);
        throw error;
      }

      // Safely type check and validate the response structure
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Invalid response format from magic link generation');
      }

      // Type guard function to validate response shape
      const isMagicLinkResponse = (obj: unknown): obj is MagicLinkResponse => {
        const response = obj as Partial<MagicLinkResponse>;
        return typeof response.success === 'boolean';
      };

      // Cast to unknown first, then validate
      if (!isMagicLinkResponse(data)) {
        throw new Error('Invalid magic link response format');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate magic link');
      }

      // Send the magic link email
      await sendEmail({
        to: data.email!,
        subject: 'Your Login Link',
        html: `<p>Here's your magic login link: ${process.env.VITE_SUPABASE_URL}/auth/v1/verify?token=${data.token}&type=magiclink</p>`,
      });

      toast({
        title: "Success",
        description: "Magic link sent successfully",
      });
      
    } catch (error: any) {
      console.error('Error generating magic link:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { generateMagicLink };
};
