
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialOverview } from "./financial/FinancialOverview";
import { CollectorsList } from "./financial/CollectorsList";
import { PaymentsList } from "./financial/PaymentsList";
import { FinancialReports } from "./financial/FinancialReports";
import { MemberStats } from "./financial/MemberStats";
import { useFinancialQueries } from "./financial/hooks/useFinancialQueries";
import { useFinancialMutations } from "./financial/hooks/useFinancialMutations";
import { getPaymentStatusColor, getPaymentStatusIcon, formatMemberNumber, calculatePaymentStats } from "./financial/utils/helpers";
import { exportToCSV, generatePDF } from "@/utils/exportUtils";
import { useToast } from "@/components/ui/use-toast";
import { BarChart3, Users, Receipt, FileText, UserSquare2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function FinancialManagement() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { paymentsData, loadingPayments, collectors, isLoadingCollectors, refetchCollectors } = useFinancialQueries();
  const { approveMutation, deleteMutation } = useFinancialMutations();

  const payments = calculatePaymentStats(paymentsData);

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
    try {
      if (!paymentsData) return;
      
      setExporting(true);

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

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-semibold text-gradient">Financial Management</h2>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-col sm:flex-row gap-2 sm:gap-0 bg-transparent sm:bg-black/40 sm:backdrop-blur-xl border-0 sm:border sm:border-white/10">
          <TabsTrigger 
            value="overview" 
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="collectors"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Collectors</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payments"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reports"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger 
            value="stats"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <UserSquare2 className="h-4 w-4" />
            <span className="hidden sm:inline">Member Stats</span>
          </TabsTrigger>
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
            exporting={exporting}
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <FinancialReports 
            payments={payments}
            handleExport={handleExport}
            exporting={exporting}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <MemberStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
