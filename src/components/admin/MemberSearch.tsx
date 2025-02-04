import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserCheck, UserCog, Mail, Phone, Key, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

type MemberWithRelations = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  member_number: string;
  failed_login_attempts: number | null;
  user_roles: Array<{ role: string }>;
  member_notes: Array<{ note_text: string; note_type: string }>;
  payment_requests: Array<{ status: string | null; amount: number; payment_type: string }>;
}

export function MemberSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"full_name" | "email" | "phone" | "member_number">("full_name");
  const { toast } = useToast();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["memberSearch", searchTerm, searchType],
    queryFn: async () => {
      if (!searchTerm) return [];
      
      const { data: members, error } = await supabase
        .from('members')
        .select(`
          *,
          member_notes(note_text, note_type),
          payment_requests!payment_requests_member_id_fkey(status, amount, payment_type)
        `)
        .or(`${searchType}.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      // Fetch user roles separately since we need to join through auth.users
      const membersWithRoles = await Promise.all((members || []).map(async (member) => {
        if (!member.auth_user_id) return { ...member, user_roles: [] };

        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', member.auth_user_id);

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          return { ...member, user_roles: [] };
        }

        return { ...member, user_roles: roles || [] };
      }));
        
      return membersWithRoles as MemberWithRelations[];
    },
    enabled: searchTerm.length > 2
  });

  const handleResetLoginState = async (memberNumber: string) => {
    try {
      const { data, error } = await supabase.rpc('reset_user_login_state', {
        p_member_number: memberNumber
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "User login state has been reset",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCleanupFailedAttempts = async (memberNumber: string) => {
    try {
      const { error } = await supabase.rpc('cleanup_failed_attempts', {
        p_member_number: memberNumber
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Failed login attempts have been cleaned up",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select 
          className="bg-background border border-input rounded-md px-3 py-2"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as any)}
        >
          <option value="full_name">Name</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="member_number">Member ID</option>
        </select>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search by ${searchType}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading && <div>Searching...</div>}
      
      {searchResults && searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((member) => (
            <div key={member.id} className="flex flex-col p-4 glass-card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{member.full_name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex gap-2">
                  {member.user_roles?.map((role: any) => (
                    <Badge key={role.role} variant="secondary">
                      {role.role}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Member ID:</span> {member.member_number}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Phone:</span> {member.phone || 'N/A'}
                </div>
                {member.failed_login_attempts > 0 && (
                  <div className="col-span-2">
                    <Badge variant="destructive" className="mb-2">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {member.failed_login_attempts} failed login attempts
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => handleResetLoginState(member.member_number)}>
                  <Key className="mr-2 h-4 w-4" />
                  Reset Login
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCleanupFailedAttempts(member.member_number)}>
                  <UserCog className="mr-2 h-4 w-4" />
                  Clear Failed Attempts
                </Button>
                <Button variant="outline" size="sm">
                  <UserCheck className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}