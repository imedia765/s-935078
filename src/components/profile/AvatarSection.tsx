
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
    <div 
      className="relative group"
      role="region"
      aria-label="Profile photo"
    >
      <Avatar className="h-20 w-20">
        {photoUrl ? (
          <AvatarImage 
            src={photoUrl} 
            alt={`Profile photo of ${fullName}`} 
          />
        ) : (
          <AvatarFallback className="bg-primary/20">
            <span className="text-2xl" aria-hidden="true">
              {fullName?.[0]}
            </span>
            <span className="sr-only">
              {fullName || 'User'} profile picture placeholder
            </span>
          </AvatarFallback>
        )}
      </Avatar>
      <label 
        htmlFor="photo-upload" 
        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            document.getElementById('photo-upload')?.click();
          }
        }}
      >
        {uploadingPhoto ? (
          <>
            <Loader2 
              className="h-6 w-6 text-white animate-spin" 
              aria-hidden="true" 
            />
            <span className="sr-only">Uploading photo...</span>
          </>
        ) : (
          <>
            <Upload 
              className="h-6 w-6 text-white" 
              aria-hidden="true" 
            />
            <span className="sr-only">Upload new profile photo</span>
          </>
        )}
      </label>
      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPhotoUpload}
        disabled={uploadingPhoto}
        aria-label="Choose profile photo"
      />
    </div>
  );
}
