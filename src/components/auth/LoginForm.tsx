import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';

const LoginForm = () => {
  const [memberNumber, setMemberNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting login process for member:', memberNumber);
      
      // First, verify member exists
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, member_number')
        .eq('member_number', memberNumber)
        .limit(1);

      if (memberError) {
        console.error('Member verification error:', memberError);
        throw memberError;
      }

      if (!members || members.length === 0) {
        console.error('Member not found');
        throw new Error('Member not found');
      }

      const member = members[0];
      console.log('Member found:', member);

      // Check if member is a collector using a separate query
      let isCollector = false;
      const { data: collectorData } = await supabase
        .from('members_collectors')
        .select('name')
        .eq('member_profile_id', member.id)
        .maybeSingle();

      if (collectorData) {
        console.log('Member is a collector:', collectorData.name);
        isCollector = true;
      }

      const email = `${memberNumber.toLowerCase()}@temp.com`;
      const password = memberNumber;

      console.log('Attempting sign in with:', { email });
      
      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If sign in fails due to invalid credentials, try to sign up
      if (signInError && signInError.message === 'Invalid login credentials') {
        console.log('Attempting signup for new user');
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              member_number: memberNumber,
            }
          }
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          throw signUpError;
        }

        if (signUpData.user) {
          // Update member with auth_user_id
          const { error: updateError } = await supabase
            .from('members')
            .update({ auth_user_id: signUpData.user.id })
            .eq('id', member.id);

          if (updateError) {
            console.error('Error updating member with auth_user_id:', updateError);
            throw updateError;
          }

          // If member is a collector, assign collector role
          if (isCollector) {
            console.log('Assigning collector role for member');
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: signUpData.user.id,
                role: 'collector'
              });

            if (roleError) {
              console.error('Error assigning collector role:', roleError);
              throw roleError;
            }
          }

          console.log('Signup successful, attempting final sign in');
          
          // Final sign in attempt after successful signup
          const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (finalSignInError) {
            console.error('Final sign in error:', finalSignInError);
            throw finalSignInError;
          }

          // Verify session is established
          if (!finalSignInData?.session) {
            throw new Error('Failed to establish session');
          }
        }
      } else if (signInError) {
        throw signInError;
      }

      // Verify session after sign in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Failed to establish session');
      }

      // Invalidate all queries to refresh data
      await queryClient.invalidateQueries();

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      // Clear any existing session
      await supabase.auth.signOut();
      
      toast({
        title: "Login failed",
        description: error.message,
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