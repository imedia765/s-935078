
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
import { MemberWithRelations, validateField } from "@/types/member";
import { format } from "date-fns";

const Profile = () => {
  const [memberData, setMemberData] = useState<MemberWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<MemberWithRelations | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isAddFamilyMemberOpen, setIsAddFamilyMemberOpen] = useState(false);
  const [isEditFamilyMemberOpen, setIsEditFamilyMemberOpen] = useState(false);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
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

  const validateForm = (data: Partial<MemberWithRelations>): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate each field
    Object.keys(data).forEach((field) => {
      const value = data[field as keyof MemberWithRelations];
      if (typeof value === 'string') {
        const error = validateField(field, value);
        if (error) {
          errors[field] = error;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
      const familyMemberNumber = generateFamilyMemberNumber(memberData?.member_number || '', relationship);

      const { error } = await supabase
        .from('family_members')
        .insert({
          member_id: memberData?.id,
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
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Validate file type
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        throw new Error('Only JPEG and PNG files are allowed');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${memberData?.member_number}-${Math.random()}.${fileExt}`;
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
        .eq('id', memberData?.id);

      if (updateError) throw updateError;

      setMemberData(prev => prev ? { ...prev, photo_url: publicUrl } : null);
      toast({
        title: "Success",
        description: "Profile photo updated successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error uploading photo",
        description: error.message
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedData(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      const error = validateField(field, value);
      setValidationErrors(prev => ({
        ...prev,
        [field]: error || ''
      }));
      return updated;
    });
  };

  const handleSave = async () => {
    if (!editedData) return;

    if (!validateForm(editedData)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please correct the errors before saving"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('members')
        .update(editedData)
        .eq('id', memberData?.id);

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
    } finally {
      setSaving(false);
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
                          <div className="space-y-2">
                            <Input
                              value={editedData?.full_name || ''}
                              onChange={(e) => handleInputChange("full_name", e.target.value)}
                              className={validationErrors.full_name ? "border-red-500" : ""}
                            />
                            {validationErrors.full_name && (
                              <p className="text-sm text-red-500">{validationErrors.full_name}</p>
                            )}
                          </div>
                        ) : (
                          <h2 className="text-2xl font-semibold text-primary">{memberData?.full_name}</h2>
                        )}
                        <div className="flex items-center gap-2">
                          <p className="text-muted-foreground font-mono">Member #{memberData?.member_number}</p>
                        </div>
                        {/* Role Badges */}
                        <div className="flex flex-wrap gap-2">
                          {memberData?.user_roles?.map((role, index) => (
                            <Badge 
                              key={index} 
                              className="bg-primary/20 text-primary hover:bg-primary/30 transition-colors capitalize text-sm px-3 py-1"
                              variant="outline"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              {role.role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button 
                              onClick={handleSave} 
                              size="sm" 
                              className="bg-primary/20 hover:bg-primary/30 text-primary"
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <Save className="h-4 w-4 mr-1" />
                              )}
                              Save
                            </Button>
                            <Button 
                              onClick={handleCancel} 
                              variant="outline" 
                              size="sm" 
                              className="hover:bg-destructive/20 hover:text-destructive"
                            >
                              <X className="h-4 w-4 mr-1" /> Cancel
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
                          <div className="space-y-2">
                            <Input
                              value={editedData?.email || ''}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              className={validationErrors.email ? "border-red-500" : ""}
                            />
                            {validationErrors.email && (
                              <p className="text-sm text-red-500">{validationErrors.email}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.email}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editedData?.phone || ''}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              className={validationErrors.phone ? "border-red-500" : ""}
                            />
                            {validationErrors.phone && (
                              <p className="text-sm text-red-500">{validationErrors.phone}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.phone}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.address || ''}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.address}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Postcode</p>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editedData?.postcode || ''}
                              onChange={(e) => handleInputChange("postcode", e.target.value)}
                              className={validationErrors.postcode ? "border-red-500" : ""}
                            />
                            {validationErrors.postcode && (
                              <p className="text-sm text-red-500">{validationErrors.postcode}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.postcode}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Town</p>
                        {isEditing ? (
                          <Input
                            value={editedData?.town || ''}
                            onChange={(e) => handleInputChange("town", e.target.value)}
                          />
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">{memberData?.town}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              type="date"
                              value={editedData?.date_of_birth || ''}
                              onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
                              className={validationErrors.date_of_birth ? "border-red-500" : ""}
                            />
                            {validationErrors.date_of_birth && (
                              <p className="text-sm text-red-500">{validationErrors.date_of_birth}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors">
                            {memberData?.date_of_birth ? format(new Date(memberData.date_of_birth), 'dd/MM/yyyy') : 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        {isEditing ? (
                          <Select
                            value={editedData?.gender || ''}
                            onValueChange={(value) => handleInputChange("gender", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors capitalize">
                            {memberData?.gender || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Marital Status</p>
                        {isEditing ? (
                          <Select
                            value={editedData?.marital_status || ''}
                            onValueChange={(value) => handleInputChange("marital_status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select marital status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="married">Married</SelectItem>
                              <SelectItem value="divorced">Divorced</SelectItem>
                              <SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-foreground hover:text-primary transition-colors capitalize">
                            {memberData?.marital_status || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Collector</p>
                        <p className="text-foreground hover:text-primary transition-colors">
                          {memberData?.collector || 'Not assigned'}
                        </p>
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
                    <strong>IMPORTANT:</strong> You must use your member number ({memberData?.member_number}) as the payment reference when making a bank transfer to ensure your payment is properly recorded.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Add Family Member Dialog */}
      <Dialog open={isAddFamilyMemberOpen} onOpenChange={setIsAddFamilyMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Family Member</DialogTitle>
            <DialogDescription>
              Add a family member to your membership. They will be linked to your account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFamilyMember}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Family Member</DialogTitle>
            <DialogDescription>
              Update the details of your family member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditFamilyMember}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={selectedFamilyMember?.full_name}
                  className="col-span-3"
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
                  defaultValue={selectedFamilyMember?.date_of_birth}
                  className="col-span-3"
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
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
