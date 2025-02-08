
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Save } from "lucide-react";

type RetentionPeriod = '30days' | '90days' | '180days' | '1year' | '2years';

export function LogRetentionConfig() {
  const { toast } = useToast();
  const [retentionPeriod, setRetentionPeriod] = useState<RetentionPeriod>('90days');
  const [saving, setSaving] = useState(false);

  const handleSaveRetention = async () => {
    setSaving(true);
    try {
      // Store the retention period in the new_values field as JSON
      const { error } = await supabase.from('audit_logs')
        .update({
          new_values: {
            retention_period: retentionPeriod,
            days: retentionPeriod === '30days' ? 30 :
              retentionPeriod === '90days' ? 90 :
              retentionPeriod === '180days' ? 180 :
              retentionPeriod === '1year' ? 365 : 730
          },
          operation: 'UPDATE',
          table_name: 'audit_retention'
        })
        .eq('id', 'config');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Log retention policy updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg bg-card">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Select value={retentionPeriod} onValueChange={(value) => setRetentionPeriod(value as RetentionPeriod)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select retention period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30days">30 Days</SelectItem>
          <SelectItem value="90days">90 Days</SelectItem>
          <SelectItem value="180days">180 Days</SelectItem>
          <SelectItem value="1year">1 Year</SelectItem>
          <SelectItem value="2years">2 Years</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleSaveRetention} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        Save Policy
      </Button>
    </div>
  );
}
