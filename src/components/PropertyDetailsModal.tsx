import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Car,
  Bed,
  Bath,
  Zap,
  Phone,
  MessageCircle,
  Droplets,
  BoltIcon,
  X,
  Calendar,
  Clock,
  User,
  Mail,
} from "lucide-react";
import { Chambre, supabase, Utilisateur } from "@/lib/supabase";
import ImageCarousel from "@/components/ImageCarousel";

interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chambre: Chambre | null;
  onReserve?: () => void;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  isOpen,
  onClose,
  chambre,
  onReserve,
}) => {
  const [proprietaire, setProprietaire] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(false);

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
        .from("utilisateurs")
        .select(
          "id, nom, prenom, email, telephone, type_utilisateur, date_creation, verifie",
        )
        .eq("id", chambre.id_proprietaire)
        .single()
        .then(({ data }) => {
          if (data) setProprietaire(data);
        });
      return;
    }

    // 3. Propriétaire via la maison (si id_proprietaire sur la maison)
    if (chambre.maisons && chambre.maisons.id_proprietaire) {
      supabase
        .from("utilisateurs")
        .select(
          "id, nom, prenom, email, telephone, type_utilisateur, date_creation, verifie",
        )
        .eq("id", chambre.maisons.id_proprietaire)
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
    if (!chambre?.maisons) return;

    setLoading(true);
    try {
      console.log("Fetching proprietaire info for chambre:", chambre);
      console.log("Maisons data:", chambre.maisons);

      // Essayer d'abord avec l'UUID s'il existe
      if (chambre.maisons.id_proprietaire_uuid) {
        const { data, error } = await supabase
          .from("utilisateurs")
          .select("*")
          .eq("uuid", chambre.maisons.id_proprietaire_uuid)
          .single();

        if (error) {
          console.error(
            "Erreur lors de la récupération du propriétaire par UUID:",
            error,
          );
        } else {
          console.log("Proprietaire trouvé par UUID:", data);
          setProprietaire(data);
          return;
        }
      }

      // Essayer avec l'ID classique
      if (chambre.maisons.id_proprietaire) {
        const { data, error } = await supabase
          .from("utilisateurs")
          .select("*")
          .eq("id", chambre.maisons.id_proprietaire)
          .single();

        if (error) {
          console.error(
            "Erreur lors de la récupération du propriétaire par ID:",
            error,
          );
        } else {
          console.log("Proprietaire trouvé par ID:", data);
          setProprietaire(data);
        }
      }

      // Si on a les données utilisateur directement dans la jointure
      if (chambre.maisons.utilisateurs) {
        console.log(
          "Proprietaire depuis jointure:",
          chambre.maisons.utilisateurs,
        );
        setProprietaire(chambre.maisons.utilisateurs);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!chambre) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Erreur</DialogTitle>
          </DialogHeader>
          <div className="text-center text-red-600 font-semibold py-8">
            Impossible d'afficher le détail de la réservation : la chambre liée
            à cette réservation est introuvable ou a été supprimée.
          </div>
          <div className="flex justify-center mt-4">
            <Button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getPhotos = () => {
    if (!chambre?.photos) return [];
    try {
      const photos = JSON.parse(chambre.photos);
      return Array.isArray(photos) ? photos : [];
    } catch (e) {
      console.error("Erreur parsing photos:", e);
      return [];
    }
  };

  const formatPrice = (price: number) => {
    return price?.toLocaleString() || "0";
  };

  const handleWhatsAppContact = () => {
    if (proprietaire?.telephone) {
      const message = `Bonjour, je suis intéressé(e) par votre logement "${chambre.numero_chambre}" à ${chambre.adresse} sur Lokaz.`;
      const whatsappUrl = `https://wa.me/${proprietaire.telephone.replace(/\s/g, "")}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleCall = () => {
    if (proprietaire?.telephone) {
      window.open(`tel:${proprietaire.telephone}`, "_self");
    }
  };

  const isDirectMapLink = chambre.adresse?.startsWith("http");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 dark:bg-card dark:border-border"
        aria-describedby="property-details-description"
      >
        {/* Header fixe avec titre et bouton fermer */}
        <div className="sticky top-0 z-20 px-4 py-3 bg-white dark:bg-card border-b border-gray-200 dark:border-border shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-foreground truncate pr-4">
              Chambre {chambre?.numero_chambre}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-muted flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Section Photos - séparée et espacée */}
        {getPhotos().length > 0 ? (
          <div className="w-full bg-gray-50 dark:bg-muted/50 py-6 px-4 border-b-4 border-gray-300 dark:border-border mb-2">
            <div className="w-full h-60 sm:h-72 md:h-80 lg:h-96 rounded-lg overflow-hidden bg-white dark:bg-card shadow-md">
              <ImageCarousel images={getPhotos()} />
            </div>
          </div>
        ) : (
          <div className="w-full bg-gray-50 dark:bg-muted/50 py-6 px-4 border-b-4 border-gray-300 dark:border-border mb-2">
            <div className="w-full h-40 sm:h-48 md:h-56 rounded-lg bg-gray-100 dark:bg-accent flex items-center justify-center">
              <p className="text-gray-400 text-sm sm:text-base">
                Aucune image disponible
              </p>
            </div>
          </div>
        )}

        {/* Zone de contenu - complètement séparée des photos avec marge de sécurité */}
        <div className="px-4 sm:px-6 py-8 bg-white dark:bg-card mt-4 sm:mt-6 md:mt-8">
          {/* Description pour l'accessibilité */}
          <div id="property-details-description" className="sr-only">
            Détails de la propriété {chambre?.numero_chambre} - {chambre?.ville}
          </div>

          <div className="space-y-10 sm:space-y-12 md:space-y-14">
            {/* Informations principales - en dessous des photos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
              {/* Colonne gauche */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-card p-4 sm:p-6 rounded-lg border border-gray-100 dark:border-border shadow-sm">
                  <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-900 dark:text-foreground">
                    Informations générales
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-gray-600 dark:text-muted-foreground">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-blue-500" />
                        {/* Afficher la ville et le quartier si disponible, sinon l'adresse */}
                        <span className="font-semibold text-gray-800 dark:text-foreground break-words">
                          {chambre.ville ||
                            chambre.maisons?.ville ||
                            chambre.adresse}
                          {(chambre.quartier || chambre.maisons?.quartier) && (
                            <>
                              {", "}
                              {chambre.quartier || chambre.maisons?.quartier}
                            </>
                          )}
                        </span>
                      </div>
                      {/* Lien maps séparé, sous le nom de la ville */}
                      {chambre.adresse && (
                        <a
                          href={
                            isDirectMapLink
                              ? chambre.adresse
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chambre.adresse)}`
                          }
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
                    <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="font-medium">
                        {chambre.superficie_m2} m²
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-card p-4 sm:p-6 rounded-lg border border-gray-100 dark:border-border shadow-sm">
                  <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-900 dark:text-foreground">
                    Caractéristiques
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                      <Bed className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">
                        {chambre.nb_chambres} chambre(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                      <Bath className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">
                        {chambre.nb_salons} salon(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">
                        {chambre.nb_cuisines} cuisine(s)
                      </span>
                    </div>
                    {chambre.garage && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-muted-foreground">
                        <Car className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Garage</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-3">
                  {chambre.chap_chap && (
                    <Badge className="bg-lokaz-orange text-white border-lokaz-orange">
                      <Zap className="h-3 w-3 mr-1" />
                      Chap-Chap
                    </Badge>
                  )}
                  {chambre.garage && (
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                    >
                      <Car className="h-3 w-3 mr-1" />
                      Garage
                    </Badge>
                  )}
                </div>
              </div>

              {/* Colonne droite */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/40 p-4 sm:p-6 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
                  <h3 className="font-semibold text-lg mb-2 text-green-900 dark:text-green-100">Prix</h3>
                  <div className="space-y-2">
                    {(chambre.type_propriete === "vente" ||
                      chambre.type_propriete === "les_deux") &&
                      chambre.prix_vente > 0 && (
                        <div className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <span className="flex items-center gap-2 text-red-900 dark:text-red-100">
                            <Calendar className="h-4 w-4" />
                            Prix de vente
                          </span>
                          <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                            {formatPrice(chambre.prix_vente)} FCFA
                          </span>
                        </div>
                      )}
                    {(chambre.type_propriete === "location" ||
                      chambre.type_propriete === "les_deux") &&
                      chambre.prix > 0 && (
                        <div className="flex justify-between items-center p-3 bg-lokaz-orange/10 dark:bg-lokaz-orange/20 rounded-lg">
                          <span className="flex items-center gap-2 dark:text-gray-200">
                            <Calendar className="h-4 w-4" />
                            Par mois
                          </span>
                          <span className="font-bold text-lokaz-orange text-lg">
                            {formatPrice(chambre.prix)} FCFA
                          </span>
                        </div>
                      )}
                    {chambre.prix_jour > 0 && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="flex items-center gap-2 dark:text-gray-300">
                          <Calendar className="h-4 w-4" />
                          Par jour
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {formatPrice(chambre.prix_jour)} FCFA
                        </span>
                      </div>
                    )}
                    {chambre.prix_heure > 0 && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="flex items-center gap-2 dark:text-gray-300">
                          <Clock className="h-4 w-4" />
                          Par heure
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {formatPrice(chambre.prix_heure)} FCFA
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coûts additionnels */}
                {(chambre.maisons?.prix_eau > 0 ||
                  chambre.maisons?.prix_electricite > 0) && (
                    <div className="bg-white dark:bg-card p-4 sm:p-6 rounded-lg border border-gray-100 dark:border-border shadow-sm">
                      <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-900 dark:text-foreground">
                        Coûts additionnels
                      </h3>
                      <div className="space-y-3">
                        {chambre.maisons?.prix_eau > 0 && (
                          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="flex items-center gap-2 dark:text-gray-300">
                              <Droplets className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">Eau (par m³)</span>
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {formatPrice(chambre.maisons.prix_eau)} FCFA
                            </span>
                          </div>
                        )}
                        {chambre.maisons?.prix_electricite > 0 && (
                          <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <span className="flex items-center gap-2 dark:text-gray-300">
                              <BoltIcon className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">
                                Électricité (par kWh)
                              </span>
                            </span>
                            <span className="font-bold text-yellow-600 dark:text-yellow-400">
                              {formatPrice(chambre.maisons.prix_electricite)} FCFA
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Informations du propriétaire */}
            <div className="bg-white dark:bg-card p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-border shadow-sm">
              <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-900 dark:text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-lokaz-orange" />
                Informations du propriétaire
              </h3>

              {loading ? (
                <div className="text-center py-3 sm:py-4">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-lokaz-orange mx-auto"></div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Chargement des informations...
                  </p>
                </div>
              ) : proprietaire ? (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base dark:text-foreground">
                        {proprietaire.prenom} {proprietaire.nom}
                      </span>
                      {proprietaire.verifie && (
                        <span className="ml-2 px-2 py-1 rounded bg-green-600 text-white text-xs">
                          Propriétaire vérifié
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Mail className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm sm:text-base break-words overflow-hidden dark:text-foreground">
                        {proprietaire.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm sm:text-base dark:text-foreground">
                        {proprietaire.telephone}
                      </span>
                    </div>
                    {/* Message d'avertissement si non vérifié */}
                    {proprietaire.verifie === false && (
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-2 rounded mt-2 text-xs break-words">
                        <strong>Attention :</strong> Propriétaire non vérifié.
                        Ne réalisez aucun paiement sans vérification. En cas
                        d'arnaque, la plateforme ne pourra pas vous assister si
                        le propriétaire n'est pas vérifié.
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {chambre.maisons?.titre && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          Propriété:{" "}
                        </span>
                        <span className="text-sm sm:text-base dark:text-gray-400">
                          {chambre.maisons.titre}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 overflow-hidden">
                      <Button
                        onClick={handleCall}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 w-full sm:w-auto text-sm dark:text-gray-200 dark:hover:bg-accent"
                      >
                        <Phone className="h-4 w-4" />
                        Appeler
                      </Button>
                      <Button
                        onClick={handleWhatsAppContact}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 w-full sm:w-auto text-sm"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 sm:py-4 text-gray-500">
                  <User className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-xs sm:text-sm">
                    Informations du propriétaire non disponibles
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {chambre.description && (
              <div className="bg-white dark:bg-card p-4 sm:p-6 rounded-lg border border-gray-100 dark:border-border shadow-sm">
                <h3 className="font-semibold text-lg sm:text-xl mb-4 text-gray-900 dark:text-foreground">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {chambre.description}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-border">
              {proprietaire && (
                <Button
                  onClick={handleWhatsAppContact}
                  variant="outline"
                  className="flex-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors duration-200 py-3 sm:py-4 text-base"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter via WhatsApp
                </Button>
              )}
              <Button
                onClick={onReserve}
                className="flex-1 bg-lokaz-orange hover:bg-lokaz-orange/90 text-white transition-colors duration-200 py-3 sm:py-4 text-base font-semibold"
              >
                Réserver maintenant
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetailsModal;
