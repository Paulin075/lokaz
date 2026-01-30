import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface LoginFormProps {
  onSuccess: () => void
  defaultUserType?: 'proprietaire' | 'locataire'
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      onSuccess()
    } catch (err: unknown) {
      console.error('Erreur de connexion:', err)

      // Gérer les erreurs spécifiques
      const errorMessage = (err as any).message || 'Une erreur est survenue lors de la connexion';

      if (errorMessage.includes('Email not confirmed')) {
        setError('Votre email n\'est pas encore confirmé. Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.')
      } else if (errorMessage.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect')
      } else if (errorMessage.includes('Too many requests')) {
        setError('Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto dark:bg-card dark:border-border">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl font-baloo text-lokaz-black dark:text-lokaz-orange">
          <LogIn className="h-6 w-6 text-lokaz-orange" />
          Connexion
        </CardTitle>
        <CardDescription className="dark:text-muted-foreground">
          Connectez-vous à votre compte Lokaz
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
            <Label htmlFor="email" className="flex items-center gap-2 dark:text-foreground">
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
              className="dark:bg-secondary dark:text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 dark:text-foreground">
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
                className="dark:bg-secondary dark:text-foreground"
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

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
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
