
import { User, Calendar, Phone, Home } from "lucide-react";

interface InfoItemProps {
  icon: any;
  label: string;
  value: string | null;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground truncate">{value || 'Not set'}</span>
    </div>
  );
}

interface MemberInfoProps {
  memberNumber: string;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
}

export function MemberInfo({
  memberNumber,
  dateOfBirth,
  phone,
  address,
}: MemberInfoProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
      <InfoItem icon={User} label="ID" value={memberNumber} />
      <InfoItem icon={Calendar} label="DOB" value={dateOfBirth} />
      <InfoItem icon={Phone} label="Phone" value={phone} />
      <InfoItem icon={Home} label="Address" value={address} />
    </div>
  );
}
