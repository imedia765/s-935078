
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StatusMemberDialogProps {
  member: any | null;
  onToggleStatus: (data: { id: string; currentStatus: string }) => void;
  onClose: () => void;
}

export function StatusMemberDialog({ member, onToggleStatus, onClose }: StatusMemberDialogProps) {
  if (!member) return null;

  return (
    <AlertDialog open={!!member} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change Member Status</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {member?.status === 'active' ? 'pause' : 'activate'} {member?.full_name}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onToggleStatus({
              id: member.id,
              currentStatus: member.status
            })}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
