import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { PerformanceMetrics as PerformanceMetricsType } from "@/types/maintenance";

export function PerformanceMetrics() {
  const { data: metrics } = useQuery({
    queryKey: ["performanceMetrics"],
    queryFn: async () => {
      const { data: rpcData, error } = await supabase.rpc('get_performance_metrics');
      if (error) throw error;
      return rpcData as PerformanceMetrics;
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h4 className="font-medium mb-4">Response Times</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics?.response_times || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-4">Query Performance</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics?.query_times || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h4 className="font-medium mb-4">API Performance</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics?.api_performance || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-4">Cache Hit Rates</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={metrics?.cache_hits || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
