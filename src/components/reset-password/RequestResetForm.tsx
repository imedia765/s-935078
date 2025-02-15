
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MemberNumberForm } from "./MemberNumberForm";
import { EmailResetForm } from "./EmailResetForm";
import { useEmailStatus } from "@/hooks/reset-password/useEmailStatus";
import { usePasswordReset } from "@/hooks/reset-password/usePasswordReset";
import type { EmailStatus } from "./types";

export const RequestResetForm = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const { toast } = useToast();
  const { checkEmailStatus } = useEmailStatus();
  const { initiatePasswordReset } = usePasswordReset();

  const handleMemberNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberNumber.trim()) return;

    console.log("Starting member number submission for:", memberNumber);
    setIsLoading(true);
    const status = await checkEmailStatus(memberNumber);
    setIsLoading(false);

    if (!status?.success) {
      console.warn("Member not found:", memberNumber);
      toast({
        variant: "destructive",
        title: "Member Not Found",
        description: status?.error || "No member found with this member number",
      });
    } else {
      setEmailStatus(status);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailStatus) return;

    setIsLoading(true);
    console.log("Starting password reset request for member:", memberNumber);

    const success = await initiatePasswordReset(
      memberNumber,
      emailStatus.is_temp_email ? newEmail : email,
      !!emailStatus.is_temp_email
    );

    if (success) {
      setMemberNumber("");
      setEmail("");
      setNewEmail("");
      setEmailStatus(null);
    }

    setIsLoading(false);
  };

  const handleReset = () => {
    setEmailStatus(null);
    setEmail("");
    setNewEmail("");
    setMemberNumber("");
  };

  if (!emailStatus) {
    return (
      <MemberNumberForm
        memberNumber={memberNumber}
        setMemberNumber={setMemberNumber}
        isLoading={isLoading}
        onSubmit={handleMemberNumberSubmit}
      />
    );
  }

  return (
    <EmailResetForm
      memberNumber={memberNumber}
      email={email}
      setEmail={setEmail}
      newEmail={newEmail}
      setNewEmail={setNewEmail}
      emailStatus={emailStatus}
      isLoading={isLoading}
      onSubmit={handleRequestReset}
      onReset={handleReset}
    />
  );
};
