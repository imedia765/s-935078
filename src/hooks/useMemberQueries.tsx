
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Simplified type definitions - reducing nesting depth
type BaseEntity = {
  id: string;
};

type CollectorBase = BaseEntity & {
  prefix: string | null;
  name: string;
  number: string;
};

type Collector = CollectorBase & {
  active: boolean;
};

type MemberCollector = {
  name: string;
  number: string;
  active: boolean;
  prefix: string;
};

type Member = BaseEntity & {
  full_name: string;
  email: string | null;
  phone: string | null;
  member_number: string;
  collector_id: string;
  members_collectors: MemberCollector | null;
};

type QueryResult = {
  members: Member[];
  totalCount: number;
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
      return (data || []).map(r => r.role);
    },
    enabled: !!userQuery.data?.id
  });

  const userCollectorQuery = useQuery({
    queryKey: ["userCollector", userQuery.data?.id],
    queryFn: async () => {
      if (!userQuery.data?.id) return null;
      const { data, error } = await supabase
        .from("members_collectors")
        .select("id, prefix, name, number")
        .eq("auth_user_id", userQuery.data.id)
        .eq("active", true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching collector:', error);
        return null;
      }
      return data;
    },
    enabled: !!userQuery.data?.id
  });

  const collectorsQuery = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_collectors")
        .select("*")
        .eq("active", true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: userRolesQuery.data?.includes("admin") || false
  });

  const membersQuery = useQuery({
    queryKey: ["members", selectedCollector, searchTerm, sortField, sortDirection, collectorId, page],
    queryFn: async () => {
      console.log('Fetching members with params:', {
        selectedCollector,
        searchTerm,
        sortField,
        sortDirection,
        collectorId,
        page
      });

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

      // The RLS policy will automatically filter based on user role and collector_id
      // We only need to add additional filters for admin selection
      if (userRolesQuery.data?.includes("admin") && selectedCollector !== 'all') {
        console.log('Admin filtering by selected collector:', selectedCollector);
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

      console.log('Final query:', query);
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Query error:', error);
        toast({
          variant: "destructive",
          title: "Error fetching members",
          description: error.message
        });
        throw error;
      }

      console.log('Query results:', { count, results: data?.length, firstResult: data?.[0] });
      return {
        members: data || [],
        totalCount: count || 0
      } as QueryResult;
    },
    enabled: !!userQuery.data && (!!userCollectorQuery.data?.id || userRolesQuery.data?.includes("admin"))
  });

  return {
    userInfo: {
      roles: userRolesQuery.data || [],
      collectorId: userCollectorQuery.data?.id || null,
      collectorPrefix: userCollectorQuery.data?.prefix || null
    },
    collectors: collectorsQuery.data,
    membersData: membersQuery.data,
    isLoading: userQuery.isLoading || 
               userRolesQuery.isLoading || 
               userCollectorQuery.isLoading || 
               collectorsQuery.isLoading || 
               membersQuery.isLoading
  };
}
