
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface MetricData {
  date: string;
  total_requests: number;
  successful_resets: number;
  failed_attempts: number;
  verification_rate: number;
}

interface AuditMetadata {
  event_type?: string;
  step?: string;
  error?: string;
  timestamp?: string;
}

export function PasswordResetMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['passwordResetMetrics'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'password_reset')
        .gte('timestamp', thirtyDaysAgo.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Process the data into daily metrics
      const dailyMetrics: Record<string, MetricData> = {};
      
      data.forEach(log => {
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        if (!dailyMetrics[date]) {
          dailyMetrics[date] = {
            date,
            total_requests: 0,
            successful_resets: 0,
            failed_attempts: 0,
            verification_rate: 0
          };
        }

        const metrics = dailyMetrics[date];
        metrics.total_requests++;

        // Cast metadata to our interface type
        const metadata = log.metadata as AuditMetadata;
        
        if (metadata?.event_type === 'reset_success') {
          metrics.successful_resets++;
        } else if (metadata?.event_type === 'reset_failed') {
          metrics.failed_attempts++;
        }

        // Calculate verification rate
        metrics.verification_rate = metrics.successful_resets / metrics.total_requests * 100;
      });

      return Object.values(dailyMetrics);
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Password Reset Metrics</h2>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="success-rate">Success Rate</TabsTrigger>
          <TabsTrigger value="verification">Verification Rate</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="h-[300px] sm:h-[400px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total_requests" 
                stroke="#6C5DD3" 
                name="Total Requests"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="successful_resets" 
                stroke="#10B981" 
                name="Successful Resets"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="failed_attempts" 
                stroke="#EF4444" 
                name="Failed Attempts"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="success-rate" className="h-[300px] sm:h-[400px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="successful_resets" 
                stroke="#10B981" 
                name="Successful Resets"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="verification" className="h-[300px] sm:h-[400px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, "Verification Rate"]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="verification_rate" 
                stroke="#6C5DD3" 
                name="Verification Rate (%)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
