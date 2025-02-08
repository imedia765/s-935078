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

interface Collector {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Member {
  id: string;
  member_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  gender?: string;
  family_members: any[];
  payment_requests: any[];
  collector_id: string | null;
  collector: Collector | null;
}

interface CollectorReport {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  members: Array<Member & { 
    payments: {
      total: number;
      approved: number;
      pending: number;
      amount: number;
    }
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
        const { data, error } = await supabase
          .from('members')
          .select(`
            *,
            family_members (
              id,
              full_name,
              gender,
              relationship,
              date_of_birth
            ),
            payment_requests (
              id,
              amount,
              status,
              payment_method,
              created_at
            ),
            collector:members_collectors!members_collector_id_fkey (
              id,
              name,
              email,
              phone
            )
          `);

        if (error) {
          console.error('Error fetching member stats:', error);
          throw error;
        }

        // Properly type and transform the data to match our interfaces
        const processedData = data?.map(member => ({
          ...member,
          collector: Array.isArray(member.collector) && member.collector.length > 0
            ? {
                id: member.collector[0].id,
                name: member.collector[0].name,
                email: member.collector[0].email,
                phone: member.collector[0].phone
              }
            : null
        })) as Member[];

        console.log('Processed member stats:', processedData);
        return processedData;
      } catch (error) {
        console.error('Error in memberStats query:', error);
        throw error;
      }
    }
  });

  const totalMembers = stats?.length || 0;
  const directMembers = stats?.filter(m => !m.family_members?.length)?.length || 0;
  const familyMembers = stats?.reduce((acc, member) => acc + (member.family_members?.length || 0), 0) || 0;

  const genderDistribution = {
    men: stats?.filter(m => m.gender === 'male')?.length || 0,
    women: stats?.filter(m => m.gender === 'female')?.length || 0,
    other: stats?.filter(m => m.gender && m.gender !== 'male' && m.gender !== 'female')?.length || 0,
    unspecified: stats?.filter(m => !m.gender)?.length || 0,
  };

  // Improved collector grouping logic
  const collectorReports: Record<string, CollectorReport> = {};
  
  stats?.forEach(member => {
    if (!member) return;
    
    const collector = member.collector;
    const collectorId = collector?.id || 'unassigned';
    const collectorName = collector?.name || 'Unassigned';
    
    if (!collectorReports[collectorId]) {
      collectorReports[collectorId] = {
        id: collectorId,
        name: collectorName,
        email: collector?.email || null,
        phone: collector?.phone || null,
        members: [],
        totalMembers: 0,
        totalPayments: 0,
        approvedPayments: 0,
        pendingPayments: 0,
        totalAmount: 0
      };
    }

    const memberPayments = member.payment_requests || [];
    const totalPayments = memberPayments.length;
    const approvedPayments = memberPayments.filter(p => p.status === 'approved').length;
    const pendingPayments = memberPayments.filter(p => p.status === 'pending').length;
    const totalAmount = memberPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    collectorReports[collectorId].members.push({
      ...member,
      payments: {
        total: totalPayments,
        approved: approvedPayments,
        pending: pendingPayments,
        amount: totalAmount
      }
    });

    collectorReports[collectorId].totalMembers += 1;
    collectorReports[collectorId].totalPayments += totalPayments;
    collectorReports[collectorId].approvedPayments += approvedPayments;
    collectorReports[collectorId].pendingPayments += pendingPayments;
    collectorReports[collectorId].totalAmount += totalAmount;
  });

  const handleExportCollectorReport = (collectorData: CollectorReport) => {
    const title = `Collector Report - ${collectorData.name}`;
    const reportData = collectorData.members.map((member) => ({
      member_number: member.member_number,
      full_name: member.full_name,
      email: member.email,
      phone: member.phone,
      status: member.status,
      total_payments: member.payments.total,
      approved_payments: member.payments.approved,
      pending_payments: member.payments.pending,
      total_amount: member.payments.amount
    }));
    generatePDF(reportData, title);
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
          <p className="text-3xl font-bold">{totalMembers}</p>
        </Card>
        <Card className="p-4 glass-card">
          <h3 className="text-lg font-semibold">Direct Members</h3>
          <p className="text-3xl font-bold">{directMembers}</p>
        </Card>
        <Card className="p-4 glass-card">
          <h3 className="text-lg font-semibold">Family Members</h3>
          <p className="text-3xl font-bold">{familyMembers}</p>
        </Card>
        <Card className="p-4 glass-card">
          <h3 className="text-lg font-semibold">Active Collectors</h3>
          <p className="text-3xl font-bold">{Object.keys(collectorReports).length}</p>
        </Card>
      </div>

      <Card className="p-6 glass-card">
        <h2 className="text-xl font-semibold mb-4 text-gradient">Collector Reports</h2>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {Object.values(collectorReports).map((collector) => (
            <AccordionItem key={collector.id} value={collector.id} className="border rounded-lg p-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{collector.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {collector.email} | {collector.phone || 'No phone'}
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
                      Export Report
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payments</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collector.members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>{member.member_number}</TableCell>
                          <TableCell>{member.full_name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{member.email}</div>
                              <div>{member.phone || 'No phone'}</div>
                            </div>
                          </TableCell>
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
