import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

const Announcements = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 p-6 login-container">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gradient mb-8">Announcements</h1>
          
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-gradient">Annual General Meeting</h2>
                  <p className="text-sm text-gray-400">Posted on March 15, 2024</p>
                </div>
              </div>
              <p className="text-gray-200">
                The Annual General Meeting will be held on April 1st, 2024. All members are requested to attend.
                Important matters regarding the association's future will be discussed.
              </p>
            </Card>

            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-gradient">Membership Renewal</h2>
                  <p className="text-sm text-gray-400">Posted on March 10, 2024</p>
                </div>
              </div>
              <p className="text-gray-200">
                Reminder: Annual membership renewal is due by March 31st, 2024. Please ensure your payments
                are up to date to maintain active membership status.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;