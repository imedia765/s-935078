import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { MemberFormData } from "@/types/member";

export function useMemberQueries(
  selectedCollector: string,
  searchTerm: string,
  sortField: string,
  sortDirection: 'asc' | 'desc',
  collectorId: string | null,
  page: number,
  ITEMS_PER_PAGE: number
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userInfo } = useQuery({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const { data: collectorInfo } = await supabase
        .from("members_collectors")
        .select("id")
        .eq("auth_user_id", user.id);

      const collectorId = collectorInfo && collectorInfo.length > 0 ? collectorInfo[0].id : null;

      return {
        roles: roles?.map(r => r.role) || [],
        collectorId
      };
    }
  });

  const { data: collectors, isLoading: loadingCollectors } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_collectors")
        .select("*")
        .eq("active", true);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ["members", selectedCollector, searchTerm, sortField, sortDirection, collectorId, page],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select(`
          *,
          members_collectors!members_collectors_member_number_fkey (
            name,
            number,
            active
          )
        `, { count: 'exact' });

      // Filter by collector ID if provided (for collectors)
      if (collectorId) {
        query = query.eq('collector_id', collectorId);
      } 
      // Otherwise, if a specific collector is selected (for admins)
      else if (selectedCollector !== 'all') {
        query = query.eq('collector_id', selectedCollector);
      }

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      if (sortField) {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        members: data || [],
        totalCount: count || 0
      };
    }
  });

  return {
    userInfo,
    collectors,
    membersData,
    isLoading: loadingMembers || loadingCollectors
  };
}
