import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Members() {
  const [selectedCollector, setSelectedCollector] = useState<string>('all');

  // Query collectors for the filter dropdown
  const { data: collectors, isLoading: loadingCollectors } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_collectors")
        .select("*")
        .eq("active", true);
      if (error) throw error;
      return data;
    }
  });

  // Query members with collector information
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["members", selectedCollector],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select(`
          *,
          members_collectors!members_collectors_member_number_fkey (
            name,
            number,
            active
          )
        `);

      if (selectedCollector !== 'all') {
        query = query.eq('collector_id', selectedCollector);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  if (loadingCollectors || loadingMembers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Members List</h1>
        <Select
          value={selectedCollector}
          onValueChange={(value) => setSelectedCollector(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by collector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collectors</SelectItem>
            {collectors?.map((collector) => (
              <SelectItem key={collector.id} value={collector.id}>
                {collector.name || `Collector ${collector.number}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member Number</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Collector</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.member_number}</TableCell>
                <TableCell>{member.full_name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.phone || 'N/A'}</TableCell>
                <TableCell>
                  {member.members_collectors?.name || 'No Collector'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    member.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.status || 'Unknown'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}