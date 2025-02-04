import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { useNavigate } from "react-router-dom"
import { Home, User } from "lucide-react"

export const Navigation = () => {
  const navigate = useNavigate()

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <NavigationMenu className="py-2">
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <NavigationMenuLink
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-black/40 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/20 data-[state=open]:bg-primary/20"
                onClick={() => navigate("/")}
              >
                <Home className="mr-2 h-4 w-4" /> Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-black/40 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/20 data-[state=open]:bg-primary/20"
                onClick={() => navigate("/profile")}
              >
                <User className="mr-2 h-4 w-4" /> Profile
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  )
}