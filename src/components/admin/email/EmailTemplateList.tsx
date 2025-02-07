import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Eye, Send, Copy } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
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
    text: "text-gray-900 leading-relaxed"
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

    const emailWrapper = (content: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <!-- Header -->
        <div style="background-color: #6C5DD3; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PWA Burton</h1>
        </div>
        
        <!-- Bismillah -->
        <div style="text-align: center; padding: 20px; font-size: 24px; color: #333; font-family: 'Traditional Arabic', serif;">
          بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
        </div>
        
        <!-- Main Content -->
        <div style="background-color: white; padding: 30px; border-radius: 8px; margin: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px; background-color: #f1f1f1;">
          <p>Professional Women's Association Burton</p>
          <p>Supporting and empowering women in our community</p>
          <p>Contact us: <a href="mailto:burtonpwa@gmail.com" style="color: #6C5DD3;">burtonpwa@gmail.com</a></p>
        </div>
      </div>
    `;

    const systemTemplates = [
      {
        name: "Payment Confirmation",
        subject: getPaymentConfirmationTemplate(samplePayment as any).subject,
        body: emailWrapper(`
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Payment Confirmation</h2>
          <p style="color: #34495e;">Dear {member_name},</p>
          <p style="color: #34495e;">We are pleased to confirm that we have received your payment successfully.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Payment Details</h3>
            <ul style="list-style: none; padding: 0; color: #34495e;">
              <li style="margin-bottom: 8px;">📝 Payment Number: {payment_number}</li>
              <li style="margin-bottom: 8px;">💷 Amount: £{amount}</li>
              <li style="margin-bottom: 8px;">📅 Date: {payment_date}</li>
              <li style="margin-bottom: 8px;">💳 Payment Method: {payment_method}</li>
            </ul>
          </div>
          <p style="color: #34495e;">Thank you for your continued support of PWA Burton. Your contribution helps us maintain and improve our services for the community.</p>
          <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
        `),
        category: "payment" as const,
        is_system: true,
        is_active: true,
        variables: {
          member_name: "string",
          payment_number: "string",
          amount: "number",
          payment_date: "date",
          payment_method: "string"
        }
      },
      {
        name: "Payment Reminder",
        subject: "Payment Reminder - PWA Burton Membership",
        body: emailWrapper(`
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Payment Reminder</h2>
          <p style="color: #34495e;">Dear {member_name},</p>
          <p style="color: #34495e;">This is a friendly reminder about an upcoming payment for your PWA Burton membership.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Payment Details</h3>
            <ul style="list-style: none; padding: 0; color: #34495e;">
              <li style="margin-bottom: 8px;">💷 Amount Due: £{amount}</li>
              <li style="margin-bottom: 8px;">📅 Due Date: {due_date}</li>
              <li style="margin-bottom: 8px;">📋 Payment Type: {payment_type}</li>
            </ul>
          </div>
          <p style="color: #34495e;">Please ensure your payment is made by the due date to maintain your membership benefits.</p>
          <p style="color: #34495e;">If you have any questions or concerns, please don't hesitate to contact us.</p>
          <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
        `),
        category: "payment" as const,
        is_system: true,
        is_active: true,
        variables: {
          member_name: "string",
          amount: "number",
          due_date: "date",
          payment_type: "string"
        }
      },
      {
        name: "Late Payment Notice",
        subject: "Important: Outstanding Payment Notice - PWA Burton",
        body: emailWrapper(`
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Outstanding Payment Notice</h2>
          <p style="color: #34495e;">Dear {member_name},</p>
          <p style="color: #34495e;">We noticed that a payment is currently overdue by {days_late} days.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Payment Details</h3>
            <ul style="list-style: none; padding: 0; color: #34495e;">
              <li style="margin-bottom: 8px;">📝 Payment Number: {payment_number}</li>
              <li style="margin-bottom: 8px;">💷 Amount: £{amount}</li>
              <li style="margin-bottom: 8px;">📋 Payment Type: {payment_type}</li>
            </ul>
          </div>
          <p style="color: #34495e;">To maintain your membership status and continue accessing PWA Burton's services, please arrange for the payment to be made at your earliest convenience.</p>
          <p style="color: #34495e;">If you have already made the payment, please disregard this notice and accept our thanks.</p>
          <p style="color: #34495e;">If you're experiencing any difficulties or need to discuss payment arrangements, please don't hesitate to contact us.</p>
          <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
        `),
        category: "payment" as const,
        is_system: true,
        is_active: true,
        variables: {
          member_name: "string",
          days_late: "number",
          payment_number: "string",
          amount: "number",
          payment_type: "string"
        }
      },
      {
        name: "Welcome Email",
        subject: "Welcome to PWA Burton",
        body: emailWrapper(`
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Welcome to PWA Burton! 🎉</h2>
          <p style="color: #34495e;">Dear {member_name},</p>
          <p style="color: #34495e;">Welcome to the Professional Women's Association Burton! We're delighted to have you as a member of our community.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Your Membership Details</h3>
            <ul style="list-style: none; padding: 0; color: #34495e;">
              <li style="margin-bottom: 8px;">👤 Member Number: {member_number}</li>
              <li style="margin-bottom: 8px;">📅 Join Date: {join_date}</li>
            </ul>
          </div>
          <p style="color: #34495e;">We look forward to supporting you and growing together as a community.</p>
          <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
        `),
        category: "custom" as const,
        is_system: false,
        is_active: true,
        variables: {
          member_name: "string",
          member_number: "string",
          join_date: "date"
        }
      },
      {
        name: "Account Verification",
        subject: "Verify Your PWA Burton Account",
        body: emailWrapper(`
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Verify Your Account 🔐</h2>
          <p style="color: #34495e;">Dear {member_name},</p>
          <p style="color: #34495e;">Thank you for registering with PWA Burton. To complete your account setup, please verify your email address.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_link}" style="background-color: #6C5DD3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #34495e;">If you didn't request this verification, please ignore this email.</p>
          <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
        `),
        category: "custom" as const,
        is_system: false,
        is_active: true,
        variables: {
          member_name: "string",
          verification_link: "string"
        }
      },
      {
        name: "Password Reset",
        subject: "Reset Your PWA Burton Password",
        body: emailWrapper(`
          <h2 style="color: #2c3e50; margin-bottom: 20px;">Password Reset Request 🔑</h2>
          <p style="color: #34495e;">Dear {member_name},</p>
          <p style="color: #34495e;">We received a request to reset your PWA Burton account password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #6C5DD3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #34495e;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
          <p style="color: #34495e;">Best regards,<br>PWA Burton Team</p>
        `),
        category: "custom" as const,
        is_system: false,
        is_active: true,
        variables: {
          member_name: "string",
          reset_link: "string"
        }
      }
    ];

    // First, delete existing system templates to avoid duplicates
    const { error: deleteError } = await supabase
      .from('email_templates')
      .delete()
      .eq('is_system', true);
    
    if (deleteError) {
      toast({
        title: "Error",
        description: "Failed to clean up existing system templates",
        variant: "destructive",
      });
      return;
    }

    // Then insert new templates
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

  const handleDeleteClick = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedTemplate) {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', selectedTemplate.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete template: " + error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Template deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      }
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
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
              <Button className="bg-primary hover:bg-primary/90">
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
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Category</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 rounded-full animate-pulse bg-primary/60"></div>
                  <div className="w-4 h-4 rounded-full animate-pulse bg-primary/60 animation-delay-200"></div>
                  <div className="w-4 h-4 rounded-full animate-pulse bg-primary/60 animation-delay-400"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : templates?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No templates found
              </TableCell>
            </TableRow>
          ) : (
            templates?.map((template) => (
              <TableRow key={template.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <Badge variant={template.category === "system" ? "secondary" : "default"} className="capitalize">
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
                  <Badge 
                    variant={template.is_active ? "default" : "destructive"}
                    className={`${
                      template.is_active 
                        ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' 
                        : 'bg-red-500/20 text-red-700 hover:bg-red-500/30'
                    }`}
                  >
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
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
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePreview(template)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => duplicateTemplate(template)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!template.is_system && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(template)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteClick(template)}
                          className="hover:bg-destructive/10 hover:text-destructive"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Template</DialogTitle>
            <DialogDescription className="pt-4">
              Are you sure you want to delete the template "{selectedTemplate?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
