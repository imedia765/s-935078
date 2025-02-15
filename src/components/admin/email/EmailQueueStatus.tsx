
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

export function EmailQueueStatus() {
  const { data: loopsConfig } = useQuery({
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

  const { data: queueStats, isLoading, refetch } = useQuery({
    queryKey: ['emailQueue'],
    queryFn: async () => {
      if (!loopsConfig?.is_active) return null;

      const { data: emailLogs, error } = await supabase
        .from('email_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return emailLogs;
    },
    enabled: !!loopsConfig?.is_active,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

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
      case 'queued':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 text-red-400';
      case 'high':
        return 'bg-orange-500/20 text-orange-400';
      case 'normal':
        return 'bg-blue-500/20 text-blue-400';
      case 'low':
        return 'bg-gray-500/20 text-gray-400';
      case 'bulk':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Email Queue</h3>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : !queueStats?.length ? (
        <div>No emails in queue</div>
      ) : (
        <div className="grid gap-4">
          {queueStats.map((email: any) => (
            <Card key={email.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{email.subject}</h4>
                  <p className="text-sm text-muted-foreground">To: {email.recipient_email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(email.status)}>
                      {email.status}
                    </Badge>
                    <Badge className={getPriorityColor(email.priority)}>
                      {email.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {email.next_retry_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Next retry: {formatDistanceToNow(new Date(email.next_retry_at), { addSuffix: true })}
                    </p>
                  )}
                  {email.retry_count > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Retry count: {email.retry_count}
                    </p>
                  )}
                  {email.delivered_at && (
                    <p className="text-xs text-muted-foreground">
                      Delivered: {formatDistanceToNow(new Date(email.delivered_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
              {email.error_message && (
                <p className="mt-2 text-sm text-red-400">{email.error_message}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
