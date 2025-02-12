
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { MemberFormData } from "@/types/member";

type UserInfo = {
  roles: string[];
  collectorId: string | null;
  collectorPrefix: string | null;
};

type MembersData = {
  members: Array<{
    id: string;
    full_name: string;
    email: string;
    member_number: string;
    phone: string;
    collector_id: string;
    members_collectors: {
      name: string;
      number: string;
      active: boolean;
      prefix: string;
    } | null;
  }>;
  totalCount: number;
};

type CollectorType = {
  id: string;
  name: string | null;
  number: string | null;
  prefix: string | null;
  active: boolean;
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

  const { data: userInfo } = useQuery<UserInfo>({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const { data: collectors } = await supabase
        .from("members_collectors")
        .select("id, prefix")
        .eq("user_id", user.id);

      const collector = collectors && collectors.length > 0 ? collectors[0] : null;

      return {
        roles: roles?.map(r => r.role) || [],
        collectorId: collector?.id || null,
        collectorPrefix: collector?.prefix || null
      };
    }
  });

  const { data: collectors, isLoading: loadingCollectors } = useQuery<CollectorType[]>({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_collectors")
        .select("*")
        .eq("active", true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: userInfo?.roles.includes("admin") || false
  });

  const { data: membersData, isLoading: loadingMembers } = useQuery<MembersData>({
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

      if (!userInfo?.roles.includes("admin")) {
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
    }
  });

  return {
    userInfo,
    collectors,
    membersData,
    isLoading: loadingMembers || loadingCollectors
  };
}
