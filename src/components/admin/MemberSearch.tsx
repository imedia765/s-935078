import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function MemberSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"full_name" | "email" | "phone" | "member_number">("full_name");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["memberSearch", searchTerm, searchType],
    queryFn: async () => {
      if (!searchTerm) return [];
      
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .or(`${searchType}.ilike.%${searchTerm}%`)
        .limit(10);
        
      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length > 2
  });

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
            <div key={member.id} className="flex items-center justify-between p-3 glass-card">
              <div>
                <p className="font-medium">{member.full_name}</p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
              <Button variant="outline" size="sm">
                <UserCheck className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}