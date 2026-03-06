import * as React from "react";
import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth, UserRole } from "@/hooks/use-auth";
import Index from "./pages/Index";
import ProtocolOverview from "./pages/ProtocolOverview";
import Employer from "./pages/Employer";
import EmployeePortal from "./pages/EmployeePortal";
import Deploy from "./pages/Deploy";
import Compliance from "./pages/Compliance";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";

import { WagmiProvider } from "wagmi";
import { config as wagmiConfig } from "./lib/wagmi";

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: UserRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (role && user.role !== role && user.role !== "admin") {
    // Redirect to their own dashboard if they don't have access
    const redirectPath = user.role === "employer" ? "/employer" : user.role === "employee" ? "/employee" : "/";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/" element={<Index />} />
                <Route
                  path="/protocol"
                  element={
                    <ProtectedRoute role="admin">
                      <ProtocolOverview />
                    </ProtectedRoute>
                  }
                />
                <Route path="/employer" element={
                  <ProtectedRoute role="employer">
                    <Employer />
                  </ProtectedRoute>
                } />
                <Route path="/deploy" element={
                  <ProtectedRoute role="employer">
                    <Deploy />
                  </ProtectedRoute>
                } />
                <Route path="/employee" element={
                  <ProtectedRoute role="employee">
                    <EmployeePortal />
                  </ProtectedRoute>
                } />
                <Route path="/compliance" element={
                  <ProtectedRoute role="admin">
                    <Compliance />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  // Use a global variable to persist the root between hot reloads
  const global = window as any;
  if (!global._root) {
    global._root = createRoot(rootElement);
  }
  global._root.render(<App />);
}
