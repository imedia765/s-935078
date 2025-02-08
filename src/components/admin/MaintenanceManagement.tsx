import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemResources } from "./maintenance/SystemResources";
import { BackupManagement } from "./maintenance/BackupManagement";
import { ErrorLogViewer } from "./maintenance/ErrorLogViewer";
import { PerformanceMetrics } from "./maintenance/PerformanceMetrics";
import { SecurityDashboard } from "./maintenance/SecurityDashboard";
import { AlertsDashboard } from "./maintenance/AlertsDashboard";
import { MaintenanceHistory } from "@/types/maintenance";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function MaintenanceManagement() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Query maintenance mode status
  const { data: maintenanceMode, refetch: refetchMaintenanceMode } = useQuery({
    queryKey: ["maintenanceMode"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_settings')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: maintenanceHistory } = useQuery({
    queryKey: ["maintenanceHistory"],
    queryFn: async () => {
      const { data: rpcData, error } = await supabase.rpc('get_maintenance_history');
      if (error) throw error;
      return rpcData as MaintenanceHistory[];
    }
  });

  const handleRunMaintenance = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.rpc('perform_system_maintenance');
      if (error) throw error;
      toast({
        title: "Maintenance Complete",
        description: "System maintenance has been completed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleScheduleMaintenance = async () => {
    try {
      const { data, error } = await supabase.rpc('schedule_system_maintenance');
      if (error) throw error;
      toast({
        title: "Maintenance Scheduled",
        description: "Daily maintenance has been scheduled successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleMaintenanceMode = async () => {
    try {
      const { error } = await supabase
        .from('maintenance_settings')
        .update({ 
          is_enabled: !maintenanceMode?.is_enabled,
          enabled_at: !maintenanceMode?.is_enabled ? new Date().toISOString() : null,
          enabled_by: !maintenanceMode?.is_enabled ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', maintenanceMode?.id);

      if (error) throw error;

      toast({
        title: !maintenanceMode?.is_enabled ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
        description: !maintenanceMode?.is_enabled 
          ? "Only administrators can access the system now."
          : "System is now accessible to all users.",
      });
      refetchMaintenanceMode();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
        <div className="space-y-0.5">
          <div className="flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-yellow-500" />
            <h3 className="font-medium">Maintenance Mode</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            When enabled, only administrators can access the system
          </p>
        </div>
        <Switch
          checked={maintenanceMode?.is_enabled || false}
          onCheckedChange={handleToggleMaintenanceMode}
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">System Resources</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="logs">Error Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button 
                onClick={handleRunMaintenance} 
                disabled={isRunning}
              >
                {isRunning ? "Running Maintenance..." : "Run Maintenance Now"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleScheduleMaintenance}
              >
                Schedule Daily Maintenance
              </Button>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Maintenance History</h3>
              {isLoadingHistory ? (
                <p>Loading maintenance history...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Execution Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceHistory?.map((record: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(record.execution_time).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                            record.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {record.duration_seconds?.toFixed(2)}s
                          </span>
                        </TableCell>
                        <TableCell>
                          <pre className="text-sm whitespace-pre-wrap max-h-40 overflow-auto">
                            {JSON.stringify(record.details, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <SystemResources />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsDashboard />
        </TabsContent>

        <TabsContent value="backups">
          <BackupManagement />
        </TabsContent>

        <TabsContent value="logs">
          <ErrorLogViewer />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMetrics />
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
