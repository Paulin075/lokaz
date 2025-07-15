
import React, { useState } from 'react'
import PropertyCard from '@/components/booking/PropertyCard'
import { Chambre } from '@/lib/supabase'
import Pagination from '@/components/ui/pagination'

interface PaginatedPropertiesProps {
  chambres: Chambre[]
  onReserve: (chambreId: number) => void
  itemsPerPage?: number
}

const PaginatedProperties: React.FC<PaginatedPropertiesProps> = ({
  chambres,
  onReserve,
  itemsPerPage = 9
}) => {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(chambres.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentChambres = chambres.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (chambres.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun logement trouvé</h3>
        <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grille des propriétés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentChambres.map((chambre) => (
          <PropertyCard
            key={chambre.id}
            chambre={chambre}
            onReserve={onReserve}
          />
        ))}
      </div>

      {/* Pagination custom Lokaz */}
      {totalPages > 1 && (
        <Pagination
          page={currentPage}
          total={totalPages}
          onChange={goToPage}
        />
      )}

      {/* Informations de pagination */}
      <div className="text-center text-sm text-gray-600">
        Affichage de {startIndex + 1} à {Math.min(endIndex, chambres.length)} sur {chambres.length} logement{chambres.length !== 1 ? 's' : ''}
        {totalPages > 1 && ` (Page ${currentPage} sur ${totalPages})`}
      </div>
    </div>
  )
}

export default PaginatedProperties
