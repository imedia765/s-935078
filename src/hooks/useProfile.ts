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

        console.log("Session user:", session.user);
        console.log("User metadata:", session.user.user_metadata);
        
        // First try to get member by member_number from metadata
        if (session.user.user_metadata?.member_number) {
          const memberNumber = session.user.user_metadata.member_number;
          console.log("Trying to fetch profile by member_number:", memberNumber);
          
          const { data: memberData, error: memberError } = await supabase
            .from("members")
            .select("*")
            .eq('member_number', memberNumber)
            .maybeSingle();

          if (memberError) {
            console.error("Member fetch error:", memberError);
            throw memberError;
          }

          if (memberData) {
            console.log("Found profile by member_number:", memberData);
            
            // Update auth_user_id if not set
            if (!memberData.auth_user_id) {
              console.log("Updating auth_user_id for member:", memberData.id);
              const { error: updateError } = await supabase
                .from("members")
                .update({ auth_user_id: session.user.id })
                .eq('id', memberData.id);

              if (updateError) {
                console.error("Failed to update auth_user_id:", updateError);
              } else {
                console.log("Successfully updated auth_user_id");
              }
            }

            return memberData;
          } else {
            console.log("No member found with member_number:", memberNumber);
          }
        }

        // If no member_number in metadata or no profile found, try auth_user_id
        console.log("Trying to fetch profile by auth_user_id:", session.user.id);
        
        const { data: profileData, error: profileError } = await supabase
          .from("members")
          .select("*")
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }

        if (!profileData) {
          console.log("No profile found by auth_user_id");
          return null;
        }

        console.log("Found profile by auth_user_id:", profileData);
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