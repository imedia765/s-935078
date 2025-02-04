import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cpu, HardDrive, Network, Memory } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SystemResources() {
  const { data: resources } = useQuery({
    queryKey: ["systemResources"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_system_resources');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          <h4 className="font-medium">CPU Usage</h4>
        </div>
        <Progress value={resources?.cpu_usage || 0} />
        <p className="text-sm text-muted-foreground">{resources?.cpu_usage || 0}%</p>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Memory className="h-4 w-4" />
          <h4 className="font-medium">Memory Usage</h4>
        </div>
        <Progress value={resources?.memory_usage || 0} />
        <p className="text-sm text-muted-foreground">{resources?.memory_usage || 0}%</p>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          <h4 className="font-medium">Disk Space</h4>
        </div>
        <Progress value={resources?.disk_usage || 0} />
        <p className="text-sm text-muted-foreground">{resources?.disk_usage || 0}%</p>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4" />
          <h4 className="font-medium">Network Status</h4>
        </div>
        <p className="text-sm text-muted-foreground">{resources?.network_status || "Unknown"}</p>
      </Card>
    </div>
  );
}