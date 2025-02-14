
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { exportToCSV, generatePDF, generateIndividualMemberPDF, exportToExcel } from "@/utils/exportUtils";
import { MembersToolbar } from "@/components/members/MembersToolbar";
import { MembersTable } from "@/components/members/MembersTable";
import { EditMemberDialog } from "@/components/members/EditMemberDialog";
import { MoveMemberDialog } from "@/components/members/MoveMemberDialog";
import { MembersPagination } from "@/components/members/MembersPagination";
import { DeleteMemberDialog } from "@/components/members/DeleteMemberDialog";
import { StatusMemberDialog } from "@/components/members/StatusMemberDialog";
import { MembersLoading } from "@/components/members/MembersLoading";
import { useMemberQueries } from "@/hooks/useMemberQueries";
import { useMemberMutations } from "@/hooks/useMemberMutations";
import { useCollectorData } from "@/hooks/useCollectorData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ITEMS_PER_PAGE = 10;

export default function Members() {
  const { data: currentUser, isLoading: isUserLoading } = useCollectorData();
  const [selectedCollector, setSelectedCollector] = useState<string>(
    currentUser?.isAdmin ? 'all' : (currentUser?.collectorId || 'all')
  );
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
    currentUser?.collectorId || null,
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

      if (!currentUser?.isAdmin && currentUser?.member_number) {
        const prefix = currentUser.member_number.substring(0, 2);
        const number = currentUser.member_number.substring(2, 4);
        const collectorPrefix = prefix + number;
        query = query.ilike('member_number', `${collectorPrefix}%`);
      } 
      else if (currentUser?.isAdmin && selectedCollector !== 'all') {
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

  if (isLoading || isUserLoading) {
    return <MembersLoading />;
  }

  const currentCollector = currentUser?.isAdmin ? null : 
    (currentUser?.collectorId && currentUser?.collectorName) ? {
      id: currentUser.collectorId,
      name: currentUser.collectorName
    } : null;

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
          isAdmin={currentUser?.isAdmin || false}
          currentCollector={currentCollector}
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
            currentPage={page}
            totalPages={Math.ceil((membersData?.totalCount || 0) / ITEMS_PER_PAGE)}
            onPageChange={setPage}
          />
        </Card>

        <EditMemberDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={(id, data) => updateMemberMutation.mutate({ id, data })}
          member={editingMember}
          collectors={collectors || []}
        />

        <MoveMemberDialog
          open={isMoveDialogOpen}
          onOpenChange={setIsMoveDialogOpen}
          onConfirm={(collectorId) => 
            moveMemberMutation.mutate({ 
              memberId: movingMember?.id, 
              newCollectorId: collectorId 
            })}
          collectors={collectors || []}
          loading={moveMemberMutation.isPending}
          memberName={movingMember?.full_name}
        />

        <DeleteMemberDialog
          member={deleteConfirmMember}
          onDelete={(id) => deleteMemberMutation.mutate(id)}
          onClose={() => setDeleteConfirmMember(null)}
        />

        <StatusMemberDialog
          member={statusConfirmMember}
          onToggleStatus={toggleStatusMutation.mutate}
          onClose={() => setStatusConfirmMember(null)}
        />
      </div>
    </div>
  );
}
