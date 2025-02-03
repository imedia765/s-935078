import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const Documents = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 p-6 login-container">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gradient mb-8">Documents</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-primary" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gradient">Membership Guidelines</h2>
                  <p className="text-sm text-gray-400">Last updated: March 2024</p>
                </div>
                <Button variant="outline" className="bg-black/40 hover:bg-primary/20">
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </div>
              <p className="text-gray-200">
                Complete guide to membership rules, rights, and responsibilities.
              </p>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="text-primary" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gradient">Annual Report 2023</h2>
                  <p className="text-sm text-gray-400">Published: January 2024</p>
                </div>
                <Button variant="outline" className="bg-black/40 hover:bg-primary/20">
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </div>
              <p className="text-gray-200">
                Detailed report of the association's activities and financial status for 2023.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;