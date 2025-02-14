
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
    refetchInterval: 60000,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5
  });

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Loading query performance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 lg:p-6">
        <h3 className="text-lg font-medium mb-4">Slow Queries</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Query</TableHead>
                <TableHead className="whitespace-nowrap">Execution Time (ms)</TableHead>
                <TableHead className="whitespace-nowrap">Rows Affected</TableHead>
                <TableHead className="whitespace-nowrap">Recorded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queryLogs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs break-all">
                    {log.query_text}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{log.execution_time.toFixed(2)}</TableCell>
                  <TableCell className="whitespace-nowrap">{log.rows_affected}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.recorded_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
