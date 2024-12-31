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

      console.log('Fetched collectors:', collectorsData?.length);

      // Then, get all members with their collector information
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, collector_id, collector')
        .eq('status', 'active');

      if (membersError) {
        console.error('Error fetching members:', membersError);
        throw membersError;
      }

      // Create a map of collector IDs to their members
      const collectorMembersMap = new Map();
      membersData?.forEach(member => {
        if (member.collector_id) {
          const currentMembers = collectorMembersMap.get(member.collector_id) || [];
          collectorMembersMap.set(member.collector_id, [...currentMembers, member]);
        }
      });

      // Enhance collectors with their members
      const enhancedCollectorsData = collectorsData?.map(collector => {
        const collectorMembers = collectorMembersMap.get(collector.id) || [];
        console.log(`Collector ${collector.name} has ${collectorMembers.length} members`);
        
        return {
          ...collector,
          members: collectorMembers
        };
      });

      // Log total active members
      const totalActiveMembers = membersData?.length || 0;
      console.log('Fetched total active members:', totalActiveMembers);

      // Log member counts for each collector
      enhancedCollectorsData?.forEach(collector => {
        console.log(`Collector ${collector.name} has ${collector.members.length} active members`);
      });

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