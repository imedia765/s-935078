
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, RefreshCw, UserCog, CheckCircle, XCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CollectorsListProps {
  collectors: any[];
  isLoadingCollectors: boolean;
  refetchCollectors: () => void;
  getPaymentStatusColor: (status: string) => string;
  getPaymentStatusIcon: (status: string) => JSX.Element;
  formatMemberNumber: (collector: any, index: number) => string;
}

export function CollectorsList({
  collectors,
  isLoadingCollectors,
  refetchCollectors,
  getPaymentStatusColor,
  getPaymentStatusIcon,
  formatMemberNumber
}: CollectorsListProps) {
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
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
