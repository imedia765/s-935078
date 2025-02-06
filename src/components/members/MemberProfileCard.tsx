import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  Clock,
  Home,
  Phone,
  Mail,
  Calendar,
  User,
  CreditCard,
  PlusCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MemberProfileCardProps {
  member: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    member_number: string;
    status: string;
    address?: string;
    town?: string;
    postcode?: string;
    date_of_birth?: string;
    marital_status?: string;
    membership_type?: string;
    payment_date?: string;
    yearly_payment_status?: string;
    yearly_payment_due_date?: string;
    yearly_payment_amount?: number;
    emergency_collection_status?: string;
    emergency_collection_amount?: number;
    emergency_collection_due_date?: string;
    collector?: string;
    family_members?: Array<{
      full_name: string;
      relationship: string;
      date_of_birth?: string;
      gender?: string;
    }>;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function MemberProfileCard({ member, onEdit, onDelete }: MemberProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const { toast } = useToast();

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

  const handleRecordPayment = async () => {
    try {
      const { data: collector } = await supabase
        .from('members_collectors')
        .select('id')
        .eq('name', member.collector)
        .single();

      if (!collector) {
        throw new Error('Collector not found');
      }

      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          member_id: member.id,
          collector_id: collector.id,
          member_number: member.member_number,
          amount: 40,
          payment_type: 'yearly',
          payment_method: paymentMethod,
          status: 'pending',
          notes: 'Yearly membership payment'
        });

      if (error) throw error;

      toast({
        title: "Payment Recorded",
        description: "Payment has been recorded and is pending approval",
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6 glass-card transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-primary">{member.full_name}</h3>
            <Badge className={cn("text-xs font-medium", getStatusColor(member.status))}>
              {member.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{member.email}</p>
          <p className="text-sm font-mono text-primary/70">{member.member_number}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(member.id)}
              className="h-8 w-8 p-0 hover:text-primary"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(member.id)}
              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 hover:text-primary"
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
        <div className="mt-6 space-y-6 border-t pt-6">
          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-primary flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {member.date_of_birth && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary/70" />
                  <span>DOB: <span className="text-foreground">{format(new Date(member.date_of_birth), 'PPP')}</span></span>
                </div>
              )}
              {member.marital_status && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary/70" />
                  <span>Marital Status: <span className="text-foreground">{member.marital_status}</span></span>
                </div>
              )}
              {member.membership_type && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-primary/70" />
                  <span>Membership: <span className="text-foreground">{member.membership_type}</span></span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-primary flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-colors">
                <div className="text-sm font-medium mb-2 text-primary">Yearly Payment</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPaymentStatusIcon(member.yearly_payment_status)}
                    <span className="text-sm">{member.yearly_payment_status}</span>
                  </div>
                  {member.yearly_payment_amount && (
                    <span className="text-sm font-medium text-foreground">
                      £{member.yearly_payment_amount.toFixed(2)}
                    </span>
                  )}
                </div>
                {member.yearly_payment_due_date && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Due: {format(new Date(member.yearly_payment_due_date), 'PPP')}
                  </div>
                )}
                <div className="mt-2 space-y-2">
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: 'cash' | 'bank') => setPaymentMethod(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecordPayment}
                    className="w-full bg-primary/20 hover:bg-primary/30"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              </div>

              {/* Emergency Collection */}
              {member.emergency_collection_status && (
                <div className="bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-colors">
                  <div className="text-sm font-medium mb-2 text-primary">Emergency Collection</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getPaymentStatusIcon(member.emergency_collection_status)}
                      <span className="text-sm">{member.emergency_collection_status}</span>
                    </div>
                    {member.emergency_collection_amount && (
                      <span className="text-sm font-medium text-foreground">
                        £{member.emergency_collection_amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {member.emergency_collection_due_date && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Due: {format(new Date(member.emergency_collection_due_date), 'PPP')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Family Members */}
          {member.family_members && member.family_members.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                <Users className="h-4 w-4" />
                Family Members
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {member.family_members.map((familyMember, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 bg-muted/50 rounded-lg p-4 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{familyMember.full_name}</span>
                      <Badge variant="outline" className="text-primary">{familyMember.relationship}</Badge>
                    </div>
                    {familyMember.date_of_birth && (
                      <div className="text-xs text-muted-foreground">
                        DOB: {format(new Date(familyMember.date_of_birth), 'PPP')}
                      </div>
                    )}
                    {familyMember.gender && (
                      <div className="text-xs text-muted-foreground">
                        Gender: {familyMember.gender}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-primary flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </h4>
            <div className="space-y-2">
              {member.payment_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary/70" />
                  <span>Last payment: <span className="text-foreground">{format(new Date(member.payment_date), 'PPP')}</span></span>
                </div>
              )}
              {member.collector && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 text-primary/70" />
                  <span>Collector: <span className="text-foreground">{member.collector}</span></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
