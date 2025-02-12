
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailWhitelist {
  id: string;
  email: string;
  member_number: string;
  reason: string;
  approved_at: string;
}

interface StandardizationResult {
  member_number: string;
  current_auth_email: string;
  current_member_email: string;
  standardization_status: string;
  issues: string[];
}

interface StandardizationLog {
  member_number: string;
  old_email: string;
  new_email: string;
  status: string;
  attempted_at: string;
  completed_at: string | null;
  error_message: string | null;
}

interface StandardizationResponse {
  success: boolean;
  message?: string;
  error?: string;
  old_email?: string;
  new_email?: string;
}

export const useEmailStandardization = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch standardization results
  const { data: standardizationResults, isLoading: isLoadingResults } = useQuery({
    queryKey: ["emailStandardization"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_email_standardization');
      if (error) throw error;
      return data as StandardizationResult[];
    }
  });

  // Fetch whitelist
  const { data: whitelistedEmails, isLoading: isLoadingWhitelist } = useQuery({
    queryKey: ["emailWhitelist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_whitelist')
        .select('*');
      if (error) throw error;
      return data as EmailWhitelist[];
    }
  });

  // Fetch standardization logs
  const { data: standardizationLogs } = useQuery({
    queryKey: ["emailStandardizationLogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_standardization_logs')
        .select('*')
        .order('attempted_at', { ascending: false });
      if (error) throw error;
      return data as StandardizationLog[];
    }
  });

  // Standardize email mutation
  const standardizeEmailMutation = useMutation({
    mutationFn: async (memberNumber: string) => {
      const { data, error } = await supabase.rpc('handle_email_standardization', {
        p_member_number: memberNumber,
        p_attempt_legacy: true,
        p_check_whitelist: true
      });
      if (error) throw error;
      return data as StandardizationResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["emailStandardization"] });
      queryClient.invalidateQueries({ queryKey: ["emailStandardizationLogs"] });
      toast({
        title: "Success",
        description: data.message || "Email standardization completed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Whitelist email mutation
  const whitelistEmailMutation = useMutation({
    mutationFn: async ({ email, memberNumber, reason }: { email: string; memberNumber: string; reason: string }) => {
      // First add to whitelist logs
      const { error: logError } = await supabase
        .from('email_whitelist_logs')
        .insert([{ email, member_number: memberNumber, reason }]);
      if (logError) throw logError;

      // Then add to whitelist
      const { data, error } = await supabase
        .from('email_whitelist')
        .insert([{ email, member_number: memberNumber, reason }]);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailWhitelist"] });
      toast({
        title: "Success",
        description: "Email added to whitelist successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Remove from whitelist mutation
  const removeFromWhitelistMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_whitelist')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailWhitelist"] });
      toast({
        title: "Success",
        description: "Email removed from whitelist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    standardizationResults,
    whitelistedEmails,
    standardizationLogs,
    isLoadingResults,
    isLoadingWhitelist,
    standardizeEmail: standardizeEmailMutation.mutate,
    whitelistEmail: whitelistEmailMutation.mutate,
    removeFromWhitelist: removeFromWhitelistMutation.mutate,
    isStandardizing: standardizeEmailMutation.isPending,
    isWhitelisting: whitelistEmailMutation.isPending,
    isRemoving: removeFromWhitelistMutation.isPending
  };
};
