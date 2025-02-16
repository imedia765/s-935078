
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, X, Edit, Loader2 } from "lucide-react";

interface ActionButtonsProps {
  isEditing: boolean;
  saving: boolean;
  status?: string;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

export function ActionButtons({
  isEditing,
  saving,
  status,
  onSave,
  onCancel,
  onEdit,
}: ActionButtonsProps) {
  return (
    <div 
      className="flex gap-2"
      role="group"
      aria-label="Profile actions"
    >
      {isEditing ? (
        <>
          <Button 
            onClick={onSave} 
            size="sm" 
            className="bg-primary/20 hover:bg-primary/30 text-primary"
            disabled={saving}
            aria-label={saving ? "Saving changes..." : "Save changes"}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4 mr-1" aria-hidden="true" />
            )}
            <span>Save</span>
          </Button>
          <Button 
            onClick={onCancel} 
            variant="outline" 
            size="sm" 
            className="hover:bg-destructive/20 hover:text-destructive"
            aria-label="Cancel editing"
          >
            <X className="h-4 w-4 mr-1" aria-hidden="true" />
            <span>Cancel</span>
          </Button>
        </>
      ) : (
        <Button 
          onClick={onEdit} 
          variant="outline" 
          size="sm" 
          className="hover:bg-primary/20 hover:text-primary"
          aria-label="Edit profile"
        >
          <Edit className="w-4 h-4 mr-1" aria-hidden="true" />
          <span>Edit</span>
        </Button>
      )}
      {status && (
        <Badge 
          variant={status === 'active' ? 'default' : 'destructive'}
          className={cn(
            status === 'active' 
              ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
              : 'bg-destructive/20 text-destructive'
          )}
        >
          {status}
        </Badge>
      )}
    </div>
  );
}
