import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

interface UseMembersDataProps {
  searchTerm: string;
  selectedCollector: string | undefined;
  userRole: string | null;
  collectorInfo: any;
  page: number;
}

export const useMembersData = ({ 
  searchTerm, 
  selectedCollector, 
  userRole, 
  collectorInfo,
  page 
}: UseMembersDataProps) => {
  const ITEMS_PER_PAGE = 20;

  return useQuery({
    queryKey: ['members', searchTerm, selectedCollector, userRole, page, collectorInfo?.name],
    queryFn: async () => {
      console.log('Starting query with params:', {
        searchTerm,
        selectedCollector,
        userRole,
        collectorInfo,
        page
      });
      
      let query = supabase
        .from('members')
        .select('*', { count: 'exact' });

      // Apply search filter if present
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%`);
        console.log('Applied search filter:', searchTerm);
      }

      // Apply collector filter based on role and selection
      if (userRole === 'collector' && collectorInfo?.name) {
        // If user is a collector, only show their assigned members
        console.log('Filtering for collector:', collectorInfo.name);
        query = query.eq('collector', collectorInfo.name);
      } else if (selectedCollector && selectedCollector !== 'all') {
        // If a specific collector is selected from dropdown
        const prefix = selectedCollector.substring(0, 2);
        console.log('Filtering by collector prefix:', prefix);
        query = query.ilike('member_number', `${prefix}%`);
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
        firstMember: data?.[0],
        appliedFilters: {
          collector: selectedCollector,
          prefix: selectedCollector !== 'all' ? selectedCollector.substring(0, 2) : null
        }
      });
      
      return {
        members: data || [],
        totalCount: count || 0,
        currentPage: page
      };
    },
    staleTime: 0, // Disable caching to ensure fresh data on every request
    cacheTime: 0
  });
};