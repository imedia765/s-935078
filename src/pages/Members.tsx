import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { exportToCSV, generatePDF, generateIndividualMemberPDF } from "@/utils/exportUtils";
import { useState } from "react";
import { MembersToolbar } from "@/components/members/MembersToolbar";
import { MembersTable } from "@/components/members/MembersTable";
import { EditMemberDialog } from "@/components/members/EditMemberDialog";
import { MoveMemberDialog } from "@/components/members/MoveMemberDialog";
import Fuse from 'fuse.js';

interface MemberFormData {
  full_name: string;
  email: string;
  phone: string;
  member_number: string;
  collector_id: string | null;
  status: string;
}

export default function Members() {
  const [selectedCollector, setSelectedCollector] = useState<string>('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [movingMember, setMovingMember] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collectors, isLoading: loadingCollectors } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_collectors")
        .select("*")
        .eq("active", true);
      if (error) throw error;
      return data;
    }
  });

  // Updated members query with debounced search and fuzzy matching
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["members", selectedCollector, debouncedSearchTerm, sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select(`
          *,
          members_collectors!members_collectors_member_number_fkey (
            name,
            number,
            active
          )
        `);

      if (selectedCollector !== 'all') {
        query = query.eq('collector_id', selectedCollector);
      }

      const { data, error } = await query;
      if (error) throw error;

      // If there's a search term, use Fuse.js for fuzzy searching
      if (debouncedSearchTerm) {
        const fuse = new Fuse(data || [], {
          keys: ['full_name', 'email', 'member_number'],
          threshold: 0.3,
          distance: 100,
          includeScore: true
        });

        const searchResults = fuse.search(debouncedSearchTerm);
        return searchResults.map(result => result.item);
      }

      return data;
    }
  });

  // Add member mutation
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

  // Update member mutation
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
      setIsEditDialogOpen(false);
      setEditingMember(null);
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

  // Delete member mutation
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
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete member: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle member status mutation
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
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update member status: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Add move member mutation
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
      setIsMoveDialogOpen(false);
      setMovingMember(null);
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loadingCollectors || loadingMembers) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 space-y-6">
        <MembersToolbar
          onSearch={setDebouncedSearchTerm}
          selectedCollector={selectedCollector}
          onCollectorChange={setSelectedCollector}
          onExportCSV={() => exportToCSV(members || [], `members_${selectedCollector === 'all' ? 'all' : 'collector_' + selectedCollector}`)}
          onExportPDF={() => generatePDF(members || [], `Members Report - ${selectedCollector === 'all' ? 'All Members' : 'Collector ' + selectedCollector}`)}
          onAddMember={(data) => addMemberMutation.mutate(data)}
          collectors={collectors || []}
        />

        <Card className="glass-card p-6">
          <MembersTable
            members={members || []}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={(member) => {
              setEditingMember(member);
              setIsEditDialogOpen(true);
            }}
            onToggleStatus={(member) => toggleStatusMutation.mutate({
              id: member.id,
              currentStatus: member.status
            })}
            onMove={(member) => {
              setMovingMember(member);
              setIsMoveDialogOpen(true);
            }}
            onExportIndividual={generateIndividualMemberPDF}
            onDelete={(member) => deleteMemberMutation.mutate(member.id)}
          />
        </Card>

        <EditMemberDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={(id, data) => updateMemberMutation.mutate({ id, data })}
          member={editingMember}
          collectors={collectors || []}
        />

        <MoveMemberDialog
          isOpen={isMoveDialogOpen}
          onOpenChange={setIsMoveDialogOpen}
          onSubmit={(memberId, newCollectorId) => 
            moveMemberMutation.mutate({ memberId, newCollectorId })}
          member={movingMember}
          collectors={collectors || []}
        />
      </div>
    </div>
  );
}
