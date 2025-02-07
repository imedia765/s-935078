
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";

interface AvatarSectionProps {
  photoUrl?: string | null;
  fullName?: string;
  uploadingPhoto: boolean;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AvatarSection({
  photoUrl,
  fullName,
  uploadingPhoto,
  onPhotoUpload
}: AvatarSectionProps) {
  return (
    <div className="relative group">
      <Avatar className="h-20 w-20">
        {photoUrl ? (
          <AvatarImage src={photoUrl} alt={fullName} />
        ) : (
          <AvatarFallback className="bg-primary/20">
            <span className="text-2xl">{fullName?.[0]}</span>
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
        onChange={onPhotoUpload}
        disabled={uploadingPhoto}
      />
    </div>
  );
}
