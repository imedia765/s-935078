
import { Button } from "@/components/ui/button";
import { Key, UserCog, UserCheck, Lock } from "lucide-react";
import { MemberWithRelations } from "../../../types/member";
import { useMagicLink } from "../hooks/useMagicLink";
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
import { useState } from "react";

interface MemberActionsProps {
  member: MemberWithRelations;
  onResetLoginState: (memberNumber: string) => Promise<void>;
  onCleanupFailedAttempts: (memberNumber: string) => Promise<void>;
}

export function MemberActions({ member, onResetLoginState, onCleanupFailedAttempts }: MemberActionsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { resetPasswordToMemberNumber } = useMagicLink();

  const handlePasswordReset = async () => {
    try {
      await resetPasswordToMemberNumber(member.auth_user_id, member.member_number);
      setShowResetConfirm(false);
    } catch (error) {
      console.error("Failed to reset password:", error);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onResetLoginState(member.member_number)}
        >
          <Key className="mr-2 h-4 w-4" />
          Reset Login
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onCleanupFailedAttempts(member.member_number)}
        >
          <UserCog className="mr-2 h-4 w-4" />
          Clear Failed Attempts
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowResetConfirm(true)}
        >
          <Lock className="mr-2 h-4 w-4" />
          Reset Password
        </Button>
        <Button variant="outline" size="sm">
          <UserCheck className="mr-2 h-4 w-4" />
          View Details
        </Button>
      </div>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for {member.full_name} to their member number? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePasswordReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
