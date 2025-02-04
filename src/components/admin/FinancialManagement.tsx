import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, FileDown, Download, Check, X, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { exportToCSV, generatePDF } from "@/utils/exportUtils";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FinancialManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: rawMemberStats, isLoading: loadingStats } = useQuery({
    queryKey: ["memberStats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id,
          full_name,
          gender,
          date_of_birth,
          membership_type,
          payment_amount,
          payment_date,
          yearly_payment_amount,
          yearly_payment_status,
          status,
          created_at,
          members_collectors (
            name,
            number
          )
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: paymentStats, isLoading: loadingPaymentStats } = useQuery({
    queryKey: ["paymentStats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          id,
          amount,
          payment_method,
          payment_type,
          status,
          created_at,
          payment_number,
          members!payment_requests_member_id_fkey (
            full_name
          ),
          members_collectors!payment_requests_collector_id_fkey (
            name
          )
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const payments = paymentStats ? {
    totalPayments: paymentStats.length,
    totalAmount: paymentStats.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    pendingPayments: paymentStats.filter(p => p.status === 'pending').length,
    approvedPayments: paymentStats.filter(p => p.status === 'approved').length,
    paymentMethods: {
      cash: paymentStats.filter(p => p.payment_method === 'cash').length,
      bankTransfer: paymentStats.filter(p => p.payment_method === 'bank_transfer').length
    },
    recentPayments: paymentStats
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  } : null;

  const { data: collectorsData, isLoading: loadingCollectors } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members_collectors')
        .select(`
          id,
          name,
          number,
          email,
          phone,
          active,
          members!members_collector_id_fkey (
            id,
            full_name,
            payment_amount,
            payment_date,
            yearly_payment_amount,
            yearly_payment_status
          )
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: paymentsData, isLoading: loadingPayments } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          id,
          amount,
          payment_method,
          payment_type,
          status,
          created_at,
          payment_number,
          members!payment_requests_member_id_fkey (
            full_name
          ),
          members_collectors!payment_requests_collector_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payment_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "Payment approved",
        description: "The payment has been successfully approved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve payment: " + error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payment_requests')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setShowDeleteDialog(false);
      toast({
        title: "Payment deleted",
        description: "The payment has been successfully deleted.",
      });
    },
    onError: (error) => {
      setShowDeleteDialog(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete payment: " + error.message,
      });
    },
  });

  const handleApprove = (paymentId: string) => {
    approveMutation.mutate(paymentId);
  };

  const handleDelete = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedPaymentId) {
      deleteMutation.mutate(selectedPaymentId);
    }
  };

  const handleExport = async (type: 'excel' | 'csv' | 'all') => {
    try {
      if (!paymentsData) return;

      const data = paymentsData.map(payment => ({
        payment_number: payment.payment_number || 'N/A',
        member_name: payment.members?.full_name || 'N/A',
        collector: payment.members_collectors?.name || 'N/A',
        amount: payment.amount || 0,
        payment_method: payment.payment_method || 'N/A',
        payment_type: payment.payment_type || 'N/A',
        status: payment.status || 'N/A',
        created_at: payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'
      }));

      switch (type) {
        case 'excel':
          await exportToCSV(data, 'payments_export_excel');
          toast({
            title: "Export successful",
            description: "The Excel file has been downloaded.",
          });
          break;
        case 'csv':
          await exportToCSV(data, 'payments_export_csv');
          toast({
            title: "Export successful",
            description: "The CSV file has been downloaded.",
          });
          break;
        case 'all':
          await generatePDF(data, 'All Payments Report');
          toast({
            title: "Export successful",
            description: "The PDF report has been downloaded.",
          });
          break;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export data",
      });
    }
  };

  const COLORS = ['#8c5dd3', '#3b82f6', '#22c55e'];

  const collectorPaymentStats = paymentStats ? paymentStats.reduce((acc: Record<string, any>, payment) => {
    const collectorName = payment.members_collectors?.name || 'Unassigned';
    if (!acc[collectorName]) {
      acc[collectorName] = {
        totalAmount: 0,
        payments: [],
        pendingCount: 0,
        approvedCount: 0
      };
    }
    acc[collectorName].payments.push(payment);
    acc[collectorName].totalAmount += payment.amount || 0;
    if (payment.status === 'pending') {
      acc[collectorName].pendingCount++;
    } else if (payment.status === 'approved') {
      acc[collectorName].approvedCount++;
    }
    return acc;
  }, {}) : {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gradient">Financial Management</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('excel')}
            className="bg-emerald-600/20 hover:bg-emerald-600/30"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExport('csv')}
            className="bg-blue-600/20 hover:bg-blue-600/30"
          >
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleExport('all')}
            className="bg-purple-600/20 hover:bg-purple-600/30"
          >
            <Download className="mr-2 h-4 w-4" />
            Export All Reports
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-black/40 backdrop-blur-xl border border-white/10">
          <TabsTrigger value="overview">Payment Overview</TabsTrigger>
          <TabsTrigger value="collectors">Collectors Overview</TabsTrigger>
          <TabsTrigger value="all-payments">All Payments</TabsTrigger>
          <TabsTrigger value="stats">Member Stats</TabsTrigger>
          <TabsTrigger value="collector-payments">Payments by Collector</TabsTrigger>
        </TabsList>

        <TabsContent value="collector-payments">
          <Card className="p-4 glass-card">
            <h3 className="font-semibold mb-4">Payments by Collector</h3>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {Object.entries(collectorPaymentStats).map(([collectorName, stats]: [string, any]) => (
                <AccordionItem 
                  key={collectorName} 
                  value={collectorName}
                  className="border border-white/10 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-2 hover:no-underline">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">{collectorName}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm bg-primary/20 px-2 py-1 rounded">
                          Total: £{stats.totalAmount.toFixed(2)}
                        </span>
                        <span className="text-sm bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                          Pending: {stats.pendingCount}
                        </span>
                        <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          Approved: {stats.approvedCount}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Member</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.payments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{payment.members?.full_name}</TableCell>
                            <TableCell>£{payment.amount}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded ${
                                payment.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {payment.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {payment.status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleApprove(payment.id)}
                                    className="h-8 w-8 bg-green-500/20 hover:bg-green-500/30"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(payment.id)}
                                  className="h-8 w-8 bg-red-500/20 hover:bg-red-500/30"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </TabsContent>

      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payment record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
