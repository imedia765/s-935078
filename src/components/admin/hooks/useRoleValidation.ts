

import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { FixType } from "../types/role-types";

export const useRoleValidation = () => {
  const { toast } = useToast();

  const handleFixAllIssues = async () => {
    try {
      console.log("Starting fix all issues process...");
      
      const { data, error } = await supabase.rpc('fix_all_role_issues');
      
      if (error) {
        console.error("Error in fix_all_role_issues:", error);
        throw error;
      }

      console.log("Fix all issues response:", data);
      
      await refetch();
      
      toast({
        title: "Success",
        description: "All role issues have been fixed",
      });
    } catch (error: any) {
      console.error('Error fixing all issues:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFixRoleError = async (userId: string | undefined, checkType: string, fixType: FixType) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Fixing role error: ${checkType} for user ${userId} with fix type ${fixType}`);
      
      const { data, error } = await supabase.rpc('fix_role_error', {
        p_error_type: checkType,
        p_user_id: userId,
        p_specific_fix: fixType === 'remove_role' ? 'remove_role' : null
      });

      if (error) {
        console.error("Error in fix_role_error:", error);
        throw error;
      }

      console.log("Fix role error response:", data);

      toast({
        title: "Success",
        description: "Role issue fixed successfully",
      });

      await refetch();
    } catch (error: any) {
      console.error('Error fixing role:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const { data: roleValidation, isLoading: isLoadingValidation, refetch } = useQuery({
    queryKey: ["roleValidation"],
    queryFn: async () => {
      console.log("Fetching role validation data...");
      
      const { data: validationData, error: validationError } = await supabase
        .rpc('validate_user_roles');
      
      if (validationError) {
        console.error("Role validation error:", validationError);
        throw validationError;
      }

      console.log("Validation data:", validationData);

      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'user_roles')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (auditError) {
        console.error("Audit log fetch error:", auditError);
      }

      console.log("Audit logs:", auditLogs);

      return {
        validation: validationData || [],
        auditLogs: auditLogs || []
      };
    }
  });

  return {
    handleFixAllIssues,
    handleFixRoleError,
    roleValidation,
    isLoadingValidation,
    refetch
  };
};

