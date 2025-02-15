
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PaymentSectionProps {
  title: string;
  status: string;
  amount: number | null;
  dueDate: string | null;
}

function PaymentSection({ title, status, amount, dueDate }: PaymentSectionProps) {
  return (
    <div className="bg-muted/30 rounded p-2">
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="flex items-center justify-between">
        <span className="text-sm">{status}</span>
        {amount && (
          <span className="text-sm font-medium">
            £{amount.toFixed(2)}
          </span>
        )}
      </div>
      {dueDate && (
        <div className="text-xs text-muted-foreground mt-1">
          Due: {format(new Date(dueDate), 'PP')}
        </div>
      )}
    </div>
  );
}

interface PaymentInfoProps {
  yearlyStatus: string | null;
  yearlyAmount: number | null;
  yearlyDueDate: string | null;
  emergencyStatus: string | null;
  emergencyAmount: number | null;
  emergencyDueDate: string | null;
}

export function PaymentInfo({
  yearlyStatus,
  yearlyAmount,
  yearlyDueDate,
  emergencyStatus,
  emergencyAmount,
  emergencyDueDate,
}: PaymentInfoProps) {
  if (!yearlyStatus && !emergencyStatus) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {yearlyStatus && (
        <PaymentSection
          title="Yearly Payment"
          status={yearlyStatus}
          amount={yearlyAmount}
          dueDate={yearlyDueDate}
        />
      )}
      {emergencyStatus && (
        <PaymentSection
          title="Emergency Collection"
          status={emergencyStatus}
          amount={emergencyAmount}
          dueDate={emergencyDueDate}
        />
      )}
    </div>
  );
}
