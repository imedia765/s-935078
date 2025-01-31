import { useState } from "react";
import CollectorMemberPayments from '../CollectorMemberPayments';
import MembersListContent from './MembersListContent';
import { DashboardTabs, DashboardTabsList, DashboardTabsTrigger, DashboardTabsContent } from "@/components/ui/dashboard-tabs";
import CollectorPaymentSummary from '@/components/CollectorPaymentSummary';
import RoleBasedRenderer from '@/components/RoleBasedRenderer';
import NotesList from '../notes/NotesList';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMembersData } from "./hooks/useMembersData";

interface MembersListViewProps {
  searchTerm: string;
  userRole: string | null;
  collectorInfo: any;
  selectedCollector?: string;
}

const MembersListView = ({ 
  searchTerm, 
  userRole, 
  collectorInfo,
  selectedCollector = 'all'
}: MembersListViewProps) => {
  const [page, setPage] = useState(1);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: membersData, isLoading, refetch } = useMembersData({
    searchTerm,
    selectedCollector,
    userRole,
    collectorInfo,
    page
  });

  const handleEditClick = (memberId: string) => {
    setSelectedMemberId(memberId);
  };

  const handleDeleteClick = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Member deleted",
        description: "Member has been successfully deleted",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardTabs defaultValue="members" className="w-full">
      <DashboardTabsList className="w-full grid grid-cols-1 sm:grid-cols-3 gap-0">
        {userRole === 'collector' && (
          <>
            <DashboardTabsTrigger value="summary">Summary</DashboardTabsTrigger>
            <DashboardTabsTrigger value="payments">Payments</DashboardTabsTrigger>
          </>
        )}
        <DashboardTabsTrigger value="members">Members List</DashboardTabsTrigger>
        <RoleBasedRenderer allowedRoles={['admin']}>
          <DashboardTabsTrigger value="notes">Notes</DashboardTabsTrigger>
        </RoleBasedRenderer>
      </DashboardTabsList>

      {userRole === 'collector' && collectorInfo && (
        <>
          <DashboardTabsContent value="summary">
            <CollectorPaymentSummary collectorName={collectorInfo.name} />
          </DashboardTabsContent>

          <DashboardTabsContent value="payments">
            <CollectorMemberPayments collectorName={collectorInfo.name} />
          </DashboardTabsContent>
        </>
      )}

      <DashboardTabsContent value="members">
        <MembersListContent
          members={membersData?.members || []}
          isLoading={isLoading}
          userRole={userRole}
          currentPage={page}
          totalPages={Math.ceil((membersData?.totalCount || 0) / 20)}
          onPageChange={setPage}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
      </DashboardTabsContent>

      <RoleBasedRenderer allowedRoles={['admin']}>
        <DashboardTabsContent value="notes">
          <div className="text-center text-dashboard-muted py-8">
            Loading notes...
          </div>
        </DashboardTabsContent>
      </RoleBasedRenderer>
    </DashboardTabs>
  );
};

export default MembersListView;