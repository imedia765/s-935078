
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { EmailDeliveryMetric } from "@/types/email";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export function EmailMetrics() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['emailMetrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_events')
        .select(`
          id,
          event_type,
          occurred_at,
          metadata
        `)
        .order('occurred_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Process metrics
      const processedData = data.reduce((acc: any[], event) => {
        const date = new Date(event.occurred_at).toLocaleDateString();
        const existing = acc.find(item => item.date === date);

        if (existing) {
          existing[event.event_type] = (existing[event.event_type] || 0) + 1;
          existing.total = (existing.total || 0) + 1;
        } else {
          acc.push({
            date,
            [event.event_type]: 1,
            total: 1
          });
        }

        return acc;
      }, []);

      return processedData;
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load email metrics: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Email Delivery Metrics</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={metrics}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="delivered" 
                stroke="#4ade80" 
                name="Delivered"
              />
              <Line 
                type="monotone" 
                dataKey="opened" 
                stroke="#60a5fa" 
                name="Opened"
              />
              <Line 
                type="monotone" 
                dataKey="clicked" 
                stroke="#f472b6" 
                name="Clicked"
              />
              <Line 
                type="monotone" 
                dataKey="failed" 
                stroke="#ef4444" 
                name="Failed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics && metrics.length > 0 && (
          <>
            <MetricCard
              title="Delivery Rate"
              value={calculateRate(metrics, 'delivered')}
              color="text-green-500"
            />
            <MetricCard
              title="Open Rate"
              value={calculateRate(metrics, 'opened')}
              color="text-blue-500"
            />
            <MetricCard
              title="Click Rate"
              value={calculateRate(metrics, 'clicked')}
              color="text-pink-500"
            />
            <MetricCard
              title="Failure Rate"
              value={calculateRate(metrics, 'failed')}
              color="text-red-500"
            />
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <Card className="p-4">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

function calculateRate(metrics: any[], type: string): string {
  if (!metrics || metrics.length === 0) return "0%";

  const lastMetric = metrics[metrics.length - 1];
  const total = lastMetric.total || 0;
  const typeCount = lastMetric[type] || 0;

  if (total === 0) return "0%";
  return `${Math.round((typeCount / total) * 100)}%`;
}
