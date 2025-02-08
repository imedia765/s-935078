
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MemberWithRelations } from "@/types/member";

interface UseFamilyMembersReturn {
  isAddFamilyMemberOpen: boolean;
  isEditFamilyMemberOpen: boolean;
  selectedFamilyMember: React.MutableRefObject<any>;
  setIsAddFamilyMemberOpen: (value: boolean) => void;
  setIsEditFamilyMemberOpen: (value: boolean) => void;
  handleAddFamilyMember: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleEditFamilyMember: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleDeleteFamilyMember: (id: string) => Promise<void>;
}

export function useFamilyMembers(
  memberData: MemberWithRelations | null,
  fetchData: () => Promise<void>,
  setLoadingState: (key: string, value: boolean) => void
): UseFamilyMembersReturn {
  const [isAddFamilyMemberOpen, setIsAddFamilyMemberOpen] = useState(false);
  const [isEditFamilyMemberOpen, setIsEditFamilyMemberOpen] = useState(false);
  const selectedFamilyMember = useRef<any>(null);
  const { toast } = useToast();

  const generateFamilyMemberNumber = (parentMemberNumber: string, relationship: string) => {
    const base = parentMemberNumber;
    const prefix = relationship === 'spouse' ? 'S' : 'D';
    return `${base}-${prefix}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const handleAddFamilyMember = async (e: React.FormEvent<HTMLFormElement>) => {
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
  };

  const handleEditFamilyMember = async (e: React.FormEvent<HTMLFormElement>) => {
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
        .eq('id', selectedFamilyMember.current.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Family member updated successfully"
      });
      
      setIsEditFamilyMemberOpen(false);
      selectedFamilyMember.current = null;
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
  };

  const handleDeleteFamilyMember = async (id: string) => {
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
  };

  return {
    isAddFamilyMemberOpen,
    isEditFamilyMemberOpen,
    selectedFamilyMember,
    setIsAddFamilyMemberOpen,
    setIsEditFamilyMemberOpen,
    handleAddFamilyMember,
    handleEditFamilyMember,
    handleDeleteFamilyMember
  };
}
