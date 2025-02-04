
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Payment, Collector } from "../types";

export function useFinancialQueries() {
  const { data: paymentsData, isLoading: loadingPayments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          id,
          amount,
          payment_method,
          payment_type,
          status,
          created_at,
          payment_number,
          members!payment_requests_member_id_fkey (
            full_name
          ),
          members_collectors!payment_requests_collector_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    }
  });

  const { data: collectors, isLoading: isLoadingCollectors, refetch: refetchCollectors } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_collectors")
        .select(`
          *,
          members!members_collectors_member_number_fkey (
            member_number,
            full_name,
            email
          ),
          payment_requests (
            status,
            amount,
            created_at
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Collector[];
    }
  });

  return {
    paymentsData,
    loadingPayments,
    collectors,
    isLoadingCollectors,
    refetchCollectors
  };
}
