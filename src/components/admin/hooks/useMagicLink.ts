
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/utils/email";

export const useMagicLink = () => {
  const { toast } = useToast();

  const generateMagicLink = async (userId: string) => {
    try {
      console.log("Generating magic link for user:", userId);
      
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('email, auth_user_id')
        .eq('auth_user_id', userId)
        .single();

      if (memberError || !memberData?.email) {
        console.error("Member data fetch error:", memberError);
        throw new Error(memberError?.message || 'No email found for user');
      }

      console.log("Found member email:", memberData.email);

      // Call the rpc function instead of direct admin API
      const { data: magicLinkData, error } = await supabase.rpc('generate_magic_link', {
        user_email: memberData.email
      }) as { data: { magic_link: string } | null, error: any };

      if (error) {
        console.error("Magic link generation error:", error);
        throw error;
      }

      if (magicLinkData?.magic_link) {
        await sendEmail({
          to: memberData.email,
          subject: 'Your Login Link',
          html: `<p>Here's your magic login link: ${magicLinkData.magic_link}</p>`,
        });

        toast({
          title: "Success",
          description: "Magic link sent successfully",
        });
      }
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
