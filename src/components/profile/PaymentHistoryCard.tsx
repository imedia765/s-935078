
import { Card } from "@/components/ui/card";
import { MemberWithRelations } from "@/types/member";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentHistoryCardProps {
  memberData: MemberWithRelations | null;
}

export function PaymentHistoryCard({ memberData }: PaymentHistoryCardProps) {
  const payments = memberData?.payment_requests || [];

  const downloadReceipt = (paymentId: string) => {
    // TODO: Implement receipt download
    console.log("Downloading receipt for payment:", paymentId);
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary">Payment History</h2>
      </div>
      {payments.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No payment history available</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.id}</TableCell>
                <TableCell className="capitalize">{payment.payment_type}</TableCell>
                <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    payment.status === 'approved' 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {payment.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadReceipt(payment.id)}
                    className="h-8 w-8"
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
