import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function BackupScheduler() {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["backupSchedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_schedules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>Loading backup schedules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Backup Schedules</h3>
        <div className="space-x-2">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Create Backup
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Backup
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Schedule Name</TableHead>
            <TableHead>Cron Expression</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules?.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>{schedule.schedule_name}</TableCell>
              <TableCell>{schedule.cron_expression}</TableCell>
              <TableCell>
                {schedule.last_run ? new Date(schedule.last_run).toLocaleString() : 'Never'}
              </TableCell>
              <TableCell>
                {schedule.next_run ? new Date(schedule.next_run).toLocaleString() : 'Not scheduled'}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-sm ${
                  schedule.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {schedule.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}