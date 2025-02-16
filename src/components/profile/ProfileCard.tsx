import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberWithRelations } from "@/types/member";
import { AvatarSection } from "./AvatarSection";
import { RoleBadges } from "./RoleBadges";
import { ActionButtons } from "./ActionButtons";
import { PasswordChangeDialog } from "./PasswordChangeDialog";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

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
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isSectionExpanded = (section: string) => expandedSections.includes(section);

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
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-4 w-full sm:w-auto">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editedData?.full_name || ''}
                      onChange={(e) => onInputChange("full_name", e.target.value)}
                      className={cn(
                        "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        validationErrors.full_name && "border-red-500 focus-visible:ring-red-500"
                      )}
                      aria-invalid={!!validationErrors.full_name}
                      aria-describedby={validationErrors.full_name ? "full_name-error" : undefined}
                      placeholder="Full Name"
                    />
                    {validationErrors.full_name && (
                      <p className="text-sm text-red-500" id="full_name-error" role="alert">
                        {validationErrors.full_name}
                      </p>
                    )}
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
              </div>
              
              <ActionButtons
                isEditing={isEditing}
                saving={saving}
                onSave={onSave}
                onCancel={onCancel}
                onEdit={onEdit}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                {renderField("email", "Email")}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                {renderField("phone", "Phone")}
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <div className="border rounded-lg p-4">
                <button
                  onClick={() => toggleSection('address')}
                  className="flex justify-between items-center w-full text-left"
                  aria-expanded={isSectionExpanded('address')}
                >
                  <h3 className="text-lg font-medium">Address Information</h3>
                  {isSectionExpanded('address') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                
                {isSectionExpanded('address') && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <button
                  onClick={() => toggleSection('personal')}
                  className="flex justify-between items-center w-full text-left"
                  aria-expanded={isSectionExpanded('personal')}
                >
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  {isSectionExpanded('personal') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
                
                {isSectionExpanded('personal') && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectTrigger className={validationErrors.gender ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {validationErrors.gender && (
                            <p className="text-sm text-red-500" role="alert">{validationErrors.gender}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-foreground capitalize">{memberData?.gender || 'Not set'}</p>
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
                            <SelectTrigger className={validationErrors.marital_status ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select marital status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="married">Married</SelectItem>
                              <SelectItem value="divorced">Divorced</SelectItem>
                              <SelectItem value="widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                          {validationErrors.marital_status && (
                            <p className="text-sm text-red-500" role="alert">{validationErrors.marital_status}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-foreground capitalize">{memberData?.marital_status || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Collector</p>
                      <p className="text-foreground">{memberData?.collector || 'Not assigned'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!isEditing && memberData?.member_number && (
              <div className="mt-4">
                <PasswordChangeDialog memberNumber={memberData.member_number} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
