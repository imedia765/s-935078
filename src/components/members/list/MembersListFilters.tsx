import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import MemberSearch from "@/components/MemberSearch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from 'lucide-react';

interface MembersListFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCollector?: string;
  onCollectorChange?: (collector: string) => void;
}

const MembersListFilters = ({ 
  searchTerm, 
  onSearchChange,
  selectedCollector,
  onCollectorChange 
}: MembersListFiltersProps) => {
  const { data: collectors } = useQuery({
    queryKey: ['collectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members_collectors')
        .select('name')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <header className="mb-8">
      <h1 className="text-3xl font-medium mb-2 text-white">Members</h1>
      <p className="text-dashboard-muted">View and manage member information</p>
      <div className="mt-4 space-y-4">
        <MemberSearch 
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
        
        <div className="flex items-center space-x-2">
          <Select
            value={selectedCollector}
            onValueChange={onCollectorChange}
          >
            <SelectTrigger className="w-[250px] bg-dashboard-card border-dashboard-cardBorder hover:bg-dashboard-cardHover">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-dashboard-accent1" />
                <SelectValue placeholder="Filter by collector" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-dashboard-card border-dashboard-cardBorder">
              <SelectItem value="all" className="text-dashboard-text hover:text-white">
                All Collectors
              </SelectItem>
              {collectors?.map((collector) => (
                <SelectItem 
                  key={collector.name} 
                  value={collector.name}
                  className="text-dashboard-text hover:text-white"
                >
                  {collector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
};

export default MembersListFilters;