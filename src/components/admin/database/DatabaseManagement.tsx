
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthMonitoring } from "./HealthMonitoring";
import { QueryAnalysis } from "./QueryAnalysis";
import { BackupScheduler } from "./BackupScheduler";
import { DataIntegrity } from "./DataIntegrity";
import { StorageOptimizer } from "./StorageOptimizer";
import { ConnectionPoolMonitor } from "./ConnectionPoolMonitor";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Search, Shield, Database, HardDrive, Server, BarChart3 } from "lucide-react";

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
    refetchInterval: 30000
  });

  return (
    <div className="space-y-6">
      <Card className="p-4 lg:p-6">
        <h2 className="text-2xl font-bold mb-6">Database Management</h2>
        
        <Tabs defaultValue="health">
          <TabsList className="w-full flex flex-col sm:flex-row gap-2 sm:gap-0 bg-transparent sm:bg-black/40 sm:backdrop-blur-xl border-0 sm:border sm:border-white/10">
            <TabsTrigger 
              value="health" 
              className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
            >
              <Activity className="h-4 w-4" />
              <span>Health Monitoring</span>
            </TabsTrigger>
            <TabsTrigger 
              value="performance"
              className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Query Performance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="integrity"
              className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
            >
              <Shield className="h-4 w-4" />
              <span>Data Integrity</span>
            </TabsTrigger>
            <TabsTrigger 
              value="storage"
              className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
            >
              <HardDrive className="h-4 w-4" />
              <span>Storage Optimization</span>
            </TabsTrigger>
            <TabsTrigger 
              value="backups"
              className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
            >
              <Server className="h-4 w-4" />
              <span>Backup Management</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <Card className="p-4 lg:p-6 space-y-6">
              <HealthMonitoring metrics={healthMetrics} />
              <ConnectionPoolMonitor />
            </Card>
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
