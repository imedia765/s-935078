import { Bell, CreditCard, Lock, User } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">PWA Burton Member Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder cards for the dashboard */}
        <div className="glass-card p-6">
          <User className="w-8 h-8 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Profile</h2>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        
        <div className="glass-card p-6">
          <CreditCard className="w-8 h-8 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Payments</h2>
          <p className="text-muted-foreground">View and manage payments</p>
        </div>
        
        <div className="glass-card p-6">
          <Bell className="w-8 h-8 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Notifications</h2>
          <p className="text-muted-foreground">Stay updated with announcements</p>
        </div>
      </div>
    </div>
  );
};

export default Index;