import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export function RoleManagement() {
  const { toast } = useToast();

  const { data: roleValidation, isLoading, refetch } = useQuery({
    queryKey: ["roleValidation"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('validate_user_roles');
      if (error) throw error;
      return data;
    }
  });

  const handleFixRoleError = async (userId: string, errorType: string) => {
    try {
      const { error } = await supabase.rpc('fix_role_error', {
        p_user_id: userId,
        p_error_type: errorType
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Role error has been fixed",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div>Loading role validation...</div>;

  return (
    <div className="space-y-4">
      {roleValidation?.map((validation: any, index: number) => (
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
          <AlertTitle className="flex items-center gap-2">
            {validation.check_type}
            {validation.status !== 'Good' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFixRoleError(validation.details?.user_id, validation.check_type)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Fix Issue
              </Button>
            )}
          </AlertTitle>
          <AlertDescription>
            <pre className="mt-2 text-sm whitespace-pre-wrap">
              {JSON.stringify(validation.details, null, 2)}
            </pre>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}