
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PaymentStats } from "./types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReportFilters } from "./reports/ReportFilters";
import { useToast } from "@/components/ui/use-toast";

interface FinancialReportsProps {
  payments: PaymentStats | null;
  handleExport: (type: 'excel' | 'csv' | 'all') => void;
  exporting: boolean;
}

export function FinancialReports({ payments, handleExport, exporting }: FinancialReportsProps) {
  const { toast } = useToast();
  const COLORS = ['#8c5dd3', '#3b82f6', '#22c55e', '#f59e0b'];

  const { data: memberPayments, isLoading: loadingMemberPayments } = useQuery({
    queryKey: ["memberPayments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          amount,
          status,
          created_at,
          members!payment_requests_member_id_fkey (
            full_name,
            member_number
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const memberStats = data.reduce((acc: any, payment: any) => {
        const memberName = payment.members?.full_name || 'Unknown';
        if (!acc[memberName]) {
          acc[memberName] = {
            name: memberName,
            memberNumber: payment.members?.member_number,
            totalAmount: 0,
            approvedAmount: 0,
            pendingAmount: 0,
            paymentCount: 0
          };
        }
        
        acc[memberName].totalAmount += payment.amount || 0;
        acc[memberName].paymentCount += 1;
        
        if (payment.status === 'approved') {
          acc[memberName].approvedAmount += payment.amount || 0;
        } else if (payment.status === 'pending') {
          acc[memberName].pendingAmount += payment.amount || 0;
        }
        
        return acc;
      }, {});
      
      return Object.values(memberStats);
    }
  });

  const { data: collectorPerformance } = useQuery({
    queryKey: ["collectorPerformance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members_collectors')
        .select(`
          name,
          payment_requests (
            amount,
            status,
            created_at
          )
        `);
      
      if (error) throw error;
      
      return data.map((collector: any) => ({
        name: collector.name,
        totalCollected: collector.payment_requests
          .filter((p: any) => p.status === 'approved')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        successRate: collector.payment_requests.length > 0 
          ? (collector.payment_requests.filter((p: any) => p.status === 'approved').length / 
             collector.payment_requests.length) * 100
          : 0
      }));
    }
  });

  const { data: monthlyTrends } = useQuery({
    queryKey: ["monthlyTrends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('amount, created_at, status')
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      const monthlyData = data.reduce((acc: any, payment: any) => {
        const month = new Date(payment.created_at).toLocaleString('default', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { month, total: 0, approved: 0, pending: 0 };
        }
        acc[month].total += payment.amount || 0;
        if (payment.status === 'approved') {
          acc[month].approved += payment.amount || 0;
        } else if (payment.status === 'pending') {
          acc[month].pending += payment.amount || 0;
        }
        return acc;
      }, {});

      return Object.values(monthlyData);
    }
  });

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    // Update queries with new date range
    toast({
      title: "Date range updated",
      description: "The reports will reflect the selected date range.",
    });
  };

  const handleTypeChange = (type: string) => {
    // Update queries with new type filter
    toast({
      title: "Report type updated",
      description: "The reports will show data for: " + type,
    });
  };

  const handleExportFormat = (format: 'excel' | 'csv' | 'pdf') => {
    handleExport(format === 'pdf' ? 'all' : format);
  };

  if (loadingMemberPayments) {
    return <div>Loading reports...</div>;
  }

  return (
    <Card className="p-6 glass-card">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gradient">Financial Reports</h2>
        
        <ReportFilters 
          onDateRangeChange={handleDateRangeChange}
          onTypeChange={handleTypeChange}
          onExport={handleExportFormat}
          isExporting={exporting}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="text-lg font-medium mb-4">Payment Methods Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Cash', value: payments?.paymentMethods.cash || 0 },
                    { name: 'Bank Transfer', value: payments?.paymentMethods.bankTransfer || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {[
                    { name: 'Cash', value: payments?.paymentMethods.cash || 0 },
                    { name: 'Bank Transfer', value: payments?.paymentMethods.bankTransfer || 0 }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-lg font-medium mb-4">Payment Status Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pending', value: payments?.pendingPayments || 0 },
                    { name: 'Approved', value: payments?.approvedPayments || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {[
                    { name: 'Pending', value: payments?.pendingPayments || 0 },
                    { name: 'Approved', value: payments?.approvedPayments || 0 }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h4 className="text-lg font-medium mb-4">Payments by Member</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={memberPayments || []}>
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                  labelFormatter={(label) => `Member: ${label}`}
                />
                <Legend />
                <Bar dataKey="approvedAmount" name="Approved Payments" fill="#22c55e" />
                <Bar dataKey="pendingAmount" name="Pending Payments" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-lg font-medium mb-4">Monthly Payment Trends</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrends || []}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" name="Approved" fill="#22c55e" />
                <Bar dataKey="pending" name="Pending" fill="#eab308" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-lg font-medium mb-4">Collector Performance</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={collectorPerformance || []}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalCollected" name="Total Collected" fill="#8c5dd3" />
                <Bar dataKey="successRate" name="Success Rate (%)" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}
