import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Users, Home, DollarSign } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuthLogout } from '@/hooks/useAuthLogout';

interface SidePanelProps {
  userRole: string | null;
}

const SidePanel = ({ userRole }: SidePanelProps) => {
  const { handleLogout } = useAuthLogout();
  const location = useLocation();

  const links = [
    {
      title: "Dashboard",
      label: "",
      icon: <Home className="w-4 h-4" />,
      variant: "ghost",
      href: "/dashboard",
    },
    {
      title: "Members",
      label: "",
      icon: <Users className="w-4 h-4" />,
      variant: "ghost",
      href: "/users",
    },
    {
      title: "Financials",
      label: "",
      icon: <DollarSign className="w-4 h-4" />,
      variant: "ghost",
      href: "/financials",
    },
    {
      title: "System",
      label: "",
      icon: <Settings className="w-4 h-4" />,
      variant: "ghost",
      href: "/system",
    },
  ];

  const filteredLinks = links.filter(link => {
    if (userRole === 'admin') return true;
    if (userRole === 'collector') {
      return ['Dashboard', 'Members'].includes(link.title);
    }
    if (userRole === 'member') {
      return ['Dashboard'].includes(link.title);
    }
    return false;
  });

  return (
    <div className="h-screen flex">
      <div className="relative flex flex-col h-full w-64 border-r border-dashboard-cardBorder bg-dashboard-card">
        <div className="flex-1 px-3 py-8">
          <div className="space-y-4">
            <div className="px-3 py-2">
              <h2 className="mb-4 px-4 text-lg font-semibold tracking-tight text-dashboard-accent1">
                Overview
              </h2>
              <nav className="space-y-1">
                {filteredLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.href}
                    className={cn(
                      "flex items-center justify-start w-full p-3 text-sm font-medium rounded-md transition-colors",
                      "hover:text-white hover:bg-dashboard-cardHover",
                      location.pathname === link.href 
                        ? "bg-dashboard-accent1 text-white" 
                        : "text-dashboard-text"
                    )}
                  >
                    <span className="mr-3">{link.icon}</span>
                    <span>{link.title}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 p-4 mt-auto border-t border-dashboard-cardBorder bg-dashboard-card">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center justify-start bg-dashboard-accent1 text-white hover:bg-dashboard-accent1/80"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;