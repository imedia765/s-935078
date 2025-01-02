import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("No user found");
        }

        // First try to get the member directly by auth_user_id using a single query
        const { data: profileData, error: profileError } = await supabase
          .from("members")
          .select(`
            id,
            member_number,
            full_name,
            email,
            phone,
            address,
            town,
            postcode,
            status,
            role,
            membership_type,
            date_of_birth,
            collector_id,
            created_at,
            updated_at
          `)
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }

        // If no profile found and we have a member_number in metadata, try that
        if (!profileData && session.user.user_metadata?.member_number) {
          const { data: memberData, error: memberError } = await supabase
            .from("members")
            .select(`
              id,
              member_number,
              full_name,
              email,
              phone,
              address,
              town,
              postcode,
              status,
              role,
              membership_type,
              date_of_birth,
              collector_id,
              created_at,
              updated_at
            `)
            .eq('member_number', session.user.user_metadata.member_number)
            .maybeSingle();

          if (memberError) {
            console.error("Member fetch error:", memberError);
            throw memberError;
          }

          if (memberData) {
            // If found by member_number, update the auth_user_id
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