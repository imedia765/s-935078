import { Badge } from "@/components/ui/badge";
import { Mail, Phone, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MemberActions } from "./MemberActions";
import { MemberWithRelations } from "../../../types/member";

interface MemberCardProps {
  member: MemberWithRelations;
  onResetLoginState: (memberNumber: string) => Promise<void>;
  onCleanupFailedAttempts: (memberNumber: string) => Promise<void>;
}

export function MemberCard({ member, onResetLoginState, onCleanupFailedAttempts }: MemberCardProps) {
  return (
    <Card className="p-6 glass-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold">{member.full_name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Mail className="w-4 h-4" />
            <span>{member.email}</span>
            {member.phone && (
              <>
                <Phone className="w-4 h-4 ml-2" />
                <span>{member.phone}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {member.user_roles?.map((role: any) => (
            <Badge key={role.role} variant="secondary">
              {role.role}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Member ID</p>
          <p>{member.member_number}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          <Badge variant={member.status === 'active' ? 'secondary' : 'outline'}>
            {member.status}
          </Badge>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
          <p>{member.date_of_birth || 'Not specified'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Address</p>
          <p>{member.address || 'Not specified'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Membership Type</p>
          <p>{member.membership_type || 'Standard'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Last Payment</p>
          <p>{member.payment_date || 'No payment recorded'}</p>
        </div>
      </div>

      {member.family_members && member.family_members.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Family Members</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {member.family_members.map((familyMember: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{familyMember.relationship}</Badge>
                <span>{familyMember.full_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {member.member_notes && member.member_notes.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
          <div className="space-y-2">
            {member.member_notes.map((note: any, index: number) => (
              <div key={index} className="text-sm bg-muted p-2 rounded">
                <Badge variant="outline" className="mb-1">{note.note_type}</Badge>
                <p>{note.note_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {member.failed_login_attempts > 0 && (
        <div className="mb-4">
          <Badge variant="destructive" className="mb-2">
            <AlertCircle className="w-4 h-4 mr-1" />
            {member.failed_login_attempts} failed login attempts
          </Badge>
        </div>
      )}

      <MemberActions 
        member={member}
        onResetLoginState={onResetLoginState}
        onCleanupFailedAttempts={onCleanupFailedAttempts}
      />
    </Card>
  );
}