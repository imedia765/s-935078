import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, generatePDF, generateIndividualMemberPDF, exportToExcel } from "@/utils/exportUtils";
import { MembersToolbar } from "@/components/members/MembersToolbar";
import { MembersTable } from "@/components/members/MembersTable";
import { EditMemberDialog } from "@/components/members/EditMemberDialog";
import { MoveMemberDialog } from "@/components/members/MoveMemberDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MemberFormData {
  full_name: string;
  email: string;
  phone: string;
  member_number: string;
  collector_id: string | null;
  status: string;
}

const ITEMS_PER_PAGE = 10;

export default function Members() {
  const [selectedCollector, setSelectedCollector] = useState<string>('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [movingMember, setMovingMember] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<any>(null);
  const [statusConfirmMember, setStatusConfirmMember] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // First, get the current user's role and collector ID if they are a collector
  const { data: userInfo } = useQuery({
    queryKey: ["userInfo"],
    queryFn: async () => {
      console.log('Fetching user info...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      console.log('User roles:', roles);

      // If user is a collector, get their collector ID
      const { data: collectorInfo, error } = await supabase
        .from("members_collectors")
        .select("id")
        .eq("auth_user_id", user.id);

      console.log('Collector info:', collectorInfo, 'Error:', error);

      // Handle case where collector info might not exist
      const collectorId = collectorInfo && collectorInfo.length > 0 ? collectorInfo[0].id : null;

      return {
        roles: roles?.map(r => r.role) || [],
        collectorId
      };
    }
  });

  const isAdmin = userInfo?.roles.includes("admin");
  const collectorId = !isAdmin ? userInfo?.collectorId : null;

  // Get collectors for the dropdown
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

  // Get members based on user role and filters with pagination
  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ["members", selectedCollector, debouncedSearchTerm, sortField, sortDirection, collectorId, page],
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
        `, { count: 'exact' });

      // If user is a collector, only show their members
      if (collectorId) {
        query = query.eq('collector_id', collectorId);
      } 
      // If user is admin and a collector is selected
      else if (selectedCollector !== 'all') {
        query = query.eq('collector_id', selectedCollector);
      }

      // Add sorting
      if (sortField) {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }

      // Add pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      // If there's a search term, filter the results
      let filteredData = data;
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        filteredData = data.filter((member: any) => 
          member.full_name?.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower) ||
          member.member_number?.toLowerCase().includes(searchLower)
        );
      }

      return {
        members: filteredData,
        totalCount: count || 0
      };
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

  // Delete member mutation with proper error handling
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
      setDeleteConfirmMember(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle member status mutation with proper error handling
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
      setStatusConfirmMember(null);
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

  if (loadingMembers || loadingCollectors) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-[120px] w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const totalPages = Math.ceil((membersData?.totalCount || 0) / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 space-y-6">
        <MembersToolbar
          onSearch={setDebouncedSearchTerm}
          selectedCollector={selectedCollector}
          onCollectorChange={setSelectedCollector}
          onExportCSV={() => exportToCSV(membersData?.members || [], `members_${selectedCollector === 'all' ? 'all' : 'collector_' + selectedCollector}`)}
          onExportPDF={() => generatePDF(membersData?.members || [], `Members Report - ${selectedCollector === 'all' ? 'All Members' : 'Collector ' + selectedCollector}`)}
          onExportExcel={() => exportToExcel(membersData?.members || [], `members_${selectedCollector === 'all' ? 'all' : 'collector_' + selectedCollector}`)}
          onAddMember={(data) => addMemberMutation.mutate(data)}
          collectors={collectors || []}
          isAdmin={isAdmin}
        />

        <Card className="glass-card p-6">
          <MembersTable
            members={membersData?.members || []}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onEdit={(member) => {
              setEditingMember(member);
              setIsEditDialogOpen(true);
            }}
            onToggleStatus={(member) => setStatusConfirmMember(member)}
            onMove={(member) => {
              setMovingMember(member);
              setIsMoveDialogOpen(true);
            }}
            onExportIndividual={generateIndividualMemberPDF}
            onDelete={(member) => setDeleteConfirmMember(member)}
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, membersData?.totalCount || 0)} of {membersData?.totalCount} members
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
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

        <AlertDialog open={!!deleteConfirmMember} onOpenChange={() => setDeleteConfirmMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deleteConfirmMember?.full_name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteMemberMutation.mutate(deleteConfirmMember.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!statusConfirmMember} onOpenChange={() => setStatusConfirmMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Member Status</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {statusConfirmMember?.status === 'active' ? 'pause' : 'activate'} {statusConfirmMember?.full_name}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => toggleStatusMutation.mutate({
                  id: statusConfirmMember.id,
                  currentStatus: statusConfirmMember.status
                })}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
