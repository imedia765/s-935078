import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const RoleChangeRequests = () => {
  const { toast } = useToast();

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ["roleChangeRequests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_change_requests')
        .select(`
          id,
          user_id,
          requested_by,
          existing_role,
          requested_role,
          reason,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const handleApproval = async (requestId: string, approved: boolean) => {
    try {
      const { data, error } = await supabase.rpc('approve_role_change', {
        request_id: requestId,
        new_status: approved ? 'approved' : 'rejected',
        admin_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      toast({
        title: approved ? "Request Approved" : "Request Rejected",
        description: "The role change request has been processed.",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div>Loading requests...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Role Change Requests</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Requested Role</TableHead>
            <TableHead>Current Role</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests?.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.requested_role}</TableCell>
              <TableCell>{request.existing_role}</TableCell>
              <TableCell>{request.reason}</TableCell>
              <TableCell>
                <span className={
                  request.status === 'approved' ? 'text-green-500' :
                  request.status === 'rejected' ? 'text-red-500' :
                  'text-yellow-500'
                }>
                  {request.status}
                </span>
              </TableCell>
              <TableCell>
                {request.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproval(request.id, true)}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproval(request.id, false)}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};