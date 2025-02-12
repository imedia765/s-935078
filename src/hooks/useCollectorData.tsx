
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
        .eq("auth_user_id", user.id)
        .single();

      return {
        isAdmin: roles?.some(r => r.role === "admin") || false,
        collectorId: collectorData?.id || null,
        collectorPrefix: collectorData?.prefix || null,
        collectorName: collectorData?.name || null,
        collectorNumber: collectorData?.number || null
      };
    }
  });
}
