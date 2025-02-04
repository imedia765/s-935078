import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  PauseCircle,
  PlayCircle,
  ArrowRightLeft,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface MembersTableProps {
  members: any[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onEdit: (member: any) => void;
  onToggleStatus: (member: any) => void;
  onMove: (member: any) => void;
  onExportIndividual: (member: any) => void;
  onDelete: (member: any) => void;
}

export function MembersTable({
  members,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onToggleStatus,
  onMove,
  onExportIndividual,
  onDelete,
}: MembersTableProps) {
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-muted/50">
          <TableHead onClick={() => onSort('member_number')} className="cursor-pointer">
            Member Number {getSortIcon('member_number')}
          </TableHead>
          <TableHead onClick={() => onSort('full_name')} className="cursor-pointer">
            Full Name {getSortIcon('full_name')}
          </TableHead>
          <TableHead onClick={() => onSort('email')} className="cursor-pointer">
            Email {getSortIcon('email')}
          </TableHead>
          <TableHead onClick={() => onSort('phone')} className="cursor-pointer">
            Phone {getSortIcon('phone')}
          </TableHead>
          <TableHead>Collector</TableHead>
          <TableHead onClick={() => onSort('status')} className="cursor-pointer">
            Status {getSortIcon('status')}
          </TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members?.map((member) => (
          <TableRow key={member.id} className="border-border hover:bg-muted/50">
            <TableCell>{member.member_number}</TableCell>
            <TableCell>{member.full_name}</TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell>{member.phone || 'N/A'}</TableCell>
            <TableCell>
              {member.members_collectors?.name || 'No Collector'}
            </TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-sm ${
                member.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {member.status || 'Unknown'}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(member)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onToggleStatus(member)}
                >
                  {member.status === 'active' ? (
                    <PauseCircle className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onMove(member)}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onExportIndividual(member)}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this member?')) {
                      onDelete(member);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}