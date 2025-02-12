
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Get user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = roles?.some(r => r.role === 'admin');

      // Get collector ID if user is a collector
      const { data: collectorInfo } = await supabase
        .from('members_collectors')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      console.log('User roles:', roles);
      console.log('Collector info:', collectorInfo);

      let query = supabase
        .from('payment_requests')
        .select(`
          id,
          amount,
          payment_method,
          payment_type,
          status,
          created_at,
          payment_number,
          collector_id,
          member_number,
          members!payment_requests_member_number_fkey (
            full_name,
            email
          ),
          members_collectors (
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
        .order('created_at', { ascending: false });

      // Filter by collector ID if user is not admin and is a collector
      if (!isAdmin && collectorInfo?.id) {
        console.log('Filtering by collector ID:', collectorInfo.id);
        query = query.eq('collector_id', collectorInfo.id);
      }

      const { data, error } = await query.limit(50);
      
      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }

      console.log('Fetched payments:', data);

      return (data as any[]).map(payment => ({
        ...payment,
        members: payment.members,
        members_collectors: payment.members_collectors
      })) as Payment[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = roles?.some(r => r.role === 'admin');

      let query = supabase
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
        `);

      // If not admin, only show the collector's own data
      if (!isAdmin) {
        query = query.eq('auth_user_id', user.id);
      }

      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching collectors:', error);
        throw error;
      }

      console.log('Fetched collectors:', data);
      
      return (data as any[]).map(collector => ({
        ...collector,
        members: collector.members
      })) as Collector[];
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
