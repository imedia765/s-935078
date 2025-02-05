import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CreditCard, Users, Calendar, Receipt, Building2, Edit, Save, X, Upload, Loader2, Pencil, Trash2, FileText } from "lucide-react";
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

      // Then fetch member data with explicit relationship specification
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select(`
          *,
          family_members (*),
          payment_requests!payment_requests_member_id_fkey (
            created_at,
            payment_type,
            amount,
            status,
            payment_number
          )
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

      // Set payment history from the fetched payment_requests
      if (member?.payment_requests) {
        setPaymentHistory(member.payment_requests);
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Member Dashboard
            </h1>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Member Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="glass-card p-6">
                <div className="flex items-start gap-6">
                  {/* Avatar Section */}
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
                  
                  {/* Member Details */}
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
                          <h2 className="text-2xl font-semibold text-primary">{memberData?.full_name}</h2>
                        )}
                        <div className="flex items-center gap-2">
                          <p className="text-muted-foreground font-mono">Member #{memberData?.member_number}</p>
                        </div>
                        {/* Role Badges */}
                        <div className="flex flex-wrap gap-2">
                          {memberData?.roles?.map((role: string, index: number) => (
                            <Badge 
                              key={index} 
                              className="bg-primary/20 text-primary hover:bg-primary/30 transition-colors capitalize text-sm px-3 py-1"
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
                            <Button onClick={handleSave} size="sm" className="bg-primary/20 hover:bg-primary/30 text-primary">
                              <Save className="w-4 h-4 mr-1" /> Save
                            </Button>
                            <Button onClick={handleCancel} variant="outline" size="sm" className="hover:bg-destructive/20 hover:text-destructive">
                              <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                          </>
                        ) : (
                          <Button onClick={handleEdit} variant="outline" size="sm" className="hover:bg-primary/20 hover:text-primary">
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                        )}
                        <Badge 
                          variant={memberData?.status === 'active' ? 'default' : 'destructive'}
                          className={memberData?.status === 'active' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : ''}
                        >
                          {memberData?.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Contact Information Grid */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.email}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.phone}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.address}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Postcode</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.postcode}
                            onChange={(e) => handleInputChange("postcode", e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.postcode}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Town</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.town}
                            onChange={(e) => handleInputChange("town", e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.town}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editedData?.date_of_birth}
                            onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">
                            {memberData?.date_of_birth ? new Date(memberData.date_of_birth).toLocaleDateString() : 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.gender}
                            onChange={(e) => handleInputChange("gender", e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.gender || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Marital Status</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.marital_status}
                            onChange={(e) => handleInputChange("marital_status", e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.marital_status || 'Not set'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Collector</p>
                        <p className="text-foreground hover:text-primary transition-colors">{memberData?.collector}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Bank Details Card */}
              <Card className="glass-card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="text-primary" />
                  <h2 className="text-xl font-semibold text-primary">Bank Details</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bank Name</p>
                    <p className="text-foreground font-medium">HSBC Bank</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Name</p>
                    <p className="text-foreground font-medium">Pakistan Welfare Association</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sort Code</p>
                    <p className="text-foreground font-mono">40-15-34</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="text-foreground font-mono">41024892</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    <strong>IMPORTANT:</strong> You must use your member number ({memberData?.member_number}) as the payment
                    reference when making bank transfers.
                  </p>
                </div>
              </Card>

              {/* Important Documents Card */}
              <Card className="glass-card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="text-primary" />
                    <h2 className="text-xl font-semibold text-primary">Important Documents</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-black/20 rounded-lg border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-200">PWA Collector Member Responsibilities</h3>
                        <p className="text-sm text-gray-400">Last updated: 14 December 2024</p>
                      </div>
                      <Button variant="outline" className="bg-black/40 hover:bg-primary/20">
                        <FileText className="mr-2 h-4 w-4" /> View
                      </Button>
                    </div>
                    <p className="text-sm text-gray-400">
                      Guidelines for collector members regarding their responsibilities and duties.
                    </p>
                  </div>

                  <div className="p-4 bg-black/20 rounded-lg border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-200">Pakistan Welfare Association Membership Terms</h3>
                        <p className="text-sm text-gray-400">Last updated: 14 December 2024</p>
                      </div>
                      <Button variant="outline" className="bg-black/40 hover:bg-primary/20">
                        <FileText className="mr-2 h-4 w-4" /> View
                      </Button>
                    </div>
                    <p className="text-sm text-gray-400">
                      Complete terms and conditions for PWA membership.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Payment History Card */}
              <Card className="glass-card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Receipt className="text-primary" />
                    <h2 className="text-xl font-semibold text-primary">Payment History</h2>
                  </div>
                </div>
                <div className="relative overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-muted-foreground">Date</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground">Amount</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground">Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/50">
                          <TableCell className="text-foreground">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="capitalize text-foreground">{payment.payment_type}</TableCell>
                          <TableCell className="text-foreground font-medium">£{payment.amount}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={payment.status === 'approved' ? 'default' : 'secondary'}
                              className={payment.status === 'approved' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : ''}
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">{payment.payment_number}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Membership Details Card */}
              <Card className="glass-card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="text-primary" />
                  <h2 className="text-xl font-semibold text-primary">Membership Details</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="text-foreground capitalize font-medium">{memberData?.membership_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge 
                      variant={memberData?.yearly_payment_status === 'completed' ? 'default' : 'destructive'}
                      className={memberData?.yearly_payment_status === 'completed' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : ''}
                    >
                      {memberData?.yearly_payment_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Payment Due</p>
                    <p className="text-foreground">
                      {memberData?.yearly_payment_due_date ? 
                        new Date(memberData.yearly_payment_due_date).toLocaleDateString() :
                        'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Due</p>
                    <p className="text-foreground font-medium">£{memberData?.yearly_payment_amount || '0'}</p>
                  </div>
                </div>
              </Card>

              {/* Family Members Card */}
              <Card className="glass-card p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Users className="text-primary" />
                    <h2 className="text-xl font-semibold text-primary">Family Members</h2>
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
