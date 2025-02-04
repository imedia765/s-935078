import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, AlertTriangle, Upload } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) { // 16MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Video must be less than 16MB for WhatsApp sharing.",
        });
        return;
      }
      setVideoFile(file);
      toast({
        title: "Video uploaded",
        description: "Video will be attached to your support message.",
      });
    }
  };

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
        
        <Alert className="bg-yellow-50/10 border-yellow-500/50 mb-4">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-500">
            This support channel is for app-related issues only. For membership or general inquiries, please contact your collector directly.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 mb-6">
          <h3 className="font-medium text-sm">Before submitting:</h3>
          <ul className="list-disc pl-4 space-y-2 text-sm text-muted-foreground">
            <li>Check if you're using the latest version of the app</li>
            <li>Try logging out and logging back in</li>
            <li>Take screenshots of any error messages you see</li>
            <li>Include steps to reproduce the issue in your query</li>
            <li>Record a short video (max 16MB) demonstrating the issue if possible</li>
          </ul>
        </div>

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
              placeholder="Describe your issue in detail, including any error messages"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="video">Video Demonstration (Optional - Max 16MB)</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="cursor-pointer"
            />
            {videoFile && (
              <p className="text-sm text-muted-foreground">
                Video selected: {videoFile.name}
              </p>
            )}
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