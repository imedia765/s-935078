import { Card } from "@/components/ui/card";
import { ChartLine, BarChart3, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsSummary {
  total_logs: number;
  by_severity: { [key: string]: number };
  by_operation: { [key: string]: number };
}

export function AuditAnalytics() {
  const { data: analytics } = useQuery({
    queryKey: ["auditAnalytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('operation, severity')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const summary: AnalyticsSummary = {
        total_logs: data.length,
        by_severity: {},
        by_operation: {}
      };

      data.forEach(log => {
        summary.by_severity[log.severity] = (summary.by_severity[log.severity] || 0) + 1;
        summary.by_operation[log.operation] = (summary.by_operation[log.operation] || 0) + 1;
      });

      return summary;
    }
  });

  if (!analytics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Total Logs</p>
            <h3 className="text-2xl font-bold">{analytics.total_logs}</h3>
          </div>
          <ChartLine className="h-8 w-8 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">By Severity</p>
            <div className="space-y-1">
              {Object.entries(analytics.by_severity).map(([severity, count]) => (
                <div key={severity} className="flex items-center text-sm">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {severity}: {count}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">By Operation</p>
            <div className="space-y-1">
              {Object.entries(analytics.by_operation).map(([operation, count]) => (
                <div key={operation} className="flex items-center text-sm">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {operation}: {count}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}