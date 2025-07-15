import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import React, { useEffect, useState } from "react";

const queryClient = new QueryClient();

// Composant pour logger la route active
const RouteLogger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('=== Route changed to:', location.pathname, '===');
  }, [location]);

  return null;
};

function App() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Gestionnaire d'erreurs global pour capturer les erreurs non gérées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Empêcher la déconnexion automatique causée par les erreurs
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      // Empêcher la propagation des erreurs qui pourraient causer des déconnexions
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    console.log('App component mounted - routes should be available');

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
      // Masquer le bouton après 5 secondes
      setTimeout(() => setShowInstallButton(false), 5000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowInstallButton(false);
      });
    }
  };

  console.log('App component rendering...');

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteLogger />
            <Routes>
              <Route path="/" element={<Index />} />
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
              <Route path="/politique-confidentialite" element={<Privacy />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          {showInstallButton && (
            <button onClick={handleInstallClick} style={{position:'fixed',bottom:24,right:24,zIndex:1000}} className="bg-lokaz-orange text-white px-4 py-2 rounded shadow-lg animate-fade-in">
              Installer l’application Lokaz
            </button>
          )}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
