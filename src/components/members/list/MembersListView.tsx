import { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import CollectorMemberPayments from '../CollectorMemberPayments';
import MembersListContent from './MembersListContent';
import { DashboardTabs, DashboardTabsList, DashboardTabsTrigger, DashboardTabsContent } from "@/components/ui/dashboard-tabs";
import CollectorPaymentSummary from '@/components/CollectorPaymentSummary';
import RoleBasedRenderer from '@/components/RoleBasedRenderer';
import NotesList from '../notes/NotesList';
import { useToast } from "@/hooks/use-toast";

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
  const ITEMS_PER_PAGE = 20;
  const { toast } = useToast();

  const { data: membersData, isLoading, refetch } = useQuery({
    queryKey: ['members', searchTerm, userRole, page, collectorInfo?.name, selectedCollector],
    queryFn: async () => {
      console.log('Starting query with params:', {
        searchTerm,
        selectedCollector,
        userRole,
        collectorInfo
      });
      
      let query = supabase
        .from('members')
        .select('*', { count: 'exact' });

      // Apply search filter if present
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,collector.ilike.%${searchTerm}%`);
      }

      // Apply collector filter based on role and selection
      if (userRole === 'collector' && collectorInfo?.name) {
        // If user is a collector, only show their assigned members
        console.log('Filtering for collector:', collectorInfo.name);
        query = query.eq('collector', collectorInfo.name);
      } else if (selectedCollector && selectedCollector !== 'all') {
        // If a specific collector is selected (and user has permission to view)
        console.log('Filtering by selected collector:', selectedCollector);
        query = query.eq('collector', selectedCollector);
      }

      // Add pagination
      query = query
        .range((page - 1) * ITEMS_PER_PAGE, (page - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE - 1)
        .order('created_at', { ascending: false });

      console.log('Executing query...');
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      console.log('Query results:', {
        count,
        resultsLength: data?.length,
        firstMember: data?.[0]
      });
      
      return {
        members: data || [],
        totalCount: count || 0,
        currentPage: page
      };
    },
    placeholderData: (previousData) => previousData
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
          totalPages={Math.ceil((membersData?.totalCount || 0) / ITEMS_PER_PAGE)}
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