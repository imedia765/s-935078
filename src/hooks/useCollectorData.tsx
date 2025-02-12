
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
  return useQuery<CollectorData | null>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const { data: collectors } = await supabase
        .from("members_collectors")
        .select("id, prefix, name, number")
        .eq("user_id", user.id);

      const collector = collectors && collectors.length > 0 ? collectors[0] : null;

      return {
        isAdmin: roles?.some(r => r.role === "admin") || false,
        collectorId: collector?.id || null,
        collectorPrefix: collector?.prefix || null,
        collectorName: collector?.name || null,
        collectorNumber: collector?.number || null
      };
    }
  });
}
