import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { useNavigate, useLocation } from "react-router-dom"
import { Home, User, Settings } from "lucide-react"

export const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="fixed top-0 left-0 right-0 z-50 nav-gradient">
      <div className="max-w-7xl mx-auto">
        {/* Bismillah Section */}
        <div className="text-center py-2 border-b border-white/10">
          <p className="text-lg font-arabic text-primary">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
        </div>

        {/* Navigation Menu */}
        <div className="flex items-center justify-between p-4">
          <NavigationMenu>
            <NavigationMenuList className="space-x-2">
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                    isActive("/") ? "bg-primary/20 text-primary" : "bg-black/40"
                  }`}
                  onClick={() => navigate("/")}
                >
                  <Home className="mr-2 h-4 w-4" /> Home
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                    isActive("/profile") ? "bg-primary/20 text-primary" : "bg-black/40"
                  }`}
                  onClick={() => navigate("/profile")}
                >
                  <User className="mr-2 h-4 w-4" /> Profile
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                    isActive("/admin") ? "bg-primary/20 text-primary" : "bg-black/40"
                  }`}
                  onClick={() => navigate("/admin")}
                >
                  <Settings className="mr-2 h-4 w-4" /> Admin
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </div>
  )
}