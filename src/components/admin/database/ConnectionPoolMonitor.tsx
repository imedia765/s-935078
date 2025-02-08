
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Database, AlertTriangle } from "lucide-react";

export function ConnectionPoolMonitor() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["connectionPool"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_database_health');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return <div>Loading connection pool metrics...</div>;
  }

  const activeConnections = metrics?.find(m => m.metric_name === 'active_connections');
  const poolUtilization = activeConnections?.details?.percent_used || 0;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <h3 className="text-lg font-medium">Connection Pool Status</h3>
          </div>
          {poolUtilization > 80 && (
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">High utilization</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Pool Utilization</span>
              <span className="text-sm font-medium">{poolUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={poolUtilization} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/40">
              <div className="text-sm text-muted-foreground">Active Connections</div>
              <div className="text-2xl font-bold">{activeConnections?.current_value || 0}</div>
            </div>
            <div className="p-4 rounded-lg bg-background/40">
              <div className="text-sm text-muted-foreground">Max Connections</div>
              <div className="text-2xl font-bold">{activeConnections?.details?.max_connections || 0}</div>
            </div>
            <div className="p-4 rounded-lg bg-background/40">
              <div className="text-sm text-muted-foreground">Available</div>
              <div className="text-2xl font-bold">
                {(activeConnections?.details?.max_connections || 0) - (activeConnections?.current_value || 0)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-medium mb-4">Connection History</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={metrics?.filter(m => m.metric_name === 'connection_history')?.[0]?.details?.history || []}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="connections" 
                stroke="#8884d8" 
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
