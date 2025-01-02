import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.log("No authenticated session found");
          throw new Error("No user found");
        }

        console.log("Fetching profile for user:", session.user.id);
        
        // Get member by auth_user_id
        const { data: profileData, error: profileError } = await supabase
          .from("members")
          .select()
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }

        if (!profileData) {
          console.log("No profile found for auth_user_id, trying member_number");
          
          // If no profile found and we have a member_number in metadata, try that
          if (session.user.user_metadata?.member_number) {
            const { data: memberData, error: memberError } = await supabase
              .from("members")
              .select()
              .eq('member_number', session.user.user_metadata.member_number)
              .maybeSingle();

            if (memberError) {
              console.error("Member fetch error:", memberError);
              throw memberError;
            }

            if (memberData) {
              console.log("Found profile by member_number, updating auth_user_id");
              // Update auth_user_id if found by member_number
              const { error: updateError } = await supabase
                .from("members")
                .update({ auth_user_id: session.user.id })
                .eq('id', memberData.id);

              if (updateError) {
                console.error("Failed to update auth_user_id:", updateError);
              }

              return memberData;
            }
          }
          
          console.log("No profile found by either auth_user_id or member_number");
          return null;
        }

        return profileData;
      } catch (err) {
        console.error("Error in profile query:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
};