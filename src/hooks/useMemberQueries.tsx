
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MembersTableProps {
  members: any[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onEdit: (member: any) => void;
  onToggleStatus: (member: any) => void;
  onMove: (member: any) => void;
  onExportIndividual: (member: any) => void;
  onDelete: (member: any) => void;
}

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
        .select("id, prefix, name, number, member_number")
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
      console.log('Starting member fetch with collector ID:', collectorId);

      let query = supabase
        .from("members")
        .select(`
          *,
          members_collectors!members_collectors_member_number_fkey (
            name,
            number,
            active,
            prefix,
            member_number
          ),
          payment_requests!payment_requests_member_number_fkey (
            id,
            status,
            amount,
            payment_type
          )
        `, { count: 'exact' });

      const isAdmin = userRolesQuery.data?.includes("admin");
      const userCollector = userCollectorQuery.data;

      console.log('User is admin:', isAdmin);
      console.log('Current collector data:', userCollector);

      if (!isAdmin) {
        if (!userCollector?.id) {
          console.error('Non-admin user without collector ID detected');
          throw new Error('Collector ID not found');
        }
        console.log('Applying non-admin filter with collector ID:', userCollector.id);
        query = query.eq('collector_id', userCollector.id);
      } else if (selectedCollector !== 'all') {
        console.log('Admin filtering by selected collector:', selectedCollector);
        query = query.eq('collector_id', selectedCollector);
      } else {
        console.log('Admin viewing all members');
      }

      if (searchTerm) {
        console.log('Applying search term:', searchTerm);
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (sortField) {
        query = query.order(sortField, { ascending: sortDirection === 'asc' });
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);

      console.log('Executing final query...');
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

      console.log('Query completed successfully:', {
        totalCount: count,
        resultsCount: data?.length,
        firstMember: data?.[0]?.member_number
      });

      return {
        members: data || [],
        totalCount: count || 0
      };
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
