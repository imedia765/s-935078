import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BackupRecord } from "@/types/maintenance";

export function BackupManagement() {
  const { toast } = useToast();
  const [isBackingUp, setIsBackingUp] = useState(false);

  const { data: backups, refetch } = useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      const { data: rpcData, error } = await supabase.rpc('generate_full_backup');
      if (error) throw error;
      return rpcData as BackupRecord[];
    }
  });

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const { data, error } = await supabase.rpc('generate_full_backup');
      if (error) throw error;
      
      toast({
        title: "Backup Created",
        description: "System backup has been created successfully",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    try {
      const { data, error } = await supabase.rpc('restore_from_backup', { backup_id: backupId });
      if (error) throw error;
      
      toast({
        title: "Restore Initiated",
        description: "System restore has been initiated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Backup Management</h3>
        <div className="space-x-2">
          <Button onClick={handleBackup} disabled={isBackingUp}>
            <Download className="mr-2 h-4 w-4" />
            {isBackingUp ? "Creating Backup..." : "Create Backup"}
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Backup
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backups?.map((backup: any) => (
            <TableRow key={backup.id}>
              <TableCell>{new Date(backup.created_at).toLocaleString()}</TableCell>
              <TableCell>{backup.size}</TableCell>
              <TableCell>{backup.status}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(backup.id)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Restore
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}