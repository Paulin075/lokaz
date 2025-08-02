
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Upload, X } from 'lucide-react'

interface PropertyModalProps {
  isOpen: boolean
  onClose: () => void
  property?: any
  onSuccess: () => void
  onDelete?: (id: number) => void
}

const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  property,
  onSuccess,
  onDelete
}) => {
  const { userData } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    adresse: '',
    ville: '',
    quartier: '',
    prix_eau: '',
    prix_electricite: ''
  })

  useEffect(() => {
    if (property) {
      setFormData({
        titre: property.titre || '',
        description: property.description || '',
        adresse: property.adresse || '',
        ville: property.ville || '',
        quartier: property.quartier || '',
        prix_eau: property.prix_eau ? property.prix_eau.toString() : '',
        prix_electricite: property.prix_electricite ? property.prix_electricite.toString() : ''
      })
      if (property.photos) {
        try {
          setPhotos(JSON.parse(property.photos))
        } catch {
          setPhotos([])
        }
      }
    } else {
      setFormData({
        titre: '',
        description: '',
        adresse: '',
        ville: '',
        quartier: '',
        prix_eau: '',
        prix_electricite: ''
      })
      setPhotos([])
    }
  }, [property, isOpen])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setLoading(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}-${file.name}`
        const { data, error } = await supabase.storage
          .from('property-photos')
          .upload(fileName, file)

        if (error) throw error

        const { data: urlData } = supabase.storage
          .from('property-photos')
          .getPublicUrl(data.path)

        uploadedUrls.push(urlData.publicUrl)
      }

      setPhotos(prev => [...prev, ...uploadedUrls])
      toast({
        title: "Photos ajoutées",
        description: "Les photos ont été uploadées avec succès"
      })
    } catch (error) {
      console.error('Erreur upload:', error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload des photos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    if (files.length < 2 || files.length > 5) {
      toast({ title: 'Erreur', description: 'Sélectionnez entre 2 et 5 photos', variant: 'destructive' })
      return
    }
    setPhotoFiles(files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return

    setLoading(true)

    try {
      let photoUrls: string[] = [...photos]
      if (photoFiles.length > 0) {
        for (const file of photoFiles) {
          const fileName = `propriete-${Date.now()}-${file.name}`
          const { data, error } = await supabase.storage.from('proprietes-images').upload(fileName, file)
          if (error) throw error
          const { data: urlData } = supabase.storage.from('proprietes-images').getPublicUrl(data.path)
          photoUrls.push(urlData.publicUrl)
        }
        // Limite à 5 photos max
        photoUrls = photoUrls.slice(0, 5)
      }
      let maisonId = property?.id

      if (!maisonId) {
        // Création (insert)
        const { data: maisonData, error: maisonError } = await supabase
          .from('maisons')
          .insert([{
            id_proprietaire: userData.id,
            titre: formData.titre,
            description: formData.description,
            adresse: formData.adresse,
            ville: formData.ville,
            quartier: formData.quartier,
            prix_eau: parseFloat(formData.prix_eau) || 0,
            prix_electricite: parseFloat(formData.prix_electricite) || 0,
            photos: JSON.stringify(photoUrls)
          }])
          .select()
          .single()
        if (maisonError) throw maisonError
        maisonId = maisonData.id
      } else {
        // Mise à jour (update)
        const { error: maisonError } = await supabase
          .from('maisons')
          .update({
            titre: formData.titre,
            description: formData.description,
            adresse: formData.adresse,
            ville: formData.ville,
            quartier: formData.quartier,
            prix_eau: parseFloat(formData.prix_eau) || 0,
            prix_electricite: parseFloat(formData.prix_electricite) || 0,
            photos: JSON.stringify(photoUrls)
          })
          .eq('id', maisonId)
        if (maisonError) throw maisonError
      }

      toast({
        title: property ? "Propriété mise à jour" : "Propriété créée avec succès",
        description: property ? "Les informations de la propriété ont été mises à jour." : "Votre propriété a été ajoutée.",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Erreur détaillée:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la propriété.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {property ? 'Modifier la propriété' : 'Ajouter une nouvelle propriété'}
          </DialogTitle>
          <DialogDescription>
            Formulaire d'ajout ou de modification de propriété
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre de la propriété *</Label>
              <Input
                id="titre"
                value={formData.titre}
                onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ville">Ville *</Label>
              <Input
                id="ville"
                value={formData.ville}
                onChange={(e) => setFormData(prev => ({ ...prev, ville: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quartier">Quartier *</Label>
            <Input
              id="quartier"
              value={formData.quartier}
              onChange={(e) => setFormData(prev => ({ ...prev, quartier: e.target.value }))}
              placeholder="Ex: Tokoin, Bé, Agoè, etc."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse complète *</Label>
            <Input
              id="adresse"
              value={formData.adresse}
              onChange={(e) => setFormData(prev => ({ ...prev, adresse: e.target.value }))}
              required
              placeholder="Collez ici le lien Google Maps de l'adresse pour un accès facile"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix de l'eau (FCFA/m³) *</Label>
              <Input type="number" min="0" value={formData.prix_eau || ''} onChange={e => setFormData(f => ({ ...f, prix_eau: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Prix de l'électricité (FCFA/kWh) *</Label>
              <Input type="number" min="0" value={formData.prix_electricite || ''} onChange={e => setFormData(f => ({ ...f, prix_electricite: e.target.value }))} required />
            </div>
          </div>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {photos.map((url, idx) => (
                <img key={idx} src={url} alt={`Photo ${idx + 1}`} className="w-20 h-20 object-cover rounded border" />
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label>Photos (2 à 5)</Label>
            <Input type="file" accept="image/*" multiple onChange={e => {
              if (!e.target.files) return
              const files = Array.from(e.target.files)
              if (files.length + photos.length > 5) {
                toast({ title: 'Erreur', description: 'Maximum 5 photos au total', variant: 'destructive' })
                return
              }
              setPhotoFiles(files)
            }} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="bg-lokaz-orange hover:bg-lokaz-orange-light text-white" disabled={loading}>{loading ? 'Enregistrement...' : property ? 'Mettre à jour' : 'Créer la propriété'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PropertyModal
