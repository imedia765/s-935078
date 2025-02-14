
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRoleValidation } from "./useRoleValidation";
import { useUserRoles } from "./useUserRoles";

interface CollectorSyncResult {
  success: boolean;
  total_processed: number;
  success_count: number;
  failed_count: number;
  results: Array<{
    success: boolean;
    member_number?: string;
    error?: string;
  }>;
  timestamp: string;
}

export function useRoleManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"full_name" | "email" | "id" | "member_number">("full_name");
  const [activeTab, setActiveTab] = useState("table");
  const [isFixingAll, setIsFixingAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    handleFixAllIssues: handleValidationFixAll,
    handleFixRoleError,
    roleValidation,
    isLoadingValidation,
  } = useRoleValidation();

  const {
    handleRoleChange,
    userData,
    isLoadingUsers,
  } = useUserRoles();

  // Mutation for fixing all collector role sync issues
  const fixAllCollectorsMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting fix all collectors process...');
      const { data, error } = await supabase.rpc('fix_role_sync');
      if (error) throw error;
      
      // Safely cast the response to our expected type
      const result = data as unknown as CollectorSyncResult;
      if (!result || typeof result.success_count !== 'number') {
        throw new Error('Invalid response format from role sync');
      }
      
      return result;
    },
    onSuccess: (data) => {
      console.log('Fix all collectors response:', data);
      toast({
        title: "Success",
        description: `Fixed ${data.success_count} collectors (${data.failed_count} failed)`,
      });
      queryClient.invalidateQueries({ queryKey: ["collectors-status"] });
    },
    onError: (error: Error) => {
      console.error('Error fixing all collectors:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsFixingAll(false);
    }
  });

  const handleFixAllIssues = async () => {
    setIsFixingAll(true);
    try {
      await Promise.all([
        handleValidationFixAll(),
        fixAllCollectorsMutation.mutateAsync()
      ]);
    } catch (error) {
      console.error('Error in fix all process:', error);
    } finally {
      setIsFixingAll(false);
    }
  };

  const generateMagicLink = async (userId: string) => {
    try {
      console.log(`Generating magic link for user ${userId}`);
      
      const { data: user } = await supabase
        .from('members')
        .select('email')
        .eq('auth_user_id', userId)
        .single();

      if (!user?.email) {
        toast({
          title: "Error",
          description: "User email not found",
          variant: "destructive",
        });
        return { magicLink: '', email: '', token: '' };
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Error generating magic link:", error);
        throw error;
      }

      console.log("Magic link data:", data);

      // Safely access session data with null check and provide default values
      const token = data?.session?.access_token ?? '';
      const magicLink = token ? `${window.location.origin}/auth/callback?token=${token}&type=magiclink` : '';

      return { magicLink, email: user.email, token };
    } catch (error: any) {
      console.error('Error generating magic link:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { magicLink: '', email: '', token: '' };
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    searchType,
    setSearchType,
    activeTab,
    setActiveTab,
    generateMagicLink,
    handleFixRoleError,
    handleRoleChange,
    handleFixAllIssues,
    userData,
    isLoadingUsers,
    roleValidation,
    isLoadingValidation,
    isFixingAll
  };
}
