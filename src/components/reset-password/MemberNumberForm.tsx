
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
  const [error, setError] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase(); // Convert to uppercase
    setError(""); // Clear any previous errors
    setMemberNumber(value);
  };

  const validateForm = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError("");

    // Basic format validation (TM followed by numbers)
    if (!memberNumber.match(/^TM\d+$/)) {
      setError("Please enter a valid member number (e.g., TM12345)");
      return;
    }

    // If validation passes, call onSubmit
    onSubmit(e);
  };

  return (
    <form onSubmit={validateForm} className="space-y-4">
      <div>
        <label htmlFor="memberNumber" className="block text-sm mb-2">
          Member Number
        </label>
        <Input
          id="memberNumber"
          type="text"
          placeholder="Enter your member number (e.g., TM12345)"
          value={memberNumber}
          onChange={handleChange}
          className={`bg-black/40 ${error ? 'border-red-500' : ''}`}
          disabled={isLoading}
        />
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
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
