import React, { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import SearchForm from '@/components/SearchForm'
import PaginatedProperties from '@/components/PaginatedProperties'
import ReservationModal from '@/components/booking/ReservationModal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProperties } from '@/hooks/useProperties'
import { useAuth } from '@/hooks/useAuth'
import { Chambre } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

const Search = () => {
  try {
    const [selectedChambre, setSelectedChambre] = useState<Chambre | null>(null)
    const [reservationModalOpen, setReservationModalOpen] = useState(false)
    const [sortBy, setSortBy] = useState('recent')
    const { chambres, loading, error, fetchProperties, createReservation } = useProperties()
    const { user, userData } = useAuth()
    const { toast } = useToast()

    useEffect(() => {
      // Charger les propriétés au montage du composant
      fetchProperties()
    }, [])

    const handleSearch = (filters: any) => {
      const numericFilters = {
        ...filters,
        prix_min: filters.prix_min ? parseInt(filters.prix_min) : undefined,
        prix_max: filters.prix_max ? parseInt(filters.prix_max) : undefined,
        nb_chambres: filters.nb_chambres ? parseInt(filters.nb_chambres) : undefined,
        superficie_min: filters.superficie_min ? parseInt(filters.superficie_min) : undefined,
      }
      fetchProperties(numericFilters)
    }

    const handleReserve = (chambreId: number) => {
      if (!user) {
        toast({
          title: "Connexion requise",
          description: "Vous devez être connecté pour faire une réservation",
          variant: "destructive"
        })
        return
      }
      const chambre = chambres.find(c => c.id === chambreId)
      if (chambre) {
        setSelectedChambre(chambre)
        setReservationModalOpen(true)
      }
    }

    const handleConfirmReservation = async (reservationData: any) => {
      if (!userData) return
      try {
        await createReservation({
          ...reservationData,
          locataireId: userData.id
        })
        toast({
          title: "Réservation confirmée",
          description: "Votre réservation a été enregistrée avec succès",
        })
        setReservationModalOpen(false)
        setSelectedChambre(null)
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la réservation",
          variant: "destructive"
        })
      }
    }

    const sortedChambres = [...chambres].sort((a, b) => {
      switch (sortBy) {
        case 'prix_asc':
          return a.prix - b.prix
        case 'prix_desc':
          return b.prix - a.prix
        case 'superficie_desc':
          return b.superficie_m2 - a.superficie_m2
        case 'recent':
        default:
          return 0
      }
    })

    // Mélange avec priorité aux 3 plus récentes
    const sortedByDate = [...chambres].sort((a, b) => {
      if (a.date_publication && b.date_publication) {
        return new Date(b.date_publication).getTime() - new Date(a.date_publication).getTime();
      }
      return b.id - a.id;
    });
    const recentChambres = sortedByDate.slice(0, 3);
    const shuffle = (arr) => arr
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    const otherChambres = shuffle(sortedByDate.slice(3));
    const chambresToDisplay = [...recentChambres, ...otherChambres];

    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-baloo text-lokaz-black mb-4">
              Rechercher un logement
            </h1>
            <SearchForm onSearch={handleSearch} loading={loading} />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold font-baloo">
              {chambres.length} logement{chambres.length !== 1 ? 's' : ''} trouvé{chambres.length !== 1 ? 's' : ''}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Trier par:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récent</SelectItem>
                  <SelectItem value="prix_asc">Prix croissant</SelectItem>
                  <SelectItem value="prix_desc">Prix décroissant</SelectItem>
                  <SelectItem value="superficie_desc">Plus grande superficie</SelectItem>
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
    )
  } catch (err) {
    // Affichage d'une erreur lisible à l'écran
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur lors du chargement de la page</h1>
        <p className="text-gray-700 mb-2">{String(err)}</p>
        <p className="text-gray-500">Veuillez contacter l'administrateur ou réessayer plus tard.</p>
      </div>
    )
  }
}

export default Search
