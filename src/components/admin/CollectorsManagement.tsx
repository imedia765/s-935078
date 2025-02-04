import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Users, 
  UserPlus, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Wallet,
  UserCog,
  AlertCircle,
  Clock,
  PoundSterling
} from "lucide-react";

export function CollectorsManagement() {
  const { toast } = useToast();

  // Query collectors data with member numbers and payment status
  const { data: collectors, isLoading: isLoadingCollectors, refetch } = useQuery({
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

  const handleCreateAuthUsers = async () => {
    try {
      const { error } = await supabase.rpc('create_auth_users_for_collectors');
      if (error) throw error;
      toast({
        title: "Success",
        description: "Auth users created for collectors",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Since profile functionality isn't ready, we'll skip the update for now
  const handleUpdateProfiles = async () => {
    toast({
      title: "Info",
      description: "Profile update functionality is not available yet",
    });
  };

  // Maintain collector roles
  const handleMaintainRoles = async () => {
    try {
      const { error } = await supabase.rpc('maintain_collector_roles');
      if (error) throw error;
      toast({
        title: "Success",
        description: "Collector roles maintained",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Fix collector roles
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
      refetch();
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

  return (
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
  );
}
