
import React, { useState, useRef, useEffect } from "react"
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

export const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [announcements, setAnnouncements] = useState<string>("")

  // Screen reader announcements
  const announce = (message: string) => {
    setAnnouncements(message)
  }

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

  // Enhanced focus trap and keyboard navigation
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        menuButtonRef.current?.focus()
        announce("Menu closed")
      }

      if (e.key === 'Tab' && menuRef.current) {
        const focusableElements = menuRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Focus management when menu opens/closes
  useEffect(() => {
    if (isMenuOpen) {
      const firstFocusableElement = menuRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusableElement?.focus();
      announce("Menu opened")
    }
  }, [isMenuOpen]);

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
      icon: <User className="mr-2 h-4 w-4" aria-hidden="true" />, 
      label: "Profile",
      show: true
    },
    { 
      path: "/members", 
      icon: <Users className="mr-2 h-4 w-4" aria-hidden="true" />, 
      label: "Members",
      show: hasAccess('collector' as UserRole)
    },
    { 
      path: "/financials", 
      icon: <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />, 
      label: "Financials",
      show: hasAccess('admin' as UserRole)
    },
    { 
      path: "/admin", 
      icon: <Settings className="mr-2 h-4 w-4" aria-hidden="true" />, 
      label: "Admin",
      show: hasAccess('admin' as UserRole)
    }
  ]

  const isLoading = sessionLoading || rolesLoading

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 nav-gradient" aria-label="Main Navigation">
      {/* Live region for announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcements}
      </div>

      {/* Skip link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto">
        <div className="py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-medium text-primary">PWA Burton</h3>
            <p className="text-lg font-arabic text-primary tracking-wider truncate max-w-[200px] md:max-w-none" lang="ar">
              بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <span className="w-[88px] invisible" aria-hidden="true" />
          </div>
        </div>

        {session && (
          <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-3 relative">
            {isLoading ? (
              <div className="flex items-center space-x-2" role="status">
                <span className="sr-only">Loading navigation...</span>
                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <Button
                  ref={menuButtonRef}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden min-h-[44px] min-w-[44px]"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-expanded={isMenuOpen}
                  aria-controls="navigation-menu"
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                >
                  {isMenuOpen ? (
                    <X className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  )}
                </Button>

                <NavigationMenu 
                  ref={menuRef}
                  id="navigation-menu"
                  className={cn(
                    "fixed inset-x-0 top-[105px] bg-gray-900 dark:bg-gray-800 lg:relative lg:top-0 lg:bg-transparent lg:backdrop-blur-none transition-all duration-200 border-b border-gray-200 dark:border-gray-700 lg:border-none z-30",
                    isMenuOpen ? "block" : "hidden lg:block"
                  )}
                >
                  <NavigationMenuList 
                    className="flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5 lg:gap-2 p-4 lg:p-0"
                    role="menubar"
                  >
                    {menuItems.filter(item => item.show).map((item) => (
                      <NavigationMenuItem key={item.path} role="none">
                        <NavigationMenuLink
                          className={cn(
                            "group inline-flex h-11 w-full items-center justify-start rounded-md px-4 py-2 text-sm font-medium transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            "hover:bg-primary-600 hover:text-white disabled:pointer-events-none disabled:opacity-50",
                            isActive(item.path) ? 
                              "bg-primary-600 text-white shadow-sm" : 
                              "bg-gray-800 text-white dark:bg-gray-700"
                          )}
                          onClick={() => {
                            navigate(item.path);
                            setIsMenuOpen(false);
                            announce(`Navigating to ${item.label}`);
                          }}
                          role="menuitem"
                          aria-current={isActive(item.path) ? 'page' : undefined}
                        >
                          <span className="flex items-center">
                            {item.icon}
                            <span>{item.label}</span>
                          </span>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ))}
                    <NavigationMenuItem role="none">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 bg-gray-800 dark:bg-gray-700 text-white hover:bg-primary-600 hover:text-white focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={() => {
                          setTheme(theme === "dark" ? "light" : "dark");
                          announce(`Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`);
                        }}
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                      >
                        {theme === "dark" ? (
                          <Sun className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Moon className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </NavigationMenuItem>
                    <NavigationMenuItem role="none" className="lg:ml-auto">
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start px-4 h-11 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500"
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                          announce("Signing out");
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                        <span>Sign Out</span>
                      </Button>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
