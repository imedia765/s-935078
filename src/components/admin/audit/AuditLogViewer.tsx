import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, History, Filter, Search, Clock, Database, User, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuditActivity {
  hour_bucket: string;
  operation: string;
  count: number;
}

interface AuditLogFilters {
  operation: string;
  timeRange: string;
  searchTerm: string;
}

export function AuditLogViewer() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    operation: "all",
    timeRange: "24h",
    searchTerm: "",
  });

  const { data: auditActivity, isLoading } = useQuery({
    queryKey: ["auditActivity", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_activity_summary');
      if (error) throw error;
      return data as AuditActivity[];
    }
  });

  const handleExport = () => {
    if (!auditActivity) return;
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Time,Operation,Count\n" +
      auditActivity.map(row => 
        `${row.hour_bucket},${row.operation},${row.count}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
  };

  const getOperationIcon = (operation: string) => {
    switch (operation.toLowerCase()) {
      case "create":
        return <Database className="h-4 w-4" />;
      case "update":
        return <History className="h-4 w-4" />;
      case "delete":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-8"
            />
          </div>
          <Select
            value={filters.operation}
            onValueChange={(value) => setFilters(prev => ({ ...prev, operation: value }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Operation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operations</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.timeRange}
            onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport} className="whitespace-nowrap">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card className="p-4">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Timestamp</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading audit logs...</TableCell>
                </TableRow>
              ) : auditActivity?.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDateTime(activity.hour_bucket)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getOperationIcon(activity.operation)}
                      <span className="capitalize">{activity.operation.toLowerCase()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{activity.count}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
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