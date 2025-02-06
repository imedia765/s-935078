
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
      
      console.log("Searching members with term:", searchTerm);
      
      // First get members with their related data using explicit foreign key references
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          id,
          auth_user_id,
          full_name,
          email,
          phone,
          member_number,
          status,
          date_of_birth,
          address,
          membership_type,
          payment_date,
          failed_login_attempts,
          member_notes:member_notes (
            id,
            note_text,
            note_type
          ),
          payment_requests:payment_requests_member_id_fkey (
            id,
            status,
            amount,
            payment_type
          ),
          family_members:family_members_parent_id_fkey (
            id,
            full_name,
            relationship,
            date_of_birth
          )
        `)
        .or(`${searchType}.ilike.%${searchTerm}%`)
        .limit(10);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        toast({
          variant: "destructive",
          title: "Error fetching members",
          description: membersError.message
        });
        throw membersError;
      }

      console.log("Found members:", members);

      // Then get roles for each member with auth_user_id using Promise.all for parallel requests
      const membersWithRoles = await Promise.all(
        (members || []).map(async (member) => {
          if (!member.auth_user_id) {
            console.log(`No auth_user_id for member ${member.member_number}`);
            return {
              ...member,
              user_roles: []
            };
          }

          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', member.auth_user_id);

          if (rolesError) {
            console.error(`Error fetching roles for member ${member.member_number}:`, rolesError);
            toast({
              variant: "destructive",
              title: "Error fetching roles",
              description: `Failed to fetch roles for member ${member.member_number}`
            });
            return {
              ...member,
              user_roles: []
            };
          }

          console.log(`Roles for member ${member.member_number}:`, userRoles);

          return {
            ...member,
            user_roles: userRoles || [],
            member_notes: member.member_notes || [],
            payment_requests: member.payment_requests || [],
            family_members: member.family_members || []
          };
        })
      );

      return membersWithRoles as MemberWithRelations[];
    },
    enabled: searchTerm.length > 2,
    meta: {
      onError: (error: Error) => {
        console.error("Query error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch member data. Please try again."
        });
      }
    }
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
