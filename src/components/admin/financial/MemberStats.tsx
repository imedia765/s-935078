import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Users, UserPlus, UsersIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function MemberStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["memberStats"],
    queryFn: async () => {
      console.log('Fetching member stats...');
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          family_members (*)
        `);
      
      if (error) {
        console.error('Error fetching member stats:', error);
        throw error;
      }
      
      console.log('Fetched member stats:', data);
      return data;
    }
  });

  const { data: collectors } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_collectors")
        .select(`
          *,
          members!members_collectors_member_number_fkey (count)
        `);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>Loading statistics...</div>;
  }

  const totalMembers = stats?.length || 0;
  const directMembers = stats?.filter(m => !m.family_member_of)?.length || 0;
  const familyMembers = stats?.filter(m => m.family_member_of)?.length || 0;

  const genderDistribution = {
    men: stats?.filter(m => m.gender === 'male')?.length || 0,
    women: stats?.filter(m => m.gender === 'female')?.length || 0
  };

  const ageGroups = [
    { label: '0-17', count: 0, amount: '£100' },
    { label: '18-29', count: 0, amount: '£285' },
    { label: '30-49', count: 0, amount: '£500' },
    { label: '50-69', count: 0, amount: '£150' },
    { label: '70+', count: 0, amount: '£20' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Member Statistics</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="secondary" size="sm">
            <FileDown className="mr-2 h-4 w-4" /> Export All Reports
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 glass-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <h3 className="text-2xl font-bold">{totalMembers}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary">1135% Growth</Badge>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Direct Members</p>
              <h3 className="text-2xl font-bold">{directMembers}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary">1135% Growth</Badge>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Family Members</p>
              <h3 className="text-2xl font-bold">{familyMembers}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="secondary">26% Growth</Badge>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 glass-card">
          <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-500/10 p-4 rounded-lg">
              <p className="text-3xl font-bold text-blue-500">{genderDistribution.men}</p>
              <p className="text-sm text-muted-foreground">Men</p>
              <p className="text-xs text-muted-foreground">£360 yearly</p>
            </div>
            <div className="bg-purple-500/10 p-4 rounded-lg">
              <p className="text-3xl font-bold text-purple-500">{genderDistribution.women}</p>
              <p className="text-sm text-muted-foreground">Women</p>
              <p className="text-xs text-muted-foreground">£880 yearly</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
          <div className="grid grid-cols-5 gap-2">
            {ageGroups.map((group, index) => (
              <div key={index} className="bg-purple-500/10 p-2 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">{group.label}</p>
                <p className="text-lg font-bold text-purple-500">{group.count}</p>
                <p className="text-xs text-muted-foreground">{group.amount}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 glass-card">
        <h3 className="text-lg font-semibold mb-4">Collector Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {collectors?.map((collector) => (
            <div key={collector.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
              <div>
                <p className="font-medium">{collector.name}</p>
                <p className="text-sm text-muted-foreground">Members: {collector.members?.[0]?.count || 0}</p>
              </div>
              <Button variant="ghost" size="icon">
                <FileDown className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}