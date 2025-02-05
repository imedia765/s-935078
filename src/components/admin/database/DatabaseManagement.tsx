import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthMonitoring } from "./HealthMonitoring";
import { QueryAnalysis } from "./QueryAnalysis";
import { BackupScheduler } from "./BackupScheduler";
import { supabase } from "@/integrations/supabase/client";

export function DatabaseManagement() {
  const { data: healthMetrics } = useQuery({
    queryKey: ["databaseHealth"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_database_health');
      if (error) throw error;
      return data;
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
            <TabsTrigger value="backups">Backup Management</TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <HealthMonitoring metrics={healthMetrics} />
          </TabsContent>

          <TabsContent value="performance">
            <QueryAnalysis />
          </TabsContent>

          <TabsContent value="backups">
            <BackupScheduler />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}