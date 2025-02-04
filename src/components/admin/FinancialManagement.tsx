import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, FileDown, Download, Check, X, Trash2, LayoutDashboard, Users, Receipt, ChartBar, UserCog, UserPlus, RefreshCw, CheckCircle, XCircle, Wallet, AlertCircle, Clock, PoundSterling } from "lucide-react";
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
import { useState } from "react";

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

  const handleCreateAuthUsers = async () => {
    try {
      const { error } = await supabase.rpc('create_auth_users_for_collectors');
      if (error) throw error;
      toast({
        title: "Success",
        description: "Auth users created for collectors",
      });
      refetchCollectors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfiles = async () => {
    toast({
      title: "Info",
      description: "Profile update functionality is not available yet",
    });
  };

  const handleMaintainRoles = async () => {
    try {
      const { error } = await supabase.rpc('maintain_collector_roles');
      if (error) throw error;
      toast({
        title: "Success",
        description: "Collector roles maintained",
      });
      refetchCollectors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFixRoles = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('fix_role_error', {
        p_user_id: userId,
        p_error_type: 'collector_role_missing'
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Collector role fixed",
      });
      refetchCollectors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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

  const COLORS = ['#8c5dd3', '#3b82f6', '#22c55e'];

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 glass-card">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Total Payments</h3>
              </div>
              <p className="text-3xl font-bold text-primary mt-2">
                {payments?.totalPayments || 0}
              </p>
            </Card>

            <Card className="p-4 glass-card">
              <div className="flex items-center space-x-2">
                <PoundSterling className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">Total Amount</h3>
              </div>
              <p className="text-3xl font-bold text-green-500 mt-2">
                £{payments?.totalAmount.toFixed(2) || '0.00'}
              </p>
            </Card>

            <Card className="p-4 glass-card">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Pending Payments</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-500 mt-2">
                {payments?.pendingPayments || 0}
              </p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collectors">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 glass-card">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Total Collectors</h3>
                </div>
                <p className="text-3xl font-bold text-primary mt-2">
                  {collectors?.length || 0}
                </p>
              </Card>
              
              <Card className="p-4 glass-card">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Active Collectors</h3>
                </div>
                <p className="text-3xl font-bold text-green-500 mt-2">
                  {collectors?.filter(c => c.active)?.length || 0}
                </p>
              </Card>

              <Card className="p-4 glass-card">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold">Total Collections</h3>
                </div>
                <p className="text-3xl font-bold text-purple-500 mt-2">
                  £{collectors?.reduce((acc: number, curr: any) => {
                    const totalPayments = curr.payment_requests?.reduce((sum: number, payment: any) => 
                      payment.status === 'approved' ? sum + (payment.amount || 0) : sum, 0) || 0;
                    return acc + totalPayments;
                  }, 0).toFixed(2) || '0.00'}
                </p>
              </Card>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleCreateAuthUsers}
                className="bg-primary/20 hover:bg-primary/30"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create Auth Users
              </Button>
              <Button 
                onClick={handleUpdateProfiles}
                className="bg-primary/20 hover:bg-primary/30"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Profiles
              </Button>
              <Button 
                onClick={handleMaintainRoles}
                className="bg-primary/20 hover:bg-primary/30"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Maintain Roles
              </Button>
            </div>

            <Card className="glass-card">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gradient">Collectors List</h2>
                {isLoadingCollectors ? (
                  <p>Loading collectors...</p>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {collectors?.map((collector: any) => {
                      const lastPayment = collector.payment_requests?.[0];
                      const paymentStatus = lastPayment?.status || 'no payments';
                      const statusColor = getPaymentStatusColor(paymentStatus);
                      const StatusIcon = getPaymentStatusIcon(paymentStatus);

                      return (
                        <AccordionItem key={collector.id} value={collector.id} className="border-b border-white/10">
                          <AccordionTrigger className="hover:no-underline px-4">
                            <div className="grid grid-cols-8 w-full gap-4 items-center">
                              <div className="col-span-2">{collector.name}</div>
                              <div>{collector.number}</div>
                              <div>{collector.member_number}</div>
                              <div className="col-span-2">{collector.email}</div>
                              <div>
                                {collector.active ? (
                                  <span className="flex items-center text-green-500">
                                    <CheckCircle className="mr-1 h-4 w-4" /> Active
                                  </span>
                                ) : (
                                  <span className="flex items-center text-red-500">
                                    <XCircle className="mr-1 h-4 w-4" /> Inactive
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className={`flex items-center px-2 py-1 rounded-full ${statusColor}`}>
                                  {StatusIcon}
                                  <span className="ml-1 capitalize">{paymentStatus}</span>
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="px-4 py-2">
                              <h3 className="text-lg font-semibold mb-2">Associated Members</h3>
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-primary/5">
                                    <TableHead>Member Number</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Email</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {collector.members ? (
                                    <TableRow className="hover:bg-primary/5">
                                      <TableCell>{formatMemberNumber(collector, 0)}</TableCell>
                                      <TableCell>{collector.members.full_name}</TableCell>
                                      <TableCell>{collector.members.email}</TableCell>
                                    </TableRow>
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        No members associated
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="p-6 glass-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gradient">Payment Records</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => handleExport('excel')}
                  className="bg-emerald-600/20 hover:bg-emerald-600/30"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  className="bg-blue-600/20 hover:bg-blue-600/30"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
            {loadingPayments ? (
              <p>Loading payments...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment #</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Collector</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsData?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.payment_number}</TableCell>
                      <TableCell>{payment.members?.full_name}</TableCell>
                      <TableCell>{payment.members_collectors?.name}</TableCell>
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
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="p-6 glass-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gradient">Financial Reports</h2>
              <Button 
                variant="outline"
                onClick={() => handleExport('all')}
                className="bg-purple-600/20 hover:bg-purple-600/30"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Full Report
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium mb-4">Payment Methods Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Cash', value: payments?.paymentMethods.cash || 0 },
                        { name: 'Bank Transfer', value: payments?.paymentMethods.bankTransfer || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Cash', value: payments?.paymentMethods.cash || 0 },
                        { name: 'Bank Transfer', value: payments?.paymentMethods.bankTransfer || 0 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-4">Payment Status Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Pending', value: payments?.pendingPayments || 0 },
                        { name: 'Approved', value: payments?.approvedPayments || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Pending', value: payments?.pendingPayments || 0 },
                        { name: 'Approved', value: payments?.approvedPayments || 0 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
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
