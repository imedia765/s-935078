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
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useState, useCallback } from "react";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  PauseCircle, 
  PlayCircle, 
  ArrowRightLeft, 
  Download, 
  FileDown,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { exportToCSV, generatePDF, generateIndividualMemberPDF } from "@/utils/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import debounce from "lodash/debounce";
import Fuse from 'fuse.js';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [movingMember, setMovingMember] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setDebouncedSearchTerm(term);
    }, 300),
    []
  );

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

  // Updated members query with debounced search and fuzzy matching
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["members", selectedCollector, debouncedSearchTerm, sortField, sortDirection],
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

      // If there's a search term, use Fuse.js for fuzzy searching
      if (debouncedSearchTerm) {
        const fuse = new Fuse(data || [], {
          keys: ['full_name', 'email', 'member_number'],
          threshold: 0.3, // Lower threshold means more strict matching
          distance: 100,  // How far to search for matches
          includeScore: true
        });

        const searchResults = fuse.search(debouncedSearchTerm);
        return searchResults.map(result => result.item);
      }

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  if (loadingCollectors || loadingMembers) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-gradient">Members List</h1>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                className="pl-9 w-full bg-card text-card-foreground"
              />
            </div>
            <Select
              value={selectedCollector}
              onValueChange={(value) => setSelectedCollector(value)}
            >
              <SelectTrigger className="w-[200px] glass-card">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="glass-card">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => 
                  exportToCSV(members || [], `members_${selectedCollector === 'all' ? 'all' : 'collector_' + selectedCollector}`)
                }>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => 
                  generatePDF(members || [], `Members Report - ${selectedCollector === 'all' ? 'All Members' : 'Collector ' + selectedCollector}`)
                }>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" /> Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card">
                <DialogHeader>
                  <DialogTitle>Add New Member</DialogTitle>
                  <DialogDescription>
                    Fill in the member details below
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
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
                  addMemberMutation.mutate(memberData);
                }} className="space-y-4">
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

        <Card className="glass-card p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead onClick={() => handleSort('member_number')} className="cursor-pointer">
                  Member Number {getSortIcon('member_number')}
                </TableHead>
                <TableHead onClick={() => handleSort('full_name')} className="cursor-pointer">
                  Full Name {getSortIcon('full_name')}
                </TableHead>
                <TableHead onClick={() => handleSort('email')} className="cursor-pointer">
                  Email {getSortIcon('email')}
                </TableHead>
                <TableHead onClick={() => handleSort('phone')} className="cursor-pointer">
                  Phone {getSortIcon('phone')}
                </TableHead>
                <TableHead>Collector</TableHead>
                <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
                  Status {getSortIcon('status')}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => (
                <TableRow key={member.id} className="border-border hover:bg-muted/50">
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
                        variant="outline"
                        size="icon"
                        onClick={() => generateIndividualMemberPDF(member)}
                      >
                        <FileDown className="h-4 w-4" />
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
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Edit Member</DialogTitle>
              <DialogDescription>
                Update the member details below
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const memberData = {
                full_name: formData.get('full_name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                member_number: formData.get('member_number') as string,
                collector_id: formData.get('collector_id') as string,
              };
              updateMemberMutation.mutate({ id: editingMember.id, data: memberData });
            }} className="space-y-4">
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
                  <Select name="collector_id" defaultValue={editingMember?.collector_id}>
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
          <DialogContent className="glass-card">
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
    </div>
  );
}