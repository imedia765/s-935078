
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronUp, Zap, Edit2, Trash2, Mail, Phone, Calendar, User, Home, Users, CreditCard, Clock, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface MemberProfileCardProps {
  member: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  onMove?: () => void;
  onExportIndividual?: () => void;
}

export function MemberProfileCard({
  member,
  onEdit,
  onDelete,
  onToggleStatus,
  onMove,
  onExportIndividual
}: MemberProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
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

  const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | null }) => (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground truncate">{value || 'Not set'}</span>
    </div>
  );

  const handleRecordPayment = async () => {
    try {
      setIsProcessing(true);
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
          amount: member.yearly_payment_amount || 40,
          payment_type: 'yearly',
          payment_method: paymentMethod,
          status: 'pending',
          notes: 'Quick yearly membership payment'
        });

      if (error) throw error;

      toast({
        title: "Payment Recorded",
        description: "Payment has been recorded and is pending approval",
      });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200">
      <div className="p-3 space-y-2">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium truncate">{member.full_name}</h3>
              <Badge variant="outline" className={`shrink-0 ${getStatusColor(member.status)}`}>
                {member.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Mail className="h-4 w-4" />
              <span className="truncate">{member.email}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRecordPayment}
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
        </div>

        {/* Quick Info Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <InfoItem icon={User} label="ID" value={member.member_number} />
          <InfoItem icon={Calendar} label="DOB" value={member.date_of_birth} />
          <InfoItem icon={Phone} label="Phone" value={member.phone} />
          <InfoItem icon={Home} label="Address" value={member.address} />
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-3">
            {/* Payment Info */}
            {(member.yearly_payment_status || member.emergency_collection_status) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {member.yearly_payment_status && (
                  <div className="bg-muted/30 rounded p-2">
                    <div className="text-sm font-medium mb-1">Yearly Payment</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{member.yearly_payment_status}</span>
                      {member.yearly_payment_amount && (
                        <span className="text-sm font-medium">
                          £{member.yearly_payment_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {member.yearly_payment_due_date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Due: {format(new Date(member.yearly_payment_due_date), 'PP')}
                      </div>
                    )}
                  </div>
                )}

                {member.emergency_collection_status && (
                  <div className="bg-muted/30 rounded p-2">
                    <div className="text-sm font-medium mb-1">Emergency Collection</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{member.emergency_collection_status}</span>
                      {member.emergency_collection_amount && (
                        <span className="text-sm font-medium">
                          £{member.emergency_collection_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {member.emergency_collection_due_date && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Due: {format(new Date(member.emergency_collection_due_date), 'PP')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Family Members */}
            {member.family_members && member.family_members.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Family Members</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {member.family_members.map((familyMember: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-muted/30 rounded p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {familyMember.full_name}
                          </span>
                          <Badge variant="outline" className="shrink-0">
                            {familyMember.relationship}
                          </Badge>
                        </div>
                        {familyMember.date_of_birth && (
                          <div className="text-xs text-muted-foreground">
                            DOB: {format(new Date(familyMember.date_of_birth), 'PP')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {member.member_notes && member.member_notes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  <h4 className="text-sm font-medium">Notes</h4>
                </div>
                <div className="space-y-2">
                  {member.member_notes.map((note: any, index: number) => (
                    <div key={index} className="bg-muted/30 rounded p-2">
                      <Badge variant="outline" className="mb-1">
                        {note.note_type}
                      </Badge>
                      <p className="text-sm">{note.note_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
