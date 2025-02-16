
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
          <a href="/" className="text-blue-500 hover:text-blue-700 underline">
            Return to Home
          </a>
        </div>
      </div>
      <footer className="text-center py-6 sm:py-8 space-y-2 border-t border-border">
        <p className="text-subtle text-xs sm:text-sm">
          © {currentYear} SmartFIX Tech, Burton Upon Trent. All rights reserved.
        </p>
        <p className="text-subtle text-xs sm:text-sm">
          Website created and coded by <span className="text-primary">Zaheer Asghar</span>
        </p>
      </footer>
    </div>
  );
};

export default NotFound;
