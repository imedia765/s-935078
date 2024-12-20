import { useToast } from "@/components/ui/use-toast";
import { handleEmailLogin } from "./handlers/emailLoginHandler";
import { handleMemberIdLogin } from "./handlers/memberIdLoginHandler";

export const useLoginHandlers = (setIsLoggedIn: (value: boolean) => void) => {
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const success = await handleEmailLogin(email, password, toast);
    if (success) {
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setIsLoggedIn(true);
    }
  };

  const handleMemberIdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const memberId = (formData.get("memberId") as string).toUpperCase().trim();
    const password = formData.get("memberPassword") as string;

    const success = await handleMemberIdLogin(memberId, password, toast);
    if (success) {
      toast({
        title: "Login successful",
        description: "Welcome! Please update your profile information.",
      });
      setIsLoggedIn(true);
    }
  };

  return {
    handleEmailSubmit,
    handleMemberIdSubmit,
  };
};