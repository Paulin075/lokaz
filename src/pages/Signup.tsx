
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
      console.log('Signup: Utilisateur connecté avec données, redirection vers dashboard')
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
    <div className="min-h-screen bg-gradient-to-br from-lokaz-orange/5 to-lokaz-orange-light/10 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo className="h-16 w-auto" />
      </div>
      <SignupForm onSuccess={handleSignupSuccess} defaultUserType={userType} />
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Déjà un compte ?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-lokaz-orange hover:underline font-medium"
          >
            Connectez-vous à NBBC Immo
          </button>
        </p>
      </div>
    </div>
  )
}

export default Signup
