import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Database } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface IntegrityCheck {
  check_type: string;
  status: string;
  details: Record<string, any>;
}

export function DataIntegrity() {
  const { data: integrityChecks, isLoading } = useQuery({
    queryKey: ["dataIntegrity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_data_integrity');
      if (error) throw error;
      return data as IntegrityCheck[];
    },
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return <div>Loading integrity checks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-5 w-5" />
        <h3 className="text-lg font-medium">Data Integrity Status</h3>
      </div>

      {integrityChecks?.map((check, index) => (
        <Alert
          key={index}
          variant={check.status === 'Good' ? 'default' : 'warning'}
          className="flex items-start"
        >
          {check.status === 'Good' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <div>
            <AlertTitle>{check.check_type}</AlertTitle>
            <AlertDescription>
              <div className="mt-2 text-sm">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(check.details, null, 2)}
                </pre>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      ))}
    </div>
  );
}