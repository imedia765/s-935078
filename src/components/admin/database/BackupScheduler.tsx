
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackupSchedule } from "@/types/maintenance";

export function BackupScheduler() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [retentionDays, setRetentionDays] = useState("30");

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["backupSchedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_schedules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BackupSchedule[];
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      const cronExpression = frequency === 'daily' ? '0 0 * * *' : 
                            frequency === 'weekly' ? '0 0 * * 0' : 
                            '0 0 1 * *';

      const { error } = await supabase
        .from('backup_schedules')
        .insert({
          schedule_name: scheduleName,
          frequency,
          cron_expression: cronExpression,
          retention_days: parseInt(retentionDays),
          next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backupSchedules"] });
      setIsOpen(false);
      toast({
        title: "Success",
        description: "Backup schedule created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const toggleScheduleStatus = useMutation({
    mutationFn: async (schedule: BackupSchedule) => {
      const { error } = await supabase
        .from('backup_schedules')
        .update({ status: schedule.status === 'active' ? 'inactive' : 'active' })
        .eq('id', schedule.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backupSchedules"] });
      toast({
        title: "Success",
        description: "Schedule status updated successfully",
      });
    }
  });

  const handleCreateSchedule = () => {
    createScheduleMutation.mutate();
  };

  if (isLoading) {
    return <div>Loading backup schedules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Backup Schedules</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Backup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Backup Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Schedule Name</Label>
                <Input
                  id="name"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="Daily Production Backup"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={frequency} onValueChange={(value: "daily" | "weekly" | "monthly") => setFrequency(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="retention">Retention (days)</Label>
                <Input
                  id="retention"
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateSchedule} className="w-full">
                Create Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Schedule Name</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Retention Days</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Next Run</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules?.map((schedule) => (
            <TableRow key={schedule.id}>
              <TableCell>{schedule.schedule_name}</TableCell>
              <TableCell className="capitalize">{schedule.frequency}</TableCell>
              <TableCell>{schedule.retention_days} days</TableCell>
              <TableCell>
                {schedule.last_run ? new Date(schedule.last_run).toLocaleString() : 'Never'}
              </TableCell>
              <TableCell>
                {schedule.next_run ? new Date(schedule.next_run).toLocaleString() : 'Not scheduled'}
              </TableCell>
              <TableCell>
                <Button
                  variant={schedule.status === 'active' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => toggleScheduleStatus.mutate(schedule)}
                >
                  {schedule.status}
                </Button>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => {}}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
