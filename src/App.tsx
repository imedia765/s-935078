
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import { Navigation } from "@/components/Navigation"
import Index from "./pages/Index"
import Profile from "./pages/Profile"
import Admin from "./pages/Admin"
import Members from "./pages/Members"
import Financials from "./pages/Financials"
import Documentation from "./pages/Documentation"
import ResetPassword from "./pages/ResetPassword"
import VerifyEmail from "./pages/VerifyEmail"
import NotFound from "./pages/NotFound"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"
import { UserRole } from "./types/auth"
import { useEffect } from "react"

const queryClient = new QueryClient()

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Layout component for consistent page structure
const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary">
        Skip to main content
      </a>
      <main id="main-content" role="main" aria-label="Main content" className="pt-24">
        {children}
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: UserRole }) => {
  const { data: userRoles, isLoading } = useQuery({
    queryKey: ["userRoles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)

      return roles?.map(r => r.role as UserRole) || []
    }
  })

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (requiredRole && !userRoles?.includes('admin') && !userRoles?.includes(requiredRole)) {
    return <Navigate to="/" replace />
  }

  return <PageLayout>{children}</PageLayout>
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<PageLayout><Index /></PageLayout>} />
            <Route path="/profile" element={<PageLayout><Profile /></PageLayout>} />
            <Route path="/documentation" element={<PageLayout><Documentation /></PageLayout>} />
            <Route path="/verify-email" element={<PageLayout><VerifyEmail /></PageLayout>} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/members" 
              element={
                <ProtectedRoute requiredRole="collector">
                  <Members />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/financials" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Financials />
                </ProtectedRoute>
              } 
            />
            <Route path="/reset-password" element={<PageLayout><ResetPassword /></PageLayout>} />
            <Route path="*" element={<PageLayout><NotFound /></PageLayout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
)

export default App
