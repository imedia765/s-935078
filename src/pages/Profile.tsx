import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CreditCard, Users, Calendar, Receipt, Building2, Edit, Save, X, Upload, Loader2, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Profile = () => {
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isAddFamilyMemberOpen, setIsAddFamilyMemberOpen] = useState(false);
  const [isEditFamilyMemberOpen, setIsEditFamilyMemberOpen] = useState(false);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No session found, redirecting to login");
          toast({
            title: "Session Expired",
            description: "Please log in again to continue",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        await fetchData();
      } catch (error: any) {
        console.error("Session check error:", error);
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    initializeProfile();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No user found, redirecting to login");
        navigate("/");
        return;
      }

      // First get user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      console.log("User roles:", roles);

      // Then fetch member data
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select(`
          *,
          family_members (*)
        `)
        .eq("auth_user_id", user.id)
        .maybeSingle();

      console.log("Member data:", member, "Error:", memberError);

      if (memberError && memberError.code !== 'PGRST116') {
        console.error("Error fetching member:", memberError);
        throw new Error("Failed to fetch member data");
      }
      
      setMemberData({ ...member, roles: roles?.map(r => r.role) });
      setEditedData({ ...member, roles: roles?.map(r => r.role) });

      // Fetch payment history if member exists
      if (member?.member_number) {
        const { data: payments, error: paymentsError } = await supabase
          .from("payment_requests")
          .select("*")
          .eq("member_number", member.member_number)
          .order("created_at", { ascending: false });

        if (paymentsError) throw paymentsError;
        setPaymentHistory(payments || []);
      }

      // Fetch announcements
      const { data: announcements, error: announcementsError } = await supabase
        .from("system_announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (announcementsError) throw announcementsError;
      setAnnouncements(announcements || []);

    } catch (error: any) {
      console.error("Error in fetchData:", error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFamilyMemberNumber = (parentMemberNumber: string, relationship: string) => {
    const base = parentMemberNumber;
    const prefix = relationship === 'spouse' ? 'S' : 'D';
    return `${base}-${prefix}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  };

  const handleAddFamilyMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const relationship = formData.get('relationship')?.toString() || '';
      const familyMemberNumber = generateFamilyMemberNumber(memberData.member_number, relationship);

      const { error } = await supabase
        .from('family_members')
        .insert({
          member_id: memberData.id,
          family_member_number: familyMemberNumber,
          full_name: formData.get('full_name')?.toString() || '',
          relationship: relationship,
          date_of_birth: formData.get('date_of_birth')?.toString() || null,
          gender: formData.get('gender')?.toString() || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Family member added successfully"
      });
      
      setIsAddFamilyMemberOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${memberData.member_number}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('members')
        .update({ photo_url: publicUrl })
        .eq('id', memberData.id);

      if (updateError) throw updateError;

      setMemberData({ ...memberData, photo_url: publicUrl });
      toast({
        title: "Success",
        description: "Profile photo updated successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('members')
        .update(editedData)
        .eq('id', memberData.id);

      if (error) throw error;

      setMemberData(editedData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleCancel = () => {
    setEditedData(memberData);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditedData(memberData);
    setIsEditing(true);
  };

  const handleEditFamilyMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase
        .from('family_members')
        .update({
          full_name: formData.get('full_name')?.toString() || '',
          relationship: formData.get('relationship')?.toString() || '',
          date_of_birth: formData.get('date_of_birth')?.toString() || null,
          gender: formData.get('gender')?.toString() || null
        })
        .eq('id', selectedFamilyMember.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Family member updated successfully"
      });
      
      setIsEditFamilyMemberOpen(false);
      setSelectedFamilyMember(null);
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleDeleteFamilyMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Family member removed successfully"
      });
      
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h2 className="text-xl font-semibold mb-4">Error Loading Profile</h2>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchData}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gradient">Member Dashboard</h1>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Member Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="glass-card p-6">
                <div className="flex items-start gap-6">
                  <div className="relative group">
                    <Avatar className="h-20 w-20">
                      {memberData?.photo_url ? (
                        <AvatarImage src={memberData.photo_url} alt={memberData?.full_name} />
                      ) : (
                        <AvatarFallback className="bg-primary/20">
                          <span className="text-2xl">{memberData?.full_name?.[0]}</span>
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <label 
                      htmlFor="photo-upload" 
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      ) : (
                        <Upload className="h-6 w-6 text-white" />
                      )}
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-4">
                        {isEditing ? (
                          <Input
                            value={editedData?.full_name}
                            onChange={(e) => handleInputChange("full_name", e.target.value)}
                            className="mb-2"
                          />
                        ) : (
                          <h2 className="text-2xl font-semibold text-gradient">{memberData?.full_name}</h2>
                        )}
                        <div className="flex items-center gap-2">
                          <p className="text-gray-400">Member #{memberData?.member_number}</p>
                        </div>
                        {/* Role Badges */}
                        <div className="flex flex-wrap gap-2">
                          {memberData?.roles?.map((role: string, index: number) => (
                            <Badge 
                              key={index} 
                              className={`bg-gray-500 text-white capitalize text-sm px-3 py-1 shadow-lg hover:opacity-90 transition-opacity`}
                              variant="outline"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button onClick={handleSave} size="sm" className="bg-primary/20">
                              <Save className="w-4 h-4 mr-1" /> Save
                            </Button>
                            <Button onClick={handleCancel} variant="outline" size="sm" className="bg-black/40">
                              <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                          </>
                        ) : (
                          <Button onClick={handleEdit} variant="outline" size="sm" className="bg-black/40">
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                        )}
                        <Badge variant={memberData?.status === 'active' ? 'default' : 'destructive'}>
                          {memberData?.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                          />
                        ) : (
                          <p className="text-gray-200">{memberData?.email}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                          />
                        ) : (
                          <p className="text-gray-200">{memberData?.phone}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Address</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                          />
                        ) : (
                          <p className="text-gray-200">{memberData?.address}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Postcode</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.postcode}
                            onChange={(e) => handleInputChange("postcode", e.target.value)}
                          />
                        ) : (
                          <p className="text-gray-200">{memberData?.postcode}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Town</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.town}
                            onChange={(e) => handleInputChange("town", e.target.value)}
                          />
                        ) : (
                          <p className="text-gray-200">{memberData?.town}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Date of Birth</p>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editedData?.date_of_birth}
                            onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                          />
                        ) : (
                          <p className="text-gray-200">
                            {memberData?.date_of_birth ? new Date(memberData.date_of_birth).toLocaleDateString() : 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Gender</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.gender}
                            onChange={(e) => handleInputChange("gender", e.target.value)}
                          />
                        ) : (
                          <p className="text-gray-200">{memberData?.gender || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Marital Status</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.marital_status}
                            onChange={(e) => handleInputChange("marital_status", e.target.value)}
                          />
                        ) : (
                          <p className="text-gray-200">{memberData?.marital_status || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Collector</p>
                        <p className="text-gray-200">{memberData?.collector}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Bank Details */}
              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="text-primary" />
                  <h2 className="text-xl font-semibold text-gradient">Bank Details</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Bank Name</p>
                    <p className="text-gray-200">HSBC Bank</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Account Name</p>
                    <p className="text-gray-200">Pakistan Welfare Association</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Sort Code</p>
                    <p className="text-gray-200">40-15-34</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Account Number</p>
                    <p className="text-gray-200">41024892</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm text-yellow-500">
                    <strong>IMPORTANT:</strong> You must use your member number ({memberData?.member_number}) as the payment
                    reference when making bank transfers.
                  </p>
                </div>
              </Card>

              {/* Payment History */}
              <Card className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Receipt className="text-primary" />
                    <h2 className="text-xl font-semibold text-gradient">Payment History</h2>
                  </div>
                </div>
                <div className="relative overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {new Date(payment.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="capitalize">{payment.payment_type}</TableCell>
                          <TableCell>£{payment.amount}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'approved' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.payment_number}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Right Column - Additional Info */}
            <div className="space-y-6">
              {/* Membership Details */}
              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="text-primary" />
                  <h2 className="text-xl font-semibold text-gradient">Membership Details</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Type</p>
                    <p className="text-gray-200 capitalize">{memberData?.membership_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Payment Status</p>
                    <Badge variant={memberData?.yearly_payment_status === 'completed' ? 'default' : 'destructive'}>
                      {memberData?.yearly_payment_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Next Payment Due</p>
                    <p className="text-gray-200">
                      {memberData?.yearly_payment_due_date ? 
                        new Date(memberData.yearly_payment_due_date).toLocaleDateString() :
                        'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Amount Due</p>
                    <p className="text-gray-200">£{memberData?.yearly_payment_amount || '0'}</p>
                  </div>
                </div>
              </Card>

              {/* Family Members */}
              <Card className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Users className="text-primary" />
                    <h2 className="text-xl font-semibold text-gradient">Family Members</h2>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-black/40"
                    onClick={() => setIsAddFamilyMemberOpen(true)}
                  >
                    Add Member
                  </Button>
                </div>
                <div className="space-y-3">
                  {memberData?.family_members?.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-gray-800"
                    >
                      <div>
                        <p className="font-medium text-gray-200">{member.full_name}</p>
                        <p className="text-sm text-gray-400 capitalize">{member.relationship}</p>
                        {member.date_of_birth && (
                          <p className="text-sm text-gray-400">
                            DOB: {new Date(member.date_of_birth).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFamilyMember(member);
                            setIsEditFamilyMemberOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFamilyMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!memberData?.family_members || memberData.family_members.length === 0) && (
                    <p className="text-gray-400 text-center py-4">No family members registered</p>
                  )}
                </div>
              </Card>

              {/* Add Family Member Dialog */}
              <Dialog open={isAddFamilyMemberOpen} onOpenChange={setIsAddFamilyMemberOpen}>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Add Family Member</DialogTitle>
                    <DialogDescription>
                      Add a new family member to your profile
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddFamilyMember} className="space-y-4">
                    <div className="grid gap-4">
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
                        <Label htmlFor="relationship" className="text-right">
                          Relationship
                        </Label>
                        <Select name="relationship" required>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date_of_birth" className="text-right">
                          Date of Birth
                        </Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gender" className="text-right">
                          Gender
                        </Label>
                        <Select name="gender">
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Family Member</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Edit Family Member Dialog */}
              <Dialog open={isEditFamilyMemberOpen} onOpenChange={setIsEditFamilyMemberOpen}>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Edit Family Member</DialogTitle>
                    <DialogDescription>
                      Update family member details
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleEditFamilyMember} className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="full_name" className="text-right">
                          Full Name
                        </Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          className="col-span-3"
                          defaultValue={selectedFamilyMember?.full_name}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="relationship" className="text-right">
                          Relationship
                        </Label>
                        <Select name="relationship" defaultValue={selectedFamilyMember?.relationship} required>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date_of_birth" className="text-right">
                          Date of Birth
                        </Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          className="col-span-3"
                          defaultValue={selectedFamilyMember?.date_of_birth}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gender" className="text-right">
                          Gender
                        </Label>
                        <Select name="gender" defaultValue={selectedFamilyMember?.gender}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Update Family Member</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
