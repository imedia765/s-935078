import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { NavigationMenu } from "./NavigationMenu";
import { ProfileCompletionGuard } from "./auth/ProfileCompletionGuard";

export const AdminLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <NavigationMenu />
      <main className="flex-1 container mx-auto px-4 py-8">
        <ProfileCompletionGuard>
          <Outlet />
        </ProfileCompletionGuard>
      </main>
      <Footer />
    </div>
  );
};