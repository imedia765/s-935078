import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function EmailQueueStatus() {
  const { data: queuedEmails, isLoading, refetch } = useQuery({
    queryKey: ['emailQueue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .in('status', ['pending', 'failed'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Email Queue</h3>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : queuedEmails?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No emails in queue</TableCell>
            </TableRow>
          ) : (
            queuedEmails?.map((email) => (
              <TableRow key={email.id}>
                <TableCell>{email.recipient_email}</TableCell>
                <TableCell>{email.subject}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded ${
                    email.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {email.status}
                  </span>
                </TableCell>
                <TableCell>{new Date(email.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">Retry</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}