import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Info, RefreshCw, Shield, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

type CollectorStatus = {
  collector_name: string;
  member_number: string;
  contact_info: {
    email: string | null;
    phone: string | null;
  };
  role_verification: {
    issues: string[];
    total_issues: number;
  };
  auth_status: {
    has_auth_id: boolean;
    status: string;
  };
  sync_status: {
    status: string;
    error: string | null;
  };
  last_sync: string;
  enhanced_role_status: string;
  role_store_status: string;
  permissions: {
    roles: string[];
  };
};

export function CollectorsView() {
  const { data: collectors, isLoading, error } = useQuery({
    queryKey: ["collectors-status"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_collectors_role_status');
      if (error) throw error;
      return data as CollectorStatus[];
    }
  });

  if (isLoading) return <div>Loading collectors...</div>;
  if (error) return <div>Error loading collectors: {(error as Error).message}</div>;

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collector</TableHead>
            <TableHead>Member #</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Role Verification</TableHead>
            <TableHead>Auth Status</TableHead>
            <TableHead>Sync Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collectors?.map((collector) => (
            <TableRow key={collector.member_number}>
              <TableCell>{collector.collector_name}</TableCell>
              <TableCell>{collector.member_number}</TableCell>
              <TableCell>
                {collector.contact_info.email || 'N/A'}<br />
                {collector.contact_info.phone || 'N/A'}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-2">
                  <Badge 
                    variant={collector.role_verification.total_issues > 0 ? "destructive" : "success"}
                    className="w-fit"
                  >
                    {collector.role_verification.total_issues} Issues
                  </Badge>
                  {collector.role_verification.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-center gap-1 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      {issue}
                    </div>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {collector.auth_status.has_auth_id ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  {collector.auth_status.status}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge 
                    variant={collector.sync_status.status === 'completed' ? "success" : "warning"}
                    className="w-fit"
                  >
                    {collector.sync_status.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Last sync: {new Date(collector.last_sync).toLocaleString()}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sync Roles
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}