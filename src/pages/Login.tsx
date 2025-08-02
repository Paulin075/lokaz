import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LoginForm from '@/components/auth/LoginForm'
import Logo from '@/components/Logo'
import { useAuth } from '@/hooks/useAuth'

const Login = () => {
  const navigate = useNavigate()
  const { user, userData, loading } = useAuth()

  React.useEffect(() => {
    // Attendre que l'authentification soit chargée avant de rediriger
    // ET seulement si on a les données utilisateur (pas juste la session auth)
    if (!loading && user && userData) {
      console.log('Login: Utilisateur connecté avec données, redirection vers dashboard')
      navigate('/dashboard', { replace: true })
    }
  }, [user, userData, loading, navigate])

  const handleLoginSuccess = () => {
    // La redirection sera gérée par le useEffect ci-dessus
    console.log('Connexion réussie, redirection en cours...')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-lokaz-orange/5 to-lokaz-orange-light/10 flex flex-col items-center justify-center p-4">
      {/* Bouton retour */}
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-lokaz-orange"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Button>
      </div>

      <div className="mb-8">
        <Logo className="h-16 w-auto" />
      </div>
      <LoginForm onSuccess={handleLoginSuccess} />
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Pas encore de compte ?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-lokaz-orange hover:underline font-medium"
          >
            Inscrivez-vous sur NBBC Immo
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
