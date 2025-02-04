
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PaymentStats } from "./types";

interface FinancialReportsProps {
  payments: PaymentStats | null;
  handleExport: (type: 'excel' | 'csv' | 'all') => void;
}

export function FinancialReports({ payments, handleExport }: FinancialReportsProps) {
  const COLORS = ['#8c5dd3', '#3b82f6', '#22c55e'];

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              >
                {[
                  { name: 'Cash', value: payments?.paymentMethods.cash || 0 },
                  { name: 'Bank Transfer', value: payments?.paymentMethods.bankTransfer || 0 }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
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
              >
                {[
                  { name: 'Pending', value: payments?.pendingPayments || 0 },
                  { name: 'Approved', value: payments?.approvedPayments || 0 }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
