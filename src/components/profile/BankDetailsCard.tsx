
import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface BankDetailsCardProps {
  memberNumber?: string;
}

export function BankDetailsCard({ memberNumber }: BankDetailsCardProps) {
  return (
    <Card className="glass-card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Building2 className="text-primary" />
        <h2 className="text-xl font-semibold text-primary">Bank Details</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Bank Name</p>
          <p className="text-foreground font-medium">HSBC Bank</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Account Name</p>
          <p className="text-foreground font-medium">Pakistan Welfare Association</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Sort Code</p>
          <p className="text-foreground font-mono">40-15-34</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Account Number</p>
          <p className="text-foreground font-mono">41024892</p>
        </div>
      </div>
      <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          <strong>IMPORTANT:</strong> You must use your member number ({memberNumber}) as the payment reference when making a bank transfer to ensure your payment is properly recorded.
        </p>
      </div>
    </Card>
  );
}
