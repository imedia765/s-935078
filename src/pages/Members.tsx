import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, PauseCircle, PlayCircle, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MemberFormData {
  full_name: string;
  email: string;
  phone: string;
  member_number: string;
  collector_id: string | null;
  status: string;
}

export default function Members() {
  const [selectedCollector, setSelectedCollector] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [movingMember, setMovingMember] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query collectors for the filter dropdown
  const { data: collectors, isLoading: loadingCollectors } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members_collectors")
        .select("*")
        .eq("active", true);
      if (error) throw error;
      return data;
    }
  });

  // Query members with collector information
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["members", selectedCollector],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select(`
          *,
          members_collectors!members_collectors_member_number_fkey (
            name,
            number,
            active
          )
        `);

      if (selectedCollector !== 'all') {
        query = query.eq('collector_id', selectedCollector);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (newMember: MemberFormData) => {
      const { data, error } = await supabase
        .from('members')
        .insert([newMember])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Member added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add member: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MemberFormData> }) => {
      const { data: updatedMember, error } = await supabase
        .from('members')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setIsEditDialogOpen(false);
      setEditingMember(null);
      toast({
        title: "Success",
        description: "Member updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update member: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete member: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle member status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { data, error } = await supabase
        .from('members')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast({
        title: "Success",
        description: `Member ${data.status === 'active' ? 'activated' : 'paused'} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update member status: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Add move member mutation
  const moveMemberMutation = useMutation({
    mutationFn: async ({ memberId, newCollectorId }: { memberId: string; newCollectorId: string }) => {
      const { data, error } = await supabase
        .from('members')
        .update({ collector_id: newCollectorId })
        .eq('id', memberId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setIsMoveDialogOpen(false);
      setMovingMember(null);
      toast({
        title: "Success",
        description: "Member moved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to move member: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const memberData = {
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      member_number: formData.get('member_number') as string,
      collector_id: formData.get('collector_id') as string,
      status: 'active',
    };

    if (editingMember) {
      updateMemberMutation.mutate({ id: editingMember.id, data: memberData });
    } else {
      addMemberMutation.mutate(memberData);
    }
  };

  if (loadingCollectors || loadingMembers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Members List</h1>
        <div className="flex gap-4">
          <Select
            value={selectedCollector}
            onValueChange={(value) => setSelectedCollector(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by collector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collectors</SelectItem>
              {collectors?.map((collector) => (
                <SelectItem key={collector.id} value={collector.id}>
                  {collector.name || `Collector ${collector.number}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Fill in the member details below
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="full_name" className="text-right">
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="member_number" className="text-right">
                      Member Number
                    </Label>
                    <Input
                      id="member_number"
                      name="member_number"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="collector_id" className="text-right">
                      Collector
                    </Label>
                    <Select name="collector_id">
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a collector" />
                      </SelectTrigger>
                      <SelectContent>
                        {collectors?.map((collector) => (
                          <SelectItem key={collector.id} value={collector.id}>
                            {collector.name || `Collector ${collector.number}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Member</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member Number</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Collector</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.member_number}</TableCell>
                <TableCell>{member.full_name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.phone || 'N/A'}</TableCell>
                <TableCell>
                  {member.members_collectors?.name || 'No Collector'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    member.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.status || 'Unknown'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setEditingMember(member);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleStatusMutation.mutate({
                        id: member.id,
                        currentStatus: member.status
                      })}
                    >
                      {member.status === 'active' ? (
                        <PauseCircle className="h-4 w-4" />
                      ) : (
                        <PlayCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setMovingMember(member);
                        setIsMoveDialogOpen(true);
                      }}
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this member?')) {
                          deleteMemberMutation.mutate(member.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update the member details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  className="col-span-3"
                  defaultValue={editingMember?.full_name}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  className="col-span-3"
                  defaultValue={editingMember?.email}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  className="col-span-3"
                  defaultValue={editingMember?.phone}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="member_number" className="text-right">
                  Member Number
                </Label>
                <Input
                  id="member_number"
                  name="member_number"
                  className="col-span-3"
                  defaultValue={editingMember?.member_number}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="collector_id" className="text-right">
                  Collector
                </Label>
                <Select 
                  name="collector_id"
                  defaultValue={editingMember?.collector_id}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a collector" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectors?.map((collector) => (
                      <SelectItem key={collector.id} value={collector.id}>
                        {collector.name || `Collector ${collector.number}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Member</DialogTitle>
            <DialogDescription>
              Select a new collector for this member
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newCollectorId = formData.get('new_collector_id') as string;
            
            if (movingMember && newCollectorId) {
              moveMemberMutation.mutate({
                memberId: movingMember.id,
                newCollectorId
              });
            }
          }} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new_collector_id" className="text-right">
                  New Collector
                </Label>
                <Select name="new_collector_id" defaultValue={movingMember?.collector_id}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a collector" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectors?.map((collector) => (
                      <SelectItem 
                        key={collector.id} 
                        value={collector.id}
                        disabled={collector.id === movingMember?.collector_id}
                      >
                        {collector.name || `Collector ${collector.number}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Move Member</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
