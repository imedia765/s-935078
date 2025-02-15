
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail } from "lucide-react";

interface UserTableProps {
  users: any[];
  generateMagicLink: (userId: string) => Promise<void>;
}

export function UserTable({ users, generateMagicLink }: UserTableProps) {
  const [loadingUserId, setLoadingUserId] = React.useState<string | null>(null);

  const handleGenerateMagicLink = async (userId: string) => {
    setLoadingUserId(userId);
    try {
      await generateMagicLink(userId);
    } finally {
      setLoadingUserId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Member #</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.member_number}</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {user.user_roles?.map((role: any) => (
                    <Badge key={role.role} variant="secondary">
                      {role.role}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateMagicLink(user.id)}
                  disabled={loadingUserId === user.id}
                  aria-label={`Generate magic link for ${user.full_name}`}
                >
                  {loadingUserId === user.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Magic Link</span>
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
