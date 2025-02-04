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

export default function Admin() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("system");

  // System Checks Query with error handling
  const { data: systemChecks, isLoading: isLoadingChecks, error: systemError } = useQuery({
    queryKey: ["systemChecks"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('run_combined_system_checks');
      if (error) throw error;
      return data;
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
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">System Health Checks</h2>
            {systemError && <ErrorAlert error={systemError as Error} />}
            {isLoadingChecks ? (
              <p>Loading system checks...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemChecks?.map((check: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{check.check_type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded ${
                          check.status === 'Good' ? 'bg-green-100 text-green-800' :
                          check.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {check.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <pre className="text-sm whitespace-pre-wrap">
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
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Audit Activity</h2>
            {auditError && <ErrorAlert error={auditError as Error} />}
            {isLoadingAudit ? (
              <p>Loading audit logs...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditActivity?.map((activity: any, index: number) => (
                    <TableRow key={index}>
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
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Role Validation</h2>
            {rolesError && <ErrorAlert error={rolesError as Error} />}
            {isLoadingRoles ? (
              <p>Loading role validation...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleValidation?.map((validation: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{validation.check_type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded ${
                          validation.status === 'Good' ? 'bg-green-100 text-green-800' :
                          validation.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {validation.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(validation.details, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Maintenance Tasks</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Token Management</h3>
                <Button onClick={handleCleanupTokens}>
                  Cleanup Expired Tokens
                </Button>
              </div>
              <div>
                <h3 className="font-medium mb-2">Role Management</h3>
                <Button onClick={handleMaintainCollectorRoles}>
                  Maintain Collector Roles
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}