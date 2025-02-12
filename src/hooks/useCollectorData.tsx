
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type CollectorData = {
  isAdmin: boolean;
  collectorId: string | null;
  collectorPrefix: string | null;
  collectorName: string | null;
  collectorNumber: string | null;
  member_number: string | null;
};

export function useCollectorData() {
  return useQuery<CollectorData>({
    queryKey: ["collectorData"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {
          isAdmin: false,
          collectorId: null,
          collectorPrefix: null,
          collectorName: null,
          collectorNumber: null,
          member_number: null
        };
      }

      // Fetch roles first
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      // Then fetch collector data
      const { data: collectors } = await supabase
        .from("members_collectors")
        .select("id, prefix, name, number, member_number")
        .eq("auth_user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      // Calculate collector prefix from member number if available
      let collectorPrefix = null;
      if (collectors?.member_number) {
        const prefix = collectors.member_number.substring(0, 2); // Get letters (e.g., "TM")
        const number = collectors.member_number.substring(2, 4); // Get digits (e.g., "10")
        collectorPrefix = prefix + number;
      }

      return {
        isAdmin: roles?.some(r => r.role === "admin") || false,
        collectorId: collectors?.id || null,
        collectorPrefix,
        collectorName: collectors?.name || null,
        collectorNumber: collectors?.number || null,
        member_number: collectors?.member_number || null
      };
    },
    meta: {
      onError: (error: Error) => {
        console.error("Error fetching collector data:", error);
      }
    }
  });
}
