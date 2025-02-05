import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Users,
  Activity,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberProfileCardProps {
  member: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    member_number: string;
    status: string;
    payment_date?: string;
    yearly_payment_status?: string;
    family_members?: Array<{
      full_name: string;
      relationship: string;
    }>;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MemberProfileCard({ member, onEdit, onDelete }: MemberProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/20 text-green-700';
      case 'inactive':
        return 'bg-red-500/20 text-red-700';
      default:
        return 'bg-yellow-500/20 text-yellow-700';
    }
  };

  const getPaymentStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className="p-6 glass-card transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{member.full_name}</h3>
            <Badge className={cn("text-xs", getStatusColor(member.status))}>
              {member.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{member.email}</p>
          <p className="text-sm font-mono">{member.member_number}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(member.id)}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(member.id)}
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
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

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* Payment Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Payment Status</span>
            </div>
            <div className="flex items-center gap-2">
              {getPaymentStatusIcon(member.yearly_payment_status)}
              <span className="text-sm">
                {member.yearly_payment_status || 'No payment recorded'}
              </span>
            </div>
          </div>

          {/* Family Members Preview */}
          {member.family_members && member.family_members.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Family Members</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {member.family_members.map((familyMember, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm"
                  >
                    <span className="font-medium">{familyMember.full_name}</span>
                    <Badge variant="outline" className="ml-auto">
                      {familyMember.relationship}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Recent Activity</span>
            </div>
            <div className="space-y-2">
              {member.payment_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Last payment: {new Date(member.payment_date).toLocaleDateString()}</span>
                </div>
              )}
              {/* Add more activity items here */}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}