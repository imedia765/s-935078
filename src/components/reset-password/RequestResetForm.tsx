
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const RequestResetForm = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
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
          title: "Error",
          description: "Member number not found",
        });
        return;
      }

      if (member.email.toLowerCase() !== email.toLowerCase()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Email address does not match our records",
        });
        return;
      }

      if (!member.auth_user_id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No authentication record found for this member",
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
        title: "Success",
        description: "Password reset instructions have been sent to your email",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset instructions",
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
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-black/40"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="contactNumber" className="block text-sm mb-2">
          Contact Number
        </label>
        <Input
          id="contactNumber"
          type="tel"
          placeholder="Enter your contact number"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="bg-black/40"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Reset Instructions"}
      </Button>

      <div className="text-center">
        <Button variant="link" onClick={() => navigate("/")} className="text-sm">
          Back to Login
        </Button>
      </div>
    </form>
  );
};
