
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MemberWithRelations } from "@/types/member";

interface UsePhotoUploadReturn {
  uploadingPhoto: boolean;
  handlePhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function usePhotoUpload(
  memberData: MemberWithRelations | null,
  setMemberData: (data: MemberWithRelations | null) => void
): UsePhotoUploadReturn {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { toast } = useToast();

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    setUploadingPhoto(true);

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

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

      // Update member data with new photo URL
      if (memberData) {
        const updatedMemberData: MemberWithRelations = {
          ...memberData,
          photo_url: publicUrl
        };
        setMemberData(updatedMemberData);
      }

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

  return {
    uploadingPhoto,
    handlePhotoUpload
  };
}
