
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, UserCog, FileText, Power } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MemberInfo } from "./components/MemberInfo";

interface MemberProfileCardProps {
  member: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onMove: () => void;
  onExportIndividual: (member: any) => void;
}

export function MemberProfileCard({
  member,
  onEdit,
  onDelete,
  onToggleStatus,
  onMove,
  onExportIndividual,
}: MemberProfileCardProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'inactive':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'overdue':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getCollectorColor = (collector: string | null) => {
    return collector 
      ? 'text-primary dark:text-primary/90'
      : 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Card className="glass-card p-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-4 flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {member.full_name}
              </h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  getStatusColor(member.status)
                )}>
                  {member.status || 'Unknown Status'}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className={cn(
                  "text-sm",
                  getPaymentStatusColor(member.yearly_payment_status)
                )}>
                  {member.yearly_payment_status || 'No Payment Status'}
                </span>
              </div>
              <span className={cn(
                "text-sm block mt-1",
                getCollectorColor(member.collector)
              )}>
                Collector: {member.collector || 'Not Assigned'}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleStatus}>
                  <Power className="mr-2 h-4 w-4" />
                  Toggle Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMove}>
                  <UserCog className="mr-2 h-4 w-4" />
                  Move Member
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExportIndividual(member)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <MemberInfo
            memberNumber={member.member_number}
            dateOfBirth={member.date_of_birth}
            phone={member.phone}
            address={member.address}
          />
        </div>
      </div>
    </Card>
  );
}
