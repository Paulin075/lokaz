import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, User, Mail, Phone, Calendar, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import UserTypeToggle from '@/components/UserTypeToggle'

interface SignupFormProps {
  onSuccess: () => void
  defaultUserType?: 'proprietaire' | 'locataire' | null
}

const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, defaultUserType }) => {
  // Initialiser le type d'utilisateur une seule fois (fonction dans useState)
  const [formData, setFormData] = useState(() => ({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    date_naissance: '',
    type_utilisateur: (defaultUserType || 'locataire') as 'proprietaire' | 'locataire',
    nombre_occupants: '',
    tmoney_number: '',
    flooz_number: '',
    mot_de_passe: '',
    confirmer_mot_de_passe: ''
  }))
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUserTypeChange = (type: 'proprietaire' | 'locataire') => {
    setFormData(prev => ({
      ...prev,
      type_utilisateur: type
    }))
  }

  const validateForm = () => {
    if (!formData.nom || !formData.prenom || !formData.email || !formData.telephone) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return false
    }

    if (!formData.mot_de_passe || formData.mot_de_passe.length < 6) {
      toast({
        title: "Erreur de validation",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      })
      return false
    }

    if (formData.mot_de_passe !== formData.confirmer_mot_de_passe) {
      toast({
        title: "Erreur de validation",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      })
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    console.log('Tentative d\'inscription avec:', formData)

    try {
      // Créer le compte Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.mot_de_passe,
        options: {
          data: {
            nom: formData.nom,
            prenom: formData.prenom,
            telephone: formData.telephone,
            type_utilisateur: formData.type_utilisateur
          }
        }
      })

      console.log('Réponse Auth:', { authData, authError })

      if (authError) {
        console.error('Erreur Auth:', authError)
        
        let errorMessage = "Une erreur est survenue lors de l'inscription"
        if (authError.message.includes('User already registered')) {
          errorMessage = "Cette adresse email est déjà utilisée"
        } else if (authError.message.includes('Invalid email')) {
          errorMessage = "Adresse email invalide"
        } else if (authError.message.includes('Password')) {
          errorMessage = "Le mot de passe ne respecte pas les critères requis"
        } else if (authError.message.includes('Database error')) {
          errorMessage = "Erreur de base de données. Veuillez réessayer plus tard."
        }
        
        toast({
          title: "Erreur d'inscription",
          description: errorMessage,
          variant: "destructive"
        })
        return
      }

      // Si l'inscription Auth a réussi, essayer d'insérer dans la table utilisateurs
      if (authData.user) {
        // Préparer les données utilisateur
        const userData = {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone,
          date_naissance: formData.date_naissance || null,
          type_utilisateur: formData.type_utilisateur,
          tmoney_number: formData.tmoney_number || null,
          flooz_number: formData.flooz_number || null,
          uuid: authData.user.id,
          ...(formData.type_utilisateur === 'locataire' && formData.nombre_occupants ? {
            nombre_occupants: parseInt(formData.nombre_occupants)
          } : {})
        }

        console.log('Données utilisateur à insérer:', userData)

        // Insérer dans la table utilisateurs
        const { data: userInsertData, error: userError } = await supabase
          .from('utilisateurs')
          .insert([userData])
          .select()
          .single()

        console.log('Réponse insertion utilisateur:', { userInsertData, userError })

        if (userError) {
          console.error('Erreur insertion utilisateur:', userError)
          
          // Si c'est une erreur de doublon (email déjà existant), c'est OK
          if (userError.code === '23505' || userError.message.includes('duplicate key')) {
            toast({
              title: "Inscription réussie !",
              description: "Votre compte a été créé avec succès. Vérifiez votre boîte mail pour confirmer votre compte.",
            })
            onSuccess()
            return
          }
          
          // Pour les autres erreurs, afficher un message d'erreur mais ne pas bloquer
          toast({
            title: "Inscription partiellement réussie",
            description: "Votre compte a été créé mais il y a eu un problème avec votre profil. Vous pourrez le compléter plus tard.",
            variant: "default"
          })
          onSuccess()
          return
        }

        toast({
          title: "Inscription réussie !",
          description: "Votre compte a été créé avec succès. Vérifiez votre boîte mail pour confirmer votre compte.",
        })

        onSuccess()
      }
    } catch (error) {
      console.error('Erreur générale:', error)
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader className="text-center">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-lokaz-orange"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>
        <CardTitle className="text-2xl font-bold text-lokaz-black">
          Créer un compte
        </CardTitle>
        <CardDescription>
          Rejoignez NBBC Immo dès aujourd'hui
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type d'utilisateur */}
          <div className="space-y-2">
            <Label>Type de compte</Label>
            <UserTypeToggle
              selectedType={formData.type_utilisateur}
              onTypeChange={handleUserTypeChange}
            />
          </div>

          {/* Informations personnelles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="prenom"
                  name="prenom"
                  type="text"
                  placeholder="Votre prénom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="nom"
                  name="nom"
                  type="text"
                  placeholder="Votre nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                placeholder="+228 XX XX XX XX"
                value={formData.telephone}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_naissance">Date de naissance</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="date_naissance"
                name="date_naissance"
                type="date"
                value={formData.date_naissance}
                onChange={handleChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Moyens de paiement */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tmoney_number">T-Money</Label>
              <Input
                id="tmoney_number"
                name="tmoney_number"
                type="text"
                placeholder="Numéro T-Money"
                value={formData.tmoney_number}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flooz_number">Flooz</Label>
              <Input
                id="flooz_number"
                name="flooz_number"
                type="text"
                placeholder="Numéro Flooz"
                value={formData.flooz_number}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="mot_de_passe">Mot de passe *</Label>
            <Input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              placeholder="Choisissez un mot de passe"
              value={formData.mot_de_passe}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmer_mot_de_passe">Confirmer le mot de passe *</Label>
            <Input
              id="confirmer_mot_de_passe"
              name="confirmer_mot_de_passe"
              type="password"
              placeholder="Confirmez votre mot de passe"
              value={formData.confirmer_mot_de_passe}
              onChange={handleChange}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-lokaz-orange hover:bg-lokaz-orange-light"
            disabled={loading}
          >
            {loading
              ? "Création en cours..."
              : `Créer mon compte ${formData.type_utilisateur === 'proprietaire' ? 'propriétaire' : 'locataire'}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default SignupForm
