
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { MemberFormData } from "@/types/member";

export function useMemberMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addMemberMutation = useMutation({
    mutationFn: async (newMember: MemberFormData) => {
      const { data, error } = await supabase
        .from('members')
        .insert([newMember])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Success",
        description: "Member added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add member: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MemberFormData> }) => {
      const { data: updatedMember, error } = await supabase
        .from('members')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update member: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { data, error } = await supabase
        .from('members')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Success",
        description: `Member ${data.status === 'active' ? 'activated' : 'paused'} successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update member status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const moveMemberMutation = useMutation({
    mutationFn: async ({ memberId, newCollectorId }: { memberId: string; newCollectorId: string }) => {
      const { data, error } = await supabase
        .from('members')
        .update({ collector_id: newCollectorId })
        .eq('id', memberId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Success",
        description: "Member moved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to move member: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    addMemberMutation,
    updateMemberMutation,
    deleteMemberMutation,
    toggleStatusMutation,
    moveMemberMutation
  };
}
