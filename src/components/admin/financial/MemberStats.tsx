
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { generatePDF } from "@/utils/exportUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PaymentRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Member {
  id: string;
  member_number: string;
  full_name: string;
  status: string;
}

interface MemberWithPayments extends Member {
  payment_requests: PaymentRequest[];
}

interface CollectorData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  members: Member[];
}

interface CollectorWithPayments extends Omit<CollectorData, 'members'> {
  members: MemberWithPayments[];
}

interface CollectorStats {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  members: Array<{
    member_number: string;
    full_name: string;
    status: string;
    payments: {
      total: number;
      approved: number;
      pending: number;
      amount: number;
    };
  }>;
  totalMembers: number;
  totalPayments: number;
  approvedPayments: number;
  pendingPayments: number;
  totalAmount: number;
}

export function MemberStats() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["memberStats"],
    queryFn: async () => {
      console.log('Fetching member stats...');
      try {
        const { data: collectors, error: collectorError } = await supabase
          .from('members_collectors')
          .select(`
            id,
            name,
            email,
            phone,
            active,
            members:members (
              id,
              member_number,
              full_name,
              status
            )
          `)
          .eq('active', true)
          .order('name');

        if (collectorError) throw collectorError;

        const collectorsData = (collectors || []) as CollectorData[];

        // Then get payment requests for each member
        const enrichedCollectors: CollectorWithPayments[] = await Promise.all(
          collectorsData.map(async (collector) => {
            const memberPayments = await Promise.all(
              (collector.members || []).map(async (member) => {
                const { data: payments } = await supabase
                  .from('payment_requests')
                  .select('*')
                  .eq('member_number', member.member_number);
                
                return {
                  ...member,
                  payment_requests: payments || []
                };
              })
            );

            return {
              ...collector,
              members: memberPayments
            };
          })
        );

        // Transform the data to include aggregated stats
        const collectorStats: CollectorStats[] = enrichedCollectors.map(collector => {
          const members = collector.members.map(member => {
            const payments = member.payment_requests || [];
            return {
              member_number: member.member_number,
              full_name: member.full_name,
              status: member.status,
              payments: {
                total: payments.length,
                approved: payments.filter(p => p.status === 'approved').length,
                pending: payments.filter(p => p.status === 'pending').length,
                amount: payments.reduce((sum, p) => sum + (p.amount || 0), 0)
              }
            };
          });

          const totalPayments = members.reduce((sum, m) => sum + m.payments.total, 0);
          const approvedPayments = members.reduce((sum, m) => sum + m.payments.approved, 0);
          const pendingPayments = members.reduce((sum, m) => sum + m.payments.pending, 0);
          const totalAmount = members.reduce((sum, m) => sum + m.payments.amount, 0);

          return {
            id: collector.id,
            name: collector.name,
            email: collector.email,
            phone: collector.phone,
            members,
            totalMembers: members.length,
            totalPayments,
            approvedPayments,
            pendingPayments,
            totalAmount
          };
        });

        console.log('Processed collector stats:', collectorStats);
        return {
          collectors: collectorStats,
          totals: {
            members: collectorStats.reduce((sum, c) => sum + c.totalMembers, 0),
            directMembers: collectorStats.reduce((sum, c) => sum + c.totalMembers, 0),
            familyMembers: 0,
            activeCollectors: collectorStats.length
          }
        };
      } catch (error) {
        console.error('Error in memberStats query:', error);
        throw error;
      }
    }
  });

  const generateDetailedMemberExport = (member: CollectorStats['members'][0]) => {
    const title = `Member Report - ${member.full_name}`;
    const reportData = {
      memberInfo: {
        member_number: member.member_number,
        full_name: member.full_name,
        status: member.status,
      },
      paymentSummary: {
        total_payments: member.payments.total,
        approved_payments: member.payments.approved,
        pending_payments: member.payments.pending,
        total_amount: member.payments.amount,
      }
    };
    generatePDF([reportData], title, 'detailed-member');
  };

  const handleExportCollectorReport = (collectorData: CollectorStats) => {
    const title = `Collector Report - ${collectorData.name}`;
    const reportData = collectorData.members.map((member) => ({
      member_number: member.member_number,
      full_name: member.full_name,
      status: member.status,
      total_payments: member.payments.total,
      approved_payments: member.payments.approved,
      pending_payments: member.payments.pending,
      total_amount: member.payments.amount
    }));
    generatePDF(reportData, title, 'collector');
  };

  const handleExportAllCollectors = () => {
    const title = 'Complete Members Report - All Collectors';
    const reportData = stats?.collectors.map((collector) => ({
      collector_name: collector.name,
      collector_email: collector.email || 'No email',
      collector_phone: collector.phone || 'No phone',
      total_members: collector.totalMembers,
      total_payments: collector.totalPayments,
      approved_payments: collector.approvedPayments,
      pending_payments: collector.pendingPayments,
      total_amount: collector.totalAmount,
      members: collector.members.map((member) => ({
        member_number: member.member_number,
        full_name: member.full_name,
        status: member.status,
        payments: member.payments
      }))
    }));
    generatePDF(reportData, title, 'all-collectors');
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error Loading Member Statistics</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load member statistics'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading member statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 glass-card">
          <h3 className="text-lg font-semibold">Total Members</h3>
          <p className="text-3xl font-bold">{stats?.totals.members || 0}</p>
        </Card>
        <Card className="p-4 glass-card">
          <h3 className="text-lg font-semibold">Direct Members</h3>
          <p className="text-3xl font-bold">{stats?.totals.directMembers || 0}</p>
        </Card>
        <Card className="p-4 glass-card">
          <h3 className="text-lg font-semibold">Family Members</h3>
          <p className="text-3xl font-bold">{stats?.totals.familyMembers || 0}</p>
        </Card>
        <Card className="p-4 glass-card">
          <h3 className="text-lg font-semibold">Active Collectors</h3>
          <p className="text-3xl font-bold">{stats?.totals.activeCollectors || 0}</p>
        </Card>
      </div>

      <Card className="p-6 glass-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gradient">Collector Reports</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAllCollectors}
            className="bg-primary/20 hover:bg-primary/30"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export All Collectors
          </Button>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {stats?.collectors.map((collector) => (
            <AccordionItem key={collector.id} value={collector.id} className="border rounded-lg p-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{collector.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {collector.email || 'No email'} | {collector.phone || 'No phone'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>Members: {collector.totalMembers}</span>
                    <span>Total: £{collector.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Member Details</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCollectorReport(collector)}
                      className="bg-primary/20 hover:bg-primary/30"
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Export Collector Report
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payments</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collector.members.map((member) => (
                        <TableRow key={member.member_number}>
                          <TableCell>{member.member_number}</TableCell>
                          <TableCell>{member.full_name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              member.status === 'active' 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {member.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Total: {member.payments.total}</div>
                              <div>Approved: {member.payments.approved}</div>
                              <div>Pending: {member.payments.pending}</div>
                            </div>
                          </TableCell>
                          <TableCell>£{member.payments.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateDetailedMemberExport(member)}
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
}
