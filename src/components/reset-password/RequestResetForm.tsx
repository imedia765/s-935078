
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const RequestResetForm = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: member } = await supabase
        .from("members")
        .select("email, auth_user_id")
        .eq("member_number", memberNumber)
        .single();

      if (!member?.email) {
        toast({
          variant: "destructive",
          title: "Member Not Found",
          description: "No member found with this member number",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText("Member number not found")}
            >
              Copy
            </Button>
          ),
        });
        return;
      }

      if (member.email.toLowerCase() !== email.toLowerCase()) {
        toast({
          variant: "destructive",
          title: "Email Mismatch",
          description: "The email address does not match our records",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText("Email address does not match our records")}
            >
              Copy
            </Button>
          ),
        });
        return;
      }

      if (!member.auth_user_id) {
        toast({
          variant: "destructive",
          title: "Account Error",
          description: "No authentication record found for this member",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText("No authentication record found")}
            >
              Copy
            </Button>
          ),
        });
        return;
      }

      const { data, error: fnError } = await supabase.rpc(
        "generate_magic_link",
        { p_user_id: member.auth_user_id }
      );

      if (fnError) throw fnError;

      const { error: emailError } = await supabase.functions.invoke(
        "send-password-reset",
        {
          body: {
            email: member.email,
            memberNumber: memberNumber,
            token: data,
          },
        }
      );

      if (emailError) throw emailError;

      toast({
        title: "Reset Instructions Sent",
        description: "Please check your email for password reset instructions. The link will expire in 1 hour.",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText("Password reset instructions sent to your email")}
          >
            Copy
          </Button>
        ),
      });
      
      // Clear form after successful submission
      setMemberNumber("");
      setEmail("");
    } catch (error: any) {
      console.error("Password reset request error:", error);
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: error.message || "Failed to send reset instructions. Please try again.",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(error.message || "Failed to send reset instructions")}
          >
            Copy
          </Button>
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRequestReset} className="space-y-4">
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
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending Instructions..." : "Send Reset Instructions"}
      </Button>

      <div className="text-center">
        <Button variant="link" onClick={() => navigate("/")} className="text-sm">
          Back to Login
        </Button>
      </div>
    </form>
  );
};
