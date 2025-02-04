
import { Card } from "@/components/ui/card";
import { Receipt, PoundSterling, Clock, CheckCircle } from "lucide-react";
import { PaymentStats } from "./types";

interface FinancialOverviewProps {
  payments: PaymentStats | null;
}

export function FinancialOverview({ payments }: FinancialOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 glass-card">
          <div className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Total Payments</h3>
          </div>
          <p className="text-3xl font-bold text-primary mt-2">
            {payments?.totalPayments || 0}
          </p>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center space-x-2">
            <PoundSterling className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Total Amount</h3>
          </div>
          <p className="text-3xl font-bold text-green-500 mt-2">
            £{payments?.totalAmount.toFixed(2) || '0.00'}
          </p>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Pending Payments</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-500 mt-2">
            {payments?.pendingPayments || 0}
          </p>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Approved Payments</h3>
          </div>
          <p className="text-3xl font-bold text-blue-500 mt-2">
            {payments?.approvedPayments || 0}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 glass-card">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Cash</span>
              <span>{payments?.paymentMethods.cash || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Bank Transfer</span>
              <span>{payments?.paymentMethods.bankTransfer || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
          <div className="space-y-2">
            {payments?.recentPayments.map((payment, index) => (
              <div key={index} className="flex justify-between">
                <span>{payment.members?.full_name}</span>
                <span>£{payment.amount}</span>
              </div>
            )) || <p>No recent payments</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
