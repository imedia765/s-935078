
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCollectorData() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const { data: collectorData } = await supabase
        .from("members_collectors")
        .select("id, prefix, name, number")
        .eq("user_id", user.id);

      // Safely handle the case where no collector data is found
      const collector = collectorData && collectorData.length > 0 ? collectorData[0] : null;

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
