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

      // First fetch the profile using a simpler query
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", session.user.id)
        .limit(1)
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

      if (!profileData) {
        console.log("No profile found, checking members table");
        
        // If no profile, try to get from members and create profile
        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("*")
          .eq("auth_user_id", session.user.id)
          .limit(1)
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

        console.log("Found member data:", memberData);

        if (memberData) {
          // Create a profile from member data using RPC
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
          return newProfile[0] as Profile;
        }

        toast({
          title: "No Profile Found",
          description: "No profile or member data found for your account.",
          variant: "destructive",
        });
        return null;
      }

      // Then fetch the role separately with a simpler query
      const { data: roleData, error: roleError } = await supabase
        .from("members_roles")
        .select("role")
        .eq("profile_id", profileData.id)
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error("Role fetch error:", roleError);
        // Don't throw error for role fetch, just continue without role
      }

      console.log("Found profile with role:", { ...profileData, role: roleData?.role });
      
      return {
        ...profileData,
        role: roleData?.role
      } as Profile;
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
};