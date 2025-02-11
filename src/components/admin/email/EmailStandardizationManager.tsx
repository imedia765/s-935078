
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertCircle, CheckCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

interface EmailStandardization {
  member_number: string;
  current_auth_email: string;
  current_member_email: string;
  standardization_status: string;
  issues: string[];
}

export function EmailStandardizationManager() {
  const { toast } = useToast();

  const { data: standardizationResults, isLoading, refetch } = useQuery({
    queryKey: ["emailStandardization"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_email_standardization');
      if (error) throw error;
      return data as EmailStandardization[];
    }
  });

  const handleMigration = async (memberNumber: string) => {
    try {
      const { data, error } = await supabase.rpc('standardize_auth_emails', {
        p_member_number: memberNumber
      });
      
      if (error) {
        toast({
          title: "Migration Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email Migration Initiated",
        description: "The email standardization process has been started.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "An unexpected error occurred during migration",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  const legacyCount = standardizationResults?.filter(r => r.standardization_status === 'legacy').length || 0;
  const personalCount = standardizationResults?.filter(r => r.standardization_status === 'personal').length || 0;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Email Standardization Management</h2>
          <Button onClick={() => refetch()} variant="outline">
            Refresh Status
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Legacy Format (@temp.com)</p>
                <p className="text-2xl font-bold">{legacyCount}</p>
              </div>
              <AlertCircle className={`h-8 w-8 ${legacyCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Personal Emails</p>
                <p className="text-2xl font-bold">{personalCount}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member Number</TableHead>
                <TableHead>Current Auth Email</TableHead>
                <TableHead>Member Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standardizationResults?.map((result) => (
                <TableRow key={result.member_number}>
                  <TableCell>{result.member_number}</TableCell>
                  <TableCell>{result.current_auth_email}</TableCell>
                  <TableCell>{result.current_member_email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {result.standardization_status === 'standardized' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : result.standardization_status === 'legacy' ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-500" />
                      )}
                      {result.standardization_status}
                    </div>
                  </TableCell>
                  <TableCell>
                    {result.issues.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {result.issues.map((issue, index) => (
                          <li key={index} className="text-red-500">{issue}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-green-500">No issues</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {result.standardization_status === 'legacy' && (
                      <Button
                        size="sm"
                        onClick={() => handleMigration(result.member_number)}
                      >
                        Migrate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
