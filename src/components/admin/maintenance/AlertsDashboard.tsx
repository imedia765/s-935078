
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AlertConfig {
  id: string;
  metric_name: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
}

interface ActiveAlert {
  id: string;
  metric_name: string;
  current_value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  triggered_at: string;
  resolved_at: string | null;
  details: {
    message: string;
    timestamp: string;
  };
}

export function AlertsDashboard() {
  const { toast } = useToast();

  const { data: alertConfigs, refetch: refetchConfigs } = useQuery({
    queryKey: ["alertConfigs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monitoring_alert_configs')
        .select('*')
        .order('severity', { ascending: false });
      
      if (error) throw error;
      return data as AlertConfig[];
    }
  });

  const { data: activeAlerts } = useQuery({
    queryKey: ["activeAlerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_alerts')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as ActiveAlert[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleToggleConfig = async (configId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('monitoring_alert_configs')
        .update({ enabled })
        .eq('id', configId);

      if (error) throw error;

      toast({
        title: "Alert configuration updated",
        description: `Alert has been ${enabled ? 'enabled' : 'disabled'}.`,
      });

      refetchConfigs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Alert Configurations */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5" />
            <h3 className="font-medium">Alert Configurations</h3>
          </div>
          <div className="space-y-4">
            {alertConfigs?.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">{config.metric_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Threshold: {config.threshold}%
                  </p>
                  <Badge className={getSeverityColor(config.severity)}>
                    {config.severity}
                  </Badge>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => handleToggleConfig(config.id, checked)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Active Alerts */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5" />
            <h3 className="font-medium">Active Alerts</h3>
          </div>
          <div className="space-y-4">
            {activeAlerts?.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3 rounded border ${
                  alert.resolved_at ? 'bg-gray-50' : getSeverityColor(alert.severity)
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{alert.metric_name}</span>
                  {alert.resolved_at && (
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Resolved
                    </Badge>
                  )}
                </div>
                <p className="text-sm mt-1">{alert.details.message}</p>
                <div className="text-xs mt-2 text-gray-600">
                  {alert.resolved_at ? (
                    `Resolved at ${new Date(alert.resolved_at).toLocaleString()}`
                  ) : (
                    `Triggered at ${new Date(alert.triggered_at).toLocaleString()}`
                  )}
                </div>
              </div>
            ))}
            {(!activeAlerts || activeAlerts.length === 0) && (
              <p className="text-muted-foreground text-center py-4">
                No active alerts
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
