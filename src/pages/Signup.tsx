
import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SignupForm from '@/components/auth/SignupForm'
import Logo from '@/components/Logo'
import { useAuth } from '@/hooks/useAuth'

const Signup = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, userData, loading } = useAuth()

  React.useEffect(() => {
    // Rediriger seulement si l'utilisateur est connecté ET a des données
    if (!loading && user && userData) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, userData, loading, navigate])

  const handleSignupSuccess = () => {
    navigate('/login')
  }

  // Afficher un loader pendant le chargement de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lokaz-orange/5 to-lokaz-orange-light/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lokaz-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si l'utilisateur est déjà connecté avec données, afficher un loader de redirection
  if (user && userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lokaz-orange/5 to-lokaz-orange-light/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lokaz-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Redirection vers votre dashboard...</p>
        </div>
      </div>
    )
  }

  // Récupérer le type d'utilisateur depuis les paramètres URL
  const userType = searchParams.get('type') as 'proprietaire' | 'locataire' | null

  return (
    <div className="min-h-screen bg-gradient-to-br from-lokaz-orange/5 to-lokaz-orange-light/10 dark:from-background dark:to-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 dark:text-white hover:text-lokaz-orange transition-colors font-medium bg-white/80 dark:bg-black/50 p-2 rounded-lg shadow-sm backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Retour à l'accueil
        </button>
      </div>
      <div className="mb-8">
        <Logo className="h-60 md:h-72 w-auto drop-shadow-lg transition-transform hover:scale-105 duration-300" />
      </div>
      <SignupForm onSuccess={handleSignupSuccess} defaultUserType={userType} />
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-white font-bold">
          Déjà un compte ?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-lokaz-orange hover:underline font-bold"
          >
            Connectez-vous à Lokaz
          </button>
        </p>
      </div>
    </div>
  )
}

export default Signup
