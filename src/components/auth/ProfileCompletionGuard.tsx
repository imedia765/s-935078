import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

export const ProfileCompletionGuard = ({ children }: ProfileCompletionGuardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['profile-completion-check'],
    queryFn: async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user?.email) throw new Error("No authenticated user");

        // First check if profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // If no profile exists, create one
        if (!existingProfile) {
          console.log("Creating new profile for user:", user.id);
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) throw createError;
          return newProfile;
        }

        // Get member data to check profile completion
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('email', user.email)
          .single();

        if (memberError) throw memberError;
        return memberData;
      } catch (error) {
        console.error("Profile check error:", error);
        throw error;
      }
    },
    retry: 1,
  });

  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // Allow access to profile page always
    if (currentPath === '/admin/profile') {
      return;
    }

    // Check if profile is incomplete
    if (profile && !profile.profile_completed) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your profile before accessing other pages",
        variant: "destructive",
      });
      navigate('/admin/profile');
    }
  }, [profile, navigate, toast]);

  // If on profile page and profile is incomplete, show alert
  if (window.location.pathname === '/admin/profile' && profile && !profile.profile_completed) {
    return (
      <>
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm text-blue-700">
            Please complete all profile fields before accessing other pages. This is required for your membership.
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }

  return <>{children}</>;
};