
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription } from "@/components/ui/alert";

export function EmailMetrics() {
  const { data: loopsConfig } = useQuery({
    queryKey: ['loopsConfig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loops_integration')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['loops-metrics'],
    queryFn: async () => {
      if (!loopsConfig?.is_active) {
        return [];
      }

      const { data: emailLogs, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return emailLogs;
    },
    enabled: !!loopsConfig?.is_active,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (!loopsConfig?.is_active) {
    return (
      <Alert>
        <AlertDescription>
          Loops integration is not active. Please enable it in the Settings tab to view analytics.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <div>Loading metrics...</div>;
  }

  const calculateMetrics = () => {
    if (!metrics?.length) return null;

    const total = metrics.length;
    const sent = metrics.filter(m => m.status === 'sent').length;
    const failed = metrics.filter(m => m.status === 'failed').length;
    const pending = metrics.filter(m => m.status === 'pending').length;

    return {
      successRate: (sent / total) * 100,
      failureRate: (failed / total) * 100,
      pendingRate: (pending / total) * 100
    };
  };

  const stats = calculateMetrics();

  if (!stats) {
    return <div>No email metrics available</div>;
  }

  const chartData = metrics
    ?.map((m: any) => ({
      time: new Date(m.created_at).toLocaleTimeString(),
      successRate: stats.successRate,
      failureRate: stats.failureRate
    }))
    .reverse();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium">Success Rate</h3>
          <p className={`text-2xl font-bold ${stats.successRate >= 95 ? 'text-green-500' : 'text-yellow-500'}`}>
            {stats.successRate.toFixed(1)}%
          </p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium">Failure Rate</h3>
          <p className={`text-2xl font-bold ${stats.failureRate <= 5 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.failureRate.toFixed(1)}%
          </p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium">Pending Rate</h3>
          <p className={`text-2xl font-bold ${stats.pendingRate <= 10 ? 'text-green-500' : 'text-yellow-500'}`}>
            {stats.pendingRate.toFixed(1)}%
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
              <Line type="monotone" dataKey="successRate" stroke="#10b981" name="Success Rate (%)" />
              <Line type="monotone" dataKey="failureRate" stroke="#ef4444" name="Failure Rate (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
