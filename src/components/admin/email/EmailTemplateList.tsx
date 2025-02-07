import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Eye, Send, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendEmail } from "@/utils/email";
import {
  getPaymentConfirmationTemplate,
  getPaymentReminderTemplate,
  getLatePaymentTemplate
} from "@/utils/emailNotifications";

const templateCategories = [
  "payment",
  "notification",
  "system",
  "custom"
] as const;

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
  category?: typeof templateCategories[number];
  is_system?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  variables?: unknown;
  version?: number;
}

interface EmailTemplateFormData {
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
  category?: typeof templateCategories[number];
  is_system?: boolean;
}

const testEmailSchema = z.object({
  to: z.string().email("Please enter a valid email address"),
});

type TestEmailFormData = z.infer<typeof testEmailSchema>;

const previewStyles = {
  default: {
    container: "email-preview p-8 rounded-lg shadow-xl max-w-2xl mx-auto",
    header: "email-preview-header p-6 rounded-t-lg border-b",
    body: "email-preview-body p-6 rounded-b-lg text-gray-800",
    title: "text-3xl font-arabic mb-4 text-gray-800 font-semibold",
    text: "text-gray-700 leading-relaxed"
  },
  formal: {
    container: "bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-lg shadow-xl max-w-2xl mx-auto",
    header: "bg-white/90 backdrop-blur-sm p-6 rounded-t-lg border-b border-gray-200",
    body: "bg-white/95 backdrop-blur-sm p-6 rounded-b-lg text-gray-800",
    title: "text-3xl font-arabic mb-4 text-gray-900 font-semibold",
    text: "text-gray-800 leading-relaxed"
  },
  professional: {
    container: "bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 p-8 rounded-lg shadow-xl max-w-2xl mx-auto",
    header: "bg-white/95 backdrop-blur-sm p-6 rounded-t-lg border-b border-gray-200",
    body: "bg-white/98 backdrop-blur-sm p-6 rounded-b-lg text-gray-900",
    title: "text-3xl font-arabic mb-4 text-gray-900 font-semibold",
    text: "text-gray-800 leading-relaxed"
  }
};

export function EmailTemplateList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<keyof typeof previewStyles>("default");
  const [smtpError, setSmtpError] = useState<string | null>(null);

  const form = useForm<EmailTemplateFormData>({
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      is_active: true,
      category: "custom"
    }
  });

  const testEmailForm = useForm<TestEmailFormData>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      to: ""
    }
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      const { data: basicData, error: basicError } = await supabase
        .from('email_templates')
        .select('id, name, subject, body, is_active, created_at, updated_at');

      if (basicError) {
        console.error('Error fetching basic template data:', basicError);
        throw basicError;
      }

      try {
        const { data: fullData, error: fullError } = await supabase
          .from('email_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (!fullError) {
          return (fullData || []).map((template: Partial<EmailTemplate>) => ({
            ...template,
            category: template.category || 'custom',
            is_system: template.is_system || false
          })) as EmailTemplate[];
        }
      } catch (e) {
        console.warn('New columns not yet available:', e);
      }

      return (basicData || []).map((template: Partial<EmailTemplate>) => ({
        ...template,
        category: 'custom' as const,
        is_system: false
      })) as EmailTemplate[];
    }
  });

  const importSystemTemplates = async () => {
    const samplePayment = {
      payment_number: "SAMPLE-001",
      amount: 100,
      created_at: new Date().toISOString(),
      payment_method: "bank_transfer",
      payment_type: "membership",
      members: {
        full_name: "John Doe",
        email: "john@example.com"
      }
    };

    const systemTemplates = [
      {
        name: "Payment Confirmation",
        subject: getPaymentConfirmationTemplate(samplePayment as any).subject,
        body: getPaymentConfirmationTemplate(samplePayment as any).html,
        category: "payment" as const,
        is_system: true,
        is_active: true
      },
      {
        name: "Payment Reminder",
        subject: getPaymentReminderTemplate(samplePayment as any, new Date().toISOString()).subject,
        body: getPaymentReminderTemplate(samplePayment as any, new Date().toISOString()).html,
        category: "payment" as const,
        is_system: true,
        is_active: true
      },
      {
        name: "Late Payment Notice",
        subject: getLatePaymentTemplate(samplePayment as any, 7).subject,
        body: getLatePaymentTemplate(samplePayment as any, 7).html,
        category: "payment" as const,
        is_system: true,
        is_active: true
      }
    ];

    for (const template of systemTemplates) {
      const { error } = await supabase
        .from('email_templates')
        .insert([template]);
      
      if (error) {
        toast({
          title: "Error",
          description: `Failed to import template: ${template.name}`,
          variant: "destructive",
        });
        return;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
    toast({
      title: "Success",
      description: "System templates imported successfully",
    });
  };

  const sendTestEmailMutation = useMutation({
    mutationFn: async ({ to }: TestEmailFormData) => {
      if (!selectedTemplate) throw new Error("No template selected");
      await sendEmail({
        to,
        subject: selectedTemplate.subject,
        html: selectedTemplate.body
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test email sent successfully",
      });
      setTestEmailDialogOpen(false);
      testEmailForm.reset();
    },
    onError: (error: Error) => {
      setSmtpError(error.message);
    }
  });

  const handleSendTestEmail = (data: TestEmailFormData) => {
    sendTestEmailMutation.mutate(data);
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    form.reset({
      name: template.name,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active,
      category: template.category
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

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

  const duplicateTemplate = async (template: any) => {
    const { id, created_at, updated_at, ...templateData } = template;
    const duplicatedTemplate = {
      ...templateData,
      name: `${templateData.name} (Copy)`,
      is_system: false
    };

    const { error } = await supabase
      .from('email_templates')
      .insert([duplicatedTemplate]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
    toast({
      title: "Success",
      description: "Template duplicated successfully",
    });
  };

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
      if (selectedTemplate.is_system) {
        toast({
          title: "Error",
          description: "System templates cannot be modified. Please duplicate the template first.",
          variant: "destructive",
        });
        return;
      }
      updateMutation.mutate({ ...data, id: selectedTemplate.id });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Email Templates</h3>
        <div className="flex gap-2">
          <Button onClick={importSystemTemplates}>
            Import System Templates
          </Button>
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templateCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
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
                <TableCell>
                  <Badge variant={template.category === "system" ? "secondary" : "default"}>
                    {template.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  {template.is_system ? (
                    <Badge variant="secondary">System</Badge>
                  ) : (
                    <Badge variant="outline">Custom</Badge>
                  )}
                </TableCell>
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
                      onClick={() => {
                        setSelectedTemplate(template);
                        setTestEmailDialogOpen(true);
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
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
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!template.is_system && (
                      <>
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
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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

      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          <Form {...testEmailForm}>
            <form onSubmit={testEmailForm.handleSubmit(handleSendTestEmail)} className="space-y-4">
              {smtpError && (
                <Alert variant="destructive">
                  <AlertDescription>{smtpError}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={testEmailForm.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="test@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTestEmailDialogOpen(false);
                    setSmtpError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={sendTestEmailMutation.isPending}
                >
                  {sendTestEmailMutation.isPending ? "Sending..." : "Send Test"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
