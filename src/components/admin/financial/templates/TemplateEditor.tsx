
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Save,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Template {
  id?: string;
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
  category: 'payment' | 'notification' | 'system' | 'custom';
  is_system: boolean;
  variables: Record<string, string>;
}

export function TemplateEditor() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('edit');
  const [template, setTemplate] = useState<Template>({
    name: '',
    subject: '',
    body: '',
    is_active: true,
    category: 'payment',
    is_system: false,
    variables: {}
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          name: template.name,
          subject: template.subject,
          body: template.body,
          is_active: template.is_active,
          category: template.category,
          is_system: template.is_system,
          variables: template.variables
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template saved successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save template",
      });
    }
  };

  const formatText = (command: string) => {
    document.execCommand(command, false);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Template Editor</h2>
        <div className="flex gap-2">
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={template.name}
                onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                placeholder="Enter template name"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Subject Line</label>
              <Input
                value={template.subject}
                onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                placeholder="Enter email subject"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Active</label>
              <Switch
                checked={template.is_active}
                onCheckedChange={(checked) => setTemplate({ ...template, is_active: checked })}
              />
            </div>

            <div className="border rounded-md p-2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('bold')}
                className="h-8 w-8 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('italic')}
                className="h-8 w-8 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('underline')}
                className="h-8 w-8 p-0"
              >
                <Underline className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-border mx-2" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('justifyLeft')}
                className="h-8 w-8 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('justifyCenter')}
                className="h-8 w-8 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => formatText('justifyRight')}
                className="h-8 w-8 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium">Template Content</label>
              <div
                contentEditable
                className="mt-1 min-h-[300px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                onInput={(e) => setTemplate({ ...template, body: e.currentTarget.innerHTML })}
                dangerouslySetInnerHTML={{ __html: template.body }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-md p-4">
                <h3 className="font-bold mb-2">{template.subject}</h3>
                <div dangerouslySetInnerHTML={{ __html: template.body }} />
              </div>
            </TabsContent>
            
            <TabsContent value="variables" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText('{member_name}')}>
                    <Copy className="mr-2 h-4 w-4" />
                    member_name
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText('{payment_amount}')}>
                    <Copy className="mr-2 h-4 w-4" />
                    payment_amount
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText('{payment_date}')}>
                    <Copy className="mr-2 h-4 w-4" />
                    payment_date
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click on a variable to copy it to your clipboard. You can then paste it into the template content.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
