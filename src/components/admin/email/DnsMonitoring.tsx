
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DnsCheckResult } from "@/types/email";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export function DnsMonitoring() {
  const { data: dnsChecks, isLoading } = useQuery({
    queryKey: ['dns-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dns_check_results')
        .select('*')
        .order('check_timestamp', { ascending: false })
        .limit(4);  // Get latest check for each record type

      if (error) throw error;
      return data as DnsCheckResult[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) return <div>Loading DNS status...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">DNS Records Status</h3>
      
      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Record Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Last Check</TableHead>
              <TableHead>Last Success</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dnsChecks?.map((check) => (
              <TableRow key={check.id}>
                <TableCell className="font-medium">{check.record_type}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {check.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {check.status === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    {check.status === 'error' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="capitalize">{check.status}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {check.value || check.error_message || 'N/A'}
                </TableCell>
                <TableCell>
                  {format(new Date(check.check_timestamp), 'MMM d, yyyy HH:mm:ss')}
                </TableCell>
                <TableCell>
                  {check.last_success_at 
                    ? format(new Date(check.last_success_at), 'MMM d, yyyy HH:mm:ss')
                    : 'Never'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Error Messages */}
      {dnsChecks?.some(check => check.error_message) && (
        <Card className="p-4 border-red-500/50">
          <h4 className="text-sm font-medium mb-2">Error Details</h4>
          <div className="space-y-2">
            {dnsChecks
              .filter(check => check.error_message)
              .map(check => (
                <div key={`${check.id}-error`} className="text-sm text-red-500">
                  <span className="font-medium">{check.record_type}:</span> {check.error_message}
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
