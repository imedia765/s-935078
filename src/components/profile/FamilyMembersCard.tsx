
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { MemberWithRelations } from "@/types/member";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FamilyMembersCardProps {
  memberData: MemberWithRelations | null;
  onAddMember: () => void;
  onEditMember: (member: any) => void;
  onDeleteMember: (id: string) => void;
}

export function FamilyMembersCard({
  memberData,
  onAddMember,
  onEditMember,
  onDeleteMember
}: FamilyMembersCardProps) {
  const familyMembers = memberData?.family_members || [];

  return (
    <Card className="glass-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary">Family Members</h2>
        <Button onClick={onAddMember} className="bg-primary/20 hover:bg-primary/30">
          <Plus className="h-4 w-4 mr-2" />
          Add Family Member
        </Button>
      </div>
      {familyMembers.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No family members added</p>
      ) : (
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {familyMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.full_name}</TableCell>
                  <TableCell className="capitalize">{member.relationship}</TableCell>
                  <TableCell>
                    {member.date_of_birth 
                      ? format(new Date(member.date_of_birth), 'dd/MM/yyyy')
                      : 'Not set'}
                  </TableCell>
                  <TableCell className="capitalize">{member.gender || 'Not set'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditMember(member)}
                            className="h-8 w-8 bg-blue-500/20 hover:bg-blue-500/30"
                            aria-label={`Edit ${member.full_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit {member.full_name}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit {member.full_name}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteMember(member.id)}
                            className="h-8 w-8 bg-red-500/20 hover:bg-red-500/30"
                            aria-label={`Delete ${member.full_name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete {member.full_name}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete {member.full_name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      )}
    </Card>
  );
}
