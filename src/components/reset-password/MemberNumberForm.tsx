
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

interface MemberNumberFormProps {
  memberNumber: string;
  setMemberNumber: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const MemberNumberForm = ({
  memberNumber,
  setMemberNumber,
  isLoading,
  onSubmit,
}: MemberNumberFormProps) => {
  const navigate = useNavigate();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="memberNumber" className="block text-sm mb-2">
          Member Number
        </label>
        <Input
          id="memberNumber"
          type="text"
          placeholder="Enter your member number"
          value={memberNumber}
          onChange={(e) => setMemberNumber(e.target.value)}
          className="bg-black/40"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Checking..." : "Continue"}
      </Button>

      <div className="text-center">
        <Button variant="link" onClick={() => navigate("/")} className="text-sm">
          Back to Login
        </Button>
      </div>
    </form>
  );
};
