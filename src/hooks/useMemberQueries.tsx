
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Basic types without nesting
type QueryResult<T> = {
  data: T | null;
  error: Error | null;
};

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

  // Split into separate queries to avoid deep nesting
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      return user;
    }
  });

  const userRolesQuery = useQuery({
    queryKey: ["userRoles", userQuery.data?.id],
    queryFn: async () => {
      if (!userQuery.data?.id) return [];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userQuery.data.id);
      return data?.map(r => r.role) || [];
    },
    enabled: !!userQuery.data?.id
  });

  const userCollectorQuery = useQuery({
    queryKey: ["userCollector", userQuery.data?.id],
    queryFn: async () => {
      if (!userQuery.data?.id) return null;
      const { data } = await supabase
        .from("members_collectors")
        .select("id, prefix")
        .eq("user_id", userQuery.data.id);
      return data?.[0] || null;
    },
    enabled: !!userQuery.data?.id
  });

  const collectorsQuery = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_collectors")
        .select("*")
        .eq("active", true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: userRolesQuery.data?.includes("admin") || false
  });

  const membersQuery = useQuery({
    queryKey: ["members", selectedCollector, searchTerm, sortField, sortDirection, collectorId, page],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select(`
          *,
          members_collectors!members_collectors_member_number_fkey (
            name,
            number,
            active,
            prefix
          )
        `, { count: 'exact' });

      if (!userRolesQuery.data?.includes("admin")) {
        if (!collectorId) {
          throw new Error("Collector ID not found");
        }
        query = query.eq('collector_id', collectorId);
      } else if (selectedCollector !== 'all') {
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
    },
    enabled: !!userQuery.data
  });

  // Combine the data for the return value
  const userInfo = {
    roles: userRolesQuery.data || [],
    collectorId: userCollectorQuery.data?.id || null,
    collectorPrefix: userCollectorQuery.data?.prefix || null
  };

  return {
    userInfo,
    collectors: collectorsQuery.data,
    membersData: membersQuery.data,
    isLoading: userQuery.isLoading || 
               userRolesQuery.isLoading || 
               userCollectorQuery.isLoading || 
               collectorsQuery.isLoading || 
               membersQuery.isLoading
  };
}
