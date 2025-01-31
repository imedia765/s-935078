import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

interface MembersListFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCollector?: string;
  onCollectorChange?: (value: string) => void;
}

const MembersListFilters = ({
  searchTerm,
  onSearchChange,
  selectedCollector = 'all',
  onCollectorChange
}: MembersListFiltersProps) => {
  const { data: collectors } = useQuery({
    queryKey: ['collectors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('members_collectors')
        .select('*')
        .eq('active', true)
        .order('name');
      return data || [];
    }
  });

  console.log('MembersListFilters - Selected Collector:', selectedCollector);
  console.log('MembersListFilters - Available Collectors:', collectors);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <Input
          placeholder="Search by name or member number..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-dashboard-card border-dashboard-cardBorder"
        />
      </div>
      {onCollectorChange && (
        <div className="w-full sm:w-[200px]">
          <Select
            value={selectedCollector}
            onValueChange={onCollectorChange}
          >
            <SelectTrigger className="bg-dashboard-card border-dashboard-cardBorder">
              <SelectValue placeholder="Filter by collector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collectors</SelectItem>
              {collectors?.map((collector) => (
                <SelectItem key={collector.id} value={collector.name || ''}>
                  {collector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default MembersListFilters;