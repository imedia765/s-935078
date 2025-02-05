import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Download, 
  History, 
  Filter, 
  Search, 
  Clock, 
  Database, 
  User, 
  Shield,
  Calendar,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV } from "@/utils/exportUtils";
import { AuditAnalytics } from "./AuditAnalytics";
import { useToast } from "@/hooks/use-toast";

interface AuditActivity {
  hour_bucket: string;
  operation: string;
  count: number;
  severity: string;
  table_name: string;
  user_id: string;
}

interface AuditLogFilters {
  operation: string;
  timeRange: string;
  severity: string;
  tableFilter: string;
  searchTerm: string;
  dateRange: {
    start: string;
    end: string;
  };
  retentionPeriod: string;
}

export function AuditLogViewer() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AuditLogFilters>({
    operation: "all",
    timeRange: "24h",
    severity: "all",
    tableFilter: "all",
    searchTerm: "",
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    retentionPeriod: "30days"
  });

  const { data: auditActivity, isLoading } = useQuery({
    queryKey: ["auditActivity", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_activity_summary');
      if (error) {
        toast({
          title: "Error fetching audit logs",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      return data as AuditActivity[];
    }
  });

  const handleExport = () => {
    if (!auditActivity) return;
    
    const exportData = auditActivity.map(log => ({
      Timestamp: new Date(log.hour_bucket).toLocaleString(),
      Operation: log.operation,
      'Table Name': log.table_name,
      Severity: log.severity || 'N/A',
      Count: log.count,
      'User ID': log.user_id || 'N/A'
    }));

    exportToCSV(exportData, `audit_logs_${new Date().toISOString()}`);
    
    toast({
      title: "Export successful",
      description: "Audit logs have been exported to CSV",
    });
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

  const getSeverityColor = (severity: string | undefined) => {
    if (!severity) return "text-gray-500";
    
    switch (severity.toLowerCase()) {
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const filteredLogs = auditActivity?.filter(log => {
    if (filters.operation !== "all" && log.operation !== filters.operation) return false;
    if (filters.severity !== "all" && log.severity !== filters.severity) return false;
    if (filters.tableFilter !== "all" && log.table_name !== filters.tableFilter) return false;
    
    const logDate = new Date(log.hour_bucket);
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    if (logDate < startDate || logDate > endDate) return false;
    
    return true;
  });

  return (
    <div className="space-y-4">
      <AuditAnalytics />
      
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
            <SelectTrigger className="w-[140px]">
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
            value={filters.severity}
            onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.retentionPeriod}
            onValueChange={(value) => setFilters(prev => ({ ...prev, retentionPeriod: value }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Retention" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="90days">90 Days</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              className="w-[140px]"
            />
            <span>to</span>
            <Input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              className="w-[140px]"
            />
          </div>
          <Button onClick={handleExport} className="whitespace-nowrap">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Timestamp</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading audit logs...</TableCell>
                </TableRow>
              ) : filteredLogs?.map((activity, index) => (
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
                  <TableCell>{activity.table_name}</TableCell>
                  <TableCell>
                    <span className={getSeverityColor(activity.severity)}>
                      {activity.severity}
                    </span>
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