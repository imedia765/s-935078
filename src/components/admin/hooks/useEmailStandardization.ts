
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

export const useEmailStandardization = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: standardizationResults, isLoading: isLoadingResults } = useQuery({
    queryKey: ["emailStandardization"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_email_standardization');
      if (error) throw error;
      return data as StandardizationResult[];
    }
  });

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

  const standardizeEmailMutation = useMutation({
    mutationFn: async (memberNumber: string) => {
      const { data, error } = await supabase.rpc('standardize_auth_emails', {
        p_member_number: memberNumber
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailStandardization"] });
      toast({
        title: "Success",
        description: "Email standardization completed successfully",
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

  const whitelistEmailMutation = useMutation({
    mutationFn: async ({ email, memberNumber, reason }: { email: string; memberNumber: string; reason: string }) => {
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
