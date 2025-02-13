
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, RotateCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function EmailQueueStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: loopsConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['loopsConfig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loops_integration')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: queuedEmails, isLoading: isLoadingEmails, refetch } = useQuery({
    queryKey: ['emailQueue', statusFilter, sortOrder],
    queryFn: async () => {
      if (!loopsConfig?.is_active) return [];

      let query = supabase
        .from('email_logs')
        .select(`
          *,
          members (
            full_name
          )
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: sortOrder === 'asc' });

      if (error) throw error;
      return data;
    },
    enabled: !!loopsConfig?.is_active
  });

  if (isLoadingConfig) {
    return <div>Loading configuration...</div>;
  }

  if (!loopsConfig?.is_active) {
    return (
      <Alert>
        <AlertDescription>
          Loops integration is not active. Please enable it in the Settings tab to view email queue.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Email Queue</h3>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoadingEmails ? (
        <div>Loading...</div>
      ) : !queuedEmails?.length ? (
        <div>No emails in queue</div>
      ) : (
        <div className="grid gap-4">
          {queuedEmails.map((email) => (
            <div
              key={email.id}
              className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{email.subject}</h4>
                  <p className="text-sm text-muted-foreground">
                    To: {email.recipient_email}
                    {email.members?.full_name && ` (${email.members.full_name})`}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(email.status)}`}>
                      {email.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
              {email.error_message && (
                <p className="mt-2 text-sm text-red-400">{email.error_message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
