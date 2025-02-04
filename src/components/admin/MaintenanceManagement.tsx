import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

  // Query maintenance history
  const { data: maintenanceHistory, isLoading: isLoadingHistory, refetch } = useQuery({
    queryKey: ["maintenanceHistory"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_maintenance_history', { days: 7 });
      if (error) throw error;
      return data;
    }
  });

  // Run maintenance manually
  const handleRunMaintenance = async () => {
    try {
      setIsRunning(true);
      const { data, error } = await supabase.rpc('perform_system_maintenance');
      if (error) throw error;

      toast({
        title: "Maintenance Complete",
        description: "System maintenance has been completed successfully.",
      });
      refetch();
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

  // Schedule maintenance
  const handleScheduleMaintenance = async () => {
    try {
      const { error } = await supabase.rpc('schedule_system_maintenance', {
        schedule: '0 0 * * *' // Daily at midnight
      });
      if (error) throw error;

      toast({
        title: "Maintenance Scheduled",
        description: "System maintenance has been scheduled for daily execution at midnight.",
      });
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
                      {record.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
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
  );
}