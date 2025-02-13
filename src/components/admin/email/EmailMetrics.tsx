
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmailMetric } from "@/types/email";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function EmailMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['loops-metrics'],
    queryFn: async () => {
      const { data: loopsConfig } = await supabase
        .from('loops_integration')
        .select('*')
        .limit(1)
        .single();

      if (!loopsConfig?.is_active) {
        return [];
      }

      const { data, error } = await supabase
        .from('email_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EmailMetric[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) return <div>Loading metrics...</div>;

  const successRate = metrics?.find(m => m.metric_name === 'delivery_success_rate')?.metric_value ?? 0;
  const queueSize = metrics?.find(m => m.metric_name === 'queue_size')?.metric_value ?? 0;
  const avgDeliveryTime = metrics?.find(m => m.metric_name === 'average_delivery_time')?.metric_value ?? 0;

  const chartData = metrics?.filter(m => m.metric_name === 'delivery_success_rate')
    .map(m => ({
      time: new Date(m.recorded_at).toLocaleTimeString(),
      value: m.metric_value
    }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium">Delivery Success Rate</h3>
          <p className={`text-2xl font-bold ${successRate >= 95 ? 'text-green-500' : 'text-yellow-500'}`}>
            {successRate.toFixed(1)}%
          </p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium">Current Queue Size</h3>
          <p className={`text-2xl font-bold ${queueSize <= 100 ? 'text-green-500' : 'text-yellow-500'}`}>
            {queueSize}
          </p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium">Avg. Delivery Time</h3>
          <p className={`text-2xl font-bold ${avgDeliveryTime <= 5 ? 'text-green-500' : 'text-yellow-500'}`}>
            {avgDeliveryTime.toFixed(1)}s
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-4">Delivery Success Rate Trend</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#6C5DD3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
