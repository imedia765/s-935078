import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Payment {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: string;
  member_name?: string;
  collector_name?: string;
}

interface GroupedPayments {
  [key: string]: Payment[];
}

const PaymentHistoryTable = () => {
  const { toast } = useToast();

  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      return roleData?.role;
    },
  });

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['payment-history', userRole],
    queryFn: async () => {
      console.log('Starting payment history fetch...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session');
      }
      
      if (!session?.user) {
        console.error('No user session found');
        throw new Error('No user logged in');
      }

      if (userRole === 'collector') {
        // For collectors, fetch all pending payments for their assigned members
        const { data: collectorData } = await supabase
          .from('members_collectors')
          .select('id')
          .eq('member_number', session.user.user_metadata.member_number)
          .single();

        if (collectorData) {
          const { data: paymentsData, error: paymentsError } = await supabase
            .from('payment_requests')
            .select(`
              *,
              members!payment_requests_member_id_fkey(full_name)
            `)
            .eq('collector_id', collectorData.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (paymentsError) throw paymentsError;

          return paymentsData?.map(payment => ({
            id: payment.id,
            date: payment.created_at,
            type: payment.payment_type,
            amount: payment.amount,
            status: payment.status,
            member_name: payment.members?.full_name
          })) || [];
        }
      }
      
      // For regular members, show their own payment history
      const memberNumber = session.user.user_metadata.member_number;
      
      if (!memberNumber) {
        console.error('No member number found in user metadata');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Member number not found in user profile",
        });
        throw new Error('Member number not found');
      }

      const { data, error: paymentsError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('member_number', memberNumber)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payment requests:', paymentsError);
        throw paymentsError;
      }

      return data.map(payment => ({
        id: payment.id,
        date: payment.created_at,
        type: payment.payment_type,
        amount: payment.amount,
        status: payment.status
      }));
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="glass-card p-4">
        <h3 className="text-xl font-semibold mb-4 text-dashboard-highlight">Payment History</h3>
        <div className="flex items-center gap-2 text-dashboard-highlight">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading payment history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-4">
        <h3 className="text-xl font-semibold mb-4 text-dashboard-highlight">Payment History</h3>
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>Error loading payment history: {error.message}</span>
        </div>
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="glass-card p-4">
        <h3 className="text-xl font-semibold mb-4 text-dashboard-highlight">Payment History</h3>
        <div className="flex items-center gap-2 text-dashboard-highlight">
          <AlertCircle className="h-4 w-4" />
          <span>No payment history found. Please check if you have any pending payments or contact your collector for assistance.</span>
        </div>
      </div>
    );
  }

  const groupedPayments = payments.reduce((acc: GroupedPayments, payment) => {
    const memberName = payment.member_name || 'Unknown Member';
    if (!acc[memberName]) {
      acc[memberName] = [];
    }
    acc[memberName].push(payment);
    return acc;
  }, {});

  return (
    <div className="glass-card p-4">
      <h3 className="text-xl font-semibold mb-4 text-dashboard-highlight">
        {userRole === 'collector' ? 'Pending Payments - Members' : 'Payment History'}
      </h3>
      
      {userRole === 'collector' ? (
        <Accordion type="single" collapsible className="space-y-4">
          {Object.entries(groupedPayments).map(([memberName, memberPayments]) => (
            <AccordionItem
              key={memberName}
              value={memberName}
              className="border border-dashboard-highlight/20 rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dashboard-accent1 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-dashboard-highlight">{memberName}</p>
                    <span className="text-sm text-dashboard-warning">
                      {memberPayments.length} pending payment{memberPayments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="rounded-md border border-dashboard-highlight/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-dashboard-highlight">Date</TableHead>
                        <TableHead className="text-dashboard-highlight">Type</TableHead>
                        <TableHead className="text-dashboard-highlight">Amount</TableHead>
                        <TableHead className="text-dashboard-highlight">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-dashboard-text">{format(new Date(payment.date), 'PPP')}</TableCell>
                          <TableCell className="text-dashboard-text">{payment.type}</TableCell>
                          <TableCell className="text-dashboard-accent3">
                            <span className="text-dashboard-accent3">£</span>{payment.amount}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full bg-dashboard-warning/20 text-dashboard-warning">
                              {payment.status}
                            </span>
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
      ) : (
        <div className="rounded-md border border-dashboard-highlight/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-dashboard-highlight">Date</TableHead>
                <TableHead className="text-dashboard-highlight">Type</TableHead>
                <TableHead className="text-dashboard-highlight">Amount</TableHead>
                <TableHead className="text-dashboard-highlight">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-dashboard-text">{format(new Date(payment.date), 'PPP')}</TableCell>
                  <TableCell className="text-dashboard-text">{payment.type}</TableCell>
                  <TableCell className="text-dashboard-accent3">
                    <span className="text-dashboard-accent3">£</span>{payment.amount}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full ${
                      payment.status === 'pending' 
                        ? 'bg-dashboard-warning/20 text-dashboard-warning'
                        : 'bg-dashboard-accent3/20 text-dashboard-accent3'
                    }`}>
                      {payment.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryTable;