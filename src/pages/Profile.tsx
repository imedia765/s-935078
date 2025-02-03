import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, CreditCard, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 p-6 login-container">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gradient">Member Profile</h1>
            <Button onClick={handleLogout} variant="outline" className="bg-black/40 hover:bg-primary/20">
              Sign Out
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="text-primary" />
                <h2 className="text-xl font-semibold text-gradient">Personal Information</h2>
              </div>
              <div className="space-y-3 text-gray-200">
                <p><span className="text-primary">Member Number:</span> {memberData?.member_number}</p>
                <p><span className="text-primary">Full Name:</span> {memberData?.full_name}</p>
                <p><span className="text-primary">Email:</span> {memberData?.email}</p>
                <p><span className="text-primary">Phone:</span> {memberData?.phone}</p>
                <p><span className="text-primary">Address:</span> {memberData?.address}</p>
              </div>
            </Card>

            {/* Membership Details */}
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="text-primary" />
                <h2 className="text-xl font-semibold text-gradient">Membership Details</h2>
              </div>
              <div className="space-y-3 text-gray-200">
                <p><span className="text-primary">Status:</span> {memberData?.status}</p>
                <p><span className="text-primary">Type:</span> {memberData?.membership_type}</p>
                <p><span className="text-primary">Collector:</span> {memberData?.collector}</p>
                <p><span className="text-primary">Yearly Payment Status:</span> {memberData?.yearly_payment_status}</p>
                <p><span className="text-primary">Next Payment Due:</span> {memberData?.yearly_payment_due_date}</p>
              </div>
            </Card>

            {/* Family Members */}
            <Card className="glass-card p-6 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-primary" />
                <h2 className="text-xl font-semibold text-gradient">Family Members</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memberData?.family_members?.map((member: any) => (
                  <Card key={member.id} className="glass-card p-4">
                    <h3 className="font-semibold text-gradient mb-2">{member.full_name}</h3>
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
    </div>
  );
};

export default Profile;