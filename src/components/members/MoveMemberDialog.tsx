import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MoveMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (memberId: string, newCollectorId: string) => void;
  member: any;
  collectors: any[];
}

export function MoveMemberDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  member,
  collectors,
}: MoveMemberDialogProps) {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Move Member</DialogTitle>
          <DialogDescription>
            Select a new collector for this member
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const newCollectorId = formData.get('new_collector_id') as string;
          if (member && newCollectorId) {
            onSubmit(member.id, newCollectorId);
          }
        }} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new_collector_id" className="text-right">
                New Collector
              </Label>
              <Select name="new_collector_id" defaultValue={member.collector_id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a collector" />
                </SelectTrigger>
                <SelectContent>
                  {collectors?.map((collector) => (
                    <SelectItem 
                      key={collector.id} 
                      value={collector.id}
                      disabled={collector.id === member.collector_id}
                    >
                      {collector.name || `Collector ${collector.number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Move Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}