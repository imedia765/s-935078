
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MemberWithRelations } from "@/types/member";
import { matchAndLinkProfile } from "@/utils/profileMatcher";

interface UseProfileDataReturn {
  memberData: MemberWithRelations | null;
  loading: boolean;
  error: string | null;
  loadingStates: {
    profile: boolean;
    familyMembers: boolean;
    payments: boolean;
    documents: boolean;
  };
  setLoadingState: (key: string, value: boolean) => void;
  fetchData: (retryCount?: number) => Promise<void>;
}

export function useProfileData(): UseProfileDataReturn {
  const [memberData, setMemberData] = useState<MemberWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    familyMembers: false,
    payments: false,
    documents: false
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const setLoadingState = (key: string, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const fetchData = async (retryCount = 0) => {
    try {
      setError(null);
      setLoadingState('profile', true);
      console.log("[useProfileData] Starting profile data fetch");
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[useProfileData] Current auth user:", user);
      
      if (!user) {
        console.log("[useProfileData] No user found, redirecting to login");
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Get member number from email_audit table
      const { data: emailAuditRecords, error: emailAuditError } = await supabase
        .from('email_audit')
        .select('member_number')
        .eq('auth_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (emailAuditError) {
        throw new Error(`Failed to fetch email audit: ${emailAuditError.message}`);
      }

      const emailAudit = emailAuditRecords?.[0];
      console.log("[useProfileData] Email audit data:", { emailAudit });

      let memberNumber = emailAudit?.member_number || user.user_metadata?.member_number;

      if (memberNumber) {
        const matchResult = await matchAndLinkProfile(user.id, memberNumber);
        
        if (!matchResult.success) {
          console.error("[useProfileData] Profile matching failed:", matchResult.error);
          toast({
            title: "Profile Error",
            description: matchResult.error,
            variant: "destructive",
          });
        }
      }

      const { data: member, error: memberError } = await supabase
        .from("members")
        .select(`
          *,
          family_members (*),
          member_notes (*),
          payment_requests!payment_requests_member_id_fkey (
            id,
            payment_type,
            amount,
            status,
            created_at,
            payment_number
          )
        `)
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (memberError) {
        throw new Error(`Failed to fetch member data: ${memberError.message}`);
      }

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesError) {
        throw new Error(`Failed to fetch user roles: ${rolesError.message}`);
      }

      if (member) {
        const memberWithRelations: MemberWithRelations = {
          ...member,
          user_roles: roles?.map(r => ({ role: r.role })) || [],
          roles: roles?.map(r => r.role) || [],
          member_notes: member.member_notes || [],
          family_members: member.family_members || [],
          payment_requests: member.payment_requests || [],
          yearly_payment_status: member.yearly_payment_status || null,
          yearly_payment_due_date: member.yearly_payment_due_date || null,
          yearly_payment_amount: member.yearly_payment_amount || null,
          emergency_collection_status: member.emergency_collection_status || null,
          emergency_collection_amount: member.emergency_collection_amount || null,
          emergency_collection_due_date: member.emergency_collection_due_date || null,
          marital_status: member.marital_status || null,
          gender: member.gender || null,
          town: member.town || null,
          postcode: member.postcode || null,
          collector: member.collector || null,
          photo_url: member.photo_url || null
        };
        
        setMemberData(memberWithRelations);
      }

    } catch (error: any) {
      console.error("[useProfileData] Error in fetchData:", error);
      setError(error.message);
      
      if (retryCount < 3) {
        const retryDelay = Math.pow(2, retryCount) * 1000;
        toast({
          title: "Connection Error",
          description: `Retrying in ${retryDelay/1000} seconds...`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingState('profile', false);
      setLoading(false);
    }
  };

  return {
    memberData,
    loading,
    error,
    loadingStates,
    setLoadingState,
    fetchData
  };
}
