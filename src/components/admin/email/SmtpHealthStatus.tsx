
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SmtpHealthCheck } from "@/types/email";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export function SmtpHealthStatus() {
  const { data: healthChecks, isLoading } = useQuery({
    queryKey: ['smtp-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smtp_health_checks')
        .select(`
          id,
          configuration_id,
          status,
          check_timestamp,
          response_time,
          success_rate,
          quota_remaining,
          error_details,
          created_at,
          smtp_configurations (
            name,
            host
          )
        `)
        .order('check_timestamp', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as (SmtpHealthCheck & { smtp_configurations: { name: string; host: string } })[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) return <div>Loading health status...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">SMTP Health Status</h3>
      <div className="grid grid-cols-1 gap-4">
        {healthChecks?.map((check) => (
          <Card key={check.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{check.smtp_configurations.name}</h4>
                <p className="text-sm text-gray-500">{check.smtp_configurations.host}</p>
              </div>
              <StatusBadge status={check.status} />
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Success Rate</p>
                <p className="text-lg font-medium">{check.success_rate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Response Time</p>
                <p className="text-lg font-medium">{check.response_time}ms</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quota Remaining</p>
                <p className="text-lg font-medium">{check.quota_remaining}</p>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Last checked: {format(new Date(check.check_timestamp), 'MMM d, yyyy HH:mm:ss')}
            </div>

            {Object.keys(check.error_details).length > 0 && (
              <div className="mt-2 text-sm text-red-500">
                Error: {JSON.stringify(check.error_details)}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'failing' }) {
  const config = {
    healthy: { icon: CheckCircle, className: 'bg-green-500/20 text-green-500' },
    degraded: { icon: AlertTriangle, className: 'bg-yellow-500/20 text-yellow-500' },
    failing: { icon: XCircle, className: 'bg-red-500/20 text-red-500' }
  };

  const { icon: Icon, className } = config[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${className}`}>
      <Icon className="h-4 w-4" />
      <span className="capitalize">{status}</span>
    </div>
  );
}

