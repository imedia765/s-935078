
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collectors, isLoading, error } = useQuery({
    queryKey: ["collectors-status"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_collectors_role_status');
        if (error) throw error;
        return data as CollectorStatus[];
      } catch (err) {
        console.error('Error fetching collectors:', err);
        throw err;
      }
    }
  });

  const syncRoleMutation = useMutation({
    mutationFn: async (memberNumber: string) => {
      console.log('Syncing roles for member:', memberNumber);
      const { data, error } = await supabase.rpc('fix_collector_role_sync', {
        p_member_number: memberNumber
      });
      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }
      console.log('Role sync response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Role sync success:', data);
      queryClient.invalidateQueries({ queryKey: ["collectors-status"] });
      toast({
        title: "Success",
        description: "Role synchronization completed successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Role sync error:', error);
      toast({
        title: "Error",
        description: "Failed to sync roles: " + error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoading) return <div>Loading collectors...</div>;
  if (error) return <div>Error loading collectors: {(error as Error).message}</div>;

  // Ensure we have a valid array of collectors
  const collectorsData = Array.isArray(collectors) ? collectors : [];

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
          {collectorsData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No collectors found
              </TableCell>
            </TableRow>
          ) : (
            collectorsData.map((collector) => (
              <TableRow key={collector.member_number}>
                <TableCell>{collector.collector_name || 'N/A'}</TableCell>
                <TableCell>{collector.member_number}</TableCell>
                <TableCell>
                  {collector.contact_info?.email || 'N/A'}<br />
                  {collector.contact_info?.phone || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Badge 
                      variant={collector.role_verification?.total_issues > 0 ? "destructive" : "default"}
                      className="w-fit"
                    >
                      {collector.role_verification?.total_issues || 0} Issues
                    </Badge>
                    {collector.role_verification?.issues?.map((issue, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        {issue}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {collector.auth_status?.has_auth_id ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {collector.auth_status?.status || 'Unknown'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge 
                      variant={collector.sync_status?.status === 'completed' ? "default" : "secondary"}
                      className="w-fit"
                    >
                      {collector.sync_status?.status || 'Unknown'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Last sync: {collector.last_sync ? new Date(collector.last_sync).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      if (collector.auth_status?.has_auth_id) {
                        syncRoleMutation.mutate(collector.member_number);
                      } else {
                        toast({
                          title: "Error",
                          description: "Cannot sync roles: No auth ID found",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={!collector.auth_status?.has_auth_id || syncRoleMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 ${syncRoleMutation.isPending ? 'animate-spin' : ''}`} />
                    {syncRoleMutation.isPending ? 'Syncing...' : 'Sync Roles'}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
