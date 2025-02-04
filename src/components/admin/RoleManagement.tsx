import { AlertCircle, CheckCircle2, XCircle, History, Search, UserSearch } from "lucide-react";
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
  user_roles?: { role: string }[];
}

export function RoleManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("table");

  // Query for all users and their roles
  const { data: userData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log("Fetching all users data...");
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error("Users fetch error:", usersError);
        throw usersError;
      }

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        users.users.map(async (user) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          
          return {
            id: user.id,
            email: user.email,
            user_roles: roles || []
          };
        })
      );

      return usersWithRoles as User[];
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

  const handleFixRoleError = async (userId: string, errorType: string) => {
    try {
      console.log(`Attempting to fix role error for user ${userId}, type: ${errorType}`);
      
      const { data, error } = await supabase.rpc('fix_role_error', {
        p_user_id: userId,
        p_error_type: errorType
      });
      
      if (error) throw error;

      await supabase.from('audit_logs').insert([{
        table_name: 'user_roles',
        operation: 'UPDATE',
        record_id: userId,
        new_values: {
          error_type: errorType,
          resolution: 'automatic_fix'
        }
      }]);

      await refetch();
      
      toast({
        title: "Success",
        description: "Role error fixed successfully",
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

  const generateMagicLink = async (userId: string) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('member_number')
        .eq('auth_user_id', userId)
        .single();

      if (memberError) throw memberError;
      if (!memberData?.member_number) throw new Error('Member not found');

      const { data, error } = await supabase.rpc('generate_magic_link_token', {
        p_member_number: memberData.member_number
      });

      if (error) throw error;

      const magicLink = `${window.location.origin}/reset-password?token=${data}`;
      await navigator.clipboard.writeText(magicLink);

      toast({
        title: "Magic Link Generated",
        description: "Link has been copied to clipboard",
      });
    } catch (error: any) {
      console.error("Error generating magic link:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = userData?.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingUsers || isLoadingValidation) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  <TableHead>Email</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
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
            {roleValidation?.validation?.map((validation: any, index: number) => (
              <Alert
                key={index}
                variant={validation.status === 'Good' ? 'default' : 'destructive'}
                className="glass-card"
              >
                {validation.status === 'Good' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="flex items-center justify-between">
                  <span>{validation.check_type}</span>
                  <div className="flex gap-2">
                    {validation.status !== 'Good' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFixRoleError(validation.details?.user_id, validation.check_type)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Fix Issue
                        </Button>
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
                  <pre className="mt-2 text-sm whitespace-pre-wrap">
                    {JSON.stringify(validation.details, null, 2)}
                  </pre>
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
              {roleValidation?.auditLogs?.map((log: any, index: number) => (
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
      </Tabs>
    </div>
  );
}
