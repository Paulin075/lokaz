import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Search, MessageCircle, User, LogOut, LayoutDashboard, Home, Info, Zap } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import Logo from './Logo';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, userData, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleDashboardClick = () => {
    // Vérifier que l'utilisateur a des données avant de rediriger
    if (!userData) {
      console.log('Navigation: Pas de données utilisateur, redirection vers /')
      navigate('/')
      return
    }
    
    // Tous les types d'utilisateurs vont au dashboard
    navigate('/dashboard')
  };

  // Afficher un loader pendant le chargement de l'authentification
  if (loading) {
    return (
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 font-baloo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo className="h-10 w-auto" />
            </div>
            <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 font-baloo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <Logo className="h-10 w-auto" />
            </Link>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`font-medium flex items-center gap-2 px-3 py-1 rounded transition-colors duration-200 ${currentPath === '/' ? 'bg-lokaz-orange text-white shadow' : 'text-gray-700 hover:text-lokaz-orange'}`}>
              <Home className="h-4 w-4" />
              Accueil
            </Link>
            <Link to="/search" className={`font-medium flex items-center gap-2 px-3 py-1 rounded transition-colors duration-200 ${currentPath === '/search' ? 'bg-lokaz-orange text-white shadow' : 'text-gray-700 hover:text-lokaz-orange'}`}>
              <Search className="h-4 w-4" />
              Rechercher
            </Link>
            <Link to="/chap-chap" className={`font-medium flex items-center gap-2 px-3 py-1 rounded transition-colors duration-200 ${currentPath === '/chap-chap' ? 'bg-lokaz-orange text-white shadow' : 'text-gray-700 hover:text-lokaz-orange'}`}>
              <Zap className="h-4 w-4" />
              Chap-Chap
            </Link>
            <Link to="/about" className={`font-medium flex items-center gap-2 px-3 py-1 rounded transition-colors duration-200 ${currentPath === '/about' ? 'bg-lokaz-orange text-white shadow' : 'text-gray-700 hover:text-lokaz-orange'}`}>
              <Info className="h-4 w-4" />
              À propos
            </Link>
          </div>

          {/* Actions Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/messages">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-lokaz-orange flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Messages
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-700 hover:text-lokaz-orange">
                      <User className="h-4 w-4 mr-2" />
                      {userData?.prenom || 'Mon compte'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleDashboardClick}>
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/messages')}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Messages
                    </DropdownMenuItem>
                    {userData?.type_utilisateur === 'proprietaire' && (
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        Mes propriétés
                      </DropdownMenuItem>
                    )}
                    {userData?.type_utilisateur === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        Administration
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-lokaz-orange text-lokaz-orange hover:bg-lokaz-orange hover:text-white transition-all duration-200"
                  >
                    Connexion
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button 
                    className="bg-lokaz-orange hover:bg-lokaz-orange-light text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Inscription Propriétaire
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Menu Mobile Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <Link to="/" className={`font-medium flex items-center gap-2 px-3 py-1 rounded transition-colors ${currentPath === '/' ? 'bg-lokaz-orange text-white shadow' : 'text-gray-700 hover:text-lokaz-orange'}`}>
                <Home className="h-4 w-4" />
                Accueil
              </Link>
              <Link to="/search" className={`font-medium flex items-center gap-2 px-3 py-1 rounded transition-colors ${currentPath === '/search' ? 'bg-lokaz-orange text-white shadow' : 'text-gray-700 hover:text-lokaz-orange'}`}>
                <Search className="h-4 w-4" />
                Rechercher
              </Link>
              <Link to="/chap-chap" className={`font-medium flex items-center gap-2 px-3 py-1 rounded transition-colors ${currentPath === '/chap-chap' ? 'bg-lokaz-orange text-white shadow' : 'text-gray-700 hover:text-lokaz-orange'}`}>
                <Zap className="h-4 w-4" />
                Chap-Chap
              </Link>
              <Link to="/about" className={`font-medium flex items-center gap-2 px-3 py-1 rounded transition-colors ${currentPath === '/about' ? 'bg-lokaz-orange text-white shadow' : 'text-gray-700 hover:text-lokaz-orange'}`}>
                <Info className="h-4 w-4" />
                À propos
              </Link>
              <div className="pt-4 border-t border-gray-100 flex flex-col space-y-2">
                {user ? (
                  <>
                    <span className="text-lokaz-orange font-medium">
                      Bonjour {userData?.prenom}
                    </span>
                    <Button onClick={handleDashboardClick} variant="outline" className="w-full justify-start">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    <Link to="/messages">
                      <Button variant="outline" className="w-full justify-start">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Messages
                      </Button>
                    </Link>
                    <Button onClick={handleLogout} variant="outline" className="justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button 
                        variant="outline" 
                        className="w-full border-lokaz-orange text-lokaz-orange hover:bg-lokaz-orange hover:text-white"
                      >
                        Connexion
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button className="w-full bg-lokaz-orange hover:bg-lokaz-orange-light text-white">
                        Inscription Propriétaire
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
