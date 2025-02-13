
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface TemplateIds {
  payment_confirmation: string;
  payment_reminder: string;
  late_payment: string;
  password_reset: string;
}

interface UpdateConfigParams {
  apiKey: string;
  templateIds: TemplateIds;
}

export function LoopsConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [templateIds, setTemplateIds] = useState<TemplateIds>({
    payment_confirmation: "",
    payment_reminder: "",
    late_payment: "",
    password_reset: "",
  });

  const { data: loopsConfig, isLoading } = useQuery({
    queryKey: ['loopsConfig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loops_integration')
        .select('*')
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        const { data: newConfig, error: insertError } = await supabase
          .from('loops_integration')
          .insert([
            { 
              api_key: '', 
              payment_confirmation_template_id: '', 
              payment_reminder_template_id: '', 
              late_payment_template_id: '', 
              password_reset_template_id: 'cm73c7rki01n6i16s6vle80mc',
              is_active: false 
            }
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        return newConfig;
      }

      return data[0];
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const { data, error } = await supabase.rpc('toggle_loops_integration', {
        p_is_active: isActive
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loopsConfig'] });
      toast({
        title: "Success",
        description: "Loops integration status updated",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update Loops integration status",
      });
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ apiKey, templateIds }: UpdateConfigParams) => {
      const { error } = await supabase
        .from('loops_integration')
        .update({
          api_key: apiKey,
          payment_confirmation_template_id: templateIds.payment_confirmation,
          payment_reminder_template_id: templateIds.payment_reminder,
          late_payment_template_id: templateIds.late_payment,
          password_reset_template_id: templateIds.password_reset,
          updated_at: new Date().toISOString()
        })
        .eq('id', loopsConfig?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loopsConfig'] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Loops configuration updated successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update Loops configuration",
      });
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleToggle = (checked: boolean) => {
    toggleMutation.mutate(checked);
  };

  const handleSave = () => {
    updateConfigMutation.mutate({ apiKey, templateIds });
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Loops Integration</h3>
          <p className="text-sm text-muted-foreground">Configure Loops email service integration</p>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="loops-active">Active</Label>
          <Switch
            id="loops-active"
            checked={loopsConfig?.is_active || false}
            onCheckedChange={handleToggle}
          />
        </div>
      </div>

      <div className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter Loops API key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-reset-template">Password Reset Template ID</Label>
              <Input
                id="password-reset-template"
                value={templateIds.password_reset}
                onChange={(e) => setTemplateIds(prev => ({ ...prev, password_reset: e.target.value }))}
                placeholder="Enter Password Reset template ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-confirmation-template">Payment Confirmation Template ID</Label>
              <Input
                id="payment-confirmation-template"
                value={templateIds.payment_confirmation}
                onChange={(e) => setTemplateIds(prev => ({ ...prev, payment_confirmation: e.target.value }))}
                placeholder="Enter Payment Confirmation template ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-reminder-template">Payment Reminder Template ID</Label>
              <Input
                id="payment-reminder-template"
                value={templateIds.payment_reminder}
                onChange={(e) => setTemplateIds(prev => ({ ...prev, payment_reminder: e.target.value }))}
                placeholder="Enter Payment Reminder template ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late-payment-template">Late Payment Template ID</Label>
              <Input
                id="late-payment-template"
                value={templateIds.late_payment}
                onChange={(e) => setTemplateIds(prev => ({ ...prev, late_payment: e.target.value }))}
                placeholder="Enter Late Payment template ID"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>API Key</Label>
              <div className="mt-1">•••••••••••••••••</div>
            </div>
            <div>
              <Label>Password Reset Template ID</Label>
              <div className="mt-1">{loopsConfig?.password_reset_template_id || "Not set"}</div>
            </div>
            <div>
              <Label>Payment Confirmation Template ID</Label>
              <div className="mt-1">{loopsConfig?.payment_confirmation_template_id || "Not set"}</div>
            </div>
            <div>
              <Label>Payment Reminder Template ID</Label>
              <div className="mt-1">{loopsConfig?.payment_reminder_template_id || "Not set"}</div>
            </div>
            <div>
              <Label>Late Payment Template ID</Label>
              <div className="mt-1">{loopsConfig?.late_payment_template_id || "Not set"}</div>
            </div>
            <Button onClick={() => {
              setApiKey(loopsConfig?.api_key || "");
              setTemplateIds({
                payment_confirmation: loopsConfig?.payment_confirmation_template_id || "",
                payment_reminder: loopsConfig?.payment_reminder_template_id || "",
                late_payment: loopsConfig?.late_payment_template_id || "",
                password_reset: loopsConfig?.password_reset_template_id || "",
              });
              setIsEditing(true);
            }}>
              Edit Configuration
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
