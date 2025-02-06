
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { User, UserRole } from "../types/role-types";

export const useUserRoles = () => {
  const { toast } = useToast();

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

  const { data: userData, isLoading: isLoadingUsers, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log("Fetching users and roles data...");
      
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          id,
          auth_user_id,
          email,
          member_number,
          full_name,
          member_notes (
            note_text,
            note_type
          ),
          payment_requests!payment_requests_member_id_fkey (
            status,
            amount,
            payment_type
          ),
          family_members (
            full_name,
            relationship,
            date_of_birth
          )
        `);

      if (membersError) {
        console.error("Members fetch error:", membersError);
        throw membersError;
      }

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error("User roles fetch error:", rolesError);
        throw rolesError;
      }

      console.log("Fetched members:", members);
      console.log("Fetched user roles:", userRoles);

      const rolesByUser = userRoles.reduce((acc: { [key: string]: { role: UserRole }[] }, role: any) => {
        if (!acc[role.user_id]) {
          acc[role.user_id] = [];
        }
        if (role.role === 'admin' || role.role === 'collector' || role.role === 'member') {
          acc[role.user_id].push({ role: role.role as UserRole });
        }
        return acc;
      }, {});

      const usersWithRoles: User[] = members.map((member: any) => ({
        id: member.auth_user_id,
        email: member.email,
        member_number: member.member_number,
        full_name: member.full_name,
        user_roles: rolesByUser[member.auth_user_id] || []
      }));

      return usersWithRoles;
    }
  });

  return {
    handleRoleChange,
    userData,
    isLoadingUsers,
    refetch
  };
};
