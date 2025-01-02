import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/integrations/supabase/types/profile";
import { useToast } from "@/components/ui/use-toast";

export const useProfile = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        toast({
          title: "Session Error",
          description: "Failed to get session. Please try logging in again.",
          variant: "destructive",
        });
        throw new Error("Failed to get session");
      }

      if (!session?.user) {
        console.log("No authenticated session found");
        throw new Error("No user found");
      }

      console.log("Fetching profile for user:", session.user.id);

      // Try to create profile from user metadata first
      if (session.user.user_metadata) {
        const { data: newProfile, error: createError } = await supabase
          .rpc('safely_upsert_profile', {
            p_auth_user_id: session.user.id,
            p_member_number: session.user.user_metadata.member_number || '',
            p_full_name: session.user.user_metadata.full_name || '',
            p_email: session.user.user_metadata.email || session.user.email || ''
          });

        if (createError) {
          console.error("Profile creation error:", createError);
        } else {
          console.log("Profile created/updated from metadata:", newProfile);
        }
      }

      // Now fetch the complete profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          auth_user_id,
          member_number,
          full_name,
          date_of_birth,
          gender,
          marital_status,
          email,
          phone,
          address,
          postcode,
          town,
          status,
          membership_type,
          created_at,
          updated_at
        `)
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        toast({
          title: "Error",
          description: "Failed to fetch profile data",
          variant: "destructive",
        });
        throw profileError;
      }

      // Separately fetch the role to avoid recursion
      const { data: roleData, error: roleError } = await supabase
        .from("members_roles")
        .select("role")
        .eq("profile_id", profileData?.id ?? '')
        .maybeSingle();

      if (roleError) {
        console.error("Role fetch error:", roleError);
      }

      if (!profileData) {
        console.log("No profile found, checking members table");
        
        // If no profile exists, check members table
        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select(`
            id,
            auth_user_id,
            member_number,
            full_name,
            email,
            role
          `)
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (memberError) {
          console.error("Member fetch error:", memberError);
          toast({
            title: "Error",
            description: "Failed to fetch member data",
            variant: "destructive",
          });
          throw memberError;
        }

        if (memberData) {
          // Create profile from member data
          const { data: newProfile, error: insertError } = await supabase
            .rpc('safely_upsert_profile', {
              p_auth_user_id: session.user.id,
              p_member_number: memberData.member_number,
              p_full_name: memberData.full_name,
              p_email: memberData.email
            });

          if (insertError) {
            console.error("Profile creation error:", insertError);
            toast({
              title: "Error",
              description: "Failed to create profile",
              variant: "destructive",
            });
            throw insertError;
          }

          console.log("Created new profile:", newProfile);
          
          // Return the newly created profile with role
          if (newProfile && newProfile[0]) {
            return {
              ...newProfile[0],
              role: memberData.role
            } as Profile;
          }
        }

        toast({
          title: "No Profile Found",
          description: "No profile or member data found for your account.",
          variant: "destructive",
        });
        return null;
      }

      // Return profile with role
      return {
        ...profileData,
        role: roleData?.role
      } as Profile;
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
};