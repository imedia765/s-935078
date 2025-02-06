import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/utils/email";
import { User, ValidationDetails, FixType, UserRole } from "../types/role-types";

export const useRoleManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("table");
  const [isFixingAll, setIsFixingAll] = useState(false);

  const generateMagicLink = async (userId: string) => {
    try {
      console.log("Generating magic link for user:", userId);
      
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('email, auth_user_id')
        .eq('auth_user_id', userId)
        .single();

      if (memberError || !memberData?.email) {
        console.error("Member data fetch error:", memberError);
        throw new Error(memberError?.message || 'No email found for user');
      }

      console.log("Found member email:", memberData.email);

      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: memberData.email,
      });

      if (error) {
        console.error("Magic link generation error:", error);
        throw error;
      }

      await sendEmail({
        to: memberData.email,
        subject: 'Your Login Link',
        html: `<p>Here's your magic login link: ${data.properties.action_link}</p>`,
      });

      toast({
        title: "Success",
        description: "Magic link sent successfully",
      });
    } catch (error: any) {
      console.error('Error generating magic link:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFixAllIssues = async () => {
    try {
      setIsFixingAll(true);
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
    } finally {
      setIsFixingAll(false);
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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      console.log(`Changing role for user ${userId} to ${newRole}`);
      
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      console.log('Current roles:', currentRoles);

      const { error: removeError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (removeError) throw removeError;

      const { error: addError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (addError) throw addError;

      await supabase.from('audit_logs').insert([{
        table_name: 'user_roles',
        operation: 'UPDATE',
        record_id: userId,
        new_values: {
          action: 'role_change',
          old_roles: currentRoles,
          new_role: newRole
        }
      }]);

      toast({
        title: "Success",
        description: `Role changed to ${newRole}`,
      });

      await refetch();
    } catch (error: any) {
      console.error("Error changing role:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const { data: userData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log("Fetching users and roles data...");
      
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error("User roles fetch error:", rolesError);
        throw rolesError;
      }

      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('auth_user_id, email, member_number, full_name');

      if (membersError) {
        console.error("Members fetch error:", membersError);
        throw membersError;
      }

      console.log("Fetched members:", members);
      console.log("Fetched user roles:", userRoles);

      const memberMap = members.reduce((acc: {[key: string]: {email: string, member_number: string, full_name: string}}, member: any) => {
        if (member.auth_user_id) {
          acc[member.auth_user_id] = {
            email: member.email,
            member_number: member.member_number,
            full_name: member.full_name
          };
        }
        return acc;
      }, {});

      const userMap = userRoles.reduce((acc: {[key: string]: User}, role: any) => {
        if (!acc[role.user_id]) {
          acc[role.user_id] = {
            id: role.user_id,
            email: memberMap[role.user_id]?.email,
            member_number: memberMap[role.user_id]?.member_number,
            full_name: memberMap[role.user_id]?.full_name,
            user_roles: []
          };
        }
        acc[role.user_id].user_roles?.push({ role: role.role });
        return acc;
      }, {});

      return Object.values(userMap);
    }
  });

  const { data: roleValidation, isLoading: isLoadingValidation, refetch } = useQuery({
    queryKey: ["roleValidation"],
    queryFn: async () => {
      console.log("Fetching role validation data...");
      const { data: validationData, error: validationError } = await supabase.rpc('validate_user_roles');
      
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
        validation: validationData,
        auditLogs: auditLogs || []
      };
    }
  });

  return {
    searchTerm,
    setSearchTerm,
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
    isFixingAll,
    refetch
  };
};