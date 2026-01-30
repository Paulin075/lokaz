import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PaginatedProperties from "@/components/PaginatedProperties";
import ReservationModal from "@/components/booking/ReservationModal";
import SEO from "@/components/SEO";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { Chambre } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SearchForm from "@/components/SearchForm";

const ChapChap = () => {
  const [selectedChambre, setSelectedChambre] = useState<Chambre | null>(null);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const { chambres, loading, error, fetchProperties, createReservation } =
    useProperties();
  const { user, userData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Charger seulement les propriétés Chap-Chap
    fetchProperties({ chap_chap: true });
  }, []);

  const handleReserve = (chambreId: number) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour faire une réservation",
        variant: "destructive",
      });
      return;
    }
    const chambre = chambres.find((c) => c.id === chambreId);
    if (chambre) {
      setSelectedChambre(chambre);
      setReservationModalOpen(true);
    }
  };

  const handleConfirmReservation = async (reservationData: {
    chambreId: number;
    dateDebut: Date;
    dateFin: Date;
    modeLocation: string;
    totalAPayer: number;
    nombreHeures?: number;
  }) => {
    if (!userData) return;
    try {
      await createReservation({
        ...reservationData,
        locataireId: userData.id,
      });
      toast({
        title: "Réservation confirmée",
        description:
          "Votre réservation Chap-Chap a été enregistrée avec succès",
      });
      setReservationModalOpen(false);
      setSelectedChambre(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la réservation",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (filters: {
    prix_min?: string;
    prix_max?: string;
    nb_chambres?: string;
    superficie_min?: string;
  }) => {
    const numericFilters = {
      ...filters,
      chap_chap: true, // Toujours filtrer sur chap_chap
      prix_min: filters.prix_min ? parseInt(filters.prix_min) : undefined,
      prix_max: filters.prix_max ? parseInt(filters.prix_max) : undefined,
      nb_chambres: filters.nb_chambres
        ? parseInt(filters.nb_chambres)
        : undefined,
      superficie_min: filters.superficie_min
        ? parseInt(filters.superficie_min)
        : undefined,
    };
    fetchProperties(numericFilters);
  };

  const sortedChambres = [...chambres].sort((a, b) => {
    switch (sortBy) {
      case "prix_heure_asc":
        return (a.prix_heure || 0) - (b.prix_heure || 0);
      case "prix_heure_desc":
        return (b.prix_heure || 0) - (a.prix_heure || 0);
      case "prix_jour_asc":
        return (a.prix_jour || 0) - (b.prix_jour || 0);
      case "prix_jour_desc":
        return (b.prix_jour || 0) - (a.prix_jour || 0);
      case "recent":
      default:
        return 0;
    }
  });

  // Mélange avec priorité aux 3 plus récentes
  const sortedByDate = [...chambres].sort((a, b) => {
    if (a.date_publication && b.date_publication) {
      return (
        new Date(b.date_publication).getTime() -
        new Date(a.date_publication).getTime()
      );
    }
    return b.id - a.id;
  });
  const recentChambres = sortedByDate.slice(0, 3);
  const shuffle = <T,>(arr: T[]) =>
    arr
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  const otherChambres = shuffle(sortedByDate.slice(3));
  // Determine display list based on sort
  let chambresToDisplay = [];
  if (sortBy === 'recent') {
    chambresToDisplay = [...recentChambres, ...otherChambres];
  } else {
    chambresToDisplay = sortedChambres;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <SEO
        title="Chap-Chap - Location à l'Heure & Journalière"
        description="⚡ Service Chap-Chap Lokaz : Location d'espaces à l'heure ou à la journée au Togo. Bureaux, salles de réunion, logements courts séjours. Réservation instantanée 24/7."
        keywords="Chap-Chap, location heure Togo, bureau à l'heure Lomé, salle réunion, location journalière, court séjour, Lokaz"
        canonical="https://lokaz.com/chap-chap"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Service Chap-Chap",
          description: "Location d'espaces à l'heure ou à la journée",
          provider: {
            "@type": "Organization",
            name: "Lokaz",
          },
          areaServed: "Togo",
          availableChannel: {
            "@type": "ServiceChannel",
            serviceUrl: "https://lokaz.com/chap-chap",
            availableLanguage: "French",
          },
        }}
      />
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header Chap-Chap */}
        <div className="mb-8">
          <SearchForm onSearch={handleSearch} loading={loading} />
        </div>
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-lokaz-orange rounded-full">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold font-baloo text-lokaz-black dark:text-lokaz-orange">
              Chap-Chap
            </h1>
            <div className="p-3 bg-lokaz-orange rounded-full">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Location à l'heure ou à la journée. Réservez instantanément pour vos
            besoins urgents : bureaux, salles de réunion, logements courts
            séjours.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold font-baloo dark:text-foreground">
            {chambres.length} espace{chambres.length !== 1 ? "s" : ""} Chap-Chap
            disponible{chambres.length !== 1 ? "s" : ""}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Trier par:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récent</SelectItem>
                <SelectItem value="prix_heure_asc">
                  Prix/heure croissant
                </SelectItem>
                <SelectItem value="prix_heure_desc">
                  Prix/heure décroissant
                </SelectItem>
                <SelectItem value="prix_jour_asc">
                  Prix/jour croissant
                </SelectItem>
                <SelectItem value="prix_jour_desc">
                  Prix/jour décroissant
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                <div className="bg-white p-4 rounded-b-lg border">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PaginatedProperties
            chambres={chambresToDisplay}
            onReserve={handleReserve}
            itemsPerPage={9}
          />
        )}
      </div>
      <ReservationModal
        open={reservationModalOpen}
        onClose={() => setReservationModalOpen(false)}
        chambre={selectedChambre}
        onConfirm={handleConfirmReservation}
      />
      <Footer />
    </div>
  );
};

export default ChapChap;
