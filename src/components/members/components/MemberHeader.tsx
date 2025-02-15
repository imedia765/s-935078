
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Zap, Edit2, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

interface MemberHeaderProps {
  fullName: string;
  email: string;
  status: string;
  isProcessing: boolean;
  isExpanded: boolean;
  onRecordPayment: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleExpand: () => void;
}

export function MemberHeader({
  fullName,
  email,
  status,
  isProcessing,
  isExpanded,
  onRecordPayment,
  onEdit,
  onDelete,
  onToggleExpand,
}: MemberHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'inactive':
        return 'bg-red-500/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    }
  };

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium truncate">{fullName}</h3>
          <Badge variant="outline" className={`shrink-0 ${getStatusColor(status)}`}>
            {status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Mail className="h-4 w-4" />
          <span className="truncate">{email}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRecordPayment}
          disabled={isProcessing}
          className="h-8 px-2 bg-primary/20 hover:bg-primary/30"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          <span className="hidden sm:inline ml-1">Quick Pay</span>
        </Button>
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
