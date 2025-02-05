
import { AlertCircle, CheckCircle2, XCircle, History, Search, UserSearch, AlertTriangle, Info, UserPlus, UserMinus, CheckCheck, History as HistoryIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendEmail } from "@/utils/email";
import { UserRole } from "@/types/auth";

type AppRole = UserRole;
type FixType = UserRole | 'remove_role';

interface User {
  id: string;
  email?: string;
  member_number?: string;
  full_name?: string;
  user_roles?: { role: AppRole }[];
}

interface ValidationDetails {
  auth_user_id?: string;
  user_id?: string;
  status?: string;
  verified?: boolean;
  full_name?: string;
  member_number?: string;
  current_roles?: AppRole[];
  member_status?: string;
  email?: string;
}

interface FixOption {
  label: string;
  value: FixType;
  description: string;
  icon?: React.ReactNode;
  action?: () => Promise<void>;
}

const getErrorSeverity = (status: string): "default" | "destructive" => {
  switch (status.toLowerCase()) {
    case 'critical':
      return "destructive";
    default:
      return "default";
  }
};

const getErrorIcon = (status: string): JSX.Element => {
  switch (status.toLowerCase()) {
    case 'good':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'error':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getErrorDetails = (checkType: string, details: ValidationDetails): Record<string, string | undefined> => {
  const baseDetails: Record<string, string | undefined> = {
    "User ID": details.auth_user_id,
    "Full Name": details.full_name,
    "Member Number": details.member_number,
    "Current Roles": details.current_roles?.join(", "),
    "Member Status": details.member_status
  };

  return baseDetails;
};

export function RoleManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("table");

  const generateMagicLink = async (userId: string) => {
    try {
      const { data: userData } = await supabase
        .from('members')
        .select('email')
        .eq('auth_user_id', userId)
        .single();

      if (!userData?.email) {
        throw new Error('No email found for user');
      }

      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.email,
      });

      if (error) throw error;

      // Send email with magic link
      await sendEmail({
        to: userData.email,
        subject: 'Your Login Link',
        html: `<p>Here's your magic login link: ${data.properties.action_link}</p>`,
      });

      toast({
        title: "Success",
        description: "Magic link sent successfully",
      });
    } catch (error: any) {
      console.error('Error generating magic link:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFixRoleError = async (userId: string | undefined, checkType: string, fixType: FixType) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is required",
        variant: "destructive",
      });
      return;
    }

    try {
      let response;
      if (fixType === 'remove_role') {
        response = await supabase.rpc('remove_user_role', {
          p_user_id: userId,
          p_role: checkType as UserRole
        });
      } else {
        response = await supabase.rpc('add_user_role', {
          p_user_id: userId,
          p_role: fixType
        });
      }

      const { error } = response;
      if (error) throw error;

      toast({
        title: "Success",
        description: "Role issue fixed successfully",
      });

      await refetch();
    } catch (error: any) {
      console.error('Error fixing role:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      console.log(`Changing role for user ${userId} to ${newRole}`);
      
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      console.log('Current roles:', currentRoles);

      const { error: removeError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (removeError) throw removeError;

      const { error: addError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (addError) throw addError;

      await supabase.from('audit_logs').insert([{
        table_name: 'user_roles',
        operation: 'UPDATE',
        record_id: userId,
        new_values: {
          action: 'role_change',
          old_roles: currentRoles,
          new_role: newRole
        }
      }]);

      toast({
        title: "Success",
        description: `Role changed to ${newRole}`,
      });

      await refetch();
    } catch (error: any) {
      console.error("Error changing role:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const { data: userData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log("Fetching users and roles data...");
      
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error("User roles fetch error:", rolesError);
        throw rolesError;
      }

      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('auth_user_id, email, member_number, full_name');

      if (membersError) {
        console.error("Members fetch error:", membersError);
        throw membersError;
      }

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

  const getFixOptions = (checkType: string, details: ValidationDetails): FixOption[] => {
    const baseOptions: FixOption[] = [
      {
        label: "Change to Member",
        value: "member",
        description: "Set role to basic member",
        icon: <UserMinus className="h-4 w-4" />,
        action: () => details?.auth_user_id ? handleRoleChange(details.auth_user_id, 'member') : Promise.resolve()
      },
      {
        label: "Change to Collector",
        value: "collector",
        description: "Set role to collector",
        icon: <UserSearch className="h-4 w-4" />,
        action: () => details?.auth_user_id ? handleRoleChange(details.auth_user_id, 'collector') : Promise.resolve()
      },
      {
        label: "Change to Admin",
        value: "admin",
        description: "Set role to admin",
        icon: <UserPlus className="h-4 w-4" />,
        action: () => details?.auth_user_id ? handleRoleChange(details.auth_user_id, 'admin') : Promise.resolve()
      }
    ];

    const additionalOptions: Record<string, FixOption[]> = {
      'Multiple Roles Assigned': [
        {
          label: "Remove Extra Roles",
          value: "remove_role",
          description: "Removes duplicate roles",
          icon: <CheckCircle2 className="h-4 w-4" />,
          action: () => details?.auth_user_id ? handleFixRoleError(details.auth_user_id, checkType, 'remove_role') : Promise.resolve()
        }
      ],
      'Member Without Role': [
        {
          label: "Add member role",
          value: "member",
          description: "Assigns the basic member role",
          icon: <UserPlus className="h-4 w-4" />,
          action: () => details?.auth_user_id ? handleFixRoleError(details.auth_user_id, checkType, 'member') : Promise.resolve()
        }
      ],
      'Collector Missing Role': [
        {
          label: "Add collector role",
          value: "collector",
          description: "Adds collector role",
          icon: <UserSearch className="h-4 w-4" />,
          action: () => details?.auth_user_id ? handleFixRoleError(details.auth_user_id, checkType, 'collector') : Promise.resolve()
        }
      ],
      'Inconsistent Member Status': [
        {
          label: "Add Member Role",
          value: "member",
          description: "Add member role",
          icon: <CheckCheck className="h-4 w-4" />,
          action: () => details?.auth_user_id ? handleFixRoleError(details.auth_user_id, checkType, 'member') : Promise.resolve()
        },
        {
          label: "Remove Current Role",
          value: "remove_role",
          description: "Remove current role",
          icon: <HistoryIcon className="h-4 w-4" />,
          action: () => details?.auth_user_id ? handleFixRoleError(details.auth_user_id, checkType, 'remove_role') : Promise.resolve()
        }
      ]
    };

    return [...(additionalOptions[checkType] || []), ...baseOptions];
  };

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
                      <div className="flex flex-wrap gap-2 justify-end">
                        {getFixOptions(validation.check_type, validation.details).map((option) => (
                          <Button
                            key={option.value}
                            variant="outline"
                            size="sm"
                            onClick={() => option.action ? 
                              option.action() : 
                              handleFixRoleError(validation.details?.auth_user_id, validation.check_type, option.value)
                            }
                            className="whitespace-nowrap flex items-center gap-2 bg-background hover:bg-secondary/80"
                          >
                            {option.icon}
                            {option.label}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateMagicLink(validation.details?.auth_user_id)}
                          className="whitespace-nowrap flex items-center gap-2 bg-background hover:bg-secondary/80"
                        >
                          <History className="h-4 w-4" />
                          Generate Magic Link
                        </Button>
                      </div>
                    )}
                  </div>
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2">
                    {validation.status !== 'Good' && (
                      <div className="bg-background/50 p-4 rounded-md space-y-3">
                        {Object.entries(getErrorDetails(validation.check_type, validation.details)).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <div className="text-sm font-medium capitalize">{key}:</div>
                            <div className="text-sm text-muted-foreground">{value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-sm font-medium mt-4">Raw Details:</div>
                    <pre className="bg-background/50 p-2 rounded-md text-sm whitespace-pre-wrap overflow-auto">
                      {JSON.stringify(validation.details, null, 2)}
                    </pre>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </TabsContent>

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
                      {user.user_roles?.map(role => role.role).join(", ")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await generateMagicLink(user.id);
                            toast({
                              title: "Success",
                              description: "Magic link generated and sent successfully",
                            });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
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
