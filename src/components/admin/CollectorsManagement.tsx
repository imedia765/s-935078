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
  Users, 
  UserPlus, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Wallet,
  UserCog,
  AlertCircle
} from "lucide-react";

export function CollectorsManagement() {
  const { toast } = useToast();

  // Query collectors data with member numbers
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
          )
        `);
      if (error) throw error;
      return data;
    }
  });

  // Create auth users for collectors
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
        <Card className="p-4 flex-1 glass-card">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Total Collectors</h3>
          </div>
          <p className="text-3xl font-bold text-primary mt-2">
            {collectors?.length || 0}
          </p>
        </Card>
        
        <Card className="p-4 flex-1 glass-card">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Active Collectors</h3>
          </div>
          <p className="text-3xl font-bold text-green-500 mt-2">
            {collectors?.filter(c => c.active)?.length || 0}
          </p>
        </Card>

        <Card className="p-4 flex-1 glass-card">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Total Collections</h3>
          </div>
          <p className="text-3xl font-bold text-purple-500 mt-2">
            £{collectors?.reduce((acc, curr) => acc + 40, 0) || 0}
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
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-primary/5">
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Member Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auth Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectors?.map((collector) => (
                  <TableRow key={collector.id} className="hover:bg-primary/5">
                    <TableCell>{collector.name}</TableCell>
                    <TableCell>{collector.number}</TableCell>
                    <TableCell>{collector.member_number}</TableCell>
                    <TableCell>{collector.email}</TableCell>
                    <TableCell>
                      {collector.active ? (
                        <span className="flex items-center text-green-500">
                          <CheckCircle className="mr-1 h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center text-red-500">
                          <XCircle className="mr-1 h-4 w-4" /> Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {collector.auth_user_id ? (
                        <span className="flex items-center text-green-500">
                          <CheckCircle className="mr-1 h-4 w-4" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-500">
                          <AlertCircle className="mr-1 h-4 w-4" /> Pending
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => collector.auth_user_id && handleFixRoles(collector.auth_user_id)}
                        disabled={!collector.auth_user_id}
                      >
                        <UserCog className="mr-2 h-4 w-4" />
                        Fix Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
