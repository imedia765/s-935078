
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface RoleBadgesProps {
  roles?: Array<{ role: string }>;
}

export function RoleBadges({ roles }: RoleBadgesProps) {
  if (!roles?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role, index) => (
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
  );
}
