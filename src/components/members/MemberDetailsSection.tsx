import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AssignCollectorForm from "../collectors/AssignCollectorForm";
import MembershipInfo from "./MembershipInfo";
import RoleSelector from "./RoleSelector";
import { Member } from "@/types/member";

type AppRole = 'admin' | 'collector' | 'member';

interface MemberDetailsSectionProps {
  member: Member;
  userRole: string | null;
}

const MemberDetailsSection = ({ member, userRole }: MemberDetailsSectionProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCollectorForm, setShowCollectorForm] = useState(false);

  useEffect(() => {
    const fetchCurrentRole = async () => {
      if (!member.auth_user_id) {
        console.log('No auth_user_id provided for member:', member);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching role for user:', member.auth_user_id);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', member.auth_user_id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching role:', error);
          setError(`Failed to fetch role: ${error.message}`);
          setIsLoading(false);
          return;
        }

        console.log('Current role data:', data);
        if (data) {
          setCurrentRole(data.role as AppRole);
          console.log('Role set to:', data.role);
        } else {
          console.log('No role found for user, defaulting to member');
          setCurrentRole('member');
        }
      } catch (error) {
        console.error('Error in fetchCurrentRole:', error);
        setError('An unexpected error occurred while fetching the role');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentRole();
  }, [member.auth_user_id]);

  const handleRoleChange = async (newRole: AppRole) => {
    if (!member.auth_user_id) {
      console.error('No user ID provided');
      setError("User ID is required to update role");
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      console.log('Updating role for user:', member.auth_user_id, 'to:', newRole);
      
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', member.auth_user_id);

      if (deleteError) {
        console.error('Error deleting existing role:', deleteError);
        throw deleteError;
      }

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: member.auth_user_id,
          role: newRole
        });

      if (insertError) {
        console.error('Error inserting new role:', insertError);
        throw insertError;
      }

      console.log('Role successfully updated to:', newRole);
      setCurrentRole(newRole);
      
      if (newRole === 'collector') {
        setShowCollectorForm(true);
      }

      toast({
        title: "Success",
        description: `Role successfully updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      setError(error instanceof Error ? error.message : "Failed to update role");
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      {userRole === 'admin' && member.auth_user_id ? (
        <>
          <MembershipInfo member={member} currentRole={currentRole} />
          <div className="mt-4">
            <RoleSelector
              currentRole={currentRole}
              isUpdating={isUpdating}
              error={error}
              onRoleChange={handleRoleChange}
            />
          </div>
          {showCollectorForm && (
            <div className="mt-4">
              <AssignCollectorForm 
                memberId={member.id} 
                onSuccess={() => setShowCollectorForm(false)}
              />
            </div>
          )}
        </>
      ) : (
        <MembershipInfo member={member} currentRole={currentRole} />
      )}
    </div>
  );
};

export default MemberDetailsSection;