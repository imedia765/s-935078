
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, Save } from "lucide-react";

type AppRole = 'admin' | 'collector' | 'member';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermission {
  role: AppRole;
  permission_name: string;
  granted: boolean;
}

export function RolePermissionsMatrix() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: rolePermissions, isLoading } = useQuery({
    queryKey: ["rolePermissions"],
    queryFn: async () => {
      // Fetch the base permissions first
      const { data: basePermissionsData, error: permError } = await supabase
        .from('permissions')
        .select('id, name, description, category');

      if (permError || !basePermissionsData) {
        throw new Error("Failed to fetch base permissions");
      }

      const basePermissions = basePermissionsData as Permission[];

      // Then fetch the roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role');

      if (rolesError || !rolesData) {
        throw new Error("Failed to fetch roles");
      }

      const uniqueRoles = Array.from(new Set(rolesData.map(r => r.role))) as AppRole[];

      // Create matrix
      const matrix: RolePermission[] = uniqueRoles.flatMap(role =>
        basePermissions.map(p => ({
          role,
          permission_name: p.name,
          granted: false
        }))
      );

      // Get existing role permissions
      const { data: existingPerms } = await supabase
        .from('role_permissions')
        .select('role, permission_name, created_at');

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
        roles: uniqueRoles,
        permissions: basePermissions
      };
    }
  });

  const handlePermissionChange = (role: AppRole, permission: string) => {
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
      const { data, error } = await supabase.rpc('approve_role_change', {
        role_data: JSON.stringify(permissions)
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
      
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
    } catch (error: any) {
      console.error('Error saving permissions:', error);
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
          {saving ? 'Saving...' : 'Save Changes'}
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
