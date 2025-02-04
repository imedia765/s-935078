import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PaymentStats } from "./types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FinancialReportsProps {
  payments: PaymentStats | null;
  handleExport: (type: 'excel' | 'csv' | 'all') => void;
}

export function FinancialReports({ payments, handleExport }: FinancialReportsProps) {
  const COLORS = ['#8c5dd3', '#3b82f6', '#22c55e'];

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

  return (
    <Card className="p-6 glass-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gradient">Financial Reports</h2>
        <Button 
          variant="outline"
          onClick={() => handleExport('all')}
          className="bg-purple-600/20 hover:bg-purple-600/30"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Full Report
        </Button>
      </div>

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
    </Card>
  );
}