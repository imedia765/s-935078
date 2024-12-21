import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";

export const GoogleLinkSection = () => {
  const { toast } = useToast();

  const handleGoogleLink = () => {
    toast({
      title: "Google Account Linking",
      description: "This feature will be implemented soon.",
    });
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full h-10 bg-white hover:bg-gray-50 border-2 shadow-sm text-gray-700 font-medium"
        onClick={handleGoogleLink}
      >
        <Icons.google className="mr-2 h-5 w-5" />
        Link Google Account
      </Button>
    </div>
  );
};