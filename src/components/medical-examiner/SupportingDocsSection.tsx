import { Card } from "@/components/ui/card";

export const SupportingDocsSection = () => {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Supporting Documentation</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <img
            src="/WhatsApp Image 2024-10-02 at 3.50.07 PM.jpeg"
            alt="Medical Examiner Process Documentation 1"
            className="rounded-lg w-full h-auto shadow-lg object-contain"
            loading="lazy"
          />
        </div>
        <div className="space-y-4">
          <img
            src="/WhatsApp Image 2024-10-02 at 3.50.07 PM (1).jpeg"
            alt="Medical Examiner Process Documentation 2"
            className="rounded-lg w-full h-auto shadow-lg object-contain"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};