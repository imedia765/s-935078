import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EditCollectorDialog } from "@/components/collectors/EditCollectorDialog";
import { CollectorList } from "@/components/collectors/CollectorList";
import { CollectorHeader } from "@/components/collectors/CollectorHeader";
import { CollectorSearch } from "@/components/collectors/CollectorSearch";
import { PrintTemplate } from "@/components/collectors/PrintTemplate";

export default function Collectors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCollector, setExpandedCollector] = useState<string | null>(null);
  const [editingCollector, setEditingCollector] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  const { data: collectors, isLoading, refetch } = useQuery({
    queryKey: ['collectors'],
    queryFn: async () => {
      console.log('Starting collectors fetch process...');
      
      // First, get all collectors
      const { data: collectorsData, error: collectorsError } = await supabase
        .from('collectors')
        .select('*')
        .order('name');

      if (collectorsError) {
        console.error('Error fetching collectors:', collectorsError);
        throw collectorsError;
      }

      // Get total member count first
      const { count: totalMemberCount, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error getting total count:', countError);
        throw countError;
      }

      console.log('Total members in database:', totalMemberCount);

      // Then, get all members with their collector information
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select(`
          id,
          member_number,
          full_name,
          email,
          phone,
          address,
          status,
          collector_id
        `)
        .not('collector_id', 'is', null); // Only get members with assigned collectors

      if (membersError) {
        console.error('Error fetching members:', membersError);
        throw membersError;
      }

      // Log unassigned members for debugging
      console.log('Fetching unassigned members...');
      const unassignedMembers = membersData.filter(member => !member.collector_id);
      if (unassignedMembers.length > 0) {
        console.log(`Found ${unassignedMembers.length} unassigned members`);
      }

      // Map members to their collectors
      const enhancedCollectorsData = collectorsData.map(collector => {
        // Filter members by collector_id
        const collectorMembers = membersData.filter(member => 
          member.collector_id === collector.id
        );

        // Log all counts for debugging
        console.log(`Collector ${collector.name}:`);
        console.log(`- Total members: ${collectorMembers.length}`);
        
        const activeMembers = collectorMembers.filter(member => 
          member.status === 'active' || member.status === null
        );
        console.log(`- Active members: ${activeMembers.length}`);
        
        const inactiveMembers = collectorMembers.filter(member => 
          member.status === 'inactive'
        );
        console.log(`- Inactive members: ${inactiveMembers.length}`);

        // Double check for MT05 and SH09
        if (collector.prefix === 'MT' || collector.prefix === 'SH') {
          console.log(`Detailed check for ${collector.prefix}${collector.number}:`);
          console.log('Member numbers:', collectorMembers.map(m => m.member_number).join(', '));
        }

        return {
          ...collector,
          members: collectorMembers,
          activeMemberCount: activeMembers.length,
          inactiveMemberCount: inactiveMembers.length,
          totalMemberCount: collectorMembers.length
        };
      });

      // Calculate and log all totals
      const totals = enhancedCollectorsData.reduce((acc, collector) => {
        return {
          total: acc.total + collector.totalMemberCount,
          active: acc.active + collector.activeMemberCount,
          inactive: acc.inactive + collector.inactiveMemberCount
        };
      }, { total: 0, active: 0, inactive: 0 });

      console.log('Final totals:');
      console.log(`- Total members across all collectors: ${totals.total}`);
      console.log(`- Total active members: ${totals.active}`);
      console.log(`- Total inactive members: ${totals.inactive}`);
      console.log(`- Unassigned members: ${unassignedMembers.length}`);
      console.log(`- Grand total (including unassigned): ${totals.total + unassignedMembers.length}`);

      return enhancedCollectorsData;
    }
  });

  const handlePrintAll = () => {
    const printContent = PrintTemplate({ collectors });
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <CollectorHeader 
        onPrintAll={handlePrintAll}
        onUpdate={refetch}
      />

      <CollectorSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <CollectorList
        collectors={collectors || []}
        expandedCollector={expandedCollector}
        onToggleCollector={setExpandedCollector}
        onEditCollector={setEditingCollector}
        onUpdate={refetch}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />

      {editingCollector && (
        <EditCollectorDialog
          isOpen={true}
          onClose={() => setEditingCollector(null)}
          collector={editingCollector}
          onUpdate={refetch}
        />
      )}
    </div>
  );
}