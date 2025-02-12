
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type CollectorData = {
  isAdmin: boolean;
  collectorId: string | null;
  collectorPrefix: string | null;
  collectorName: string | null;
  collectorNumber: string | null;
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
          collectorNumber: null
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
        .select("id, prefix, name, number")
        .eq("auth_id", user.id)
        .single();

      return {
        isAdmin: roles?.some(r => r.role === "admin") || false,
        collectorId: collectors?.id || null,
        collectorPrefix: collectors?.prefix || null,
        collectorName: collectors?.name || null,
        collectorNumber: collectors?.number || null
      };
    }
  });
}
