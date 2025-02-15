
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Loader2
} from "lucide-react";
import { MemberProfileCard } from "./MemberProfileCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash');
  const [isRecordingPayments, setIsRecordingPayments] = useState(false);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(members.map(m => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  const handleBulkPayment = async () => {
    try {
      setIsRecordingPayments(true);
      const payments = selectedMembers.map(async (memberId) => {
        const member = members.find(m => m.id === memberId);
        const { data: collector } = await supabase
          .from('members_collectors')
          .select('id')
          .eq('name', member.collector)
          .single();

        if (!collector) {
          throw new Error(`Collector not found for member ${member.member_number}`);
        }

        return {
          member_id: memberId,
          collector_id: collector.id,
          member_number: member.member_number,
          amount: 40,
          payment_type: 'yearly',
          payment_method: paymentMethod,
          status: 'pending',
          notes: 'Yearly membership payment'
        };
      });

      const { error } = await supabase
        .from('payment_requests')
        .insert(await Promise.all(payments));

      if (error) throw error;

      toast({
        title: "Payments Recorded",
        description: `${selectedMembers.length} payments have been recorded and are pending approval`,
      });

      setSelectedMembers([]);
    } catch (error: any) {
      console.error('Error recording bulk payments:', error);
      toast({
        title: "Error",
        description: "Failed to record payments: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsRecordingPayments(false);
    }
  };

  return (
    <div className="space-y-2 max-w-full overflow-hidden">
      {selectedMembers.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl">
          <div className="flex items-center gap-2 p-3 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg">
            <span className="text-sm text-muted-foreground whitespace-nowrap px-2">
              {selectedMembers.length} selected
            </span>
            <div className="flex-1 min-w-0">
              <Select
                value={paymentMethod}
                onValueChange={(value: 'cash' | 'bank_transfer') => setPaymentMethod(value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkPayment}
              disabled={isRecordingPayments}
              className="h-8 whitespace-nowrap bg-primary/20 hover:bg-primary/30"
            >
              {isRecordingPayments ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              {isRecordingPayments ? "Recording..." : "Record Payments"}
            </Button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 px-2">
        {members?.map((member) => (
          <div key={member.id} className="flex items-start gap-2">
            <Checkbox
              checked={selectedMembers.includes(member.id)}
              onCheckedChange={(checked) => handleSelectMember(member.id, checked as boolean)}
              className="mt-4 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <MemberProfileCard
                member={member}
                onEdit={() => onEdit(member)}
                onDelete={() => onDelete(member)}
                onToggleStatus={() => onToggleStatus(member)}
                onMove={() => onMove(member)}
                onExportIndividual={() => onExportIndividual(member)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
