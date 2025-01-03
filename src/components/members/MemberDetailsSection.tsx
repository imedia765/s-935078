import { Shield, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AppRole = 'admin' | 'collector' | 'member';

interface MemberDetailsSectionProps {
  member: {
    membership_type?: string;
    collector?: string;
    auth_user_id?: string;
  };
  userRole: string | null;
}

const MemberDetailsSection = ({ member, userRole }: MemberDetailsSectionProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentRole = async () => {
      if (!member.auth_user_id) {
        console.log('No auth_user_id provided for member:', member);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching role for user:', member.auth_user_id);
        const { data: userData, error: userError } = await supabase.auth.getUser();
        console.log('Current auth user:', userData);

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

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (!userId) {
      console.error('No user ID provided');
      setError("User ID is required to update role");
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      console.log('Updating role for user:', userId, 'to:', newRole);
      
      // First, delete existing role if any
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing role:', deleteError);
        throw deleteError;
      }

      // Then insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole
        });

      if (insertError) {
        console.error('Error inserting new role:', insertError);
        throw insertError;
      }

      console.log('Role successfully updated to:', newRole);
      setCurrentRole(newRole);
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
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-dashboard-muted mb-1">Membership Type</p>
          <p className="text-dashboard-text">{member.membership_type || 'Standard'}</p>
        </div>
        <div>
          <p className="text-dashboard-muted mb-1">Collector</p>
          <p className="text-dashboard-text">{member.collector || 'Not assigned'}</p>
        </div>
        <div>
          <p className="text-dashboard-muted mb-1">Role</p>
          {isLoading ? (
            <div className="flex items-center gap-2 text-dashboard-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          ) : userRole === 'admin' && member.auth_user_id ? (
            <div className="space-y-2">
              <Select 
                onValueChange={(value) => handleRoleChange(member.auth_user_id!, value as AppRole)}
                disabled={isUpdating}
                value={currentRole || undefined}
              >
                <SelectTrigger 
                  className={`w-[140px] h-8 ${
                    isUpdating 
                      ? 'bg-dashboard-accent1/5 border-dashboard-accent1/10' 
                      : 'bg-dashboard-accent1/10 border-dashboard-accent1/20'
                  }`}
                >
                  <SelectValue placeholder={isUpdating ? "Updating..." : (currentRole || "Select Role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="collector">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Collector
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Member
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p className="text-dashboard-text">{currentRole || 'Member'}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberDetailsSection;