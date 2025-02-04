import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { useNavigate, useLocation } from "react-router-dom"
import { Home, User, Settings, Users, LogOut } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    }
  })

  const { data: userRoles } = useQuery({
    queryKey: ["userRoles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)

      return roles?.map(r => r.role) || []
    },
    enabled: !!session // Only fetch roles if there's a session
  })

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      navigate("/")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message
      })
    }
  }

  const isActive = (path: string) => location.pathname === path
  const isAdmin = userRoles?.includes("admin")
  const isCollector = userRoles?.includes("collector")

  // All users (members) can see Home and Profile
  const menuItems = [
    { path: "/", icon: <Home className="mr-2 h-4 w-4" />, label: "Home" },
    { path: "/profile", icon: <User className="mr-2 h-4 w-4" />, label: "Profile" },
  ]

  // Collectors and Admins can see Members
  if (isCollector || isAdmin) {
    menuItems.push({
      path: "/members",
      icon: <Users className="mr-2 h-4 w-4" />,
      label: "Members"
    })
  }

  // Only Admins can see Admin page
  if (isAdmin) {
    menuItems.push({
      path: "/admin",
      icon: <Settings className="mr-2 h-4 w-4" />,
      label: "Admin"
    })
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 nav-gradient">
      <div className="max-w-7xl mx-auto">
        {/* Bismillah Section */}
        <div className="text-center py-2 border-b border-white/10">
          <p className="text-lg font-arabic text-primary">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
        </div>

        {/* Navigation Menu - Only show if logged in */}
        {session && (
          <div className="flex items-center justify-between p-4">
            <NavigationMenu>
              <NavigationMenuList className="space-x-2">
                {menuItems.map((item) => (
                  <NavigationMenuItem key={item.path}>
                    <NavigationMenuLink
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                        isActive(item.path) ? "bg-primary/20 text-primary" : "bg-black/40"
                      }`}
                      onClick={() => navigate(item.path)}
                    >
                      {item.icon} {item.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 bg-black/40"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        )}
      </div>
    </div>
  )
}