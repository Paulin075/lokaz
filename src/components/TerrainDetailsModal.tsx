import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, X, MessageCircle, Phone, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import ImageCarousel from "@/components/ImageCarousel";

interface TerrainDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  terrain: {
    id: number;
    titre: string;
    description: string;
    prix: number;
    superficie_m2: number;
    ville: string;
    quartier?: string;
    statut_vente: string;
    adresse?: string;
    photos?: string;
    type_terrain?: string;
    id_proprietaire?: number;
  } | null;
  onBuy?: () => void;
}

const TerrainDetailsModal: React.FC<TerrainDetailsModalProps> = ({
  isOpen,
  onClose,
  terrain,
}) => {
  const [proprietaireInfo, setProprietaireInfo] = useState<{
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
  } | null>(null);

  const fetchProprietaireInfo = useCallback(async () => {
    if (!terrain?.id_proprietaire) return;

    try {
      const { data, error } = await supabase
        .from("utilisateurs")
        .select("*")
        .eq("id", terrain.id_proprietaire)
        .single();

      if (error) {
        console.error("Erreur récupération propriétaire:", error);
        return;
      }

      setProprietaireInfo(data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  }, [terrain?.id_proprietaire]);

  useEffect(() => {
    if (terrain && terrain.id_proprietaire) {
      fetchProprietaireInfo();
    }
  }, [terrain, fetchProprietaireInfo]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("fr-FR");
  };

  const getPhotos = () => {
    if (!terrain?.photos) return [];
    try {
      return JSON.parse(terrain.photos);
    } catch {
      return [];
    }
  };

  const handleWhatsAppContact = () => {
    if (!proprietaireInfo?.telephone) return;

    const message = `Bonjour, je suis intéressé(e) par l'achat du terrain "${terrain?.titre}" situé à ${terrain?.ville}${terrain?.quartier ? `, ${terrain.quartier}` : ""}. Superficie: ${terrain?.superficie_m2}m², Prix: ${formatPrice(terrain?.prix || 0)} FCFA. Pouvez-vous me donner plus d'informations ?`;

    const whatsappUrl = `https://wa.me/${proprietaireInfo.telephone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCall = () => {
    if (!proprietaireInfo?.telephone) return;
    window.open(`tel:${proprietaireInfo.telephone}`, "_blank");
  };

  if (!terrain) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0"
        aria-describedby="terrain-details-description"
      >
        {/* Header fixe avec titre et bouton fermer */}
        <div className="sticky top-0 z-20 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">
              {terrain.titre}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Section Photos - séparée et espacée */}
        {getPhotos().length > 0 ? (
          <div className="w-full bg-gray-50 py-6 px-4 border-b-4 border-gray-300 mb-2">
            <div className="w-full h-60 sm:h-72 md:h-80 lg:h-96 rounded-lg overflow-hidden bg-white shadow-md">
              <ImageCarousel images={getPhotos()} />
            </div>
          </div>
        ) : (
          <div className="w-full bg-gray-50 py-6 px-4 border-b-4 border-gray-300 mb-2">
            <div className="w-full h-40 sm:h-48 md:h-56 rounded-lg bg-gray-100 flex items-center justify-center">
              <p className="text-gray-400 text-sm sm:text-base">
                Aucune image disponible
              </p>
            </div>
          </div>
        )}

        {/* Zone de contenu - complètement séparée des photos avec marge de sécurité */}
        <div className="px-4 sm:px-6 py-8 bg-white mt-4 sm:mt-6 md:mt-8">
          {/* Description pour l'accessibilité */}
          <div id="terrain-details-description" className="sr-only">
            Détails du terrain {terrain.titre} - {terrain.ville}
          </div>

          <div className="space-y-10 sm:space-y-12 md:space-y-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
              <div className="space-y-6">
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-100 shadow-sm">
                  <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-900">
                    Informations générales
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-gray-600">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-blue-500" />
                        <span className="font-semibold text-gray-800 break-words">
                          {terrain.ville}
                          {terrain.quartier && (
                            <>
                              {", "}
                              {terrain.quartier}
                            </>
                          )}
                        </span>
                      </div>
                      {terrain.adresse && (
                        <a
                          href={terrain.adresse}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-lokaz-orange hover:underline text-sm transition-colors duration-200"
                        >
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            Voir sur maps
                          </span>
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="font-medium">
                        {terrain.superficie_m2} m²
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-100 shadow-sm">
                  <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-900">
                    Caractéristiques
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700 min-w-0">
                        Type :
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {terrain.type_terrain || "Résidentiel"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-700 min-w-0">
                        Statut :
                      </span>
                      <Badge
                        className={
                          terrain.statut_vente === "disponible"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {terrain.statut_vente === "disponible"
                          ? "Disponible"
                          : "Vendu"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {terrain.description && (
                  <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-900">
                      Description
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {terrain.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 rounded-lg border border-green-200 shadow-sm">
                  <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-900">
                    Prix
                  </h3>
                  <div className="space-y-3">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">
                      {formatPrice(terrain.prix)} FCFA
                    </div>
                    <div className="text-sm sm:text-base text-gray-600">
                      <span className="font-medium">
                        {terrain.superficie_m2} m²
                      </span>
                      <span className="mx-2">•</span>
                      <span className="font-medium">
                        {formatPrice(
                          Math.round(terrain.prix / terrain.superficie_m2),
                        )}{" "}
                        FCFA/m²
                      </span>
                    </div>
                  </div>
                </div>

                {proprietaireInfo && (
                  <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="font-bold text-orange-600 flex items-center gap-2 mb-4 text-lg">
                      <User className="h-5 w-5" />
                      Propriétaire
                    </div>
                    <div className="space-y-3">
                      <div className="text-lg font-semibold text-gray-800">
                        {proprietaireInfo.prenom} {proprietaireInfo.nom}
                      </div>
                      <div className="text-gray-600 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-500" />
                        <span className="font-medium break-all">
                          {proprietaireInfo.telephone}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                          size="sm"
                          onClick={handleCall}
                          className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 flex-1 sm:flex-none"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleWhatsAppContact}
                          className="bg-green-500 hover:bg-green-600 text-white transition-colors duration-200 flex-1 sm:flex-none"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {terrain.statut_vente === "disponible" && (
                  <div className="pt-2">
                    <Button
                      onClick={handleWhatsAppContact}
                      className="w-full bg-lokaz-orange hover:bg-lokaz-orange/90 text-white font-semibold py-3 sm:py-4 text-base sm:text-lg transition-colors duration-200"
                      size="lg"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Acheter maintenant
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TerrainDetailsModal;
