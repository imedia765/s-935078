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
          payment_number
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

  const COLORS = ['#8c5dd3', '#3b82f6', '#22c55e'];

  const collectorStats = collectorsData ? {
    totalCollectors: collectorsData.length,
    activeCollectors: collectorsData.filter(c => c.active).length,
    totalCollected: collectorsData.reduce((sum, collector) => {
      const memberPayments = (collector.members || []).reduce((memberSum, member) => 
        memberSum + (member.payment_amount || 0), 0);
      return sum + memberPayments;
    }, 0),
    averageCollection: collectorsData.length ? (
      collectorsData.reduce((sum, collector) => {
        const memberPayments = (collector.members || []).reduce((memberSum, member) => 
          memberSum + (member.payment_amount || 0), 0);
        return sum + memberPayments;
      }, 0) / collectorsData.length
    ).toFixed(2) : 0
  } : null;

  const memberStats = rawMemberStats ? {
    totalMembers: rawMemberStats.length,
    genderDistribution: {
      male: rawMemberStats.filter(m => m.gender?.toLowerCase() === 'male').length,
      female: rawMemberStats.filter(m => m.gender?.toLowerCase() === 'female').length,
      other: rawMemberStats.filter(m => !['male', 'female'].includes(m.gender?.toLowerCase() || '')).length
    },
    membershipTypes: rawMemberStats.reduce((acc: Record<string, number>, member) => {
      const type = member.membership_type || 'Standard';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
    ageGroups: rawMemberStats.reduce((acc: Record<string, number>, member) => {
      const age = member.date_of_birth ? 
        Math.floor((new Date().getTime() - new Date(member.date_of_birth).getTime()) / 31557600000) :
        null;
      const group = age ? 
        age < 25 ? '18-24' :
        age < 35 ? '25-34' :
        age < 45 ? '35-44' :
        age < 55 ? '45-54' :
        '55+' : 'Unknown';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {}),
    activeMembers: rawMemberStats.filter(m => m.status === 'active').length,
    newMembers: rawMemberStats.filter(m => {
      if (!m.created_at) return false;
      const createdAt = new Date(m.created_at);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && 
             createdAt.getFullYear() === now.getFullYear();
    }).length
  } : null;

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
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-2">Total Payments</h3>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">£{payments?.totalAmount.toFixed(2) || '0.00'}</span>
                <ResponsiveContainer width={60} height={60}>
                  <PieChart>
                    <Pie
                      data={[{ value: payments?.totalAmount || 0 }]}
                      innerRadius={20}
                      outerRadius={25}
                      fill="#8c5dd3"
                      dataKey="value"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-2">Pending Payments</h3>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{payments?.pendingPayments || 0}</span>
                <ResponsiveContainer width={60} height={60}>
                  <PieChart>
                    <Pie
                      data={[{ value: payments?.pendingPayments || 0 }]}
                      innerRadius={20}
                      outerRadius={25}
                      fill="#3b82f6"
                      dataKey="value"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-2">Approved Payments</h3>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold">{payments?.approvedPayments || 0}</span>
                <ResponsiveContainer width={60} height={60}>
                  <PieChart>
                    <Pie
                      data={[{ value: payments?.approvedPayments || 0 }]}
                      innerRadius={20}
                      outerRadius={25}
                      fill="#22c55e"
                      dataKey="value"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-4">Payment Methods</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p>Cash: {payments?.paymentMethods.cash || 0}</p>
                  <p>Bank Transfer: {payments?.paymentMethods.bankTransfer || 0}</p>
                </div>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Cash', value: payments?.paymentMethods.cash || 0 },
                        { name: 'Bank Transfer', value: payments?.paymentMethods.bankTransfer || 0 }
                      ]}
                      innerRadius={35}
                      outerRadius={50}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-4">Recent Payments</h3>
              <div className="space-y-2">
                {payments?.recentPayments.map((payment, index) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 bg-primary/10 rounded">
                    <span>£{payment.amount}</span>
                    <span className={`px-2 py-1 rounded ${
                      payment.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {payment.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collectors">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 glass-card">
                <h3 className="font-semibold mb-2">Total Collectors</h3>
                <span className="text-2xl font-bold">{collectorStats?.totalCollectors || 0}</span>
              </Card>
              <Card className="p-4 glass-card">
                <h3 className="font-semibold mb-2">Active Collectors</h3>
                <span className="text-2xl font-bold">{collectorStats?.activeCollectors || 0}</span>
              </Card>
              <Card className="p-4 glass-card">
                <h3 className="font-semibold mb-2">Total Collected</h3>
                <span className="text-2xl font-bold">£{collectorStats?.totalCollected || 0}</span>
              </Card>
              <Card className="p-4 glass-card">
                <h3 className="font-semibold mb-2">Average Collection</h3>
                <span className="text-2xl font-bold">£{collectorStats?.averageCollection || 0}</span>
              </Card>
            </div>

            <Card className="p-4 glass-card">
              <h3 className="font-semibold mb-4">Collectors List</h3>
              {loadingCollectors ? (
                <p>Loading collectors data...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Total Collection</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectorsData?.map((collector) => (
                      <TableRow key={collector.id}>
                        <TableCell>{collector.name}</TableCell>
                        <TableCell>{collector.number}</TableCell>
                        <TableCell>{collector.email}</TableCell>
                        <TableCell>{collector.phone}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded ${
                            collector.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {collector.active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>{(collector.members || []).length}</TableCell>
                        <TableCell>£{(collector.members || []).reduce((sum, member) => 
                          sum + (member.payment_amount || 0), 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="all-payments">
          <Card className="p-4 glass-card">
            <h3 className="font-semibold mb-4">All Payments</h3>
            {loadingPayments ? (
              <p>Loading payments data...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment #</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Collector</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsData?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.payment_number || 'N/A'}</TableCell>
                      <TableCell>{payment.members?.full_name}</TableCell>
                      <TableCell>{payment.members_collectors?.name}</TableCell>
                      <TableCell>£{payment.amount}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell className="capitalize">{payment.payment_type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded ${
                          payment.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
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

        <TabsContent value="stats">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 glass-card">
                <h3 className="font-semibold mb-2">Total Members</h3>
                <span className="text-2xl font-bold">{memberStats?.totalMembers || 0}</span>
              </Card>
              
              <Card className="p-4 glass-card">
                <h3 className="font-semibold mb-2">Active Members</h3>
                <span className="text-2xl font-bold">{memberStats?.activeMembers || 0}</span>
              </Card>
              
              <Card className="p-4 glass-card">
                <h3 className="font-semibold mb-2">New Members (This Month)</h3>
                <span className="text-2xl font-bold">{memberStats?.newMembers || 0}</span>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 glass-card">
                <h3 className="font-semibold mb-4">Gender Distribution</h3>
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <p>Male: {memberStats?.genderDistribution.male || 0}</p>
                    <p>Female: {memberStats?.genderDistribution.female || 0}</p>
                    <p>Other/Unspecified: {memberStats?.genderDistribution.other || 0}</p>
                  </div>
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Male', value: memberStats?.genderDistribution.male || 0 },
                          { name: 'Female', value: memberStats?.genderDistribution.female || 0 },
                          { name: 'Other', value: memberStats?.genderDistribution.other || 0 }
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4 glass-card">
                <h3 className="font-semibold mb-4">Age Distribution</h3>
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    {memberStats?.ageGroups && Object.entries(memberStats.ageGroups).map(([group, count]) => (
                      <p key={group}>{group}: {count}</p>
                    ))}
                  </div>
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={memberStats?.ageGroups ? 
                          Object.entries(memberStats.ageGroups).map(([name, value]) => ({
                            name,
                            value
                          })) : []
                        }
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card className="p-4 glass-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Membership Types</h3>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberStats?.membershipTypes && Object.entries(memberStats.membershipTypes).map(([type, count]) => (
                    <TableRow key={type}>
                      <TableCell className="font-medium">{type}</TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell>
                        {((Number(count) / (memberStats?.totalMembers || 1)) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
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
