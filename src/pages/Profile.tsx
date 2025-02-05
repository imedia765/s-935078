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
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
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

        const { data: memberData, error } = await supabase
          .from("members")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
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
          first_name: profile.first_name,
          last_name: profile.last_name,
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
        <h2 className="text-3xl font-bold mb-6">Profile Details</h2>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="memberNumber">Member Number</Label>
              <Input
                id="memberNumber"
                value={profile.member_number}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                value={profile.status}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>
      
      {/* Important Documents Section */}
      <div className="glass-card p-8">
        <h2 className="text-3xl font-bold text-gradient mb-6 text-left">Important Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-primary flex-shrink-0" />
              <div className="flex-1 text-left">
                <h3 className="text-xl font-semibold text-gradient">Member Guidelines</h3>
                <p className="text-sm text-gray-400">Last updated: December 2023</p>
              </div>
              <Button variant="outline" className="bg-black/40 hover:bg-primary/20">
                <FileText className="mr-2 h-4 w-4" /> View
              </Button>
            </div>
            <p className="text-gray-200 text-left">
              Complete guide to membership rules, rights, and responsibilities.
            </p>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-primary flex-shrink-0" />
              <div className="flex-1 text-left">
                <h3 className="text-xl font-semibold text-gradient">Payment Guidelines</h3>
                <p className="text-sm text-gray-400">Last updated: December 2023</p>
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