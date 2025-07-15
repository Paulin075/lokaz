import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireUserData?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireUserData = true 
}) => {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

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

  // Si pas d'utilisateur connecté, rediriger vers la page d'accueil
  if (!user) {
    console.log('ProtectedRoute: Pas d\'utilisateur, redirection vers /')
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Si on exige des données utilisateur mais qu'elles ne sont pas disponibles
  if (requireUserData && !userData) {
    console.log('ProtectedRoute: Pas de données utilisateur, redirection vers /')
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Si tout est OK, afficher le contenu
  return <>{children}</>;
};

export default ProtectedRoute; 