import { AlertCircle, CheckCircle2, XCircle, History, Search, UserSearch, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  id: string;
  email?: string;
  member_number?: string;
  full_name?: string;
  user_roles?: { role: string }[];
}

interface ValidationDetails {
  auth_user_id?: string;
  user_id?: string;
  status?: string;
  verified?: boolean;
  full_name?: string;
  member_number?: string;
  current_roles?: string[];
  member_status?: string;
}

// Function to generate a magic link for a user
const generateMagicLink = async (userId: string) => {
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userId // Using userId as email since that's what we have
    });
    
    if (error) throw error;
    
    return data;
  } catch (error: any) {
    console.error('Error generating magic link:', error);
    throw new Error('Failed to generate magic link');
  }
};

export function RoleManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("table");

  // Query for users and their roles
  const { data: userData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log("Fetching users and roles data...");
      
      // First get all users with their roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error("User roles fetch error:", rolesError);
        throw rolesError;
      }

      // Then get member details for these users
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('auth_user_id, email, member_number, full_name');

      if (membersError) {
        console.error("Members fetch error:", membersError);
        throw membersError;
      }

      // Create a map of auth_user_id to member details
      const memberMap = members.reduce((acc: {[key: string]: {email: string, member_number: string, full_name: string}}, member: any) => {
        if (member.auth_user_id) {
          acc[member.auth_user_id] = {
            email: member.email,
            member_number: member.member_number,
            full_name: member.full_name
          };
        }
        return acc;
      }, {});

      // Transform the data to match the User interface
      const userMap = userRoles.reduce((acc: {[key: string]: User}, role: any) => {
        if (!acc[role.user_id]) {
          acc[role.user_id] = {
            id: role.user_id,
            email: memberMap[role.user_id]?.email,
            member_number: memberMap[role.user_id]?.member_number,
            full_name: memberMap[role.user_id]?.full_name,
            user_roles: []
          };
        }
        acc[role.user_id].user_roles?.push({ role: role.role });
        return acc;
      }, {});

      return Object.values(userMap);
    }
  });

  const { data: roleValidation, isLoading: isLoadingValidation, refetch } = useQuery({
    queryKey: ["roleValidation"],
    queryFn: async () => {
      console.log("Fetching role validation data...");
      const { data: validationData, error: validationError } = await supabase.rpc('validate_user_roles');
      
      if (validationError) {
        console.error("Role validation error:", validationError);
        throw validationError;
      }

      const { data: auditLogs, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'user_roles')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (auditError) {
        console.error("Audit log fetch error:", auditError);
      }

      return {
        validation: validationData,
        auditLogs: auditLogs || []
      };
    }
  });

  const handleFixRoleError = async (userId: string | undefined, errorType: string, specificFix?: string) => {
    try {
      console.log(`Starting fix operation for user ${userId}, type: ${errorType}, specific fix: ${specificFix}`);
      
      if (errorType === 'Inconsistent Member Status' && !userId) {
        const validationDetails = roleValidation?.validation?.find(v => v.check_type === errorType);
        const details = validationDetails?.details as ValidationDetails;
        userId = details?.auth_user_id;
        
        console.log('Extracted validation details:', details);
        console.log('Using auth_user_id:', userId);
      }

      if (!userId) {
        console.error("User ID is undefined");
        throw new Error("User ID is required");
      }

      // Log current state before fix
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      console.log('Current roles before fix:', currentRoles);

      // Update the RPC call to include p_specific_fix parameter
      const { data, error } = await supabase.rpc('fix_role_error', {
        p_error_type: errorType,
        p_user_id: userId,
        p_specific_fix: specificFix || null // Add the specific fix parameter
      } as any); // Using 'as any' temporarily until the types are updated in the database
      
      if (error) {
        console.error("Fix role error failed:", error);
        throw error;
      }

      console.log('Fix operation response:', data);

      // Log state after fix
      const { data: updatedRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      console.log('Updated roles after fix:', updatedRoles);

      await supabase.from('audit_logs').insert([{
        table_name: 'user_roles',
        operation: 'UPDATE',
        record_id: userId,
        new_values: {
          error_type: errorType,
          specific_fix: specificFix,
          resolution: 'automatic_fix',
          before_state: currentRoles,
          after_state: updatedRoles
        }
      }]);

      await refetch();
      
      toast({
        title: "Success",
        description: `Role error fixed successfully (${specificFix || 'default fix'})`,
      });
    } catch (error: any) {
      console.error("Error fixing role:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter functions for each tab
  const filteredUsers = userData?.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.member_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredValidations = roleValidation?.validation?.filter((validation: any) =>
    validation.check_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(validation.details).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAuditLogs = roleValidation?.auditLogs?.filter((log: any) =>
    JSON.stringify(log.new_values).toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.operation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getErrorSeverity = (status: string) => {
    switch (status) {
      case 'Critical': return 'destructive';
      case 'Warning': return 'warning';
      default: return 'default';
    }
  };

  const getErrorIcon = (status: string) => {
    switch (status) {
      case 'Critical': return <AlertCircle className="h-4 w-4" />;
      case 'Warning': return <AlertTriangle className="h-4 w-4" />;
      case 'Good': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getErrorFix = (checkType: string) => {
    switch (checkType) {
      case 'Multiple Roles Assigned':
        return "This user has multiple roles which may cause conflicts. The fix will keep only the highest priority role (admin > collector > member).";
      case 'Member Without Role':
        return "This user doesn't have the basic member role. The fix will assign the member role automatically.";
      case 'Collector Missing Role':
        return "This collector is missing their collector role. The fix will assign the collector role while maintaining existing roles.";
      case 'Inconsistent Member Status':
        return "The member's status is inconsistent with their roles. Please review their profile and update manually.";
      default:
        return "Contact system administrator for assistance.";
    }
  };

  const getErrorDetails = (checkType: string, details: any) => {
    switch (checkType) {
      case 'Multiple Roles Assigned':
        return {
          explanation: "User has conflicting roles that may cause permission issues",
          impact: "This can lead to unexpected behavior in role-based access control",
          currentState: `Current roles: ${details.current_roles?.join(', ')}`,
          recommendation: "Keep only the highest priority role (admin > collector > member)"
        };
      case 'Member Without Role':
        return {
          explanation: "User exists in the members table but has no assigned role",
          impact: "User cannot access any role-based features",
          currentState: "No roles currently assigned",
          recommendation: "Assign at least the basic member role"
        };
      case 'Collector Missing Role':
        return {
          explanation: "User marked as collector in members table but missing collector role",
          impact: "Cannot perform collector-specific functions",
          currentState: `Current roles: ${details.current_roles?.join(', ') || 'None'}`,
          recommendation: "Add collector role while maintaining existing roles"
        };
      case 'Inconsistent Member Status':
        return {
          explanation: "Member status doesn't match assigned roles",
          impact: "May cause access control issues",
          currentState: `Status: ${details.member_status}, Roles: ${details.current_roles?.join(', ')}`,
          recommendation: "Review member profile and update status or roles accordingly"
        };
      default:
        return {
          explanation: "Unknown error type",
          impact: "Potential system inconsistency",
          currentState: "Unknown",
          recommendation: "Contact system administrator"
        };
    }
  };

  const getFixOptions = (checkType: string, details: ValidationDetails) => {
    switch (checkType) {
      case 'Multiple Roles Assigned':
        return [
          {
            label: "Keep highest priority role only",
            value: "keep_highest",
            description: "Removes all roles except the highest priority one"
          },
          {
            label: "Remove conflicting roles",
            value: "remove_conflicts",
            description: "Keeps compatible roles and removes conflicts"
          }
        ];
      case 'Member Without Role':
        return [
          {
            label: "Add member role",
            value: "add_member",
            description: "Assigns the basic member role"
          },
          {
            label: "Sync with member status",
            value: "sync_status",
            description: "Assigns roles based on member status"
          }
        ];
      case 'Collector Missing Role':
        return [
          {
            label: "Add collector role",
            value: "add_collector",
            description: "Adds collector role while keeping existing roles"
          },
          {
            label: "Full collector setup",
            value: "setup_collector",
            description: "Sets up all necessary collector permissions"
          }
        ];
      case 'Inconsistent Member Status':
        return [
          {
            label: "Update roles to match status",
            value: "update_roles",
            description: "Updates roles to match current member status"
          },
          {
            label: "Verify and sync",
            value: "verify_sync",
            description: "Verifies member status and syncs roles"
          }
        ];
      default:
        return [];
    }
  };

  if (isLoadingUsers || isLoadingValidation) return <div>Loading...</div>;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === "table" ? "Search by name, email, ID or member number..." :
              activeTab === "errors" ? "Search errors by type or details..." :
              "Search audit logs..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="errors">Error View</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Member Number</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.member_number || 'N/A'}</TableCell>
                    <TableCell className="font-mono text-sm">{user.id}</TableCell>
                    <TableCell>
                      {user.user_roles?.map((role: any) => role.role).join(", ")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateMagicLink(user.id)}
                      >
                        Generate Magic Link
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="errors">
          <div className="space-y-4">
            {filteredValidations?.map((validation: any, index: number) => (
              <Alert
                key={index}
                variant={getErrorSeverity(validation.status)}
                className="glass-card"
              >
                {getErrorIcon(validation.status)}
                <AlertTitle className="flex items-center justify-between">
                  <span>{validation.check_type}</span>
                  <div className="flex gap-2">
                    {validation.status !== 'Good' && (
                      <>
                        <div className="flex flex-col gap-2">
                          {getFixOptions(validation.check_type, validation.details).map((option) => (
                            <Button
                              key={option.value}
                              variant="outline"
                              size="sm"
                              onClick={() => handleFixRoleError(validation.details?.user_id, validation.check_type, option.value)}
                              className="whitespace-nowrap"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              {option.label}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateMagicLink(validation.details?.user_id)}
                        >
                          Generate Magic Link
                        </Button>
                      </>
                    )}
                  </div>
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    {validation.status !== 'Good' && (
                      <div className="bg-secondary/50 p-4 rounded-md space-y-3">
                        {Object.entries(getErrorDetails(validation.check_type, validation.details)).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="text-sm font-medium capitalize">{key}:</div>
                            <div className="text-sm text-muted-foreground">{value}</div>
                          </div>
                        ))}
                        <div className="mt-2">
                          <div className="text-sm font-medium">Available Fixes:</div>
                          {getFixOptions(validation.check_type, validation.details).map((option) => (
                            <div key={option.value} className="text-sm text-muted-foreground mt-1">
                              • {option.label}: {option.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-sm font-medium mt-4">Raw Details:</div>
                    <pre className="bg-secondary/50 p-2 rounded-md text-sm whitespace-pre-wrap">
                      {JSON.stringify(validation.details, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <div className="glass-card p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Role Changes
            </h3>
            <ScrollArea className="h-[200px]">
              {filteredAuditLogs?.map((log: any, index: number) => (
                <div key={index} className="mb-2 p-2 border-b last:border-0">
                  <div className="flex justify-between text-sm">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="font-medium">{log.operation}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {JSON.stringify(log.new_values)}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
