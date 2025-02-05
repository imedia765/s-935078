import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

export const RolePermissionsMatrix = () => {
  const { data: permissions, isLoading } = useQuery({
    queryKey: ["rolePermissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role');

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div>Loading permissions...</div>;

  const roles = [...new Set(permissions?.map(p => p.role))];
  const uniquePermissions = [...new Set(permissions?.map(p => p.permission_name))];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Role Permissions Matrix
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permission</TableHead>
            {roles.map(role => (
              <TableHead key={role} className="text-center">{role}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {uniquePermissions.map(permission => (
            <TableRow key={permission}>
              <TableCell className="font-medium">{permission}</TableCell>
              {roles.map(role => (
                <TableCell key={`${role}-${permission}`} className="text-center">
                  {permissions?.some(p => 
                    p.role === role && 
                    p.permission_name === permission
                  ) ? '✓' : '—'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};