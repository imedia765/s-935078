import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppSupportProps {
  memberName?: string;
  memberNumber?: string;
  memberEmail?: string;
}

export function WhatsAppSupport({ memberName = "", memberNumber = "", memberEmail = "" }: WhatsAppSupportProps) {
  const [name, setName] = useState(memberName);
  const [number, setNumber] = useState(memberNumber);
  const [email, setEmail] = useState(memberEmail);
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const handleWhatsAppSupport = () => {
    if (!name || !number || !email || !query) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all fields before sending your message.",
      });
      return;
    }

    const phoneNumber = "447476816917"; // International format without +
    const message = `PWA Support Request\n\nMember Details:\nName: ${name}\nMember Number: ${number}\nEmail: ${email}\n\nQuery: ${query}`;
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <MessageCircle className="mr-2 h-4 w-4" />
          Contact Support
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="number">Member Number</Label>
            <Input
              id="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Enter your member number"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="query">Query</Label>
            <Input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query"
            />
          </div>
        </div>
        <Button onClick={handleWhatsAppSupport} className="w-full bg-green-600 hover:bg-green-700">
          <MessageCircle className="mr-2 h-4 w-4" />
          Send Message via WhatsApp
        </Button>
      </DialogContent>
    </Dialog>
  );
}