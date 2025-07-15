
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Upload, User, Phone, CreditCard, Calendar } from 'lucide-react'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileUpdate?: () => void
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { userData, user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    date_naissance: '',
    tmoney_number: '',
    flooz_number: '',
    carte_identite: '',
    nombre_occupants: 1
  })

  useEffect(() => {
    if (userData) {
      setFormData({
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        telephone: userData.telephone || '',
        date_naissance: userData.date_naissance || '',
        tmoney_number: userData.tmoney_number || '',
        flooz_number: userData.flooz_number || '',
        carte_identite: userData.carte_identite || '',
        nombre_occupants: userData.nombre_occupants || 1
      })
    }
  }, [userData])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)

    try {
      const fileName = `identity-${user.id}-${Date.now()}.pdf`
      
      const { data, error } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, file)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('identity-documents')
        .getPublicUrl(data.path)

      setFormData(prev => ({ ...prev, carte_identite: urlData.publicUrl }))
      
      toast({
        title: "Document uploadé",
        description: "Votre carte d'identité a été uploadée avec succès"
      })
    } catch (error) {
      console.error('Erreur upload:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload du document",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from('utilisateurs')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          date_naissance: formData.date_naissance || null,
          tmoney_number: formData.tmoney_number,
          flooz_number: formData.flooz_number,
          carte_identite: formData.carte_identite,
          nombre_occupants: formData.nombre_occupants
        })
        .eq('id', userData.id)

      if (error) throw error

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès"
      })

      onClose()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-lokaz-orange" />
            Mon Profil
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Prénom *
              </Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom *
              </Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Téléphone
            </Label>
            <Input
              id="telephone"
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
              placeholder="+228 XX XX XX XX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_naissance" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date de naissance
            </Label>
            <Input
              id="date_naissance"
              type="date"
              value={formData.date_naissance}
              onChange={(e) => setFormData(prev => ({ ...prev, date_naissance: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tmoney_number" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Numéro TMoney
              </Label>
              <Input
                id="tmoney_number"
                value={formData.tmoney_number}
                onChange={(e) => setFormData(prev => ({ ...prev, tmoney_number: e.target.value }))}
                placeholder="+228 XX XX XX XX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flooz_number" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Numéro Flooz
              </Label>
              <Input
                id="flooz_number"
                value={formData.flooz_number}
                onChange={(e) => setFormData(prev => ({ ...prev, flooz_number: e.target.value }))}
                placeholder="+228 XX XX XX XX"
              />
            </div>
          </div>

          {userData?.type_utilisateur === 'locataire' && (
            <div className="space-y-2">
              <Label htmlFor="nombre_occupants">Nombre d'occupants potentiels</Label>
              <Input
                id="nombre_occupants"
                type="number"
                min="1"
                max="10"
                value={formData.nombre_occupants}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_occupants: parseInt(e.target.value) || 1 }))}
              />
            </div>
          )}

          <div className="space-y-4">
            <Label>Carte d'identité</Label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="identity-upload"
                disabled={!!formData.carte_identite}
              />
              <label htmlFor="identity-upload">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="cursor-pointer" 
                  disabled={uploading || !!formData.carte_identite}
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Upload...' : 'Télécharger la pièce d\'identité (PDF uniquement)'}
                  </span>
                </Button>
              </label>
            </div>

            {formData.carte_identite && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Votre identité est en cours de vérification
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-lokaz-orange hover:bg-lokaz-orange-light"
            >
              {loading ? 'Enregistrement...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ProfileModal
