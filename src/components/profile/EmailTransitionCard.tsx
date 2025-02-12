
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Database } from "@/types/supabase";

type EmailTransition = Database['public']['Tables']['email_transitions']['Row'];
type TransitionRpcResponse = Database['public']['Functions']['initiate_email_transition']['Returns'];

interface EmailTransitionProps {
  memberNumber: string;
  currentEmail: string;
  onComplete?: () => void;
}

export function EmailTransitionCard({ memberNumber, currentEmail, onComplete }: EmailTransitionProps) {
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch current transition status if any exists
  const { data: transitionStatus, refetch: refetchStatus } = useQuery<EmailTransition | null>({
    queryKey: ['emailTransition', memberNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_transitions' as any) // Type assertion needed due to Supabase client limitation
        .select('*')
        .eq('member_number', memberNumber)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      // Convert to unknown first, then assert the type
      return (data as unknown) as EmailTransition | null;
    },
    staleTime: 1000 * 60 // 1 minute
  });

  const initiateTransition = async () => {
    try {
      setIsSubmitting(true);

      // Email validation
      if (!newEmail || !newEmail.includes('@')) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      // Call the initiate_email_transition function
      const { data, error } = await supabase
        .rpc('initiate_email_transition' as any, {
          p_member_number: memberNumber,
          p_new_email: newEmail
        });

      if (error) throw error;

      // Convert to unknown first, then assert the type
      const transitionResult = (data as unknown) as TransitionRpcResponse;

      if (!transitionResult.success) {
        toast({
          title: "Error",
          description: transitionResult.error || "Failed to initiate email transition",
          variant: "destructive",
        });
        return;
      }

      // Send verification email using Edge Function
      await supabase.functions.invoke('send-email', {
        body: {
          to: newEmail,
          subject: "Verify Your New Email",
          html: `
            <h2>Email Verification Required</h2>
            <p>Please click the link below to verify your new email address:</p>
            <a href="${window.location.origin}/verify-email?token=${transitionResult.token}">
              Verify Email Address
            </a>
            <p>This link will expire in 24 hours.</p>
          `
        }
      });

      toast({
        title: "Verification Email Sent",
        description: "Please check your email to complete the transition",
      });

      refetchStatus();
    } catch (error: any) {
      console.error('Email transition error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate email transition",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    if (!transitionStatus) return null;

    const statusColors = {
      pending: "text-yellow-500",
      verifying: "text-blue-500",
      completed: "text-green-500",
      failed: "text-red-500"
    } as const;

    return (
      <div className="flex items-center gap-2 mt-4">
        {transitionStatus.status === 'completed' ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : transitionStatus.status === 'failed' ? (
          <AlertCircle className="h-5 w-5 text-red-500" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        )}
        <span className={statusColors[transitionStatus.status]}>
          Status: {transitionStatus.status.charAt(0).toUpperCase() + transitionStatus.status.slice(1)}
        </span>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Email Transition</h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Current Email</p>
          <p className="font-medium">{currentEmail}</p>
        </div>

        {!transitionStatus?.status || transitionStatus.status === 'failed' ? (
          <>
            <div className="space-y-2">
              <label htmlFor="newEmail" className="text-sm text-muted-foreground">
                New Email Address
              </label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter your new email"
                disabled={isSubmitting}
              />
            </div>

            <Button
              onClick={initiateTransition}
              disabled={isSubmitting || !newEmail}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Update Email"
              )}
            </Button>
          </>
        ) : null}

        {getStatusDisplay()}

        {transitionStatus?.error_message && (
          <p className="text-sm text-red-500 mt-2">{transitionStatus.error_message}</p>
        )}
      </div>
    </Card>
  );
}
