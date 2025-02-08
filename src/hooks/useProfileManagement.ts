
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSessionPersistence } from "./useSessionPersistence";
import { useProfileData } from "./profile/useProfileData";
import { useProfileEdit } from "./profile/useProfileEdit";
import { usePhotoUpload } from "./profile/usePhotoUpload";
import { useFamilyMembers } from "./profile/useFamilyMembers";

export function useProfileManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessionChecked, setSessionChecked } = useSessionPersistence();

  const {
    memberData,
    loading,
    error,
    loadingStates,
    setLoadingState,
    fetchData
  } = useProfileData();

  const {
    isEditing,
    editedData,
    validationErrors,
    saving,
    handleInputChange,
    handleSave,
    handleCancel,
    handleEdit
  } = useProfileEdit(memberData, (data) => {
    if (memberData) {
      fetchData();
    }
  });

  const {
    uploadingPhoto,
    handlePhotoUpload
  } = usePhotoUpload(memberData, (data) => {
    if (memberData) {
      fetchData();
    }
  });

  const {
    isAddFamilyMemberOpen,
    isEditFamilyMemberOpen,
    selectedFamilyMember,
    setIsAddFamilyMemberOpen,
    setIsEditFamilyMemberOpen,
    handleAddFamilyMember,
    handleEditFamilyMember,
    handleDeleteFamilyMember
  } = useFamilyMembers(memberData, fetchData, setLoadingState);

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
    selectedFamilyMember,
    loadingStates,
    handleInputChange,
    handleSave,
    handleCancel,
    handleEdit,
    handlePhotoUpload,
    setIsAddFamilyMemberOpen,
    setIsEditFamilyMemberOpen,
    fetchData,
    handleAddFamilyMember,
    handleEditFamilyMember,
    handleDeleteFamilyMember
  };
}
