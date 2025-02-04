import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { MemberSearch } from "@/components/admin/MemberSearch";
import { MaintenanceManagement } from "@/components/admin/MaintenanceManagement";
import { CollectorsManagement } from "@/components/admin/CollectorsManagement";

export default function Admin() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("system");

  const { data: systemChecks, isLoading: isLoadingChecks, error: systemError } = useQuery({
    queryKey: ["systemChecks"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('run_combined_system_checks');
        if (error) throw error;
        console.log("System checks response:", data); // Debug log
        return data;
      } catch (error: any) {
        console.error("System checks error:", error); // Debug log
        throw error;
      }
    }
  });

  // Audit Activity Query
  const { data: auditActivity, isLoading: isLoadingAudit, error: auditError } = useQuery({
    queryKey: ["auditActivity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_activity_summary');
      if (error) throw error;
      return data;
    }
  });

  // User Roles Query
  const { data: roleValidation, isLoading: isLoadingRoles, error: rolesError } = useQuery({
    queryKey: ["roleValidation"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('validate_user_roles');
      if (error) throw error;
      return data;
    }
  });

  // Cleanup Tokens
  const handleCleanupTokens = async () => {
    try {
      const { error } = await supabase.rpc('manual_cleanup_expired_tokens');
      if (error) throw error;
      toast({
        title: "Success",
        description: "Expired tokens cleaned up successfully",
      });
    } catch (error: any) {
      console.error("Cleanup tokens error:", error); // Debug log
      toast({
        title: "Error",
        description: error.message || "Failed to cleanup tokens",
        variant: "destructive",
      });
    }
  };

  // Maintain Collector Roles
  const handleMaintainCollectorRoles = async () => {
    try {
      const { error } = await supabase.rpc('maintain_collector_roles');
      if (error) throw error;
      toast({
        title: "Success",
        description: "Collector roles maintained successfully",
      });
    } catch (error: any) {
      console.error("Maintain collector roles error:", error); // Debug log
      toast({
        title: "Error",
        description: error.message || "Failed to maintain collector roles",
        variant: "destructive",
      });
    }
  };

  // Error Display Component
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
          <TabsTrigger 
            value="system"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            System Health
          </TabsTrigger>
          <TabsTrigger 
            value="audit"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Audit Logs
          </TabsTrigger>
          <TabsTrigger 
            value="roles"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Role Management
          </TabsTrigger>
          <TabsTrigger 
            value="members"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Member Search
          </TabsTrigger>
          <TabsTrigger 
            value="collectors"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Collectors
          </TabsTrigger>
          <TabsTrigger 
            value="maintenance"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            Maintenance
          </TabsTrigger>
        </TabsList>

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
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">Audit Activity</h2>
            {auditError && <ErrorAlert error={auditError as Error} />}
            {isLoadingAudit ? (
              <p>Loading audit logs...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-primary/5">
                    <TableHead>Time</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditActivity?.map((activity: any, index: number) => (
                    <TableRow key={index} className="hover:bg-primary/5">
                      <TableCell>{new Date(activity.hour_bucket).toLocaleString()}</TableCell>
                      <TableCell>{activity.operation}</TableCell>
                      <TableCell>{activity.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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

        <TabsContent value="collectors">
          <Card className="p-6 glass-card">
            <h2 className="text-xl font-semibold mb-4 text-gradient">Collectors Management</h2>
            <CollectorsManagement />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
