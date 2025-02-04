import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditMemberDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: any) => void;
  member: any;
  collectors: any[];
}

export function EditMemberDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  member, 
  collectors 
}: EditMemberDialogProps) {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Update the member details below
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const memberData = {
            full_name: formData.get('full_name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            member_number: formData.get('member_number') as string,
            collector_id: formData.get('collector_id') as string,
          };
          onSubmit(member.id, memberData);
        }} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Full Name
              </Label>
              <Input
                id="full_name"
                name="full_name"
                className="col-span-3"
                defaultValue={member.full_name}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="col-span-3"
                defaultValue={member.email}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                className="col-span-3"
                defaultValue={member.phone}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member_number" className="text-right">
                Member Number
              </Label>
              <Input
                id="member_number"
                name="member_number"
                className="col-span-3"
                defaultValue={member.member_number}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="collector_id" className="text-right">
                Collector
              </Label>
              <Select name="collector_id" defaultValue={member.collector_id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a collector" />
                </SelectTrigger>
                <SelectContent>
                  {collectors?.map((collector) => (
                    <SelectItem key={collector.id} value={collector.id}>
                      {collector.name || `Collector ${collector.number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Update Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}