
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Announcements = () => {
  return (
    <div className="glass-card p-8">
      <h2 className="text-3xl font-bold text-gradient mb-6 text-left">Latest Announcements</h2>
      <div className="space-y-6">
        <Card className="glass-card p-6">
          <div className="flex items-start gap-3 mb-4">
            <Bell className="text-primary flex-shrink-0 mt-1" />
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gradient">New Committee as of December 2023</h3>
              <p className="text-sm text-gray-400">Posted on December 1, 2023</p>
            </div>
          </div>
          <div className="space-y-4 text-gray-200 text-left">
            <p>Brother Sajid has resigned and a new Committee was formally created. We would like to thank brother Sajid for his previous efforts, and he will continue helping the Committee where possible in an informal capacity.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chairperson:</strong> Anjum Riaz & Habib Mushtaq</li>
              <li><strong>Secretary:</strong> Tariq Majid</li>
              <li><strong>Treasurer:</strong> Faizan Qadiri</li>
            </ul>
          </div>
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-start gap-3 mb-4">
            <Bell className="text-primary flex-shrink-0 mt-1" />
            <div className="text-left">
              <h3 className="text-xl font-semibold text-gradient">Important Member Information</h3>
              <p className="text-sm text-gray-400">Posted on December 1, 2023</p>
            </div>
          </div>
          <div className="space-y-4 text-gray-200 text-left">
            <p>All members have been given membership numbers. Please contact your collector to find this out.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Please login individually and fill in required data.</li>
              <li>We expect timely payments that are up to date.</li>
              <li>If payments are not up to date then you will not be covered.</li>
              <li>Unfortunately we are not taking on new members at this time.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};
