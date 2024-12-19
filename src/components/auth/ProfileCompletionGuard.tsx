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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error) throw error;
      return data;
    },
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