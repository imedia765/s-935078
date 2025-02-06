
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { MemberSearch } from "@/components/admin/MemberSearch";
import { MaintenanceManagement } from "@/components/admin/MaintenanceManagement";
import { AuditLogViewer } from "@/components/admin/audit/AuditLogViewer";
import { EmailServerDashboard } from "@/components/admin/email/EmailServerDashboard";
import { DatabaseManagement } from "@/components/admin/database/DatabaseManagement";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface SystemCheck {
  check_type: string;
  metric_name: string | null;
  current_value: number | null;
  threshold: number | null;
  status: string;
  check_details: Record<string, any>;
  test_category: string;
}

export default function Admin() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("system");

  const { data: systemChecks, isLoading: isLoadingChecks, error: systemError } = useQuery({
    queryKey: ["systemChecks"],
    queryFn: async () => {
      console.log("Fetching system checks...");
      try {
        const { data, error } = await supabase.rpc('run_system_checks');
        if (error) {
          console.error("System checks error:", error);
          throw error;
        }
        console.log("System checks data:", data);
        return data as SystemCheck[];
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
    meta: {
      onError: (error: Error) => {
        console.error("Query error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch system checks. Please try again later."
        });
      }
    }
  });

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
          <TabsTrigger value="email">Email Server</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">System Health Checks</h2>
            {systemError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {systemError instanceof Error ? systemError.message : 'An error occurred while fetching system checks'}
                </AlertDescription>
              </Alert>
            )}
            {isLoadingChecks ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : systemChecks ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemChecks.map((check, index) => (
                    <TableRow key={index}>
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
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(check.check_details, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">Audit Activity</h2>
            <AuditLogViewer />
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">Role Management</h2>
            <RoleManagement />
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">Member Search</h2>
            <MemberSearch />
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">System Maintenance</h2>
            <MaintenanceManagement />
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card className="p-6 glass-card">
            <DatabaseManagement />
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <EmailServerDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
