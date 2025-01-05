import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import DashboardView from '@/components/DashboardView';
import MembersList from '@/components/MembersList';
import CollectorsList from '@/components/CollectorsList';
import AuditLogsView from '@/components/AuditLogsView';
import SidePanel from '@/components/SidePanel';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole, roleLoading, canAccessTab } = useRoleAccess();
  const queryClient = useQueryClient();

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
    }
  };

  const handleLogout = async () => {
    await queryClient.invalidateQueries();
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!roleLoading && !canAccessTab(activeTab)) {
      setActiveTab('dashboard');
      toast({
        title: "Access Restricted",
        description: "You don't have permission to access this section.",
        variant: "destructive",
      });
    }
  }, [activeTab, roleLoading, userRole]);

  const renderContent = () => {
    if (!canAccessTab(activeTab)) {
      return <DashboardView onLogout={handleLogout} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onLogout={handleLogout} />;
      case 'users':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2 text-white">Members</h1>
              <p className="text-dashboard-muted">View and manage member information</p>
            </header>
            <MembersList searchTerm={searchTerm} userRole={userRole} />
          </>
        );
      case 'collectors':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2 text-white">Collectors</h1>
              <p className="text-dashboard-muted">View and manage collector information</p>
            </header>
            <CollectorsList />
          </>
        );
      case 'audit':
        return <AuditLogsView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <div className="w-full bg-dashboard-card/50 py-4 text-center border-b border-white/10">
        <p className="text-xl text-white font-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
        <p className="text-sm text-dashboard-text mt-1">In the name of Allah, the Most Gracious, the Most Merciful</p>
      </div>
      
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-dashboard-card/50 border-white/10"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-200 ease-in-out
      `}>
        <SidePanel 
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }} 
          userRole={userRole} 
        />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 transition-all duration-200">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;
