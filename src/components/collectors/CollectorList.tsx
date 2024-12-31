import { ScrollArea } from "@/components/ui/scroll-area";
import { CollectorCard } from "./CollectorCard";

interface CollectorListProps {
  collectors: any[];
  expandedCollector: string | null;
  onToggleCollector: (id: string) => void;
  onEditCollector: (collector: { id: string; name: string }) => void;
  onUpdate: () => void;
  isLoading: boolean;
  searchTerm: string;
}

export function CollectorList({
  collectors,
  expandedCollector,
  onToggleCollector,
  onEditCollector,
  onUpdate,
  isLoading,
  searchTerm,
}: CollectorListProps) {
  // Filter collectors based on search term
  const filteredCollectors = collectors?.filter(collector => {
    const matchesName = collector.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNumber = collector.number.includes(searchTerm);
    const matchesPrefix = collector.prefix.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Count only active members
    const activeMembers = collector.members?.filter(member => 
      member.status === 'active' || member.status === null
    ) || [];
    
    // Log member counts for debugging
    console.log(`Collector ${collector.name} has ${activeMembers.length} active members`);
    
    return matchesName || matchesNumber || matchesPrefix;
  }) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading collectors...</div>
      </div>
    );
  }

  // Log total active members for debugging
  const totalActiveMembers = collectors?.reduce((total, collector) => {
    const activeMembers = collector.members?.filter(member => 
      member.status === 'active' || member.status === null
    ) || [];
    return total + activeMembers.length;
  }, 0) || 0;
  
  console.log(`Fetched total active members: ${totalActiveMembers}`);

  if (filteredCollectors.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">
          {searchTerm ? "No collectors found matching your search" : "No collectors found"}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="space-y-4">
        {filteredCollectors.map((collector) => (
          <CollectorCard
            key={collector.id}
            collector={collector}
            collectors={collectors}
            expandedCollector={expandedCollector}
            onToggle={onToggleCollector}
            onEdit={onEditCollector}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </ScrollArea>
  );
}