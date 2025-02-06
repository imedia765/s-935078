
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User } from "../types/role-types";
import { Shield, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserTableProps {
  users: User[];
  generateMagicLink: (userId: string) => Promise<void>;
}

export const UserTable = ({ users, generateMagicLink }: UserTableProps) => {
  const { toast } = useToast();

  const handleQuickFix = async (memberNumber: string | undefined) => {
    if (!memberNumber) {
      toast({
        title: "Error",
        description: "Member number is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Attempting quick fix for member:", memberNumber);
      
      // Reset failed login attempts
      const { error: resetError } = await supabase.rpc('reset_login_state', {
        p_member_number: memberNumber
      });

      if (resetError) throw resetError;

      // Cleanup any failed attempts
      const { error: cleanupError } = await supabase.rpc('cleanup_failed_attempts', {
        p_member_number: memberNumber
      });

      if (cleanupError) throw cleanupError;

      // Update member status to active if needed
      const { error: updateError } = await supabase
        .from('members')
        .update({ status: 'active' })
        .eq('member_number', memberNumber);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Login state reset for member ${memberNumber}`,
      });
    } catch (error: any) {
      console.error('Quick fix error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
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
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name || 'N/A'}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.member_number || 'N/A'}</TableCell>
              <TableCell className="font-mono text-sm">{user.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {user.user_roles?.map(role => role.role).join(", ")}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateMagicLink(user.id)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Magic Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFix(user.member_number)}
                  >
                    Quick Fix Login
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
