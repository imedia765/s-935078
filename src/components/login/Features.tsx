
import { Shield, Bell, CreditCard } from "lucide-react";

export const Features = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Shield className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
        <div className="text-left">
          <h3 className="font-semibold mb-1">Secure Access</h3>
          <p className="text-sm text-gray-400">Your data is protected with industry-standard encryption</p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <Bell className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
        <div className="text-left">
          <h3 className="font-semibold mb-1">Instant Updates</h3>
          <p className="text-sm text-gray-400">Stay informed with real-time notifications</p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <CreditCard className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
        <div className="text-left">
          <h3 className="font-semibold mb-1">Easy Payments</h3>
          <p className="text-sm text-gray-400">Manage your membership fees hassle-free</p>
        </div>
      </div>
    </div>
  );
};
