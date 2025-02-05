
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

  const generateMagicLink = async (userId: string) => {
    try {
      const { data: userData } = await supabase
        .from('members')
        .select('email')
        .eq('auth_user_id', userId)
        .single();

      if (!userData?.email) {
        throw new Error('No email found for user');
      }

      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.email,
      });

      if (error) throw error;

      await sendEmail({
        to: userData.email,
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
      let response;
      
      // Get current roles first
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (fixType === 'remove_role') {
        // If we're removing a role, we need to delete all roles and then add back the correct one
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) throw deleteError;

        // If user should have a member role, add it back
        if (checkType === 'Inconsistent Member Status') {
          response = await supabase.from('user_roles')
            .insert({ user_id: userId, role: 'member' });
        }
      } else {
        // For adding roles, use the specific role type
        response = await supabase.from('user_roles')
          .insert({ user_id: userId, role: fixType });
      }

      const { error } = response || {};
      if (error) throw error;

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

      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'user_roles')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (auditError) {
        console.error("Audit log fetch error:", auditError);
      }

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
    userData,
    isLoadingUsers,
    roleValidation,
    isLoadingValidation,
    refetch
  };
};
