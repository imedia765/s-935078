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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { MemberProfileCard } from "./MemberProfileCard";

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
    <div className="space-y-4">
      {members?.map((member) => (
        <MemberProfileCard
          key={member.id}
          member={member}
          onEdit={() => onEdit(member)}
          onDelete={() => onDelete(member)}
        />
      ))}
    </div>
  );
}