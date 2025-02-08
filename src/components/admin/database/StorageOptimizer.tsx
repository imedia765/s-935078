
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ServerCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StorageMetric {
  table_name: string;
  total_size: number;
  bloat_percentage: number;
  recommendations: {
    needs_vacuum: boolean;
    needs_analyze: boolean;
    large_indexes: boolean;
    suggested_actions: string[];
  };
}

export function StorageOptimizer() {
  const { data: storageMetrics, isLoading } = useQuery({
    queryKey: ["storageMetrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('analyze_storage_metrics');
      if (error) throw error;
      return data as StorageMetric[];
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  if (isLoading) {
    return <div>Loading storage metrics...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ServerCog className="h-5 w-5" />
        <h3 className="text-lg font-medium">Storage Optimization</h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Table Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Bloat %</TableHead>
            <TableHead>Recommendations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {storageMetrics?.map((metric) => (
            <TableRow key={metric.table_name}>
              <TableCell className="font-medium">{metric.table_name}</TableCell>
              <TableCell>{formatBytes(metric.total_size)}</TableCell>
              <TableCell>{metric.bloat_percentage.toFixed(1)}%</TableCell>
              <TableCell>
                <ul className="list-disc list-inside">
                  {metric.recommendations.suggested_actions.map((action, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {action}
                    </li>
                  ))}
                </ul>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
