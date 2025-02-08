
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export function QueryAnalysis() {
  const { data: queryLogs, isLoading } = useQuery({
    queryKey: ["queryPerformance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('query_performance_logs')
        .select('*')
        .order('execution_time', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
    gcTime: 1000 * 60 * 5 // Cache for 5 minutes (formerly cacheTime)
  });

  if (isLoading) {
    return <div>Loading query performance data...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Slow Queries</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Query</TableHead>
              <TableHead>Execution Time (ms)</TableHead>
              <TableHead>Rows Affected</TableHead>
              <TableHead>Recorded At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queryLogs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">
                  {log.query_text}
                </TableCell>
                <TableCell>{log.execution_time.toFixed(2)}</TableCell>
                <TableCell>{log.rows_affected}</TableCell>
                <TableCell>
                  {new Date(log.recorded_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
