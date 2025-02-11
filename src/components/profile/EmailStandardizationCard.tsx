
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type StandardizationStatus = {
  total_members: number;
  standardized_count: number;
  legacy_count: number;
  personal_email_count: number;
  failed_migrations_count: number;
  last_migration_timestamp: string | null;
  recent_failures: Array<{
    member_number: string;
    error: string;
    attempted_at: string;
  }>;
};

export function EmailStandardizationCard() {
  const { data: standardizationStatus, isLoading } = useQuery({
    queryKey: ["emailStandardization"],
    queryFn: async () => {
      type RPCReturnType = StandardizationStatus;
      const { data, error } = await supabase.rpc('get_email_standardization_status');
      if (error) throw error;
      return data as RPCReturnType;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  if (!standardizationStatus) return null;

  const standardizedPercentage = standardizationStatus.standardized_count && standardizationStatus.total_members 
    ? (standardizationStatus.standardized_count / standardizationStatus.total_members) * 100
    : 0;

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Email Format Status</h3>
        <span className="text-sm text-muted-foreground">
          {standardizedPercentage.toFixed(1)}% Complete
        </span>
      </div>

      <Progress value={standardizedPercentage} className="h-2" />

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Standardized</p>
          <p className="font-medium">{standardizationStatus.standardized_count?.toLocaleString() ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Legacy Format</p>
          <p className="font-medium">{standardizationStatus.legacy_count?.toLocaleString() ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Personal Emails</p>
          <p className="font-medium">{standardizationStatus.personal_email_count?.toLocaleString() ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Failed Migrations</p>
          <p className="font-medium">{standardizationStatus.failed_migrations_count?.toLocaleString() ?? 0}</p>
        </div>
      </div>

      {standardizationStatus.recent_failures && standardizationStatus.recent_failures.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Recent Issues</h4>
          <div className="space-y-2">
            {standardizationStatus.recent_failures.map((failure, index) => (
              <div key={index} className="text-sm text-red-500">
                {failure.member_number}: {failure.error}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
