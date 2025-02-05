import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  member_number: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  date_of_birth: string | null;
  marital_status: string | null;
  membership_type: string | null;
  collector: string | null;
  collector_id: string | null;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
  verified: boolean | null;
  yearly_payment_amount: number | null;
  yearly_payment_due_date: string | null;
  yearly_payment_status: string | null;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/");
          return;
        }

        console.log('Fetching profile for auth_user_id:', user.id);
        const { data: memberData, error } = await supabase
          .from("members")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

        if (error) throw error;

        console.log('Fetched member data:', memberData);
        setProfile(memberData);
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, toast]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("members")
        .update({
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-center text-gray-500">Profile not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-gradient">Profile Details</h2>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="memberNumber" className="text-muted-foreground">Member Number</Label>
              <Input
                id="memberNumber"
                value={profile.member_number}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-muted-foreground">Status</Label>
              <Input
                id="status"
                value={profile.status}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-muted-foreground">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="hover:border-primary/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="hover:border-primary/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-muted-foreground">Phone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="hover:border-primary/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="membershipType" className="text-muted-foreground">Membership Type</Label>
              <Input
                id="membershipType"
                value={profile.membership_type || 'N/A'}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-muted-foreground">Address</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="hover:border-primary/50 focus:border-primary"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </form>
      </Card>
      
      {/* Important Documents Section */}
      <div className="glass-card p-8">
        <h2 className="text-3xl font-bold text-gradient mb-6 text-left">Important Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card p-6 hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-primary flex-shrink-0" />
              <div className="flex-1 text-left">
                <h3 className="text-xl font-semibold text-gradient">Member Guidelines</h3>
                <p className="text-sm text-muted-foreground">Last updated: December 2023</p>
              </div>
              <Button variant="outline" className="bg-black/40 hover:bg-primary/20">
                <FileText className="mr-2 h-4 w-4" /> View
              </Button>
            </div>
            <p className="text-gray-200 text-left">
              Complete guide to membership rules, rights, and responsibilities.
            </p>
          </Card>

          <Card className="glass-card p-6 hover:bg-primary/5 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-primary flex-shrink-0" />
              <div className="flex-1 text-left">
                <h3 className="text-xl font-semibold text-gradient">Payment Guidelines</h3>
                <p className="text-sm text-muted-foreground">Last updated: December 2023</p>
              </div>
              <Button variant="outline" className="bg-black/40 hover:bg-primary/20">
                <FileText className="mr-2 h-4 w-4" /> View
              </Button>
            </div>
            <p className="text-gray-200 text-left">
              Information about payment methods, deadlines, and policies.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;