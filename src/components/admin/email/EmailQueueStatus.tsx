
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

export function EmailQueueStatus() {
  const queryClient = useQueryClient();

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
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return emailLogs;
    },
    enabled: !!loopsConfig?.is_active,
    refetchInterval: 30000 // Refresh every 30 seconds
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
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                    </span>
                  </div>
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
