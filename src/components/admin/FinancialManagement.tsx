import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Clock, PoundSterling, CheckCircle } from "lucide-react";
import { exportToCSV, generatePDF } from "@/utils/exportUtils";
import { useState } from "react";
import { FinancialOverview } from "./financial/FinancialOverview";
import { CollectorsList } from "./financial/CollectorsList";
import { PaymentsList } from "./financial/PaymentsList";
import { FinancialReports } from "./financial/FinancialReports";
import type { PaymentStats, CollectorPaymentStats } from "./financial/types";

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
        .order('created_at', { foreignTable: 'payment_requests', ascending: false });
      if (error) throw error;
      return data;
    }
  });

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
          members!members_collectors_member_number_fkey (
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

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-orange-500 bg-orange-500/20';
      case 'paid':
        return 'text-purple-500 bg-purple-500/20';
      case 'approved':
        return 'text-green-500 bg-green-500/20';
      default:
        return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'paid':
        return <PoundSterling className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatMemberNumber = (collector: any, index: number) => {
    const collectorNumber = collector.number?.padStart(2, '0') || '00';
    return `${collector.id}${collectorNumber}v${index + 1}`;
  };

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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collectors">Collectors</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinancialOverview payments={payments} />
        </TabsContent>

        <TabsContent value="collectors">
          <CollectorsList
            collectors={collectors || []}
            isLoadingCollectors={isLoadingCollectors}
            refetchCollectors={refetchCollectors}
            getPaymentStatusColor={getPaymentStatusColor}
            getPaymentStatusIcon={getPaymentStatusIcon}
            formatMemberNumber={formatMemberNumber}
          />
        </TabsContent>

        <TabsContent value="payments">
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

        <TabsContent value="reports">
          <FinancialReports 
            payments={payments}
            handleExport={handleExport}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
