
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { MemberSearch } from "@/components/admin/MemberSearch";
import { MaintenanceManagement } from "@/components/admin/MaintenanceManagement";
import { FinancialManagement } from "@/components/admin/FinancialManagement";
import { AuditLogViewer } from "@/components/admin/audit/AuditLogViewer";
import { EmailServerDashboard } from "@/components/admin/email/EmailServerDashboard";
import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export default function Admin() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("system");

  const { data: systemChecks, isLoading: isLoadingChecks, error: systemError } = useQuery({
    queryKey: ["systemChecks"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('run_combined_system_checks', {}, {
          count: 'exact',
          retryCount: 3,
          retryDelay: 1000
        });

        if (error) {
          console.error("System checks error:", error);
          toast({
            variant: "destructive",
            title: "Error fetching system checks",
            description: error.message
          });
          throw error;
        }

        if (!data) {
          return [];
        }

        return data.map((check: any) => ({
          check_type: check.check_type || 'Unknown',
          status: check.status || 'Unknown',
          metric_name: check.metric_name || '',
          current_value: check.current_value || 0,
          threshold: check.threshold || 0,
          check_details: typeof check.check_details === 'object' ? check.check_details : {}
        }));
      } catch (error: any) {
        console.error("System checks error:", error);
        toast({
          variant: "destructive",
          title: "Error fetching system checks",
          description: error.message
        });
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000 // Cache data for 30 seconds
  });

  const ErrorAlert = ({ error }: { error: Error | null }) => {
    if (!error) return null;
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-gradient">Admin Dashboard</h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-full justify-start bg-black/40 backdrop-blur-xl border border-white/10">
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="members">Member Search</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="email">Email Server</TabsTrigger>
        </TabsList>

        {/* System Health Tab */}
        <TabsContent value="system">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">System Health Checks</h2>
            {systemError && <ErrorAlert error={systemError as Error} />}
            {isLoadingChecks ? (
              <p>Loading system checks...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-primary/5">
                    <TableHead>Check Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemChecks?.map((check: any, index: number) => (
                    <TableRow key={index} className="hover:bg-primary/5">
                      <TableCell>{check.check_type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded ${
                          check.status === 'Good' ? 'bg-green-500/20 text-green-400' :
                          check.status === 'Warning' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {check.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {JSON.stringify(check.check_details, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Enhanced Audit Logs Tab */}
        <TabsContent value="audit">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">Audit Activity</h2>
            <AuditLogViewer />
          </Card>
        </TabsContent>

        {/* Role Management Tab */}
        <TabsContent value="roles">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">Role Management</h2>
            <RoleManagement />
          </Card>
        </TabsContent>

        {/* Member Search Tab */}
        <TabsContent value="members">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">Member Search</h2>
            <MemberSearch />
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">System Maintenance</h2>
            <MaintenanceManagement />
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial">
          <Card className="p-6 glass-card">
            <FinancialManagement />
          </Card>
        </TabsContent>

        {/* Email Server Tab */}
        <TabsContent value="email">
          <EmailServerDashboard />
        </TabsContent>

      </Tabs>
    </div>
  );
}
