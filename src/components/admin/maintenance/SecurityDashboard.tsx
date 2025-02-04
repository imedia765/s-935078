import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Shield, AlertTriangle, Lock, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { SecurityMetrics } from "@/types/maintenance";

export function SecurityDashboard() {
  const { data: security } = useQuery({
    queryKey: ["securityMetrics"],
    queryFn: async () => {
      const { data: rpcData, error } = await supabase.rpc('get_security_metrics');
      if (error) throw error;
      return rpcData as SecurityMetrics;
    }
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4" />
            <h4 className="font-medium">Failed Logins (24h)</h4>
          </div>
          <p className="text-2xl font-bold">{security?.failed_logins || 0}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <h4 className="font-medium">Security Alerts</h4>
          </div>
          <p className="text-2xl font-bold">{security?.security_alerts || 0}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4" />
            <h4 className="font-medium">SSL Certificate</h4>
          </div>
          <p className="text-sm text-muted-foreground">Expires: {security?.ssl_expiry || "Unknown"}</p>
          <Progress 
            value={security?.ssl_days_remaining ? (security.ssl_days_remaining / 90) * 100 : 0} 
            className="mt-2"
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4" />
            <h4 className="font-medium">Active Sessions</h4>
          </div>
          <p className="text-2xl font-bold">{security?.active_sessions || 0}</p>
        </Card>
      </div>

      {security?.vulnerabilities && security.vulnerabilities.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-2">Security Vulnerabilities</h4>
          <ul className="space-y-2">
            {security.vulnerabilities.map((vuln: any, index: number) => (
              <li key={index} className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>{vuln.description}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
