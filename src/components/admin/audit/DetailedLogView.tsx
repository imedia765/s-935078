
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardCheck, 
  AlertTriangle, 
  Info, 
  Clock, 
  User, 
  Database,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DetailedLogViewProps {
  log: {
    timestamp: string;
    operation: string;
    table_name: string;
    severity: string;
    details: any;
    user_id?: string;
  } | null;
  onClose: () => void;
}

export function DetailedLogView({ log, onClose }: DetailedLogViewProps) {
  if (!log) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Dialog open={!!log} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Audit Log Details</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <Badge variant={log.severity.toLowerCase() as "default" | "warning" | "destructive"}>
              {getSeverityIcon(log.severity)}
              <span className="ml-1">{log.severity}</span>
            </Badge>
          </div>

          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Operation:</span>
              <span>{log.operation} on {log.table_name}</span>
            </div>
            {log.user_id && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">User ID:</span>
                <span>{log.user_id}</span>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium mb-2">Details</h3>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <pre className="text-sm">
                {formatValue(log.details)}
              </pre>
            </ScrollArea>
          </Card>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(formatValue(log));
                // You could add a toast here to confirm the copy
              }}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
