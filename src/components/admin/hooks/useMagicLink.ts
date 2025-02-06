
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/utils/email";

export const useMagicLink = () => {
  const { toast } = useToast();

  const generateMagicLink = async (userId: string) => {
    try {
      console.log("Generating magic link for user:", userId);
      
      // Call our secure RPC function
      const { data, error } = await supabase
        .rpc('generate_magic_link', { p_user_id: userId });

      if (error) {
        console.error("Magic link generation error:", error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate magic link');
      }

      // Send the magic link email
      await sendEmail({
        to: data.email,
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
