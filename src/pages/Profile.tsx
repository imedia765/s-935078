import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CreditCard, Users, Calendar, Receipt, Building2, Edit, Save, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Avatar } from "@/components/ui/avatar";
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
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [navigate, toast]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from("members")
        .select(`
          *,
          family_members (*)
        `)
        .eq("auth_user_id", user.id)
        .single();

      if (memberError) throw memberError;
      setMemberData(member);
      setEditedData(member);

      const { data: payments, error: paymentsError } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("member_number", member.member_number)
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;
      setPaymentHistory(payments || []);

      const { data: announcements, error: announcementsError } = await supabase
        .from("system_announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (announcementsError) throw announcementsError;
      setAnnouncements(announcements || []);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
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
            <Button onClick={handleLogout} variant="outline" className="bg-black/40 hover:bg-primary/20">
              Sign Out
            </Button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Member Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card className="glass-card p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-20 w-20 bg-primary/20">
                    <span className="text-2xl">{memberData?.full_name?.[0]}</span>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        {isEditing ? (
                          <Input
                            value={editedData?.full_name}
                            onChange={(e) => handleInputChange("full_name", e.target.value)}
                            className="mb-2"
                          />
                        ) : (
                          <h2 className="text-2xl font-semibold text-gradient">{memberData?.full_name}</h2>
                        )}
                        <p className="text-gray-400">Member #{memberData?.member_number}</p>
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