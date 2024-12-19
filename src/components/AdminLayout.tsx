import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ProfileCompletionGuard } from "./auth/ProfileCompletionGuard";

export const AdminLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <ProfileCompletionGuard>
          <Outlet />
        </ProfileCompletionGuard>
      </main>
      <Footer />
    </div>
  );
};