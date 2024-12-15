import { Button } from "@/components/ui/button";
import { UserPlus, Printer } from "lucide-react";
import { CreateCollectorDialog } from "./CreateCollectorDialog";

interface CollectorHeaderProps {
  onPrintAll: () => void;
}

export function CollectorHeader({ onPrintAll }: CollectorHeaderProps) {
  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-4xl font-bold text-white">
        Collectors Management
      </h1>
      <div className="flex flex-wrap gap-2">
        <CreateCollectorDialog />
        <Button 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onPrintAll}
        >
          <Printer className="h-4 w-4" />
          Print All Collectors
        </Button>
      </div>
    </div>
  );
}