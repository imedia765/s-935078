
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import type { EmailStatus } from "./types";

interface EmailResetFormProps {
  memberNumber: string;
  email: string;
  setEmail: (value: string) => void;
  newEmail: string;
  setNewEmail: (value: string) => void;
  emailStatus: EmailStatus;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onReset: () => void;
}

export const EmailResetForm = ({
  memberNumber,
  email,
  setEmail,
  newEmail,
  setNewEmail,
  emailStatus,
  isLoading,
  onSubmit,
  onReset,
}: EmailResetFormProps) => {
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
          value={memberNumber}
          className="bg-black/40"
          disabled
        />
      </div>

      {emailStatus.is_temp_email ? (
        <div>
          <label htmlFor="newEmail" className="block text-sm mb-2">
            New Personal Email Address
          </label>
          <Input
            id="newEmail"
            type="email"
            placeholder="Enter your personal email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="bg-black/40"
            disabled={isLoading}
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            You currently have a temporary email. Please enter your personal email address.
          </p>
        </div>
      ) : (
        <div>
          <label htmlFor="email" className="block text-sm mb-2">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your registered email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-black/40"
            disabled={isLoading}
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            Please enter your registered email address exactly as it appears in your records.
          </p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending Instructions..." : "Send Reset Instructions"}
      </Button>

      <div className="text-center">
        <Button 
          variant="link" 
          onClick={onReset}
          className="text-sm"
        >
          Use Different Member Number
        </Button>
      </div>

      <div className="text-center">
        <Button variant="link" onClick={() => navigate("/")} className="text-sm">
          Back to Login
        </Button>
      </div>
    </form>
  );
};
