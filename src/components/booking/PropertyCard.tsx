
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users, Car, Bed, Bath, Zap, Eye, Ruler, Sofa } from 'lucide-react'
import PropertyDetailsModal from '@/components/PropertyDetailsModal'
import { Chambre } from '@/lib/supabase'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PropertyCardProps {
  chambre: Chambre
  onReserve: (chambreId: number) => void
}

const PropertyCard: React.FC<PropertyCardProps> = ({ chambre, onReserve }) => {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  const getMainImage = () => {
    if (chambre.photos) {
      try {
        const photos = JSON.parse(chambre.photos)
        return photos[0] || '/placeholder.svg'
      } catch {
        return '/placeholder.svg'
      }
    }
    return '/placeholder.svg'
  }

  const formatPrice = (price: number) => {
    return price?.toLocaleString() || '0'
  }

  const handleReserve = () => {
    setDetailsModalOpen(false)
    onReserve(chambre.id)
  }

  const isDirectMapLink = chambre.adresse?.startsWith('http');

  return (
    <>
      <Card className="hover:shadow-xl transition-all duration-300 group overflow-hidden">
        <CardContent className="p-0">
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={getMainImage()}
              alt={`Chambre ${chambre.numero_chambre}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            {/* Badges sur l'image */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {chambre.chap_chap && (
                <Badge className="bg-lokaz-orange text-white flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Chap-Chap
                </Badge>
              )}
              {chambre.garage && (
                <Badge variant="secondary" className="bg-white/90 text-gray-800 flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  Garage
                </Badge>
              )}
              {/* Badge À vendre */}
              {(chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') && (
                <Badge className="bg-red-600 text-white flex items-center gap-1">
                  À vendre
                </Badge>
              )}
            </div>

            {/* Prix en overlay */}
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg p-2">
              <div className="text-right">
                <div className="font-bold text-lg text-lokaz-orange">
                  {(chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') && chambre.prix_vente > 0
                    ? `${formatPrice(chambre.prix_vente)} FCFA`
                    : `${formatPrice(chambre.prix)} FCFA`}
                </div>
                <div className="text-xs text-gray-600">
                  {(chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') && chambre.prix_vente > 0 ? 'Prix de vente' : '/mois'}
                </div>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-4 space-y-3">
            {/* Titre et adresse */}
            <div>
              <h3 className="font-bold text-lg text-lokaz-black flex items-center gap-2">
                {/* Titre avec numéro de chambre */}
                {(() => {
                  let titre = '';
                  if (chambre.type_bien) {
                    titre = chambre.type_bien.charAt(0).toUpperCase() + chambre.type_bien.slice(1);
                  } else if (chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') {
                    titre = 'Bien à vendre';
                  } else {
                    titre = 'Chambre';
                  }
                  // Ajoute le numéro de chambre si présent
                  if (chambre.numero_chambre) {
                    titre += ` ${chambre.numero_chambre}`;
                  }
                  // Vente
                  if ((chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux')) {
                    titre += ' à vendre';
                  }
                  return titre;
                })()}
                {(chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') && <Badge className="bg-red-600 text-white">À vendre</Badge>}
                {/* Badge propriétaire vérifié */}
                {chambre.proprietaire && chambre.proprietaire.verifie && (
                  <Badge className="bg-green-600 text-white ml-2">Propriétaire vérifié</Badge>
                )}
              </h3>
              {/* Date de publication toujours affichée sous le titre */}
              {chambre.date_publication && (
                <div className="text-xs text-gray-500 mb-1">
                  Publié le {(() => {
                    const datePub = new Date(chambre.date_publication)
                    const now = new Date()
                    const diffYears = (now.getTime() - datePub.getTime()) / (1000 * 60 * 60 * 24 * 365)
                    if (diffYears >= 1) {
                      return `${Math.floor(diffYears)} an${Math.floor(diffYears) > 1 ? 's' : ''}`
                    } else {
                      return format(datePub, 'dd/MM/yyyy', { locale: fr })
                    }
                  })()}
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                {/* Afficher la ville si disponible */}
                {chambre.ville ? (
                  <span className="truncate font-semibold">{chambre.ville}</span>
                ) : chambre.maisons?.ville ? (
                  <span className="truncate font-semibold">{chambre.maisons.ville}</span>
                ) : null}
              </div>
              {/* Message d'avertissement si propriétaire non vérifié */}
              {chambre.proprietaire && chambre.proprietaire.verifie === false && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-2 rounded mt-2 text-xs">
                  <strong>Attention :</strong> Propriétaire non vérifié. Ne réalisez aucun paiement sans vérification.
                </div>
              )}
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
            </div>

            {/* Caractéristiques */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Ruler className="h-4 w-4" />
                <span>{chambre.superficie_m2} m²</span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{chambre.nb_chambres} ch.</span>
              </div>
              <div className="flex items-center gap-1">
                <Sofa className="h-4 w-4" />
                <span>{chambre.nb_salons} salon</span>
              </div>
            </div>

            {/* Description */}
            {chambre.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {chambre.description}
              </p>
            )}

            {/* Prix multiples */}
            <div className="space-y-1">
              {chambre.prix_jour > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-lokaz-orange">{formatPrice(chambre.prix_jour)} FCFA</span> /jour
                </div>
              )}
              {chambre.prix_heure > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-lokaz-orange">{formatPrice(chambre.prix_heure)} FCFA</span> /heure
                </div>
              )}
            </div>

            {/* Coûts additionnels */}
            {(chambre.maisons?.prix_eau > 0 || chambre.maisons?.prix_electricite > 0) && (
              <div className="text-xs text-gray-500 space-y-1">
                {chambre.maisons?.prix_eau > 0 && (
                  <div>Eau: {formatPrice(chambre.maisons.prix_eau)} FCFA/m³</div>
                )}
                {chambre.maisons?.prix_electricite > 0 && (
                  <div>Électricité: {formatPrice(chambre.maisons.prix_electricite)} FCFA/kWh</div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setDetailsModalOpen(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Détails
              </Button>
              <Button 
                onClick={() => onReserve(chambre.id)}
                className="flex-1 bg-lokaz-orange hover:bg-lokaz-orange-light text-white"
                size="sm"
              >
                Réserver
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PropertyDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        chambre={chambre}
        onReserve={handleReserve}
      />
    </>
  )
}

export default PropertyCard
