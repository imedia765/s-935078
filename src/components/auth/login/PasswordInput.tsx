import { Input } from "@/components/ui/input";

interface PasswordInputProps {
  password: string;
  setPassword: (value: string) => void;
  loading: boolean;
  error?: string | null;
}

const PasswordInput = ({ password, setPassword, loading, error }: PasswordInputProps) => {
  return (
    <div>
      <label htmlFor="password" className="block text-sm font-medium text-dashboard-text mb-2">
        Password
      </label>
      <Input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        className={`w-full ${error ? 'border-red-500' : ''}`}
        required
        disabled={loading}
        autoComplete="current-password"
        aria-invalid={error ? "true" : "false"}
      />
    </div>
  );
};

export default PasswordInput;