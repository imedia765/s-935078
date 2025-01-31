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
import { Users } from "lucide-react";

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
    <header className="mb-8">
      <h1 className="text-3xl font-medium mb-2 text-white">Members</h1>
      <p className="text-dashboard-text">View and manage member information</p>
      
      <div className="mt-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name or member number..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-dashboard-card border-dashboard-cardBorder"
          />
        </div>
        {onCollectorChange && (
          <div className="w-full sm:w-[250px]">
            <Select
              value={selectedCollector}
              onValueChange={onCollectorChange}
            >
              <SelectTrigger className="w-full bg-dashboard-card border-dashboard-cardBorder hover:bg-dashboard-cardHover">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-dashboard-accent1" />
                  <SelectValue placeholder="Filter by collector" />
                </div>
              </SelectTrigger>
              <SelectContent 
                className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-dashboard-card text-dashboard-text shadow-md"
                position="popper"
                sideOffset={5}
              >
                <SelectItem 
                  value="all" 
                  className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-dashboard-cardHover focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  All Collectors
                </SelectItem>
                {collectors?.map((collector) => (
                  <SelectItem 
                    key={collector.id} 
                    value={collector.name || ''}
                    className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-dashboard-cardHover focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    {collector.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </header>
  );
};

export default MembersListFilters;