
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Payment, Collector } from "../types";

export function useFinancialQueries() {
  const { 
    data: paymentsData, 
    isLoading: loadingPayments,
    error: paymentsError
  } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      console.log('Fetching payments...');
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
          members!payment_requests_member_number_fkey (
            full_name,
            email
          ),
          members_collectors!payment_requests_collector_id_fkey (
            id,
            name
          ),
          receipts (
            id,
            receipt_number,
            receipt_url,
            generated_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      return (data as any[]).map(payment => ({
        ...payment,
        members: payment.members?.[0],
        members_collectors: payment.members_collectors?.[0]
      })) as Payment[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const { 
    data: collectors, 
    isLoading: isLoadingCollectors,
    refetch: refetchCollectors,
    error: collectorsError 
  } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      console.log('Fetching collectors...');
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
      
      if (error) {
        console.error('Error fetching collectors:', error);
        throw error;
      }
      return data as Collector[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const error = paymentsError || collectorsError;

  return {
    paymentsData,
    loadingPayments,
    collectors,
    isLoadingCollectors,
    refetchCollectors,
    error: error as Error | null
  };
}
