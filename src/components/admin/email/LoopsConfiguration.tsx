
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function LoopsConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [templateId, setTemplateId] = useState("");

  const { data: loopsConfig, isLoading } = useQuery({
    queryKey: ['loopsConfig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loops_integration')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
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
    mutationFn: async ({ apiKey, templateId }: { apiKey: string; templateId: string }) => {
      const { error } = await supabase
        .from('loops_integration')
        .update({
          api_key: apiKey,
          template_id: templateId,
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
    updateConfigMutation.mutate({ apiKey, templateId });
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
              <Label htmlFor="template-id">Template ID</Label>
              <Input
                id="template-id"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="Enter template ID"
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
              <Label>Template ID</Label>
              <div className="mt-1">{loopsConfig?.template_id || "Not set"}</div>
            </div>
            <Button onClick={() => {
              setApiKey(loopsConfig?.api_key || "");
              setTemplateId(loopsConfig?.template_id || "");
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
