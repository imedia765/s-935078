import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthMonitoring } from "./HealthMonitoring";
import { QueryAnalysis } from "./QueryAnalysis";
import { BackupScheduler } from "./BackupScheduler";
import { DataIntegrity } from "./DataIntegrity";
import { StorageOptimizer } from "./StorageOptimizer";
import { supabase } from "@/integrations/supabase/client";

interface HealthMetric {
  metric_name: string;
  current_value: number;
  status: 'healthy' | 'warning' | 'critical';
  details: Record<string, any>;
}

export function DatabaseManagement() {
  const { data: healthMetrics } = useQuery({
    queryKey: ["databaseHealth"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_database_health');
      if (error) throw error;
      return data as HealthMetric[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Database Management</h2>
        
        <Tabs defaultValue="health">
          <TabsList>
            <TabsTrigger value="health">Health Monitoring</TabsTrigger>
            <TabsTrigger value="performance">Query Performance</TabsTrigger>
            <TabsTrigger value="integrity">Data Integrity</TabsTrigger>
            <TabsTrigger value="storage">Storage Optimization</TabsTrigger>
            <TabsTrigger value="backups">Backup Management</TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <HealthMonitoring metrics={healthMetrics} />
          </TabsContent>

          <TabsContent value="performance">
            <QueryAnalysis />
          </TabsContent>

          <TabsContent value="integrity">
            <DataIntegrity />
          </TabsContent>

          <TabsContent value="storage">
            <StorageOptimizer />
          </TabsContent>

          <TabsContent value="backups">
            <BackupScheduler />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}