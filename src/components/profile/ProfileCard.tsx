import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Edit, Save, X, Upload, Loader2 } from "lucide-react";
import { MemberWithRelations } from "@/types/member";
import { format } from "date-fns";

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
  return (
    <Card className="glass-card p-6">
      <div className="flex items-start gap-6">
        {/* Avatar Section */}
        <div className="relative group">
          <Avatar className="h-20 w-20">
            {memberData?.photo_url ? (
              <AvatarImage src={memberData.photo_url} alt={memberData?.full_name} />
            ) : (
              <AvatarFallback className="bg-primary/20">
                <span className="text-2xl">{memberData?.full_name?.[0]}</span>
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
        
        {/* Member Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedData?.full_name || ''}
                    onChange={(e) => onInputChange("full_name", e.target.value)}
                    className={validationErrors.full_name ? "border-red-500" : ""}
                    aria-invalid={!!validationErrors.full_name}
                    aria-describedby={validationErrors.full_name ? "full_name-error" : undefined}
                  />
                  {validationErrors.full_name && (
                    <p className="text-sm text-red-500" id="full_name-error" role="alert">
                      {validationErrors.full_name}
                    </p>
                  )}
                </div>
              ) : (
                <h2 className="text-2xl font-semibold text-primary">{memberData?.full_name}</h2>
              )}
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground font-mono">Member #{memberData?.member_number}</p>
              </div>
              {/* Role Badges */}
              <div className="flex flex-wrap gap-2">
                {memberData?.user_roles?.map((role, index) => (
                  <Badge 
                    key={index} 
                    className="bg-primary/20 text-primary hover:bg-primary/30 transition-colors capitalize text-sm px-3 py-1"
                    variant="outline"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {role.role}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button 
                    onClick={onSave} 
                    size="sm" 
                    className="bg-primary/20 hover:bg-primary/30 text-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button 
                    onClick={onCancel} 
                    variant="outline" 
                    size="sm" 
                    className="hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={onEdit} variant="outline" size="sm" className="hover:bg-primary/20 hover:text-primary">
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
              )}
              <Badge 
                variant={memberData?.status === 'active' ? 'default' : 'destructive'}
                className={memberData?.status === 'active' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : ''}
              >
                {memberData?.status}
              </Badge>
            </div>
          </div>

          {/* Contact Information Grid */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedData?.email || ''}
                    onChange={(e) => onInputChange("email", e.target.value)}
                    className={validationErrors.email ? "border-red-500" : ""}
                    aria-invalid={!!validationErrors.email}
                    aria-describedby={validationErrors.email ? "email-error" : undefined}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500" id="email-error" role="alert">
                      {validationErrors.email}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-foreground hover:text-primary transition-colors">{memberData?.email}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedData?.phone || ''}
                    onChange={(e) => onInputChange("phone", e.target.value)}
                    className={validationErrors.phone ? "border-red-500" : ""}
                    aria-invalid={!!validationErrors.phone}
                    aria-describedby={validationErrors.phone ? "phone-error" : undefined}
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500" id="phone-error" role="alert">
                      {validationErrors.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-foreground hover:text-primary transition-colors">{memberData?.phone}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedData?.address || ''}
                    onChange={(e) => onInputChange("address", e.target.value)}
                    className={validationErrors.address ? "border-red-500" : ""}
                    aria-invalid={!!validationErrors.address}
                    aria-describedby={validationErrors.address ? "address-error" : undefined}
                  />
                  {validationErrors.address && (
                    <p className="text-sm text-red-500" id="address-error" role="alert">
                      {validationErrors.address}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-foreground hover:text-primary transition-colors">{memberData?.address}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Postcode</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedData?.postcode || ''}
                    onChange={(e) => onInputChange("postcode", e.target.value)}
                    className={validationErrors.postcode ? "border-red-500" : ""}
                    aria-invalid={!!validationErrors.postcode}
                    aria-describedby={validationErrors.postcode ? "postcode-error" : undefined}
                  />
                  {validationErrors.postcode && (
                    <p className="text-sm text-red-500" id="postcode-error" role="alert">
                      {validationErrors.postcode}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-foreground hover:text-primary transition-colors">{memberData?.postcode}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Town</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editedData?.town || ''}
                    onChange={(e) => onInputChange("town", e.target.value)}
                    className={validationErrors.town ? "border-red-500" : ""}
                    aria-invalid={!!validationErrors.town}
                    aria-describedby={validationErrors.town ? "town-error" : undefined}
                  />
                  {validationErrors.town && (
                    <p className="text-sm text-red-500" id="town-error" role="alert">
                      {validationErrors.town}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-foreground hover:text-primary transition-colors">{memberData?.town}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={editedData?.date_of_birth || ''}
                    onChange={(e) => onInputChange("date_of_birth", e.target.value)}
                    className={validationErrors.date_of_birth ? "border-red-500" : ""}
                    aria-invalid={!!validationErrors.date_of_birth}
                    aria-describedby={validationErrors.date_of_birth ? "date_of_birth-error" : undefined}
                  />
                  {validationErrors.date_of_birth && (
                    <p className="text-sm text-red-500" id="date_of_birth-error" role="alert">
                      {validationErrors.date_of_birth}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-foreground hover:text-primary transition-colors">
                  {memberData?.date_of_birth ? format(new Date(memberData.date_of_birth), 'dd/MM/yyyy') : 'Not set'}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gender</p>
              {isEditing ? (
                <Select
                  value={editedData?.gender || ''}
                  onValueChange={(value) => onInputChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-foreground hover:text-primary transition-colors capitalize">
                  {memberData?.gender || 'Not set'}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Marital Status</p>
              {isEditing ? (
                <Select
                  value={editedData?.marital_status || ''}
                  onValueChange={(value) => onInputChange("marital_status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-foreground hover:text-primary transition-colors capitalize">
                  {memberData?.marital_status || 'Not set'}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Collector</p>
              <p className="text-foreground hover:text-primary transition-colors">
                {memberData?.collector || 'Not assigned'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
