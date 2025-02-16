
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
        "border-destructive focus-visible:ring-destructive": validationErrors[fieldName],
        "border-input": !validationErrors[fieldName]
      }
    );
  };

  const renderValidationError = (fieldName: string) => {
    if (!validationErrors[fieldName]) return null;
    return (
      <p 
        className="text-sm text-destructive mt-1" 
        id={`${fieldName}-error`} 
        role="alert"
      >
        {validationErrors[fieldName]}
      </p>
    );
  };

  const renderField = (fieldName: keyof MemberWithRelations, label: string, type: string = "text") => {
    const inputId = `profile-${fieldName}`;
    
    if (isEditing) {
      const value = editedData?.[fieldName];
      if (typeof value === 'string' || typeof value === 'number' || value === null) {
        return (
          <div className="space-y-2">
            <Input
              id={inputId}
              type={type}
              value={value?.toString() || ''}
              onChange={(e) => onInputChange(fieldName, e.target.value)}
              className={getInputClassName(fieldName)}
              aria-invalid={!!validationErrors[fieldName]}
              aria-describedby={validationErrors[fieldName] ? `${fieldName}-error` : undefined}
              aria-label={label}
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
              <p 
                className="text-foreground hover:text-primary transition-colors truncate"
                id={inputId}
              >
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
                    <label 
                      htmlFor="profile-full_name" 
                      className="text-sm font-medium text-foreground"
                    >
                      Full Name
                    </label>
                    <Input
                      id="profile-full_name"
                      value={editedData?.full_name || ''}
                      onChange={(e) => onInputChange("full_name", e.target.value)}
                      className={cn(
                        getInputClassName("full_name"),
                        validationErrors.full_name && "border-destructive focus-visible:ring-destructive"
                      )}
                      aria-invalid={!!validationErrors.full_name}
                      aria-describedby={validationErrors.full_name ? "full_name-error" : undefined}
                    />
                    {validationErrors.full_name && (
                      <p 
                        className="text-sm text-destructive" 
                        id="full_name-error"
                        role="alert"
                      >
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
                  <p 
                    className="text-sm text-muted-foreground font-mono"
                    aria-label="Member number"
                  >
                    Member #{memberData?.member_number}
                  </p>
                </div>
                <RoleBadges roles={memberData?.user_roles} />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="profile-email"
                  className="text-sm text-muted-foreground mb-1 block"
                >
                  Email
                </label>
                {renderField("email", "Email")}
              </div>
              <div>
                <label 
                  htmlFor="profile-phone"
                  className="text-sm text-muted-foreground mb-1 block"
                >
                  Phone
                </label>
                {renderField("phone", "Phone")}
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <section 
                className="border rounded-lg p-4"
                aria-labelledby="address-section-title"
              >
                <button
                  onClick={() => toggleSection('address')}
                  className="flex justify-between items-center w-full text-left"
                  aria-expanded={isSectionExpanded('address')}
                  aria-controls="address-section-content"
                >
                  <h3 
                    id="address-section-title" 
                    className="text-lg font-medium text-foreground"
                  >
                    Address Information
                  </h3>
                  <span className="sr-only">
                    {isSectionExpanded('address') ? 'Collapse' : 'Expand'} address section
                  </span>
                  {isSectionExpanded('address') ? (
                    <ChevronUp className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                
                {isSectionExpanded('address') && (
                  <div 
                    id="address-section-content"
                    className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div className="md:col-span-2">
                      <label 
                        htmlFor="profile-address"
                        className="text-sm text-muted-foreground mb-1 block"
                      >
                        Address
                      </label>
                      {renderField("address", "Address")}
                    </div>
                    <div>
                      <label 
                        htmlFor="profile-postcode"
                        className="text-sm text-muted-foreground mb-1 block"
                      >
                        Postcode
                      </label>
                      {renderField("postcode", "Postcode")}
                    </div>
                    <div>
                      <label 
                        htmlFor="profile-town"
                        className="text-sm text-muted-foreground mb-1 block"
                      >
                        Town
                      </label>
                      {renderField("town", "Town")}
                    </div>
                  </div>
                )}
              </section>

              <section 
                className="border rounded-lg p-4"
                aria-labelledby="personal-section-title"
              >
                <button
                  onClick={() => toggleSection('personal')}
                  className="flex justify-between items-center w-full text-left"
                  aria-expanded={isSectionExpanded('personal')}
                  aria-controls="personal-section-content"
                >
                  <h3 
                    id="personal-section-title"
                    className="text-lg font-medium text-foreground"
                  >
                    Personal Information
                  </h3>
                  <span className="sr-only">
                    {isSectionExpanded('personal') ? 'Collapse' : 'Expand'} personal information section
                  </span>
                  {isSectionExpanded('personal') ? (
                    <ChevronUp className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                
                {isSectionExpanded('personal') && (
                  <div 
                    id="personal-section-content"
                    className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <label 
                        htmlFor="profile-date_of_birth"
                        className="text-sm text-muted-foreground mb-1 block"
                      >
                        Date of Birth
                      </label>
                      {renderField("date_of_birth", "Date of Birth", "date")}
                    </div>
                    <div>
                      <label 
                        htmlFor="profile-gender"
                        className="text-sm text-muted-foreground mb-1 block"
                      >
                        Gender
                      </label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Select
                            value={editedData?.gender || ''}
                            onValueChange={(value) => onInputChange("gender", value)}
                          >
                            <SelectTrigger 
                              className={validationErrors.gender ? "border-destructive" : ""}
                              aria-invalid={!!validationErrors.gender}
                              aria-describedby={validationErrors.gender ? "gender-error" : undefined}
                            >
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {validationErrors.gender && (
                            <p 
                              className="text-sm text-destructive" 
                              id="gender-error"
                              role="alert"
                            >
                              {validationErrors.gender}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-foreground capitalize">
                          {memberData?.gender || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label 
                        htmlFor="profile-marital_status"
                        className="text-sm text-muted-foreground mb-1 block"
                      >
                        Marital Status
                      </label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Select
                            value={editedData?.marital_status || ''}
                            onValueChange={(value) => onInputChange("marital_status", value)}
                          >
                            <SelectTrigger 
                              className={validationErrors.marital_status ? "border-destructive" : ""}
                              aria-invalid={!!validationErrors.marital_status}
                              aria-describedby={validationErrors.marital_status ? "marital_status-error" : undefined}
                            >
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
                            <p 
                              className="text-sm text-destructive" 
                              id="marital_status-error"
                              role="alert"
                            >
                              {validationErrors.marital_status}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-foreground capitalize">
                          {memberData?.marital_status || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label 
                        htmlFor="profile-collector"
                        className="text-sm text-muted-foreground mb-1 block"
                      >
                        Collector
                      </label>
                      <p className="text-foreground">
                        {memberData?.collector || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                )}
              </section>
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
