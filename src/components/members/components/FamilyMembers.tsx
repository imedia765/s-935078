
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { format } from "date-fns";

interface FamilyMember {
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
}

interface FamilyMembersProps {
  members: FamilyMember[];
}

export function FamilyMembers({ members }: FamilyMembersProps) {
  if (!members || members.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4" />
        <h4 className="text-sm font-medium">Family Members</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {members.map((member, index) => (
          <div
            key={index}
            className="flex items-center gap-2 bg-muted/30 rounded p-2"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {member.full_name}
                </span>
                <Badge variant="outline" className="shrink-0">
                  {member.relationship}
                </Badge>
              </div>
              {member.date_of_birth && (
                <div className="text-xs text-muted-foreground">
                  DOB: {format(new Date(member.date_of_birth), 'PP')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
