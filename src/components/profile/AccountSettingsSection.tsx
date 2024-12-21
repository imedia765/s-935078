import { useState } from "react";
import { Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NextOfKinSection } from "@/components/registration/NextOfKinSection";
import { SpousesSection } from "@/components/registration/SpousesSection";
import { DependantsSection } from "@/components/registration/DependantsSection";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Member } from "@/components/members/types";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { GoogleLinkSection } from "./sections/GoogleLinkSection";

interface AccountSettingsSectionProps {
  memberData?: Member;
}

export const AccountSettingsSection = ({ memberData }: AccountSettingsSectionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log("Updating profile with data:", formData);

      const { error } = await supabase
        .from('members')
        .update({
          ...formData,
          profile_updated: true,
          first_time_login: false,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', memberData?.email);

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      // If this was a first-time login, redirect to admin dashboard
      if (memberData?.first_time_login) {
        navigate('/admin');
      }

    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Collapsible>
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
        <PersonalInfoSection 
          formData={formData}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
        />
        
        <GoogleLinkSection />

        <div className="space-y-6 pt-4">
          <NextOfKinSection />
          <SpousesSection />
          <DependantsSection />
        </div>

        <div className="flex justify-end">
          <Button 
            className="bg-green-500 hover:bg-green-600"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};