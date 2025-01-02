import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/integrations/supabase/types/profile";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error("Failed to get session");
      }

      if (!session?.user) {
        console.log("No authenticated session found");
        throw new Error("No user found");
      }

      console.log("Fetching profile for user:", session.user.id);

      // First get the profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      if (!profileData) {
        console.log("No profile found, checking members table");
        // If no profile found, try to get data from members table
        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (memberError) {
          console.error("Member fetch error:", memberError);
          throw memberError;
        }

        console.log("Found member data:", memberData);

        if (memberData) {
          // Create a profile from member data
          const { data: newProfile, error: insertError } = await supabase
            .rpc('safely_upsert_profile', {
              p_auth_user_id: session.user.id,
              p_member_number: memberData.member_number,
              p_full_name: memberData.full_name,
              p_email: memberData.email
            });

          if (insertError) {
            console.error("Profile creation error:", insertError);
            throw insertError;
          }

          console.log("Created and returning new profile:", newProfile);
          return newProfile[0] as Profile;
        }

        // If no member data found either, return null
        console.log("No member data found, returning null");
        return null;
      }

      // Now get the role in a separate query
      const { data: roleData } = await supabase
        .from("members_roles")
        .select("role")
        .eq("profile_id", profileData.id)
        .maybeSingle();

      // Combine profile and role data
      const profileWithRole = {
        ...profileData,
        members_roles: roleData
      };

      console.log("Found profile with role:", profileWithRole);
      return profileWithRole as Profile;
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
};