
import { Badge } from "@/components/ui/badge";

interface RoleBadgesProps {
  roles?: Array<{ role: string }>;
}

export function RoleBadges({ roles }: RoleBadgesProps) {
  if (!roles?.length) return null;

  return (
    <ul className="flex flex-wrap gap-2" role="list" aria-label="User roles">
      {roles.map(({ role }, index) => (
        <li key={`${role}-${index}`}>
          <Badge 
            variant="secondary"
            className="bg-primary/20 text-primary hover:bg-primary/30"
          >
            {role}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
