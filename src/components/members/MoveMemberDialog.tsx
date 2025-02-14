
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface MoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (collectorId: string) => void;
  collectors: any[];
  loading?: boolean;
  memberName?: string;
}

export function MoveMemberDialog({
  open,
  onOpenChange,
  onConfirm,
  collectors,
  loading,
  memberName,
}: MoveMemberDialogProps) {
  const [selectedCollector, setSelectedCollector] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move Member to Another Collector</DialogTitle>
          <DialogDescription>
            Select a new collector for {memberName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select
            value={selectedCollector}
            onValueChange={setSelectedCollector}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select collector" />
            </SelectTrigger>
            <SelectContent>
              {collectors?.map((collector) => (
                collector.id && (
                  <SelectItem key={collector.id} value={collector.id}>
                    {collector.name || `Collector ${collector.member_number}`} (#{collector.member_number})
                  </SelectItem>
                )
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedCollector)}
            disabled={!selectedCollector || loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Moving..." : "Move Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
