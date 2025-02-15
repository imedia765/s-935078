
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberWithRelations } from "@/types/member";
import { format } from "date-fns";
import { AvatarSection } from "./AvatarSection";
import { RoleBadges } from "./RoleBadges";
import { ActionButtons } from "./ActionButtons";
import { PasswordChangeDialog } from "./PasswordChangeDialog";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileCardProps {
  memberData: MemberWithRelations | null;
  editedData: MemberWithRelations | null;
  isEditing: boolean;
  validationErrors: Record<string, string>;
  uploadingPhoto: boolean;
  saving: boolean;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

export function ProfileCard({
  memberData,
  editedData,
  isEditing,
  validationErrors,
  uploadingPhoto,
  saving,
  onPhotoUpload,
  onInputChange,
  onSave,
  onCancel,
  onEdit,
}: ProfileCardProps) {
  const getInputClassName = (fieldName: string) => {
    return cn(
      "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      {
        "border-red-500 focus-visible:ring-red-500": validationErrors[fieldName],
        "border-input": !validationErrors[fieldName]
      }
    );
  };

  const renderValidationError = (fieldName: string) => {
    if (!validationErrors[fieldName]) return null;
    return (
      <p className="text-sm text-red-500 mt-1" id={`${fieldName}-error`} role="alert">
        {validationErrors[fieldName]}
      </p>
    );
  };

  const renderField = (fieldName: keyof MemberWithRelations, label: string, type: string = "text") => {
    if (isEditing) {
      const value = editedData?.[fieldName];
      if (typeof value === 'string' || typeof value === 'number' || value === null) {
        return (
          <div className="space-y-2">
            <Input
              type={type}
              value={value?.toString() || ''}
              onChange={(e) => onInputChange(fieldName, e.target.value)}
              className={getInputClassName(fieldName)}
              aria-invalid={!!validationErrors[fieldName]}
              aria-describedby={validationErrors[fieldName] ? `${fieldName}-error` : undefined}
            />
            {renderValidationError(fieldName)}
          </div>
        );
      }
      return null;
    }
    
    const value = memberData?.[fieldName];
    if (typeof value === 'string' || typeof value === 'number' || value === null) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-foreground hover:text-primary transition-colors truncate">
                {value?.toString() || 'Not set'}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p>{value?.toString() || 'Not set'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <AvatarSection
          photoUrl={memberData?.photo_url}
          fullName={memberData?.full_name}
          uploadingPhoto={uploadingPhoto}
          onPhotoUpload={onPhotoUpload}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-4 w-full sm:w-auto">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedData?.full_name || ''}
                    onChange={(e) => onInputChange("full_name", e.target.value)}
                    className={getInputClassName("full_name")}
                    aria-invalid={!!validationErrors.full_name}
                    aria-describedby={validationErrors.full_name ? "full_name-error" : undefined}
                    placeholder="Full Name"
                  />
                  {renderValidationError("full_name")}
                </div>
              ) : (
                <h2 className="text-xl sm:text-2xl font-semibold text-primary truncate">
                  {memberData?.full_name}
                </h2>
              )}
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground font-mono">Member #{memberData?.member_number}</p>
              </div>
              <RoleBadges roles={memberData?.user_roles} />
              {!isEditing && memberData?.member_number && (
                <PasswordChangeDialog memberNumber={memberData.member_number} />
              )}
            </div>
            
            <ActionButtons
              isEditing={isEditing}
              saving={saving}
              status={memberData?.status}
              onSave={onSave}
              onCancel={onCancel}
              onEdit={onEdit}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              {renderField("email", "Email")}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Phone</p>
              {renderField("phone", "Phone")}
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Address</p>
              {renderField("address", "Address")}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Postcode</p>
              {renderField("postcode", "Postcode")}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Town</p>
              {renderField("town", "Town")}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
              {renderField("date_of_birth", "Date of Birth", "date")}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Gender</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Select
                    value={editedData?.gender || ''}
                    onValueChange={(value) => onInputChange("gender", value)}
                  >
                    <SelectTrigger className={getInputClassName("gender")}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {renderValidationError("gender")}
                </div>
              ) : (
                <p className="text-foreground hover:text-primary transition-colors capitalize truncate">
                  {memberData?.gender || 'Not set'}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Marital Status</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Select
                    value={editedData?.marital_status || ''}
                    onValueChange={(value) => onInputChange("marital_status", value)}
                  >
                    <SelectTrigger className={getInputClassName("marital_status")}>
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                  {renderValidationError("marital_status")}
                </div>
              ) : (
                <p className="text-foreground hover:text-primary transition-colors capitalize truncate">
                  {memberData?.marital_status || 'Not set'}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Collector</p>
              <p className="text-foreground hover:text-primary transition-colors truncate">
                {memberData?.collector || 'Not assigned'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
