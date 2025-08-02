import React from 'react';

interface TerrainCardProps {
  terrain: any;
  onDetails: (terrain: any) => void;
  onBuy: (terrain: any) => void;
}

const TerrainCard: React.FC<TerrainCardProps> = ({ terrain, onDetails, onBuy }) => {
  let prixJour = terrain.prix_jour || terrain.prix_journalier || terrain.prix;
  let prixHeure = terrain.prix_heure || terrain.prix_horaire;
  let prixMois = terrain.prix_mois || terrain.prix;
  let eau = terrain.eau || terrain.prix_eau || 0;
  let electricite = terrain.electricite || terrain.prix_electricite || 0;
  let nbChambres = terrain.nb_chambres || terrain.chambres || 0;
  let nbSalons = terrain.nb_salons || terrain.salons || 0;
  let superficie = terrain.superficie_m2 || terrain.superficie || 0;
  let ville = terrain.ville || '';
  let quartier = terrain.quartier || '';
  let titre = terrain.titre || `Terrain #${terrain.id}`;
  let description = terrain.description || '';
  let photos = [];
  try {
    photos = typeof terrain.photos === 'string' ? JSON.parse(terrain.photos) : (terrain.photos || []);
  } catch {
    photos = [];
  }
  const imageUrl = photos && photos.length > 0 ? photos[0] : null;

  return (
    <div className="bg-white border rounded-lg shadow hover:shadow-lg transition-shadow relative flex flex-col">
      {/* Image principale */}
      {imageUrl ? (
        <img src={imageUrl} alt={titre} className="w-full h-48 object-cover rounded-t-lg" />
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500 rounded-t-lg">Aucune image</div>
      )}
      {/* Badges */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <span className="bg-lokaz-orange text-white text-xs font-bold px-2 py-1 rounded">À vendre</span>
      </div>
      {/* Prix principal (vente) */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg px-4 py-2 shadow text-2xl font-bold text-lokaz-orange">
        {prixMois ? prixMois.toLocaleString() : 'N/A'} FCFA
        <span className="block text-base font-normal text-gray-700">Prix de vente</span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-2">{titre}</h3>
        <div className="flex items-center text-sm text-gray-600 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /></svg>
          {ville}{quartier ? `, ${quartier}` : ''}
        </div>
        {terrain.adresse && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(terrain.adresse)}`} target="_blank" rel="noopener noreferrer" className="text-lokaz-orange hover:underline text-sm flex items-center gap-1 mb-1">
          Voir sur maps
        </a>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-700 mb-2">
          <span><svg className="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" /></svg>{superficie} m²</span>
        </div>
        {description && (
          <div className="mb-2 text-gray-700 text-sm line-clamp-2">{description}</div>
        )}
        <div className="mb-2">
          <span className="block text-lokaz-orange font-bold">{prixMois?.toLocaleString()} FCFA <span className="font-normal text-gray-700">/jour</span></span>
        </div>
        <div className="flex gap-2 mt-4 mt-auto">
          <button onClick={() => onDetails(terrain)} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-gray-100 transition text-gray-900 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0A9 9 0 11 3 12a9 9 0 0118 0z" /></svg>
            Détails
          </button>
          <button onClick={() => onBuy(terrain)} className="flex-1 bg-lokaz-orange text-white rounded-lg px-4 py-2 font-semibold hover:bg-orange-600 transition">Acheter maintenant</button>
        </div>
      </div>
    </div>
  );
};

export default TerrainCard;
