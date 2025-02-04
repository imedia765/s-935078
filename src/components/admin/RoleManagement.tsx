import { AlertCircle, CheckCircle2, XCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

export function RoleManagement() {
  const { toast } = useToast();

  // Query for role validation status
  const { data: roleValidation, isLoading, refetch } = useQuery({
    queryKey: ["roleValidation"],
    queryFn: async () => {
      console.log("Fetching role validation data...");
      const { data: validationData, error: validationError } = await supabase.rpc('validate_user_roles');
      
      if (validationError) {
        console.error("Role validation error:", validationError);
        throw validationError;
      }

      // Also fetch role audit logs
      const { data: auditLogs, error: auditError } = await supabase
        .from('role_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
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

      // Log the role change
      await supabase.from('role_audit_logs').insert([{
        user_id: userId,
        action: 'fix_role_error',
        details: {
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
      const { data, error } = await supabase.rpc('generate_magic_link_token', {
        p_user_id: userId
      });

      if (error) throw error;

      // Create a magic link URL
      const magicLink = `${window.location.origin}/reset-password?token=${data}`;
      
      // Copy to clipboard
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

  if (isLoading) return <div>Loading role validation...</div>;

  return (
    <div className="space-y-6">
      {/* Role Validation Alerts */}
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

      {/* Audit Logs */}
      <div className="glass-card p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <History className="h-4 w-4" />
          Recent Role Changes
        </h3>
        <ScrollArea className="h-[200px]">
          {roleValidation?.auditLogs?.map((log: any, index: number) => (
            <div key={index} className="mb-2 p-2 border-b last:border-0">
              <div className="flex justify-between text-sm">
                <span>{new Date(log.created_at).toLocaleString()}</span>
                <span className="font-medium">{log.action}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {JSON.stringify(log.details)}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}