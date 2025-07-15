import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar as CalendarIcon, Users, Upload, X, Clock, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedReservationModalProps {
  isOpen: boolean
  onClose: () => void
  property: any
}

const EnhancedReservationModal: React.FC<EnhancedReservationModalProps> = ({
  isOpen,
  onClose,
  property
}) => {
  const { user, userData } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [dateDebut, setDateDebut] = useState<Date>()
  const [dateFin, setDateFin] = useState<Date>()
  const [modeLocation, setModeLocation] = useState<'heure' | 'jour' | 'mois'>('mois')
  const [nombreOccupants, setNombreOccupants] = useState(1)
  const [carteIdentite, setCarteIdentite] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [totalAPayer, setTotalAPayer] = useState(0)

  // Ajout du type de propriété, prix_vente et vendue dans le state du formulaire
  const [formData, setFormData] = useState({
    id_maison: '',
    numero_chambre: '',
    nb_chambres: 1,
    nb_salons: 1,
    nb_cuisines: 1,
    garage: false,
    chap_chap: false,
    description: '',
    prix: '',
    prix_heure: '',
    prix_jour: '',
    photos: [],
    superficie_m2: '',
    adresse: '',
    ville: '',
    prix_eau: '',
    prix_electricite: '',
    type_propriete: 'location', // location, vente, les_deux
    prix_vente: '',
    vendue: false,
    type_bien: 'maison' // Ajout du type de bien
  })
  const [photos, setPhotos] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [maisons, setMaisons] = useState<any[]>([])

  // Fonction pour convertir une chaîne en nombre en gérant les virgules et les cas vides
  const parseNumberInput = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const cleanedValue = value.replace(',', '.');
    const parsed = parseFloat(cleanedValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Fonction pour valider les nombres avant envoi
  const validateNumber = (value: number, max: number = 999999.99): number => {
    if (isNaN(value) || value < 0) return 0;
    return Math.min(value, max);
  };

  React.useEffect(() => {
    if (userData?.id) {
      supabase
        .from('maisons')
        .select('id, titre')
        .eq('id_proprietaire', userData.id)
        .then(({ data }) => setMaisons(data || []))
    }
  }, [userData])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    if (files.length < 2 || files.length > 5) {
      toast({ title: 'Erreur', description: 'Sélectionnez entre 2 et 5 photos', variant: 'destructive' })
      return
    }
    setPhotoFiles(files)
  }

  const handleMaisonChange = async (maisonId: string) => {
    setFormData(f => ({ ...f, id_maison: maisonId }))
    if (maisonId && maisonId !== "aucune") {
      const { data, error } = await supabase
        .from('maisons')
        .select('adresse, ville, prix_eau, prix_electricite')
        .eq('id', maisonId)
        .single()
      if (data) {
        setFormData(f => ({
          ...f,
          adresse: data.adresse || '',
          ville: data.ville || '',
          prix_eau: data.prix_eau ? data.prix_eau.toString() : '',
          prix_electricite: data.prix_electricite ? data.prix_electricite.toString() : ''
        }))
      }
    } else {
      setFormData(f => ({
        ...f,
        id_maison: 'aucune',
        // On conserve les valeurs existantes si elles existent
        adresse: f.adresse || '',
        ville: f.ville || '',
        prix_eau: f.prix_eau || '',
        prix_electricite: f.prix_electricite || ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Conversion stricte des champs numériques
      const toNumber = (val: string | number) => Number(String(val).replace(',', '.')) || 0;

      // 1. Upload des fichiers photos si présents
      let photoUrls: string[] = [...photos];
      if (photoFiles.length > 0) {
        for (const file of photoFiles) {
          const cleanName = sanitizeFileName(file.name);
          const fileName = `chambre-${Date.now()}-${cleanName}`;
          const { data, error } = await supabase.storage.from('proprietes-images').upload(fileName, file);
          if (error) throw error;
          const { data: urlData } = supabase.storage.from('proprietes-images').getPublicUrl(data.path);
          photoUrls.push(urlData.publicUrl);
        }
        // Limite à 5 photos max
        photoUrls = photoUrls.slice(0, 5);
      }

      const chambreData = {
        id_maison: !formData.id_maison || formData.id_maison === 'aucune' ? null : Number(formData.id_maison),
        id_proprietaire: (!formData.id_maison || formData.id_maison === 'aucune') ? userData.id : null,
        numero_chambre: formData.numero_chambre,
        superficie_m2: toNumber(formData.superficie_m2),
        description: formData.description,
        prix: toNumber(formData.prix),
        disponible: true,
        nb_chambres: Number(formData.nb_chambres) || 1,
        nb_salons: Number(formData.nb_salons) || 0,
        nb_cuisines: Number(formData.nb_cuisines) || 0,
        garage: !!formData.garage,
        chap_chap: !!formData.chap_chap,
        photos: JSON.stringify(photoUrls),
        adresse: formData.adresse,
        ville: formData.ville,
        prix_heure: toNumber(formData.prix_heure),
        prix_jour: toNumber(formData.prix_jour),
        prix_eau: toNumber(formData.prix_eau),
        prix_electricite: toNumber(formData.prix_electricite),
        type_propriete: formData.type_propriete,
        prix_vente: toNumber(formData.prix_vente),
        vendue: !!formData.vendue,
        type_bien: formData.type_bien,
      };
      console.log('chambreData envoyé à Supabase:', chambreData)

      // Vérification des bornes
      for (const key of ['prix', 'prix_heure', 'prix_jour', 'prix_eau', 'prix_electricite', 'superficie_m2']) {
        if (chambreData[key] > 999999.99) {
          toast({
            title: 'Erreur',
            description: `Le champ ${key} dépasse la valeur maximale autorisée.`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      let error = null;
      if (property && property.id) {
        // Mise à jour
        ({ error } = await supabase
          .from('chambres')
          .update(chambreData)
          .eq('id', property.id));
        if (error) {
          console.error('Erreur détaillée:', error);
          toast({
            title: 'Erreur',
            description: error.message + (error.details ? ` (${error.details})` : ''),
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        toast({
          title: 'Chambre modifiée',
          description: 'La location a été modifiée avec succès.',
        });
      } else {
        // Création
        ({ error } = await supabase
          .from('chambres')
          .insert([chambreData]));
        if (error) {
          console.error('Erreur détaillée:', error);
          toast({
            title: 'Erreur',
            description: error.message + (error.details ? ` (${error.details})` : ''),
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        toast({
          title: 'Chambre ajoutée',
          description: 'La location a été ajoutée avec succès.',
        });
      }
      onClose();
    } catch (err) {
      console.error('Erreur inattendue:', err);
      toast({
        title: 'Erreur inattendue',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (property) {
      setFormData({
        id_maison: property.id_maison ? String(property.id_maison) : 'aucune',
        numero_chambre: property.numero_chambre || '',
        nb_chambres: property.nb_chambres || 1,
        nb_salons: property.nb_salons || 1,
        nb_cuisines: property.nb_cuisines || 1,
        garage: property.garage || false,
        chap_chap: property.chap_chap || false,
        description: property.description || '',
        prix: property.prix ? property.prix.toString() : '',
        photos: property.photos ? JSON.parse(property.photos) : [],
        superficie_m2: property.superficie_m2 ? property.superficie_m2.toString() : '',
        prix_heure: property.chap_chap ? property.prix_heure ? property.prix_heure.toString() : '' : '',
        prix_jour: property.chap_chap ? property.prix_jour ? property.prix_jour.toString() : '' : '',
        adresse: property.adresse || '',
        ville: property.ville || '',
        prix_eau: property.prix_eau ? property.prix_eau.toString() : '',
        prix_electricite: property.prix_electricite ? property.prix_electricite.toString() : '',
        type_propriete: property.type_propriete || 'location',
        prix_vente: property.prix_vente ? property.prix_vente.toString() : '',
        vendue: !!property.vendue,
        type_bien: property.type_bien || 'maison',
      })
      setPhotos(property.photos ? JSON.parse(property.photos) : [])
      setPhotoFiles([])
    } else {
      setFormData({
        id_maison: 'aucune',
        numero_chambre: '',
        nb_chambres: 1,
        nb_salons: 1,
        nb_cuisines: 1,
        garage: false,
        chap_chap: false,
        description: '',
        prix: '',
        prix_heure: '',
        prix_jour: '',
        photos: [],
        superficie_m2: '',
        adresse: '',
        ville: '',
        prix_eau: '',
        prix_electricite: '',
        type_propriete: 'location',
        prix_vente: '',
        vendue: false,
        type_bien: 'maison'
      })
      setPhotos([])
      setPhotoFiles([])
    }
  }, [property, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-baloo text-xl text-lokaz-black">
            {property && property.id ? 'Modifier la location' : 'Ajouter une location'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Propriété associée */}
          <div className="space-y-2">
            <Label>Propriété associée</Label>
            <Select value={formData.id_maison} onValueChange={handleMaisonChange} required>
              <SelectTrigger className="border-lokaz-orange focus:ring-lokaz-orange">
                <SelectValue placeholder="Sélectionnez une propriété" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aucune">Aucune</SelectItem>
                {maisons
                  .filter(m => m && m.id && m.titre)
                  .map(m => (
                    <SelectItem key={String(m.id)} value={String(m.id)}>{String(m.titre)}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {/* Place le champ Type de propriété juste après le select Propriété associée */}
          <div className="space-y-2">
            <Label>Type de propriété</Label>
            <Select value={formData.type_propriete} onValueChange={val => setFormData(f => ({ ...f, type_propriete: val }))} required>
              <SelectTrigger className="border-lokaz-orange focus:ring-lokaz-orange">
                <SelectValue placeholder="Sélectionnez le type de propriété" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="vente">Vente</SelectItem>
                <SelectItem value="les_deux">Les deux</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Champ Type de bien : toujours visible */}
          <div className="space-y-2">
            <Label>Type de bien</Label>
            <Select value={formData.type_bien || ''} onValueChange={val => setFormData(f => ({ ...f, type_bien: val }))} required>
              <SelectTrigger className="border-lokaz-orange focus:ring-lokaz-orange">
                <SelectValue placeholder="Sélectionnez le type de bien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chambre">Chambre</SelectItem>
                <SelectItem value="maison">Maison</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="immeuble">Immeuble</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Champs hérités de la maison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Adresse complète</Label>
              <Input
                value={formData.adresse || ''}
                onChange={e => setFormData(f => ({ ...f, adresse: e.target.value }))}
                readOnly={formData.id_maison !== "aucune"}
                required
                placeholder="Collez ici le lien Google Maps de l'adresse pour un accès facile"
              />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={formData.ville || ''}
                onChange={e => setFormData(f => ({ ...f, ville: e.target.value }))}
                readOnly={formData.id_maison !== "aucune"}
                required
              />
            </div>
            {/* Corrige l'affichage des champs prix_eau et prix_electricite pour qu'ils soient bien visibles si une propriété est sélectionnée */}
            {!!formData.id_maison && formData.id_maison !== "aucune" && (
              <div className="space-y-2">
                <Label>Prix de l'eau (FCFA/m³)</Label>
                <Input value={formData.prix_eau || ''} readOnly />
              </div>
            )}
            {!!formData.id_maison && formData.id_maison !== "aucune" && (
              <div className="space-y-2">
                <Label>Prix de l'électricité (FCFA/kWh)</Label>
                <Input value={formData.prix_electricite || ''} readOnly />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nombre de chambres</Label>
              <Input 
                type="number" 
                min="1" 
                value={formData.nb_chambres || ''} 
                onChange={e => setFormData(f => ({ ...f, nb_chambres: parseInt(e.target.value) || 1 }))} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre de salons</Label>
              <Input 
                type="number" 
                min="0" 
                value={formData.nb_salons || ''} 
                onChange={e => setFormData(f => ({ ...f, nb_salons: parseInt(e.target.value) || 0 }))} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre de cuisines</Label>
              <Input 
                type="number" 
                min="0" 
                value={formData.nb_cuisines || ''} 
                onChange={e => setFormData(f => ({ ...f, nb_cuisines: parseInt(e.target.value) || 0 }))} 
                required 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="garage" 
                checked={formData.garage} 
                onChange={e => setFormData(f => ({ ...f, garage: e.target.checked }))} 
              />
              <Label htmlFor="garage">Garage</Label>
            </div>
            <div className="flex items-center space-x-2 bg-blue-50 rounded p-2">
              <input 
                type="checkbox" 
                id="chap_chap" 
                checked={formData.chap_chap} 
                onChange={e => setFormData(f => ({ ...f, chap_chap: e.target.checked }))} 
              />
              <Label htmlFor="chap_chap" className="text-blue-700">Disponible Chap-Chap</Label>
            </div>
          </div>

          {formData.chap_chap && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix par heure (Chap-Chap)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="999999.99"
                  step="0.01"
                  value={formData.prix_heure || ''} 
                  onChange={e => {
                    const value = parseNumberInput(e.target.value);
                    if (!isNaN(value) && value <= 999999.99) {
                      setFormData(f => ({ ...f, prix_heure: e.target.value }))
                    }
                  }} 
                  required={formData.chap_chap} 
                />
              </div>
              <div className="space-y-2">
                <Label>Prix par jour (Chap-Chap)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="999999.99"
                  step="0.01"
                  value={formData.prix_jour || ''} 
                  onChange={e => {
                    const value = parseNumberInput(e.target.value);
                    if (!isNaN(value) && value <= 999999.99) {
                      setFormData(f => ({ ...f, prix_jour: e.target.value }))
                    }
                  }} 
                  required={formData.chap_chap} 
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} 
              rows={2} 
            />
          </div>

          {/* Affichage des anciennes photos */}
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {photos.map((url, idx) => (
                <img key={idx} src={url} alt={`Photo ${idx + 1}`} className="w-20 h-20 object-cover rounded border" />
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label>Photos (2 à 5)</Label>
            <Input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={e => {
                if (!e.target.files) return
                const files = Array.from(e.target.files)
                if (files.length + photos.length > 5) {
                  toast({ title: 'Erreur', description: 'Maximum 5 photos au total', variant: 'destructive' })
                  return
                }
                setPhotoFiles(files)
              }} 
            />
          </div>

          {/* Affiche les champs de location si le type est 'location' ou 'les_deux' */}
          {(formData.type_propriete === 'location' || formData.type_propriete === 'les_deux') && (
            <>
              <div className="space-y-2">
                <Label>Numéro de chambre</Label>
                <Input
                  value={formData.numero_chambre || ''}
                  onChange={e => setFormData(f => ({ ...f, numero_chambre: e.target.value }))}
                  required={formData.type_propriete === 'location' || formData.type_propriete === 'les_deux'}
                />
              </div>
              <div className="space-y-2">
                <Label>Prix mensuel</Label>
                <Input
                  type="number"
                  min="0"
                  max="999999.99"
                  step="0.01"
                  value={formData.prix || ''}
                  onChange={e => {
                    const value = parseNumberInput(e.target.value);
                    if (!isNaN(value) && value <= 999999.99) {
                      setFormData(f => ({ ...f, prix: e.target.value }))
                    }
                  }}
                  required={formData.type_propriete === 'location' || formData.type_propriete === 'les_deux'}
                />
              </div>
              {formData.chap_chap && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prix par heure (Chap-Chap)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="999999.99"
                      step="0.01"
                      value={formData.prix_heure || ''}
                      onChange={e => {
                        const value = parseNumberInput(e.target.value);
                        if (!isNaN(value) && value <= 999999.99) {
                          setFormData(f => ({ ...f, prix_heure: e.target.value }))
                        }
                      }}
                      required={formData.chap_chap && (formData.type_propriete === 'location' || formData.type_propriete === 'les_deux')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prix par jour (Chap-Chap)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="999999.99"
                      step="0.01"
                      value={formData.prix_jour || ''}
                      onChange={e => {
                        const value = parseNumberInput(e.target.value);
                        if (!isNaN(value) && value <= 999999.99) {
                          setFormData(f => ({ ...f, prix_jour: e.target.value }))
                        }
                      }}
                      required={formData.chap_chap && (formData.type_propriete === 'location' || formData.type_propriete === 'les_deux')}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {(formData.type_propriete === 'vente' || formData.type_propriete === 'les_deux') && (
            <div className="space-y-2">
              <Label>Prix de vente</Label>
              <Input
                type="number"
                min="0"
                max="999999999"
                step="0.01"
                value={formData.prix_vente || ''}
                onChange={e => setFormData(f => ({ ...f, prix_vente: e.target.value }))}
                required={formData.type_propriete === 'vente' || formData.type_propriete === 'les_deux'}
              />
              {/* Switch pour marquer comme vendue (en édition uniquement) */}
              {property && property.id && (
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="vendue"
                    checked={formData.vendue}
                    onChange={e => setFormData(f => ({ ...f, vendue: e.target.checked }))}
                  />
                  <Label htmlFor="vendue">Marquer comme vendue</Label>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Superficie (m²)</Label>
            <Input
              type="number"
              min="0"
              max="999999.99"
              step="0.01"
              value={formData.superficie_m2 || ''}
              onChange={e => setFormData(f => ({ ...f, superficie_m2: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-lokaz-orange hover:bg-lokaz-orange-light text-white" 
              disabled={loading}
            >
              {loading ? (property && property.id ? 'Enregistrement...' : 'Ajout...') : (property && property.id ? 'Enregistrer les modifications' : 'Ajouter')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Fonction pour nettoyer le nom du fichier
function sanitizeFileName(name: string) {
  return name
    .normalize('NFD').replace(/[ -\u036f]/g, '') // enlève accents
    .replace(/[^a-zA-Z0-9.-]/g, '-') // remplace tout sauf lettres, chiffres, . et - par -
    .replace(/-+/g, '-') // remplace plusieurs - par un seul
}

export default EnhancedReservationModal