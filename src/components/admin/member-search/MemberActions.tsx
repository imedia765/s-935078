import { Button } from "@/components/ui/button";
import { Key, UserCog, UserCheck } from "lucide-react";
import { MemberWithRelations } from "../../../types/member";

interface MemberActionsProps {
  member: MemberWithRelations;
  onResetLoginState: (memberNumber: string) => Promise<void>;
  onCleanupFailedAttempts: (memberNumber: string) => Promise<void>;
}

export function MemberActions({ member, onResetLoginState, onCleanupFailedAttempts }: MemberActionsProps) {
  return (
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
      <Button variant="outline" size="sm">
        <UserCheck className="mr-2 h-4 w-4" />
        View Details
      </Button>
    </div>
  );
}