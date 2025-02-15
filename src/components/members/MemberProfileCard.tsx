
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MemberHeader } from "./components/MemberHeader";
import { MemberInfo } from "./components/MemberInfo";
import { PaymentInfo } from "./components/PaymentInfo";
import { FamilyMembers } from "./components/FamilyMembers";
import { MemberNotes } from "./components/MemberNotes";

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
        <MemberHeader
          fullName={member.full_name}
          email={member.email}
          status={member.status}
          isProcessing={isProcessing}
          isExpanded={isExpanded}
          onRecordPayment={handleRecordPayment}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />

        <MemberInfo
          memberNumber={member.member_number}
          dateOfBirth={member.date_of_birth}
          phone={member.phone}
          address={member.address}
        />

        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-3">
            <PaymentInfo
              yearlyStatus={member.yearly_payment_status}
              yearlyAmount={member.yearly_payment_amount}
              yearlyDueDate={member.yearly_payment_due_date}
              emergencyStatus={member.emergency_collection_status}
              emergencyAmount={member.emergency_collection_amount}
              emergencyDueDate={member.emergency_collection_due_date}
            />

            <FamilyMembers
              members={member.family_members}
            />

            <MemberNotes
              notes={member.member_notes}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
