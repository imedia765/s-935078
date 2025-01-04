import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { verifyMember, createAuthAccount, signInMember, linkMemberToAuth } from '@/utils/auth';

const LoginForm = () => {
  const [memberNumber, setMemberNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting login process for member:', memberNumber);
      
      // Step 1: Verify member exists
      const member = await verifyMember(memberNumber);
      console.log('Member found:', member);

      // Step 2: Handle auth account creation if needed
      if (!member.auth_user_id) {
        console.log('No auth account found, attempting signup');
        try {
          const authUser = await createAuthAccount(memberNumber);
          if (authUser) {
            console.log('Auth account created:', authUser.id);
          }
        } catch (error) {
          console.log('Auth account might already exist, proceeding to sign in');
        }
      }

      // Step 3: Sign in
      const authUser = await signInMember(memberNumber);
      console.log('Sign in successful:', authUser.id);

      // Step 4: Link member to auth if needed
      if (!member.auth_user_id) {
        await linkMemberToAuth(member.id, authUser.id);
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dashboard-card rounded-lg shadow-lg p-8 mb-12">
      <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto">
        <div>
          <label htmlFor="memberNumber" className="block text-sm font-medium text-dashboard-text mb-2">
            Member Number
          </label>
          <Input
            id="memberNumber"
            type="text"
            value={memberNumber}
            onChange={(e) => setMemberNumber(e.target.value)}
            placeholder="Enter your member number"
            className="w-full"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-dashboard-accent1 hover:bg-dashboard-accent1/90"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;