import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";

interface EmailTemplateFormData {
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
}

const previewStyles = {
  default: {
    container: "bg-gradient-to-r from-primary to-primary-hover p-8 rounded-lg shadow-xl max-w-2xl mx-auto",
    header: "bg-white/10 backdrop-blur-sm p-4 rounded-t-lg border-b border-white/20",
    body: "bg-white/5 backdrop-blur-sm p-6 rounded-b-lg text-white",
    title: "text-2xl font-bold text-white mb-4",
    text: "text-white/90 leading-relaxed"
  },
  modern: {
    container: "bg-gradient-to-br from-[#8B5CF6] to-[#D946EF] p-8 rounded-lg shadow-xl max-w-2xl mx-auto",
    header: "bg-white/10 backdrop-blur-sm p-4 rounded-t-lg border-b border-white/20",
    body: "bg-white/5 backdrop-blur-sm p-6 rounded-b-lg text-white",
    title: "text-2xl font-bold text-white mb-4",
    text: "text-white/90 leading-relaxed"
  },
  professional: {
    container: "bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] p-8 rounded-lg shadow-xl max-w-2xl mx-auto",
    header: "bg-white/10 backdrop-blur-sm p-4 rounded-t-lg border-b border-white/20",
    body: "bg-white/5 backdrop-blur-sm p-6 rounded-b-lg text-white",
    title: "text-2xl font-bold text-white mb-4",
    text: "text-white/90 leading-relaxed"
  }
};

export function EmailTemplateList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<keyof typeof previewStyles>("default");

  const form = useForm<EmailTemplateFormData>({
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      is_active: true
    }
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormData) => {
      const { error } = await supabase
        .from('email_templates')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast({
        title: "Success",
        description: "Email template created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create template: " + error.message,
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EmailTemplateFormData & { id: string }) => {
      const { error } = await supabase
        .from('email_templates')
        .update(data)
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast({
        title: "Success",
        description: "Email template updated successfully",
      });
      setIsDialogOpen(false);
      setSelectedTemplate(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update template: " + error.message,
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast({
        title: "Success",
        description: "Email template deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete template: " + error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: EmailTemplateFormData) => {
    if (selectedTemplate) {
      updateMutation.mutate({ ...data, id: selectedTemplate.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    form.reset({
      name: template.name,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id);
    }
  };

  const handlePreview = (template: any) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Email Templates</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedTemplate(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Welcome Email" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Welcome to our platform!" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Body (HTML)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="<h1>Welcome!</h1><p>Thank you for joining us...</p>" 
                          className="h-[200px]"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Active</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedTemplate ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Template Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                {Object.keys(previewStyles).map((style) => (
                  <Button
                    key={style}
                    variant={selectedStyle === style ? "default" : "outline"}
                    onClick={() => setSelectedStyle(style as keyof typeof previewStyles)}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Button>
                ))}
              </div>
              {selectedTemplate && (
                <div className={previewStyles[selectedStyle].container}>
                  <div className={previewStyles[selectedStyle].header}>
                    <h2 className={previewStyles[selectedStyle].title}>{selectedTemplate.subject}</h2>
                  </div>
                  <div 
                    className={previewStyles[selectedStyle].body}
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.body }}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : templates?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No templates found</TableCell>
            </TableRow>
          ) : (
            templates?.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.name}</TableCell>
                <TableCell>{template.subject}</TableCell>
                <TableCell>v{template.version}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded ${
                    template.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
