import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectorSelect } from "@/components/collectors/CollectorSelect";

interface ActivateMemberDialogProps {
  member: {
    id: string;
    full_name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ActivateMemberDialog({
  member,
  isOpen,
  onClose,
  onUpdate
}: ActivateMemberDialogProps) {
  const [selectedCollectorId, setSelectedCollectorId] = useState("");
  const { toast } = useToast();
  
  const { data: collectors } = useQuery({
    queryKey: ['collectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collectors')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleActivate = async () => {
    if (!selectedCollectorId) {
      toast({
        title: "Collector Required",
        description: "Please select a collector before activating the member",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          collector_id: selectedCollectorId,
          collector: collectors?.find(c => c.id === selectedCollectorId)?.name,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id);

      if (updateError) throw updateError;

      toast({
        title: "Member Activated",
        description: "Member has been successfully activated and assigned a collector"
      });
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error activating member:', error);
      toast({
        title: "Error",
        description: "Failed to activate member",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activate Member: {member.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Collector</label>
            <CollectorSelect
              collectors={collectors || []}
              currentCollectorId=""
              selectedCollectorId={selectedCollectorId}
              onCollectorChange={setSelectedCollectorId}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleActivate}>
              Activate Member
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}