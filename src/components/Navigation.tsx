
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { useNavigate, useLocation } from "react-router-dom"
import { User, Settings, Users, LogOut, Loader2, Sun, Moon, Wallet, Menu, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types/auth"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    }
  })

  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["userRoles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)

      return roles?.map(r => r.role as UserRole) || []
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

  const hasAccess = (requiredRole: UserRole) => {
    if (!userRoles) return false
    return userRoles.includes('admin' as UserRole) || userRoles.includes(requiredRole)
  }

  const menuItems = [
    { 
      path: "/profile", 
      icon: <User className="mr-2 h-4 w-4" />, 
      label: "Profile",
      show: true
    },
    { 
      path: "/members", 
      icon: <Users className="mr-2 h-4 w-4" />, 
      label: "Members",
      show: hasAccess('collector' as UserRole)
    },
    { 
      path: "/financials", 
      icon: <Wallet className="mr-2 h-4 w-4" />, 
      label: "Financials",
      show: hasAccess('admin' as UserRole)
    },
    { 
      path: "/admin", 
      icon: <Settings className="mr-2 h-4 w-4" />, 
      label: "Admin",
      show: hasAccess('admin' as UserRole)
    }
  ]

  const isLoading = sessionLoading || rolesLoading

  return (
    <div className="fixed top-0 left-0 right-0 z-50 nav-gradient">
      <div className="max-w-7xl mx-auto">
        <div className="py-2 border-b border-white/10">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-medium text-primary">PWA Burton</h3>
            <p className="text-lg font-arabic text-primary tracking-wider truncate max-w-[200px] md:max-w-none">
              بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <div className="w-[88px]" />
          </div>
        </div>

        {session && (
          <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-3 relative">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                {/* Mobile Menu Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>

                {/* Navigation Menu */}
                <NavigationMenu className={cn(
                  "fixed inset-x-0 top-[105px] bg-background/95 backdrop-blur-sm lg:relative lg:top-0 lg:bg-transparent lg:backdrop-blur-none transition-all duration-200 border-b border-white/10 lg:border-none",
                  isMenuOpen ? "block" : "hidden lg:block"
                )}>
                  <NavigationMenuList className="flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5 lg:gap-2 p-4 lg:p-0">
                    {menuItems.filter(item => item.show).map((item) => (
                      <NavigationMenuItem key={item.path} className="w-full lg:w-auto">
                        <NavigationMenuLink
                          className={cn(
                            "group inline-flex h-9 w-full items-center justify-start rounded-md px-3 lg:px-4 py-2 text-sm font-medium transition-all duration-200",
                            "hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                            isActive(item.path) ? 
                              "bg-primary/20 text-primary shadow-sm" : 
                              "bg-black/40 text-foreground"
                          )}
                          onClick={() => {
                            navigate(item.path)
                            setIsMenuOpen(false)
                          }}
                        >
                          {item.icon} <span className="ml-1.5">{item.label}</span>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ))}
                    <NavigationMenuItem className="w-full lg:w-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 bg-black/40 text-foreground hover:bg-primary/20 hover:text-primary"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        {theme === "dark" ? (
                          <Sun className="h-4 w-4" />
                        ) : (
                          <Moon className="h-4 w-4" />
                        )}
                        <span className="sr-only">Toggle theme</span>
                      </Button>
                    </NavigationMenuItem>
                    <NavigationMenuItem className="w-full lg:w-auto lg:ml-auto">
                      <NavigationMenuLink
                        className={cn(
                          "group inline-flex h-8 w-full items-center justify-start rounded-md px-2.5 lg:px-3 py-1 text-sm font-medium transition-all duration-200",
                          "hover:bg-red-500/20 hover:text-red-500 focus:bg-red-500/20 focus:text-red-500 focus:outline-none",
                          "bg-black/40 text-red-500"
                        )}
                        onClick={() => {
                          handleSignOut()
                          setIsMenuOpen(false)
                        }}
                      >
                        <LogOut className="h-4 w-4" /> <span className="ml-1.5">Sign Out</span>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
