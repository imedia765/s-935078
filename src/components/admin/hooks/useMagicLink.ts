
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

      // Use the edge function to generate magic link
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-magic-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            email: memberData.email,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate magic link');
      }

      const { magicLink } = await response.json();

      if (magicLink) {
        await sendEmail({
          to: memberData.email,
          subject: 'Your Login Link',
          html: `<p>Here's your magic login link: ${magicLink}</p>`,
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

