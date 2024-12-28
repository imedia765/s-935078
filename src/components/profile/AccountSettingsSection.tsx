import { useState } from "react";
import { Cog, User, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NextOfKinSection } from "@/components/registration/NextOfKinSection";
import { SpousesSection } from "@/components/registration/SpousesSection";
import { DependantsSection } from "@/components/registration/DependantsSection";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";
import { Member } from "@/components/members/types";
import { supabase } from "@/integrations/supabase/client";

interface AccountSettingsSectionProps {
  memberData?: Member;
}

export const AccountSettingsSection = ({ memberData }: AccountSettingsSectionProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: memberData?.full_name || "",
    address: memberData?.address || "",
    town: memberData?.town || "",
    postcode: memberData?.postcode || "",
    email: memberData?.email || "",
    phone: memberData?.phone || "",
    date_of_birth: memberData?.date_of_birth || "",
    marital_status: memberData?.marital_status || "",
    gender: memberData?.gender || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGoogleLink = () => {
    toast({
      title: "Google Account Linking",
      description: "This feature will be implemented soon.",
    });
  };

  const handleUpdateProfile = async () => {
    if (!memberData?.id) {
      toast({
        title: "Error",
        description: "Member ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log("Updating profile with data:", formData);

      const { error } = await supabase
        .from('members')
        .update({
          full_name: formData.full_name,
          address: formData.address,
          town: formData.town,
          postcode: formData.postcode,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth || null,
          marital_status: formData.marital_status,
          gender: formData.gender,
          updated_at: new Date().toISOString(),
          profile_updated: true
        })
        .eq('id', memberData.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Also update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          address: formData.address,
          town: formData.town,
          postcode: formData.postcode,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth || null,
          marital_status: formData.marital_status,
          gender: formData.gender,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('member_number', memberData.member_number);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        // Don't show this error to user since the main update succeeded
      }

    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger asChild>
        <Button 
          variant="default"
          className="flex items-center gap-2 w-full justify-between bg-primary hover:bg-primary/90"
        >
          <div className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            <span>Profile Settings</span>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-6 pt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </label>
            <Input 
              value={formData.full_name} 
              onChange={(e) => handleInputChange('full_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </label>
            <Textarea 
              value={formData.address} 
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Town</label>
            <Input 
              value={formData.town} 
              onChange={(e) => handleInputChange('town', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Post Code</label>
            <Input 
              value={formData.postcode} 
              onChange={(e) => handleInputChange('postcode', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <Input 
              value={formData.email} 
              onChange={(e) => handleInputChange('email', e.target.value)}
              type="email" 
            />
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full h-10 bg-white hover:bg-gray-50 border-2 shadow-sm text-gray-700 font-medium"
              onClick={handleGoogleLink}
            >
              <Icons.google className="mr-2 h-5 w-5" />
              Link Google Account
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Mobile No
            </label>
            <Input 
              value={formData.phone} 
              onChange={(e) => handleInputChange('phone', e.target.value)}
              type="tel" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date of Birth
            </label>
            <Input 
              type="date" 
              value={formData.date_of_birth} 
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Marital Status</label>
            <Select 
              value={formData.marital_status} 
              onValueChange={(value) => handleInputChange('marital_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Marital Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => handleInputChange('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <NextOfKinSection />
          <SpousesSection />
          <DependantsSection />
        </div>

        <div className="flex justify-end">
          <Button 
            className="bg-green-500 hover:bg-green-600"
            onClick={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};