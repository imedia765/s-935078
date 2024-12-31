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
          collector_id,
          collector
        `)
        .order('full_name');

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

        // Log member count for debugging
        console.log(`Collector ${collector.name} has ${collectorMembers.length} members`);

        // Also log active member count
        const activeMembers = collectorMembers.filter(member => 
          member.status === 'active' || member.status === null
        );
        console.log(`Collector ${collector.name} has ${activeMembers.length} active members`);

        return {
          ...collector,
          members: collectorMembers
        };
      });

      // Log total active members for debugging
      const totalActiveMembers = enhancedCollectorsData.reduce((total, collector) => {
        const activeMembers = collector.members?.filter(member => 
          member.status === 'active' || member.status === null
        ) || [];
        return total + activeMembers.length;
      }, 0);
      
      console.log(`Fetched total active members: ${totalActiveMembers}`);

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