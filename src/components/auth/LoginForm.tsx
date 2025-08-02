import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import UserTypeToggle from '@/components/UserTypeToggle'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface LoginFormProps {
  onSuccess: () => void
  defaultUserType?: 'proprietaire' | 'locataire'
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, defaultUserType }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Initialiser le type d'utilisateur à partir de l'URL, de la prop, ou par défaut
  const initialType = (searchParams.get('type') as 'proprietaire' | 'locataire') || defaultUserType || 'proprietaire'
  const [userType, setUserType] = useState<'proprietaire' | 'locataire'>(initialType)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // S'assurer que le type d'utilisateur n'est initialisé qu'une seule fois
  useEffect(() => {
    setUserType(initialType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Vérifier d'abord le type d'utilisateur dans la base de données
      const { data: userData, error: userError } = await supabase
        .from('utilisateurs')
        .select('type_utilisateur')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        setError('Utilisateur non trouvé')
        setLoading(false)
        return
      }

      // Vérifier que le type d'utilisateur correspond à la sélection
      if (userData.type_utilisateur !== userType) {
        setError(`Vous n'êtes pas autorisé à vous connecter en tant que ${userType}. Votre compte est de type ${userData.type_utilisateur}.`)
        setLoading(false)
        return
      }

      // Si la vérification passe, procéder à la connexion
      await signIn(email, password)
      onSuccess()
    } catch (err: any) {
      console.error('Erreur de connexion:', err)
      
      // Gérer les erreurs spécifiques
      if (err.message) {
        if (err.message.includes('Email not confirmed')) {
          setError('Votre email n\'est pas encore confirmé. Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.')
        } else if (err.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect')
        } else if (err.message.includes('Too many requests')) {
          setError('Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Une erreur est survenue lors de la connexion')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl font-baloo text-lokaz-black">
          <LogIn className="h-6 w-6 text-lokaz-orange" />
          Connexion
        </CardTitle>
        <CardDescription>
          Connectez-vous à votre compte NBBC Immo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Type de connexion</Label>
            <UserTypeToggle
              selectedType={userType}
              onTypeChange={setUserType}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-lokaz-orange hover:bg-lokaz-orange-light text-white font-medium"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-lokaz-orange hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default LoginForm
