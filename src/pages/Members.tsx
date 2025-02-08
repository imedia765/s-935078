
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToCSV, generatePDF, generateIndividualMemberPDF, exportToExcel } from "@/utils/exportUtils";
import { MembersToolbar } from "@/components/members/MembersToolbar";
import { MembersTable } from "@/components/members/MembersTable";
import { EditMemberDialog } from "@/components/members/EditMemberDialog";
import { MoveMemberDialog } from "@/components/members/MoveMemberDialog";
import { MembersPagination } from "@/components/members/MembersPagination";
import { useMemberQueries } from "@/hooks/useMemberQueries";
import { useMemberMutations } from "@/hooks/useMemberMutations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

const ITEMS_PER_PAGE = 10;

export default function Members() {
  const [selectedCollector, setSelectedCollector] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [movingMember, setMovingMember] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<any>(null);
  const [statusConfirmMember, setStatusConfirmMember] = useState<any>(null);

  const { userInfo, collectors, membersData, isLoading } = useMemberQueries(
    selectedCollector,
    searchTerm,
    sortField,
    sortDirection,
    !userInfo?.roles.includes("admin") ? userInfo?.collectorId : null,
    page,
    ITEMS_PER_PAGE
  );

  const {
    addMemberMutation,
    updateMemberMutation,
    deleteMemberMutation,
    toggleStatusMutation,
    moveMemberMutation
  } = useMemberMutations();

  const { data: allMembersData, refetch: refetchAllMembers } = useQuery({
    queryKey: ["allMembers", selectedCollector],
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

      if (!userInfo?.roles.includes("admin")) {
        query = query.eq('collector_id', userInfo?.collectorId);
      } 
      else if (selectedCollector !== 'all') {
        query = query.eq('collector_id', selectedCollector);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        members: data,
        totalCount: data.length
      };
    },
    enabled: false
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleExportCSV = async () => {
    await refetchAllMembers();
    if (allMembersData?.members) {
      exportToCSV(allMembersData.members, 'members_export');
    }
  };

  const handleExportPDF = async () => {
    await refetchAllMembers();
    if (allMembersData?.members) {
      generatePDF(allMembersData.members, 'members_export');
    }
  };

  const handleExportExcel = async () => {
    await refetchAllMembers();
    if (allMembersData?.members) {
      exportToExcel(allMembersData.members, 'members_export');
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 space-y-6">
        <MembersToolbar
          onSearch={handleSearch}
          searchValue={searchTerm}
          selectedCollector={selectedCollector}
          onCollectorChange={setSelectedCollector}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          onAddMember={(data) => addMemberMutation.mutate(data)}
          collectors={collectors || []}
          isAdmin={userInfo?.roles.includes("admin")}
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

          <MembersPagination
            page={page}
            itemsPerPage={ITEMS_PER_PAGE}
            totalCount={membersData?.totalCount || 0}
            onPageChange={setPage}
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
