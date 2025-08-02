import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
import LocalSEO from "@/components/LocalSEO";

import HttpsAlert from "@/components/HttpsAlert";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Search from "./pages/Search";
import ChapChap from "./pages/ChapChap";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import React, { useEffect } from "react";

const queryClient = new QueryClient();

// Composant pour logger la route active
const RouteLogger = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("=== Route changed to:", location.pathname, "===");
  }, [location]);

  return null;
};

function App() {
  useEffect(() => {
    // Gestionnaire d'erreurs global pour capturer les erreurs non gérées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      // Empêcher la déconnexion automatique causée par les erreurs
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);
      // Empêcher la propagation des erreurs qui pourraient causer des déconnexions
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    console.log("App component mounted - routes should be available");

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleError);
    };
  }, []);

  const handlePWAInstall = () => {
    console.log("PWA installée avec succès");
  };

  const handlePWAClose = () => {
    console.log("Prompt PWA fermé");
  };

  console.log("App component rendering...");

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PerformanceOptimizer />
            <LocalSEO />
            <HttpsAlert />
            <BrowserRouter>
              <RouteLogger />
              <Routes>
                <Route path="/" element={<Search />} />
                <Route path="/home" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/search" element={<Search />} />
                <Route path="/chap-chap" element={<ChapChap />} />
                <Route path="/about" element={<About />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/conditions-utilisation" element={<Terms />} />
                <Route
                  path="/politique-confidentialite"
                  element={<Privacy />}
                />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <PWAInstallPrompt
              onInstall={handlePWAInstall}
              onClose={handlePWAClose}
            />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
