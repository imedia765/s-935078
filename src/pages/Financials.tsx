
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { FinancialOverview } from "@/components/admin/financial/FinancialOverview";
import { PaymentsList } from "@/components/admin/financial/PaymentsList";
import { FinancialReports } from "@/components/admin/financial/FinancialReports";
import { MemberStats } from "@/components/admin/financial/MemberStats";
import { useFinancialQueries } from "@/components/admin/financial/hooks/useFinancialQueries";
import { useFinancialMutations } from "@/components/admin/financial/hooks/useFinancialMutations";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, generatePDF } from "@/utils/exportUtils";
import { PaymentArchive } from "@/components/admin/financial/PaymentArchive";
import { TemplateManager } from '@/components/admin/financial/templates/TemplateManager';
import { FinancialErrorBoundary } from "@/components/admin/financial/FinancialErrorBoundary";
import { Loader2 } from "lucide-react";

export default function Financials() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { 
    paymentsData, 
    loadingPayments, 
    collectors, 
    isLoadingCollectors, 
    refetchCollectors,
    error 
  } = useFinancialQueries();

  const { approveMutation, deleteMutation } = useFinancialMutations();

  // Calculate payment stats
  const payments = paymentsData ? {
    totalPayments: paymentsData.length,
    totalAmount: paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0),
    pendingPayments: paymentsData.filter(p => p.status === 'pending').length,
    approvedPayments: paymentsData.filter(p => p.status === 'approved').length,
    paymentMethods: {
      cash: paymentsData.filter(p => p.payment_method === 'cash').length,
      bankTransfer: paymentsData.filter(p => p.payment_method === 'bank_transfer').length,
    },
    recentPayments: paymentsData.slice(0, 5)
  } : null;

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
      setShowDeleteDialog(false);
    }
  };

  const handleExport = async (type: 'excel' | 'csv' | 'all') => {
    if (!paymentsData || exporting) return;

    setExporting(true);
    try {
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
        case 'csv':
          await exportToCSV(data, `payments_export_${type}`);
          toast({
            title: "Export successful",
            description: `The ${type.toUpperCase()} file has been downloaded.`,
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
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6 border-red-200 bg-red-50/10">
          <h2 className="text-lg font-semibold text-red-500 mb-2">Error Loading Financial Data</h2>
          <p className="text-sm text-red-600/80">{error.message}</p>
        </Card>
      </div>
    );
  }

  return (
    <FinancialErrorBoundary>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-6 text-gradient">Financial Management</h1>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="w-full justify-start bg-black/40 backdrop-blur-xl border border-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="stats">Member Stats</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {loadingPayments ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="overview">
                <Card className="p-6 glass-card">
                  <FinancialOverview payments={payments} />
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card className="p-6 glass-card">
                  <PaymentsList
                    paymentsData={paymentsData || []}
                    loadingPayments={loadingPayments}
                    handleExport={handleExport}
                    handleApprove={handleApprove}
                    handleDelete={handleDelete}
                    showDeleteDialog={showDeleteDialog}
                    setShowDeleteDialog={setShowDeleteDialog}
                    confirmDelete={confirmDelete}
                    exporting={exporting}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="archive">
                <Card className="p-6 glass-card">
                  <PaymentArchive />
                </Card>
              </TabsContent>

              <TabsContent value="reports">
                <Card className="p-6 glass-card">
                  <FinancialReports 
                    payments={payments}
                    handleExport={handleExport}
                    exporting={exporting}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="stats">
                <Card className="p-6 glass-card">
                  <MemberStats />
                </Card>
              </TabsContent>

              <TabsContent value="templates">
                <Card className="p-6 glass-card">
                  <TemplateManager />
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </FinancialErrorBoundary>
  );
}
