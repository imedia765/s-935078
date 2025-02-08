import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MemberWithRelations, validateField } from "@/types/member";
import { useSessionPersistence } from "./useSessionPersistence";
import { matchAndLinkProfile } from "@/utils/profileMatcher";

export function useProfileManagement() {
  const [memberData, setMemberData] = useState<MemberWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<MemberWithRelations | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isAddFamilyMemberOpen, setIsAddFamilyMemberOpen] = useState(false);
  const [isEditFamilyMemberOpen, setIsEditFamilyMemberOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    profile: false,
    familyMembers: false,
    payments: false,
    documents: false
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const familyMemberRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const { sessionChecked, setSessionChecked } = useSessionPersistence();

  const setLoadingState = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const fetchData = async (retryCount = 0) => {
    try {
      setError(null);
      setLoadingState('profile', true);
      console.log("[useProfileManagement] Starting profile data fetch");
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[useProfileManagement] Current auth user:", user);
      
      if (!user) {
        console.log("[useProfileManagement] No user found, redirecting to login");
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
      console.log("[useProfileManagement] Email audit data:", { emailAudit });

      let memberNumber = emailAudit?.member_number || user.user_metadata?.member_number;

      if (memberNumber) {
        // Try to match and link the profile
        const matchResult = await matchAndLinkProfile(user.id, memberNumber);
        
        if (!matchResult.success) {
          console.error("[useProfileManagement] Profile matching failed:", matchResult.error);
          toast({
            title: "Profile Error",
            description: matchResult.error,
            variant: "destructive",
          });
          // Continue anyway to try fetching the profile
        }
      }

      // Then fetch member data with explicit relationship specification
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

      // Get user roles
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
        setEditedData(memberWithRelations);
      }

    } catch (error: any) {
      console.error("[useProfileManagement] Error in fetchData:", error);
      setError(error.message);
      
      if (retryCount < 3) {
        const retryDelay = Math.pow(2, retryCount) * 1000;
        toast({
          title: "Connection Error",
          description: `Retrying in ${retryDelay/1000} seconds...`,
          variant: "destructive",
        });
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(retryCount + 1);
        }, retryDelay);
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingState('profile', false);
      setSessionChecked(true);
    }
  };

  const validateForm = (data: Partial<MemberWithRelations>): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate each field
    Object.keys(data).forEach((field) => {
      const value = data[field as keyof MemberWithRelations];
      if (typeof value === 'string') {
        const error = validateField(field, value);
        if (error) {
          errors[field] = error;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateFamilyMemberNumber = (parentMemberNumber: string, relationship: string) => {
    const base = parentMemberNumber;
    const prefix = relationship === 'spouse' ? 'S' : 'D';
    return `${base}-${prefix}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const handleAddFamilyMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const relationship = formData.get('relationship')?.toString() || '';
      const familyMemberNumber = generateFamilyMemberNumber(memberData?.member_number || '', relationship);

      const { error } = await supabase
        .from('family_members')
        .insert({
          member_id: memberData?.id,
          family_member_number: familyMemberNumber,
          full_name: formData.get('full_name')?.toString() || '',
          relationship: relationship,
          date_of_birth: formData.get('date_of_birth')?.toString() || null,
          gender: formData.get('gender')?.toString() || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Family member added successfully"
      });
      
      setIsAddFamilyMemberOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      
      // Validate the field immediately
      const error = validateField(field, value);
      setValidationErrors(prev => ({
        ...prev,
        [field]: error || ''
      }));
      
      return updated;
    });
  };

  const handleSave = async () => {
    if (!editedData) return;

    if (!validateForm(editedData)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please correct the errors before saving"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('members')
        .update(editedData)
        .eq('id', memberData?.id);

      if (error) throw error;

      setMemberData(editedData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    setUploadingPhoto(true);

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        throw new Error('Only JPEG and PNG files are allowed');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${memberData?.member_number}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('members')
        .update({ photo_url: publicUrl })
        .eq('id', memberData?.id);

      if (updateError) throw updateError;

      setMemberData(prev => prev ? { ...prev, photo_url: publicUrl } : null);
      toast({
        title: "Success",
        description: "Profile photo updated successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error uploading photo",
        description: error.message
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancel = () => {
    setEditedData(memberData);
    setIsEditing(false);
    setValidationErrors({});
  };

  const handleEdit = () => {
    setEditedData(memberData);
    setIsEditing(true);
  };

  const handleViewDocument = async (doc: any) => {
    console.log("Viewing document:", doc);
    // TODO: Implement document viewer
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      console.log("Downloading document:", doc);
      // TODO: Implement document download
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download document"
      });
    }
  };

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        console.log("[useProfileManagement] Initializing profile");
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[useProfileManagement] Current session:", session);
        
        if (!session) {
          console.log("[useProfileManagement] No session found, redirecting to login");
          toast({
            title: "Session Expired",
            description: "Please log in again to continue",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        await fetchData();
      } catch (error: any) {
        console.error("[useProfileManagement] Session check error:", error);
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    initializeProfile();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [navigate]);

  return {
    memberData,
    loading,
    error,
    isEditing,
    editedData,
    uploadingPhoto,
    validationErrors,
    saving,
    isAddFamilyMemberOpen,
    isEditFamilyMemberOpen,
    loadingStates,
    selectedFamilyMember: familyMemberRef,
    handleInputChange,
    handleSave,
    handleCancel,
    handleEdit,
    handlePhotoUpload,
    setIsAddFamilyMemberOpen,
    setIsEditFamilyMemberOpen,
    fetchData,
    handleAddFamilyMember: async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      try {
        setLoadingState('familyMembers', true);
        const relationship = formData.get('relationship')?.toString() || '';
        const familyMemberNumber = generateFamilyMemberNumber(memberData?.member_number || '', relationship);

        const { error } = await supabase
          .from('family_members')
          .insert({
            member_id: memberData?.id,
            family_member_number: familyMemberNumber,
            full_name: formData.get('full_name')?.toString() || '',
            relationship: relationship,
            date_of_birth: formData.get('date_of_birth')?.toString() || null,
            gender: formData.get('gender')?.toString() || null
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Family member added successfully"
        });
        
        setIsAddFamilyMemberOpen(false);
        fetchData();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      } finally {
        setLoadingState('familyMembers', false);
      }
    },
    handleEditFamilyMember: async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      try {
        setLoadingState('familyMembers', true);
        const { error } = await supabase
          .from('family_members')
          .update({
            full_name: formData.get('full_name')?.toString() || '',
            relationship: formData.get('relationship')?.toString() || '',
            date_of_birth: formData.get('date_of_birth')?.toString() || null,
            gender: formData.get('gender')?.toString() || null
          })
          .eq('id', familyMemberRef.current.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Family member updated successfully"
        });
        
        setIsEditFamilyMemberOpen(false);
        familyMemberRef.current = null;
        fetchData();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      } finally {
        setLoadingState('familyMembers', false);
      }
    },
    handleDeleteFamilyMember: async (id: string) => {
      try {
        setLoadingState('familyMembers', true);
        const { error } = await supabase
          .from('family_members')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Family member removed successfully"
        });
        
        fetchData();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      } finally {
        setLoadingState('familyMembers', false);
      }
    }
  };
}
