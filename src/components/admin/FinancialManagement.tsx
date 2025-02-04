import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, FileDown, Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { exportToCSV, generatePDF } from "@/utils/exportUtils";
import { useToast } from "@/components/ui/use-toast";

export function FinancialManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch member statistics
  const { data: memberStats, isLoading: loadingStats } = useQuery({
    queryKey: ["memberStats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          gender,
          date_of_birth,
          membership_type,
          payment_amount,
          payment_date,
          yearly_payment_amount,
          yearly_payment_status,
          members_collectors (
            name,
            number
          )
        `);
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate statistics
  const stats = memberStats ? {
    totalMembers: memberStats.length,
    directMembers: memberStats.filter(m => !m.members_collectors).length,
    familyMembers: memberStats.filter(m => m.membership_type === 'family').length,
    genderDistribution: {
      men: memberStats.filter(m => m.gender === 'male').length,
      women: memberStats.filter(m => m.gender === 'female').length
    },
    ageDistribution: memberStats.reduce((acc: any, member) => {
      if (!member.date_of_birth) return acc;
      const age = new Date().getFullYear() - new Date(member.date_of_birth).getFullYear();
      if (age <= 17) acc['0-17']++;
      else if (age <= 29) acc['18-29']++;
      else if (age <= 49) acc['30-49']++;
      else if (age <= 69) acc['50-69']++;
      else acc['70+']++;
      return acc;
    }, { '0-17': 0, '18-29': 0, '30-49': 0, '50-69': 0, '70+': 0 })
  } : null;

  const handleExport = (type: 'excel' | 'csv' | 'all') => {
    if (!memberStats) return;
    
    try {
      if (type === 'csv' || type === 'all') {
        exportToCSV(memberStats, 'member_statistics');
      }
      if (type === 'excel' || type === 'all') {
        generatePDF(memberStats, 'Member Statistics Report');
      }
      
      toast({
        title: "Export successful",
        description: `Data exported as ${type === 'all' ? 'CSV and PDF' : type.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the data.",
      });
    }
  };

  const COLORS = ['#8c5dd3', '#3b82f6', '#22c55e'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gradient">Financial Management</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('excel')}
            className="bg-emerald-600/20 hover:bg-emerald-600/30"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExport('csv')}
            className="bg-blue-600/20 hover:bg-blue-600/30"
          >
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExport('all')}
            className="bg-purple-600/20 hover:bg-purple-600/30"
          >
            <Download className="mr-2 h-4 w-4" />
            Export All Reports
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-black/40 backdrop-blur-xl border border-white/10">
          <TabsTrigger value="overview">Payment Overview</TabsTrigger>
          <TabsTrigger value="collectors">Collectors Overview</TabsTrigger>
          <TabsTrigger value="all-payments">All Payments</TabsTrigger>
          <TabsTrigger value="stats">Member Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-2">Total Members</h3>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{stats?.totalMembers || 0}</span>
                <ResponsiveContainer width={60} height={60}>
                  <PieChart>
                    <Pie
                      data={[{ value: stats?.totalMembers || 0 }]}
                      innerRadius={20}
                      outerRadius={25}
                      fill="#8c5dd3"
                      dataKey="value"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-2">Direct Members</h3>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{stats?.directMembers || 0}</span>
                <ResponsiveContainer width={60} height={60}>
                  <PieChart>
                    <Pie
                      data={[{ value: stats?.directMembers || 0 }]}
                      innerRadius={20}
                      outerRadius={25}
                      fill="#3b82f6"
                      dataKey="value"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-2">Family Members</h3>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{stats?.familyMembers || 0}</span>
                <ResponsiveContainer width={60} height={60}>
                  <PieChart>
                    <Pie
                      data={[{ value: stats?.familyMembers || 0 }]}
                      innerRadius={20}
                      outerRadius={25}
                      fill="#22c55e"
                      dataKey="value"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-4">Gender Distribution</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p>Men: {stats?.genderDistribution.men || 0}</p>
                  <p>Women: {stats?.genderDistribution.women || 0}</p>
                </div>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Men', value: stats?.genderDistribution.men || 0 },
                        { name: 'Women', value: stats?.genderDistribution.women || 0 }
                      ]}
                      innerRadius={35}
                      outerRadius={50}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-4">Age Distribution</h3>
              <div className="grid grid-cols-5 gap-2 text-center">
                {stats && Object.entries(stats.ageDistribution).map(([range, count]) => (
                  <div key={range} className="bg-primary/10 rounded p-2">
                    <div className="text-sm text-muted-foreground">{range}</div>
                    <div className="font-bold">{String(count)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collectors">
          <Card className="p-4 glass-card">
            <h3 className="font-semibold mb-4">Collector Reports Coming Soon</h3>
          </Card>
        </TabsContent>

        <TabsContent value="all-payments">
          <Card className="p-4 glass-card">
            <h3 className="font-semibold mb-4">All Payments View Coming Soon</h3>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card className="p-4 glass-card">
            <h3 className="font-semibold mb-4">Detailed Member Stats Coming Soon</h3>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
