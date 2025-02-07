
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { SmtpHealthStatus } from "./SmtpHealthStatus";

export function SmtpConfigList() {
  const { data: configs, isLoading } = useQuery({
    queryKey: ['smtpConfigs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smtp_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <SmtpHealthStatus />
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">SMTP Configurations</h3>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Configuration
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>From Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : configs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No SMTP configurations found</TableCell>
              </TableRow>
            ) : (
              configs?.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>{config.name}</TableCell>
                  <TableCell>{config.provider}</TableCell>
                  <TableCell>{config.host}</TableCell>
                  <TableCell>{config.from_address}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded ${
                      config.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

