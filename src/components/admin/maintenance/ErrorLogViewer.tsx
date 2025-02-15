
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ErrorLog } from "@/types/maintenance";
import type { Database } from "@/types/supabase";

export function ErrorLogViewer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severity, setSeverity] = useState("all");

  const { data: logs } = useQuery({
    queryKey: ["errorLogs", severity, searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_error_rates');
      if (error) throw error;
      return (data as Database['public']['Functions']['check_error_rates']['Returns']).map(item => ({
        timestamp: item.recorded_at,
        severity: item.severity,
        message: item.message,
        source: item.source
      })) as ErrorLog[];
    }
  });

  const handleExport = async () => {
    if (!logs) return;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,Severity,Message,Source\n" +
      logs.map(row => 
        `${new Date(row.timestamp).toISOString()},${row.severity},${row.message},${row.source}`
      ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "error_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3"
          >
            <option value="all">All Severities</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs?.map((log, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded ${
                  log.severity === 'error' ? 'bg-red-100 text-red-800' :
                  log.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {log.severity}
                </span>
              </TableCell>
              <TableCell>{log.message}</TableCell>
              <TableCell>{log.source}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
