import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import PaginatedProperties from "@/components/PaginatedProperties";
import ReservationModal from "@/components/booking/ReservationModal";
import TerrainCard from "@/components/booking/TerrainCard";
import TerrainDetailsModal from "@/components/TerrainDetailsModal";
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
import { Badge } from "@/components/ui/badge";

const Search = () => {
  const [selectedChambre, setSelectedChambre] = useState<Chambre | null>(null);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const { chambres, loading, error, fetchProperties, createReservation } =
    useProperties();
  const [terrains, setTerrains] = useState<
    Array<{
      id: number;
      titre: string;
      description: string;
      prix: number;
      superficie_m2: number;
      ville: string;
      quartier?: string;
      statut_vente: string;
    }>
  >([]);
  const [loadingTerrains, setLoadingTerrains] = useState(false);
  const [terrainFilters, setTerrainFilters] = useState<{
    type_bien?: string;
    ville?: string;
    quartier?: string;
    prix_min?: number;
    prix_max?: number;
    superficie_min?: number;
  }>({});
  const [selectedTerrain, setSelectedTerrain] = useState<{
    id: number;
    titre: string;
    description: string;
    prix: number;
    superficie_m2: number;
    ville: string;
    quartier?: string;
    statut_vente: string;
  } | null>(null);
  const [terrainDetailsOpen, setTerrainDetailsOpen] = useState(false);
  const [terrainBuyOpen, setTerrainBuyOpen] = useState(false);
  const { user, userData } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Charger les propriétés et terrains au montage du composant
    const loadData = async () => {
      fetchProperties();
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase
        .from("terrains")
        .select("*")
        .eq("statut_vente", "disponible");
      setTerrains(data || []);
    };

    loadData();
  }, []);

  // Recherche avancée : filtrer maisons/chambres ou terrains
  const handleSearch = async (filters: {
    type_bien?: string;
    ville?: string;
    quartier?: string;
    prix_min?: string;
    prix_max?: string;
    nb_chambres?: string;
    superficie_min?: string;
  }) => {
    const numericFilters = {
      ...filters,
      prix_min: filters.prix_min ? parseInt(filters.prix_min) : undefined,
      prix_max: filters.prix_max ? parseInt(filters.prix_max) : undefined,
      nb_chambres: filters.nb_chambres
        ? parseInt(filters.nb_chambres)
        : undefined,
      superficie_min: filters.superficie_min
        ? parseInt(filters.superficie_min)
        : undefined,
    };
    if (filters.type_bien === "terrain") {
      // Recherche terrains
      setLoadingTerrains(true);
      setTerrainFilters(numericFilters);
      const { supabase } = await import("@/lib/supabase");
      let query = supabase
        .from("terrains")
        .select("*")
        .eq("statut_vente", "disponible");
      if (numericFilters.ville)
        query = query.ilike("ville", `%${numericFilters.ville}%`);
      if (numericFilters.quartier)
        query = query.ilike("quartier", `%${numericFilters.quartier}%`);
      if (numericFilters.prix_min)
        query = query.gte("prix", numericFilters.prix_min);
      if (numericFilters.prix_max)
        query = query.lte("prix", numericFilters.prix_max);
      if (numericFilters.superficie_min)
        query = query.gte("superficie_m2", numericFilters.superficie_min);
      const { data, error } = await query;
      setTerrains(data || []);
      setLoadingTerrains(false);
    } else {
      setTerrains([]);
      fetchProperties(numericFilters);
    }
  };

  const handleReserve = (chambreId: number) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour faire une réservation",
        variant: "destructive",
      });
      return;
    }
    // Sécurisation : attendre que les chambres soient chargées et que la chambre existe
    if (!chambres || chambres.length === 0) {
      toast({
        title: "Chargement en cours",
        description:
          "Veuillez patienter, les logements sont en cours de chargement.",
        variant: "destructive",
      });
      return;
    }
    const chambre = chambres.find((c) => c.id === chambreId);
    if (!chambre) {
      toast({
        title: "Erreur",
        description: "Ce logement n'existe pas ou n'est plus disponible.",
        variant: "destructive",
      });
      return;
    }
    setSelectedChambre(chambre);
    setReservationModalOpen(true);
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
        description: "Votre réservation a été enregistrée avec succès",
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

  const sortedChambres = [...chambres].sort((a, b) => {
    switch (sortBy) {
      case "prix_asc":
        return a.prix - b.prix;
      case "prix_desc":
        return b.prix - a.prix;
      case "superficie_desc":
        return b.superficie_m2 - a.superficie_m2;
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
        title="Recherche de Logements - Location & Vente"
        description="🔍 Trouvez votre logement idéal au Togo avec Lokaz. +500 biens disponibles : maisons, appartements, chambres. Location mensuelle, journalière ou Chap-Chap (à l'heure)."
        keywords="recherche logement Togo, location appartement Lomé, maison à louer, chambre étudiant, terrain à vendre, Lokaz"
        canonical="https://lokaz.com/search"
      />
      <Navigation />
      <div className="container mx-auto px-4 py-8 dark:text-foreground">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-baloo text-lokaz-black dark:text-lokaz-orange mb-4">
            Rechercher un logement
          </h1>
          <SearchForm
            onSearch={handleSearch}
            loading={loading || loadingTerrains}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Logements (chambres/maisons) */}
        {(!terrainFilters.type_bien ||
          terrainFilters.type_bien === "" ||
          terrainFilters.type_bien === "maison" ||
          terrainFilters.type_bien === "tous" ||
          terrainFilters.type_bien === undefined) && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold font-baloo dark:text-foreground">
                  {chambres.length} logement{chambres.length !== 1 ? "s" : ""}{" "}
                  trouvé{chambres.length !== 1 ? "s" : ""}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Trier par:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Plus récent</SelectItem>
                      <SelectItem value="prix_asc">Prix croissant</SelectItem>
                      <SelectItem value="prix_desc">Prix décroissant</SelectItem>
                      <SelectItem value="superficie_desc">
                        Plus grande superficie
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
                  chambres={chambresToDisplay.map((chambre) => ({
                    ...chambre,
                    quartier: chambre.quartier,
                  }))}
                  onReserve={handleReserve}
                  itemsPerPage={9}
                />
              )}
            </>
          )}

        {/* Terrains à vendre */}
        {/* Affichage des terrains à vendre : toujours visible si des terrains existent, sinon seulement si filtre terrain/tous */}
        {(terrainFilters.type_bien === "terrain" ||
          terrainFilters.type_bien === "tous" ||
          terrains.length > 0) && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold font-baloo mb-4 dark:text-foreground">
                Terrains à vendre ({terrains.length})
              </h2>
              {loadingTerrains ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
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
              ) : terrains.length === 0 ? (
                <div className="text-gray-500">Aucun terrain trouvé</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {terrains.map((terrain) => (
                    <TerrainCard
                      key={terrain.id}
                      terrain={terrain}
                      onDetails={(t) => {
                        setSelectedTerrain(t);
                        setTerrainDetailsOpen(true);
                      }}
                      onBuy={(t) => {
                        setSelectedTerrain(t);
                        setTerrainBuyOpen(true);
                      }}
                    />
                  ))}
                  {/* Modal détails terrain */}
                  {selectedTerrain && terrainDetailsOpen && (
                    <TerrainDetailsModal
                      isOpen={terrainDetailsOpen}
                      onClose={() => setTerrainDetailsOpen(false)}
                      terrain={selectedTerrain}
                      onBuy={() => {
                        setTerrainDetailsOpen(false);
                        setTerrainBuyOpen(true);
                      }}
                    />
                  )}
                  {/* Modal acheter maintenant terrain */}
                  {selectedTerrain && terrainBuyOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white dark:bg-card rounded-lg shadow-lg p-6 max-w-md w-full mx-4 dark:border dark:border-border">
                        <h2 className="text-xl font-bold mb-4 dark:text-foreground">
                          Acheter ce terrain
                        </h2>
                        <p className="mb-4 text-gray-600 dark:text-muted-foreground">
                          Contactez le propriétaire pour finaliser l'achat de ce
                          terrain.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-end">
                          <button
                            className="px-4 py-2 rounded bg-gray-200 dark:bg-secondary dark:text-secondary-foreground hover:bg-gray-300 dark:hover:bg-secondary/80"
                            onClick={() => setTerrainBuyOpen(false)}
                          >
                            Annuler
                          </button>
                          <a
                            href={`https://wa.me/22890123456?text=Bonjour, je suis intéressé(e) par l'achat du terrain "${selectedTerrain.titre}" situé à ${selectedTerrain.ville}${selectedTerrain.quartier ? `, ${selectedTerrain.quartier}` : ""}. Superficie: ${selectedTerrain.superficie_m2}m², Prix: ${selectedTerrain.prix?.toLocaleString()} FCFA. Pouvez-vous me donner plus d'informations ?`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded bg-green-500 text-white font-semibold hover:bg-green-600 text-center"
                          >
                            Contacter via WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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

export default Search;
