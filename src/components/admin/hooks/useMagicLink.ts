
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

      // Create the magic link directly using Supabase Auth
      const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: memberData.email,
      });

      if (magicLinkError) {
        console.error("Magic link generation error:", magicLinkError);
        throw magicLinkError;
      }

      if (magicLinkData?.properties?.action_link) {
        await sendEmail({
          to: memberData.email,
          subject: 'Your Login Link',
          html: `<p>Here's your magic login link: ${magicLinkData.properties.action_link}</p>`,
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
