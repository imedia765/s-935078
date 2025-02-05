
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";

interface AuditViewProps {
  auditLogs: any[];
}

export const AuditView = ({ auditLogs }: AuditViewProps) => {
  return (
    <div className="glass-card p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <History className="h-4 w-4" />
        Recent Role Changes
      </h3>
      <ScrollArea className="h-[200px]">
        {auditLogs?.map((log: any, index: number) => (
          <div key={index} className="mb-2 p-2 border-b last:border-0">
            <div className="flex justify-between text-sm">
              <span>{new Date(log.timestamp).toLocaleString()}</span>
              <span className="font-medium">{log.operation}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {JSON.stringify(log.new_values)}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};
