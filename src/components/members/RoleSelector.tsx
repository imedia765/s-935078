import { Shield, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RoleSelectorProps {
  currentRole: string | null;
  isUpdating: boolean;
  error: string | null;
  onRoleChange: (role: string) => void;
}

const RoleSelector = ({ currentRole, isUpdating, error, onRoleChange }: RoleSelectorProps) => {
  return (
    <div className="space-y-2">
      <Select 
        onValueChange={onRoleChange}
        disabled={isUpdating}
        value={currentRole || undefined}
      >
        <SelectTrigger 
          className={`w-[140px] h-8 ${
            isUpdating 
              ? 'bg-dashboard-accent1/5 border-dashboard-accent1/10' 
              : 'bg-dashboard-accent1/10 border-dashboard-accent1/20'
          }`}
        >
          <SelectValue placeholder={isUpdating ? "Updating..." : (currentRole || "Select Role")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin
            </div>
          </SelectItem>
          <SelectItem value="collector">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Collector
            </div>
          </SelectItem>
          <SelectItem value="member">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Member
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RoleSelector;