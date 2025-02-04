import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CreditCard, Users, Calendar, Receipt, Building2, Edit, Save, X, Upload, Loader2 } from "lucide-react";
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

const Profile = () => {
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
    fetchData();
  }, [navigate]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/");
      return;
    }
  };

  const fetchData = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
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
      
      // If no member record exists but user has roles, create a basic member record
      if (!member && roles && roles.length > 0) {
        const { data: newMember, error: createError } = await supabase
          .from("members")
          .insert([
            {
              auth_user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email,
              email: user.email,
              status: 'active',
              member_number: `M${Date.now().toString().slice(-6)}` // Generate a temporary member number
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error("Error creating member:", createError);
          throw new Error("Failed to create member profile");
        }

        setMemberData({ ...newMember, roles: roles?.map(r => r.role) });
        setEditedData({ ...newMember, roles: roles?.map(r => r.role) });
      } else {
        setMemberData({ ...member, roles: roles?.map(r => r.role) });
        setEditedData({ ...member, roles: roles?.map(r => r.role) });
      }

      // Fetch payment history
      if (member?.member_number) {
        const { data: payments, error: paymentsError } = await supabase
          .from("payment_requests")
          .select("*")
          .eq("member_number", member.member_number)
          .order("created_at", { ascending: false });

        if (paymentsError) {
          console.error("Error fetching payments:", paymentsError);
          throw paymentsError;
        }
        setPaymentHistory(payments || []);
      }

      // Fetch announcements
      const { data: announcements, error: announcementsError } = await supabase
        .from("system_announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (announcementsError) {
        console.error("Error fetching announcements:", announcementsError);
        throw announcementsError;
      }
      setAnnouncements(announcements || []);

    } catch (error: any) {
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${memberData.member_number}-${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update member record with new photo URL
      const { error: updateError } = await supabase
        .from('members')
        .update({ photo_url: publicUrl })
        .eq('id', memberData.id);

      if (updateError) throw updateError;

      // Update local state
      setMemberData(prev => ({ ...prev, photo_url: publicUrl }));
      
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedData(memberData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("members")
        .update({
          full_name: editedData.full_name,
          email: editedData.email,
          phone: editedData.phone,
          address: editedData.address,
          postcode: editedData.postcode,
          town: editedData.town,
          date_of_birth: editedData.date_of_birth,
          gender: editedData.gender,
          marital_status: editedData.marital_status
        })
        .eq("id", memberData.id);

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

  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[#8B5CF6] text-white';
      case 'collector':
        return 'bg-[#F97316] text-white';
      case 'member':
        return 'bg-[#0EA5E9] text-white';
      default:
        return 'bg-gray-500 text-white';
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
                              className={`${getRoleBadgeColor(role)} capitalize text-sm px-3 py-1 shadow-lg hover:opacity-90 transition-opacity`}
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
                  <Button variant="outline" size="sm" className="bg-black/40">
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
                      </div>
                      <Badge variant="outline">{member.family_member_number}</Badge>
                    </div>
                  ))}
                  {(!memberData?.family_members || memberData.family_members.length === 0) && (
                    <p className="text-gray-400 text-center py-4">No family members registered</p>
                  )}
                </div>
              </Card>

              {/* System Announcements */}
              <Card className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="text-primary" />
                  <h2 className="text-xl font-semibold text-gradient">Announcements</h2>
                </div>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="p-4 rounded-lg bg-black/20 border border-gray-800"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-200">{announcement.title}</h3>
                        <Badge variant="outline">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{announcement.message}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No active announcements</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
