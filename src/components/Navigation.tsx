import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { useNavigate, useLocation } from "react-router-dom"
import { User, Settings, Users, LogOut } from "lucide-react"
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
    enabled: !!session
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

  const menuItems = [
    { path: "/profile", icon: <User className="mr-2 h-4 w-4" />, label: "Profile" },
  ]

  if (isCollector || isAdmin) {
    menuItems.push({
      path: "/members",
      icon: <Users className="mr-2 h-4 w-4" />,
      label: "Members"
    })
  }

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
        <div className="text-center py-2 border-b border-white/10">
          <p className="text-lg font-arabic text-primary">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
        </div>

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
                <NavigationMenuItem className="ml-auto">
                  <NavigationMenuLink
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-red-500/20 hover:text-red-500 focus:bg-red-500/20 focus:text-red-500 focus:outline-none disabled:pointer-events-none disabled:opacity-50 bg-black/40 text-red-500"
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