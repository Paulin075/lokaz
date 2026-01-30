
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Logo from '@/components/Logo'
import { supabase } from '@/lib/supabase'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [lastRequestTime, setLastRequestTime] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Protection contre les clics multiples rapides
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < 5000) { // 5 secondes minimum entre les demandes
      setError('Veuillez attendre au moins 5 secondes entre chaque demande de réinitialisation.')
      return
    }

    setLoading(true)
    setError('')
    setLastRequestTime(now)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        // Gestion spécifique de l'erreur 429 (Too Many Requests)
        if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          setError('Trop de demandes de réinitialisation. Veuillez attendre quelques minutes avant de réessayer. Cette limitation protège contre le spam.')
        } else {
          setError('Erreur lors de l\'envoi de l\'email de réinitialisation: ' + error.message)
        }
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      // Gestion des erreurs réseau ou autres
      if (err?.message?.includes('429') || err?.status === 429) {
        setError('Trop de demandes de réinitialisation. Veuillez attendre quelques minutes avant de réessayer.')
      } else {
        setError('Une erreur est survenue lors de l\'envoi de l\'email')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lokaz-orange/5 to-lokaz-orange-light/10 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-gray-600 hover:text-lokaz-orange"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Button>
        </div>

        <div className="mb-8">
          <Logo className="h-20 md:h-24 w-auto drop-shadow-lg" />
        </div>

        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-lokaz-black mb-2">Email envoyé !</h2>
              <p className="text-gray-600 mb-4">
                Nous avons envoyé un lien de réinitialisation à :
              </p>
              <p className="font-medium text-lokaz-orange mb-6">{email}</p>
              <p className="text-sm text-gray-500 mb-6">
                Vérifiez votre boîte email et cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-lokaz-orange hover:bg-lokaz-orange-light text-white"
              >
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lokaz-orange/5 to-lokaz-orange-light/10 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-600 hover:text-lokaz-orange"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Button>
      </div>

      <div className="mb-8">
        <Logo className="h-20 md:h-24 w-auto drop-shadow-lg" />
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-baloo text-lokaz-black">
            <Mail className="h-6 w-6 text-lokaz-orange" />
            Mot de passe oublié
          </CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un lien de réinitialisation
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
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Adresse email
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

            <Button
              type="submit"
              className="w-full bg-lokaz-orange hover:bg-lokaz-orange-light text-white font-medium"
              disabled={loading}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </Button>

            <div className="text-center text-xs text-gray-500 mt-4">
              <p>💡 <strong>Conseils :</strong></p>
              <p>• Vérifiez votre dossier spam si vous ne recevez pas l'email</p>
              <p>• Attendez quelques minutes entre chaque demande</p>
              <p>• Le lien expire après 1 heure</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ForgotPassword
