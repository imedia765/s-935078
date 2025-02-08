
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MemberWithRelations, validateField } from "@/types/member";

interface UseProfileEditReturn {
  isEditing: boolean;
  editedData: MemberWithRelations | null;
  validationErrors: Record<string, string>;
  saving: boolean;
  handleInputChange: (field: string, value: string) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  handleEdit: () => void;
}

export function useProfileEdit(
  memberData: MemberWithRelations | null,
  setMemberData: (data: MemberWithRelations | null) => void
): UseProfileEditReturn {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<MemberWithRelations | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const validateForm = (data: Partial<MemberWithRelations>): boolean => {
    const errors: Record<string, string> = {};
    
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

  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      
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

  const handleCancel = () => {
    setEditedData(memberData);
    setIsEditing(false);
    setValidationErrors({});
  };

  const handleEdit = () => {
    setEditedData(memberData);
    setIsEditing(true);
  };

  return {
    isEditing,
    editedData,
    validationErrors,
    saving,
    handleInputChange,
    handleSave,
    handleCancel,
    handleEdit
  };
}
