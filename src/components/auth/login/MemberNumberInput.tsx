import { Input } from "@/components/ui/input";

interface MemberNumberInputProps {
  memberNumber: string;
  setMemberNumber: (value: string) => void;
  loading: boolean;
  error?: string | null;
}

const MemberNumberInput = ({ memberNumber, setMemberNumber, loading, error }: MemberNumberInputProps) => {
  return (
    <div>
      <label htmlFor="memberNumber" className="block text-sm font-medium text-dashboard-text mb-2">
        Member Number or Email
      </label>
      <Input
        id="memberNumber"
        type="text"
        value={memberNumber}
        onChange={(e) => setMemberNumber(e.target.value)}
        placeholder="Enter your member number or email"
        className={`w-full ${error ? 'border-red-500' : ''}`}
        required
        disabled={loading}
        autoComplete="username"
        aria-invalid={error ? "true" : "false"}
      />
    </div>
  );
};

export default MemberNumberInput;