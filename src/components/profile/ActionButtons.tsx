
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
  onEdit
}: ActionButtonsProps) {
  return (
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
        variant={status === 'active' ? 'default' : 'destructive'}
        className={status === 'active' ? 'bg-green-500/20 text-green-700 dark:text-green-400' : ''}
      >
        {status}
      </Badge>
    </div>
  );
}
