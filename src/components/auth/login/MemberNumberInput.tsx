import { Input } from "@/components/ui/input";

interface MemberNumberInputProps {
  memberNumber: string;
  setMemberNumber: (value: string) => void;
  loading: boolean;
  error?: string | null;
}

const MemberNumberInput = ({ memberNumber, setMemberNumber, loading, error }: MemberNumberInputProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase immediately and trim any whitespace
    const sanitizedValue = e.target.value.trim().toUpperCase();
    setMemberNumber(sanitizedValue);
  };

  return (
    <div>
      <label htmlFor="memberNumber" className="block text-sm font-medium text-dashboard-text mb-2">
        Member Number
      </label>
      <Input
        id="memberNumber"
        type="text"
        value={memberNumber}
        onChange={handleInputChange}
        placeholder="Enter your member number (e.g. TM12345)"
        className={`w-full ${error ? 'border-red-500' : ''}`}
        required
        disabled={loading}
        autoComplete="off"
        aria-invalid={error ? "true" : "false"}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default MemberNumberInput;