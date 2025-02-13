
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailTemplateList } from "./EmailTemplateList";
import { EmailQueueStatus } from "./EmailQueueStatus";
import { EmailMetrics } from "./EmailMetrics";
import { LoopsConfiguration } from "./LoopsConfiguration";

export function EmailServerDashboard() {
  const { data: emailStats, isLoading } = useQuery({
    queryKey: ['loopsEmailStats'],
    queryFn: async () => {
      const { data: loopsConfig } = await supabase
        .from('loops_integration')
        .select('*')
        .limit(1)
        .single();

      if (!loopsConfig?.is_active) {
        return {
          total: 0,
          pending: 0,
          sent: 0,
          failed: 0
        };
      }

      const { data: emailLogs, error } = await supabase
        .from('email_logs')
        .select('status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        total: emailLogs?.length || 0,
        pending: emailLogs?.filter(log => log.status === 'pending').length || 0,
        sent: emailLogs?.filter(log => log.status === 'sent').length || 0,
        failed: emailLogs?.filter(log => log.status === 'failed').length || 0
      };

      return stats;
    }
  });

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-xl font-semibold mb-4 text-gradient">Loops Email Management</h2>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-black/40">
          <h3 className="text-sm font-medium">Total Emails (24h)</h3>
          <p className="text-2xl font-bold">{isLoading ? '...' : emailStats?.total || 0}</p>
        </Card>
        <Card className="p-4 bg-black/40">
          <h3 className="text-sm font-medium">Queued</h3>
          <p className="text-2xl font-bold text-yellow-400">{isLoading ? '...' : emailStats?.pending || 0}</p>
        </Card>
        <Card className="p-4 bg-black/40">
          <h3 className="text-sm font-medium">Delivered</h3>
          <p className="text-2xl font-bold text-green-400">{isLoading ? '...' : emailStats?.sent || 0}</p>
        </Card>
        <Card className="p-4 bg-black/40">
          <h3 className="text-sm font-medium">Failed</h3>
          <p className="text-2xl font-bold text-red-400">{isLoading ? '...' : emailStats?.failed || 0}</p>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="w-full justify-start bg-black/40 backdrop-blur-xl border border-white/10">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="metrics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <LoopsConfiguration />
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplateList />
        </TabsContent>

        <TabsContent value="queue">
          <EmailQueueStatus />
        </TabsContent>

        <TabsContent value="metrics">
          <EmailMetrics />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
