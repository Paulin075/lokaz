
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, Users, Car, Bed, Bath, Zap, Phone, MessageCircle, 
  Droplets, BoltIcon, X, Calendar, Clock, User, Mail
} from 'lucide-react'
import { Chambre, supabase, Utilisateur } from '@/lib/supabase'
import ImageCarousel from '@/components/ImageCarousel'

interface PropertyDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  chambre: Chambre | null
  onReserve?: () => void
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  isOpen,
  onClose,
  chambre,
  onReserve
}) => {
  const [proprietaire, setProprietaire] = useState<Utilisateur | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!chambre) return;

    // 1. Propriétaire via la jointure maison.utilisateurs
    if (chambre.maisons && chambre.maisons.utilisateurs) {
      setProprietaire(chambre.maisons.utilisateurs);
      return;
    }

    // 2. Propriétaire direct sur la chambre
    if (chambre.id_proprietaire) {
      supabase
        .from('utilisateurs')
        .select('id, nom, prenom, email, telephone, type_utilisateur, date_creation, verifie')
        .eq('id', chambre.id_proprietaire)
        .single()
        .then(({ data }) => {
          if (data) setProprietaire(data);
        });
      return;
    }

    // 3. Propriétaire via la maison (si id_proprietaire sur la maison)
    if (chambre.maisons && chambre.maisons.id_proprietaire) {
      supabase
        .from('utilisateurs')
        .select('id, nom, prenom, email, telephone, type_utilisateur, date_creation, verifie')
        .eq('id', chambre.maisons.id_proprietaire)
        .single()
        .then(({ data }) => {
          if (data) setProprietaire(data);
        });
      return;
    }

    // Sinon, pas d'info dispo
    setProprietaire(null);
  }, [chambre]);

  const fetchProprietaireInfo = async () => {
    if (!chambre?.maisons) return
    
    setLoading(true)
    try {
      console.log('Fetching proprietaire info for chambre:', chambre)
      console.log('Maisons data:', chambre.maisons)
      
      // Essayer d'abord avec l'UUID s'il existe
      if (chambre.maisons.id_proprietaire_uuid) {
        const { data, error } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('uuid', chambre.maisons.id_proprietaire_uuid)
          .single()

        if (error) {
          console.error('Erreur lors de la récupération du propriétaire par UUID:', error)
        } else {
          console.log('Proprietaire trouvé par UUID:', data)
          setProprietaire(data)
          return
        }
      }

      // Essayer avec l'ID classique
      if (chambre.maisons.id_proprietaire) {
        const { data, error } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('id', chambre.maisons.id_proprietaire)
          .single()

        if (error) {
          console.error('Erreur lors de la récupération du propriétaire par ID:', error)
        } else {
          console.log('Proprietaire trouvé par ID:', data)
          setProprietaire(data)
        }
      }

      // Si on a les données utilisateur directement dans la jointure
      if (chambre.maisons.utilisateurs) {
        console.log('Proprietaire depuis jointure:', chambre.maisons.utilisateurs)
        setProprietaire(chambre.maisons.utilisateurs)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!chambre) return null

  const getPhotos = () => {
    if (chambre.photos) {
      try {
        return JSON.parse(chambre.photos)
      } catch {
        return [chambre.photos]
      }
    }
    return ['/placeholder.svg']
  }

  const formatPrice = (price: number) => {
    return price?.toLocaleString() || '0'
  }

  const handleWhatsAppContact = () => {
    if (proprietaire?.telephone) {
      const message = `Bonjour, je suis intéressé(e) par votre logement "${chambre.numero_chambre}" à ${chambre.adresse} sur Lokaz.`
      const whatsappUrl = `https://wa.me/${proprietaire.telephone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
    }
  }

  const handleCall = () => {
    if (proprietaire?.telephone) {
      window.open(`tel:${proprietaire.telephone}`, '_self')
    }
  }

  const isDirectMapLink = chambre.adresse?.startsWith('http');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-2xl font-bold text-lokaz-black">
              Chambre {chambre.numero_chambre}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Carrousel d'images */}
          <div className="w-full h-64 md:h-80">
            <ImageCarousel images={getPhotos()} />
          </div>

          {/* Informations du propriétaire */}
          <div className="bg-lokaz-orange/5 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-lokaz-orange" />
              Informations du propriétaire
            </h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lokaz-orange mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement des informations...</p>
              </div>
            ) : proprietaire ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">{proprietaire.prenom} {proprietaire.nom}</span>
                    {proprietaire.verifie && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-green-600 text-white text-xs">Propriétaire vérifié</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span>{proprietaire.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span>{proprietaire.telephone}</span>
                  </div>
                  {/* Message d'avertissement si non vérifié */}
                  {proprietaire.verifie === false && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-2 rounded mt-2 text-xs">
                      <strong>Attention :</strong> Propriétaire non vérifié. Ne réalisez aucun paiement sans vérification. En cas d’arnaque, la plateforme ne pourra pas vous assister si le propriétaire n’est pas vérifié.
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {chambre.maisons?.titre && (
                    <div>
                      <span className="font-medium text-gray-700">Propriété: </span>
                      <span>{chambre.maisons.titre}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={handleCall}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      Appeler
                    </Button>
                    <Button
                      onClick={handleWhatsAppContact}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      <MessageCircle className="h-3 w-3" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Informations du propriétaire non disponibles</p>
              </div>
            )}
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne gauche */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Informations générales</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {/* Afficher la ville si disponible, sinon l'adresse */}
                    <span className="truncate font-semibold">{chambre.ville || chambre.maisons?.ville || chambre.adresse}</span>
                  </div>
                  {/* Lien maps séparé, sous le nom de la ville */}
                  {chambre.adresse && (
                    <div className="mt-1">
                      <a
                        href={isDirectMapLink
                          ? chambre.adresse
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chambre.adresse)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-lokaz-orange hover:underline"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Voir sur maps</span>
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{chambre.superficie_m2} m²</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Caractéristiques</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    <span>{chambre.nb_chambres} chambre(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4" />
                    <span>{chambre.nb_salons} salon(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{chambre.nb_cuisines} cuisine(s)</span>
                  </div>
                  {chambre.garage && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <span>Garage</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {chambre.chap_chap && (
                  <Badge className="bg-lokaz-orange text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    Chap-Chap
                  </Badge>
                )}
                {chambre.garage && (
                  <Badge variant="secondary">
                    <Car className="h-3 w-3 mr-1" />
                    Garage
                  </Badge>
                )}
              </div>
            </div>

            {/* Colonne droite */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Prix</h3>
                <div className="space-y-2">
                  {(chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') && chambre.prix_vente > 0 && (
                    <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Prix de vente
                      </span>
                      <span className="font-bold text-red-600 text-lg">
                        {formatPrice(chambre.prix_vente)} FCFA
                      </span>
                    </div>
                  )}
                  {(chambre.type_propriete === 'location' || chambre.type_propriete === 'les_deux') && chambre.prix > 0 && (
                    <div className="flex justify-between items-center p-3 bg-lokaz-orange/10 rounded-lg">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Par mois
                      </span>
                      <span className="font-bold text-lokaz-orange text-lg">
                        {formatPrice(chambre.prix)} FCFA
                      </span>
                    </div>
                  )}
                  {chambre.prix_jour > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Par jour
                      </span>
                      <span className="font-bold text-gray-700">
                        {formatPrice(chambre.prix_jour)} FCFA
                      </span>
                    </div>
                  )}
                  {chambre.prix_heure > 0 && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Par heure
                      </span>
                      <span className="font-bold text-gray-700">
                        {formatPrice(chambre.prix_heure)} FCFA
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Coûts additionnels */}
              {(chambre.maisons?.prix_eau > 0 || chambre.maisons?.prix_electricite > 0) && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Coûts additionnels</h3>
                  <div className="space-y-2">
                    {chambre.maisons?.prix_eau > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          Eau (par m³)
                        </span>
                        <span>{formatPrice(chambre.maisons.prix_eau)} FCFA</span>
                      </div>
                    )}
                    {chambre.maisons?.prix_electricite > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <BoltIcon className="h-4 w-4 text-yellow-500" />
                          Électricité (par kWh)
                        </span>
                        <span>{formatPrice(chambre.maisons.prix_electricite)} FCFA</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {chambre.description && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{chambre.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {proprietaire && (
              <Button
                onClick={handleWhatsAppContact}
                variant="outline"
                className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contacter via WhatsApp
              </Button>
            )}
            <Button
              onClick={onReserve}
              className="flex-1 bg-lokaz-orange hover:bg-lokaz-orange-light text-white"
            >
              Réserver maintenant
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PropertyDetailsModal
