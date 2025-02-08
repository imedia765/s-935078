
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, Save } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermission {
  role: string;
  permission_name: string;
  granted: boolean;
}

export function RolePermissionsMatrix() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: rolePermissions, isLoading } = useQuery({
    queryKey: ["rolePermissions"],
    queryFn: async () => {
      const [{ data: roles }, { data: perms }] = await Promise.all([
        supabase.from('roles').select('*'),
        supabase.from('permissions').select('*')
      ]);

      if (!roles || !perms) throw new Error("Failed to fetch roles or permissions");

      const matrix = roles.flatMap(role =>
        perms.map(perm => ({
          role: role.name,
          permission_name: perm.name,
          granted: false
        }))
      );

      const { data: existingPerms } = await supabase
        .from('role_permissions')
        .select('*');

      if (existingPerms) {
        existingPerms.forEach(ep => {
          const index = matrix.findIndex(
            m => m.role === ep.role && m.permission_name === ep.permission_name
          );
          if (index !== -1) {
            matrix[index].granted = true;
          }
        });
      }

      setPermissions(matrix);
      return {
        roles: roles,
        permissions: perms as Permission[]
      };
    }
  });

  const handlePermissionChange = (role: string, permission: string) => {
    setPermissions(prev => prev.map(p => {
      if (p.role === role && p.permission_name === permission) {
        return { ...p, granted: !p.granted };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc('update_role_permissions', {
        permissions_array: permissions
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div>Loading permissions matrix...</div>;

  const roles = [...new Set(permissions.map(p => p.role))];
  const uniquePermissions = rolePermissions?.permissions || [];
  const categories = [...new Set(uniquePermissions.map(p => p.category))];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Permissions Matrix
        </h3>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Permission</TableHead>
              {roles.map(role => (
                <TableHead key={role} className="text-center">{role}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(category => (
              <>
                <TableRow key={category}>
                  <TableCell colSpan={roles.length + 1} className="bg-muted/50 font-medium">
                    {category}
                  </TableCell>
                </TableRow>
                {uniquePermissions
                  .filter(permission => permission.category === category)
                  .map(permission => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{permission.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {permission.description}
                          </div>
                        </div>
                      </TableCell>
                      {roles.map(role => (
                        <TableCell key={`${role}-${permission.id}`} className="text-center">
                          <Checkbox
                            checked={permissions.find(
                              p => p.role === role && p.permission_name === permission.name
                            )?.granted}
                            onCheckedChange={() => handlePermissionChange(role, permission.name)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
