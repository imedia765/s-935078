import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CreditCard, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const [memberData, setMemberData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/");
          return;
        }

        const { data: member, error } = await supabase
          .from("members")
          .select(`
            *,
            family_members (*)
          `)
          .eq("auth_user_id", user.id)
          .single();

        if (error) throw error;
        setMemberData(member);
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

    fetchMemberData();
  }, [navigate, toast]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Member Profile</h1>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="p-6 bg-black/40 backdrop-blur-md border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Personal Information</h2>
            </div>
            <div className="space-y-3 text-gray-200">
              <p><span className="text-purple-400">Member Number:</span> {memberData?.member_number}</p>
              <p><span className="text-purple-400">Full Name:</span> {memberData?.full_name}</p>
              <p><span className="text-purple-400">Email:</span> {memberData?.email}</p>
              <p><span className="text-purple-400">Phone:</span> {memberData?.phone}</p>
              <p><span className="text-purple-400">Address:</span> {memberData?.address}</p>
            </div>
          </Card>

          {/* Membership Details */}
          <Card className="p-6 bg-black/40 backdrop-blur-md border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Membership Details</h2>
            </div>
            <div className="space-y-3 text-gray-200">
              <p><span className="text-purple-400">Status:</span> {memberData?.status}</p>
              <p><span className="text-purple-400">Type:</span> {memberData?.membership_type}</p>
              <p><span className="text-purple-400">Collector:</span> {memberData?.collector}</p>
              <p><span className="text-purple-400">Yearly Payment Status:</span> {memberData?.yearly_payment_status}</p>
              <p><span className="text-purple-400">Next Payment Due:</span> {memberData?.yearly_payment_due_date}</p>
            </div>
          </Card>

          {/* Family Members */}
          <Card className="p-6 bg-black/40 backdrop-blur-md border-purple-500/20 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Family Members</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberData?.family_members?.map((member: any) => (
                <Card key={member.id} className="p-4 bg-black/20 border-purple-500/10">
                  <h3 className="font-semibold text-white mb-2">{member.full_name}</h3>
                  <div className="text-sm text-gray-300">
                    <p>Relationship: {member.relationship}</p>
                    {member.date_of_birth && (
                      <p>Date of Birth: {new Date(member.date_of_birth).toLocaleDateString()}</p>
                    )}
                  </div>
                </Card>
              ))}
              {(!memberData?.family_members || memberData.family_members.length === 0) && (
                <p className="text-gray-400">No family members registered</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;