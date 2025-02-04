import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { exportToCSV, generatePDF } from "@/utils/exportUtils";
import { useState } from "react";
import { FinancialOverview } from "./financial/FinancialOverview";
import { CollectorsList } from "./financial/CollectorsList";
import { PaymentsList } from "./financial/PaymentsList";
import { FinancialReports } from "./financial/FinancialReports";
import type { PaymentStats, CollectorPaymentStats, Payment, Collector } from "./financial/types";

export function FinancialManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Helper functions for CollectorsList
  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    return <AlertCircle className="mr-1 h-4 w-4" />;
  };

  const formatMemberNumber = (collector: any, index: number) => {
    return collector.members?.member_number || `M${String(index + 1).padStart(4, '0')}`;
  };

  // Fetch payments data
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
      return data as Payment[];
    }
  });

  // Fetch collectors data
  const { data: collectors, isLoading: isLoadingCollectors, refetch: refetchCollectors } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_collectors")
        .select(`
          *,
          members!members_collectors_member_number_fkey (
            member_number,
            full_name,
            email
          ),
          payment_requests (
            status,
            amount,
            created_at
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Collector[];
    }
  });

  // Calculate payment statistics
  const payments = paymentsData ? {
    totalPayments: paymentsData.length,
    totalAmount: paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0),
    pendingPayments: paymentsData.filter(p => p.status === 'pending').length,
    approvedPayments: paymentsData.filter(p => p.status === 'approved').length,
    paymentMethods: {
      cash: paymentsData.filter(p => p.payment_method === 'cash').length,
      bankTransfer: paymentsData.filter(p => p.payment_method === 'bank_transfer').length
    },
    recentPayments: paymentsData
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  } : null;

  // Payment approval mutation
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

  // Payment deletion mutation
  const deleteMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payment_requests')
        .delete()
        .eq('id', paymentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gradient">Financial Management</h2>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collectors">Collectors</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <FinancialOverview payments={payments} />
        </TabsContent>

        <TabsContent value="collectors" className="mt-4">
          <CollectorsList
            collectors={collectors || []}
            isLoadingCollectors={isLoadingCollectors}
            refetchCollectors={refetchCollectors}
            getPaymentStatusColor={getPaymentStatusColor}
            getPaymentStatusIcon={getPaymentStatusIcon}
            formatMemberNumber={formatMemberNumber}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <PaymentsList
            paymentsData={paymentsData || []}
            loadingPayments={loadingPayments}
            handleExport={handleExport}
            handleApprove={handleApprove}
            handleDelete={handleDelete}
            showDeleteDialog={showDeleteDialog}
            setShowDeleteDialog={setShowDeleteDialog}
            confirmDelete={confirmDelete}
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <FinancialReports 
            payments={payments}
            handleExport={handleExport}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
