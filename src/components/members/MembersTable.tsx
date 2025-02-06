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
  PlusCircle
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
import { useToast } from "@/components/ui/use-toast";
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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
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
    } catch (error) {
      console.error('Error recording bulk payments:', error);
      toast({
        title: "Error",
        description: "Failed to record payments. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {selectedMembers.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedMembers.length} members selected
          </span>
          <Select
            value={paymentMethod}
            onValueChange={(value: 'cash' | 'bank') => setPaymentMethod(value)}
          >
            <SelectTrigger className="w-32">
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
            onClick={handleBulkPayment}
            className="bg-primary/20 hover:bg-primary/30"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Record Payments
          </Button>
        </div>
      )}
      <div className="space-y-4">
        {members?.map((member) => (
          <div key={member.id} className="flex items-start gap-4">
            <Checkbox
              checked={selectedMembers.includes(member.id)}
              onCheckedChange={(checked) => handleSelectMember(member.id, checked as boolean)}
              className="mt-6"
            />
            <div className="flex-1">
              <MemberProfileCard
                member={member}
                onEdit={() => onEdit(member)}
                onDelete={() => onDelete(member)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}