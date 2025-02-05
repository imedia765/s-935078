import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EmailQueueStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: queuedEmails, isLoading, refetch } = useQuery({
    queryKey: ['emailQueue', statusFilter, sortOrder],
    queryFn: async () => {
      const query = supabase
        .from('email_logs')
        .select('*, members!inner(full_name)')
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (statusFilter !== "all") {
        query.eq('status', statusFilter);
      } else {
        query.in('status', ['pending', 'failed']);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data;
    }
  });

  const retryMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const { data, error } = await supabase
        .from('email_logs')
        .update({ 
          status: 'pending',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailQueue'] });
      toast({
        title: "Email Queued",
        description: "Email has been queued for retry",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to retry email: " + error.message,
        variant: "destructive"
      });
    }
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTimeAgo = (date: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Email Queue</h3>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            <Clock className="mr-2 h-4 w-4" />
            {sortOrder === 'asc' ? 'Newest First' : 'Oldest First'}
          </Button>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : queuedEmails?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">No emails in queue</TableCell>
            </TableRow>
          ) : (
            queuedEmails?.map((email) => (
              <TableRow key={email.id}>
                <TableCell>
                  <div>
                    <div>{email.recipient_email}</div>
                    <div className="text-sm text-muted-foreground">
                      {email.members?.full_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{email.subject}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded ${getStatusBadgeClass(email.status)}`}>
                    {email.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {getTimeAgo(email.created_at)}
                  </div>
                </TableCell>
                <TableCell>
                  {email.error_message && (
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm truncate max-w-[200px]" title={email.error_message}>
                        {email.error_message}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => retryMutation.mutate(email.id)}
                    disabled={email.status === 'pending' || retryMutation.isPending}
                  >
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}