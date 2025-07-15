import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';
import BackgroundCarousel from '@/components/BackgroundCarousel';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Rediriger les utilisateurs connectés vers leur dashboard seulement depuis la page d'accueil
    // ET seulement si on a les données utilisateur (pas juste la session auth)
    if (!loading && user && userData && location.pathname === '/') {
      console.log('Index: Utilisateur connecté avec données, redirection vers dashboard')
      navigate('/dashboard', { replace: true });
    }
  }, [user, userData, loading, navigate, location.pathname]);

  // Afficher un loader pendant le chargement de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lokaz-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundCarousel />
      <div className="relative z-10">
        <Navigation />
        <HeroSection />
        <CallToAction />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
