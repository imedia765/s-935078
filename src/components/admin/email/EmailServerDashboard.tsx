
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailTemplateList } from "./EmailTemplateList";
import { SmtpConfigList } from "./SmtpConfigList";
import { EmailQueueStatus } from "./EmailQueueStatus";
import { EmailMetrics } from "./EmailMetrics";
import { DnsMonitoring } from "./DnsMonitoring";
import { SmtpHealthStatus } from "./SmtpHealthStatus";
import { LoopsConfiguration } from "./LoopsConfiguration";

export function EmailServerDashboard() {
  const { data: emailStats, isLoading } = useQuery({
    queryKey: ['emailStats'],
    queryFn: async () => {
      const { data: emailLogs, error } = await supabase
        .from('email_logs')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        total: emailLogs.length,
        pending: emailLogs.filter(log => log.status === 'pending').length,
        sent: emailLogs.filter(log => log.status === 'sent').length,
        failed: emailLogs.filter(log => log.status === 'failed').length
      };

      return stats;
    }
  });

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-xl font-semibold mb-4 text-gradient">Email Server Management</h2>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-black/40">
          <h3 className="text-sm font-medium">Total Emails (24h)</h3>
          <p className="text-2xl font-bold">{isLoading ? '...' : emailStats?.total || 0}</p>
        </Card>
        <Card className="p-4 bg-black/40">
          <h3 className="text-sm font-medium">Pending</h3>
          <p className="text-2xl font-bold text-yellow-400">{isLoading ? '...' : emailStats?.pending || 0}</p>
        </Card>
        <Card className="p-4 bg-black/40">
          <h3 className="text-sm font-medium">Sent</h3>
          <p className="text-2xl font-bold text-green-400">{isLoading ? '...' : emailStats?.sent || 0}</p>
        </Card>
        <Card className="p-4 bg-black/40">
          <h3 className="text-sm font-medium">Failed</h3>
          <p className="text-2xl font-bold text-red-400">{isLoading ? '...' : emailStats?.failed || 0}</p>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="w-full justify-start bg-black/40 backdrop-blur-xl border border-white/10">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="dns">DNS Status</TabsTrigger>
          <TabsTrigger value="smtp">SMTP Health</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="config">SMTP Config</TabsTrigger>
          <TabsTrigger value="queue">Queue Status</TabsTrigger>
          <TabsTrigger value="loops">Loops Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <EmailMetrics />
        </TabsContent>

        <TabsContent value="dns">
          <DnsMonitoring />
        </TabsContent>

        <TabsContent value="smtp">
          <SmtpHealthStatus />
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplateList />
        </TabsContent>

        <TabsContent value="config">
          <SmtpConfigList />
        </TabsContent>

        <TabsContent value="queue">
          <EmailQueueStatus />
        </TabsContent>

        <TabsContent value="loops">
          <LoopsConfiguration />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
