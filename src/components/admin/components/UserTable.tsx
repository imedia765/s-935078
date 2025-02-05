
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User } from "../types/role-types";

interface UserTableProps {
  users: User[];
  generateMagicLink: (userId: string) => Promise<void>;
}

export const UserTable = ({ users, generateMagicLink }: UserTableProps) => {
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
                {user.user_roles?.map(role => role.role).join(", ")}
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
  );
};
