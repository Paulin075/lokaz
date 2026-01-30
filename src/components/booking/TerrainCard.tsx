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
    <div className="bg-white dark:bg-card dark:border-gray-800 border rounded-lg shadow hover:shadow-lg transition-shadow relative flex flex-col group">
      {/* Image principale */}
      {imageUrl ? (
        <div className="relative h-48 rounded-t-lg overflow-hidden">
          <img src={imageUrl} alt={titre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-t-lg">Aucune image</div>
      )}
      {/* Badges */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <span className="bg-lokaz-orange/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded shadow-sm">À vendre</span>
      </div>
      {/* Prix principal (vente) */}
      <div className="absolute top-4 right-4 bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="text-2xl font-bold text-lokaz-orange">
          {prixMois ? prixMois.toLocaleString() : 'N/A'} <span className="text-sm">FCFA</span>
        </div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 text-right">Prix de vente</div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-lokaz-orange transition-colors">{titre}</h3>
        <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-lokaz-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /></svg>
          {ville}{quartier ? `, ${quartier}` : ''}
        </div>
        {terrain.adresse && (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(terrain.adresse)}`} target="_blank" rel="noopener noreferrer" className="text-lokaz-orange hover:underline text-xs flex items-center gap-1 mb-3 pl-5">
            Voir sur maps
          </a>
        )}
        <div className="flex items-center gap-4 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
          <span className="flex items-center"><svg className="inline h-4 w-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>{superficie} m²</span>
          {nbChambres > 0 && <span className="flex items-center"><svg className="inline h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>{nbChambres} ch.</span>}
        </div>
        {description && (
          <div className="mb-4 text-gray-600 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">{description}</div>
        )}

        <div className="flex gap-2 mt-auto pt-2 border-t dark:border-gray-800">
          <button onClick={() => onDetails(terrain)} className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-200 font-semibold text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0A9 9 0 11 3 12a9 9 0 0118 0z" /></svg>
            Détails
          </button>
          <button onClick={() => onBuy(terrain)} className="flex-1 bg-lokaz-orange text-white rounded-lg px-4 py-2 font-semibold hover:bg-orange-600 transition shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2">
            <span>Acheter</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerrainCard;
