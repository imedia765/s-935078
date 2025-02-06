import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SearchBar } from "./SearchBar";
import { MemberCard } from "./MemberCard";
import { DeletedMembersView } from "./DeletedMembersView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberWithRelations } from "../../../types/member";

export function MemberSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"full_name" | "member_number">("full_name");
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
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active Members</TabsTrigger>
        <TabsTrigger value="deleted">Deleted Members</TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        <div className="space-y-4">
          <SearchBar 
            onSearch={(term, type) => {
              setSearchTerm(term);
              setSearchType(type);
            }} 
          />

          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          {searchResults && searchResults.length > 0 && (
            <div className="space-y-4">
              {searchResults.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onResetLoginState={handleResetLoginState}
                  onCleanupFailedAttempts={handleCleanupFailedAttempts}
                />
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="deleted">
        <DeletedMembersView />
      </TabsContent>
    </Tabs>
  );
}