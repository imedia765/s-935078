import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsAppSupportProps {
  memberName?: string;
  memberNumber?: string;
  memberEmail?: string;
}

export function WhatsAppSupport({ memberName = "", memberNumber = "", memberEmail = "" }: WhatsAppSupportProps) {
  const handleWhatsAppSupport = () => {
    const phoneNumber = "447476816917"; // International format without +
    const message = `PWA Support Request\n\nMember Details:\nName: ${memberName}\nMember Number: ${memberNumber}\nEmail: ${memberEmail}\n\nQuery: `;
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleWhatsAppSupport}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Contact Support
    </Button>
  );
}