import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserCheck, UserCog, Mail, Phone, Key, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import debounce from "lodash/debounce";

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
  status: string;
  date_of_birth: string | null;
  address: string | null;
  membership_type: string | null;
  payment_date: string | null;
  family_members: Array<{ full_name: string; relationship: string; date_of_birth: string | null }>;
}

export function MemberSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"full_name" | "member_number">("full_name");
  const { toast } = useToast();

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 500),
    []
  );

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["memberSearch", searchTerm, searchType],
    queryFn: async () => {
      if (!searchTerm) return [];
      
      const { data: members, error } = await supabase
        .from('members')
        .select(`
          *,
          member_notes(note_text, note_type),
          payment_requests!payment_requests_member_id_fkey(status, amount, payment_type),
          family_members(full_name, relationship, date_of_birth)
        `)
        .or(`${searchType}.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

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
          onChange={(e) => setSearchType(e.target.value as "full_name" | "member_number")}
        >
          <option value="full_name">Search by Name</option>
          <option value="member_number">Search by Member ID</option>
        </select>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search by ${searchType === 'full_name' ? 'name' : 'member ID'}...`}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {searchResults && searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((member) => (
            <Card key={member.id} className="p-6 glass-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{member.full_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="w-4 h-4" />
                    <span>{member.email}</span>
                    {member.phone && (
                      <>
                        <Phone className="w-4 h-4 ml-2" />
                        <span>{member.phone}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {member.user_roles?.map((role: any) => (
                    <Badge key={role.role} variant="secondary">
                      {role.role}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member ID</p>
                  <p>{member.member_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={member.status === 'active' ? 'secondary' : 'outline'}>
                    {member.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p>{member.date_of_birth || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p>{member.address || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Membership Type</p>
                  <p>{member.membership_type || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Payment</p>
                  <p>{member.payment_date || 'No payment recorded'}</p>
                </div>
              </div>

              {member.family_members && member.family_members.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Family Members</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {member.family_members.map((familyMember: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{familyMember.relationship}</Badge>
                        <span>{familyMember.full_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {member.member_notes && member.member_notes.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                  <div className="space-y-2">
                    {member.member_notes.map((note: any, index: number) => (
                      <div key={index} className="text-sm bg-muted p-2 rounded">
                        <Badge variant="outline" className="mb-1">{note.note_type}</Badge>
                        <p>{note.note_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {member.failed_login_attempts > 0 && (
                <div className="mb-4">
                  <Badge variant="destructive" className="mb-2">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {member.failed_login_attempts} failed login attempts
                  </Badge>
                </div>
              )}

              <div className="flex gap-2">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
