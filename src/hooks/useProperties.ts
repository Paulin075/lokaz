import { useState, useEffect, useCallback } from 'react'
import { supabase, Chambre, Maison } from '@/lib/supabase'

interface SearchFilters {
  ville?: string
  quartier?: string
  type_location?: string
  prix_min?: number
  prix_max?: number
  nb_chambres?: number
  garage?: boolean
  chap_chap?: boolean
  superficie_min?: number
}

export const useProperties = () => {
  console.log('=== useProperties hook initializing ===')
  
  const [chambres, setChambres] = useState<Chambre[]>([])
  const [maisons, setMaisons] = useState<Maison[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  console.log('useProperties state initialized - chambres:', chambres.length, 'loading:', loading, 'error:', error)

  const fetchProperties = useCallback(async (filters: SearchFilters = {}) => {
    // Éviter les appels multiples si déjà en cours de chargement
    if (loading) {
      console.log('Fetch already in progress, skipping...')
      return
    }

    console.log('Starting fetchProperties with filters:', filters)
    setLoading(true)
    setError(null)

    try {
      console.log('Fetching properties with filters:', filters)
      
      // Construire la requête pour les chambres avec informations du propriétaire
      let query = supabase
        .from('chambres')
        .select(`
          *,
          maisons (
            id,
            titre,
            ville,
            type_location,
            prix_eau,
            prix_electricite,
            id_proprietaire,
            id_proprietaire_uuid,
            proprietaire:utilisateurs!maisons_id_proprietaire_fkey(nom, prenom, telephone)
          )
        `)
        .eq('disponible', true)

      // Appliquer les filtres
      if (filters.prix_min) {
        query = query.gte('prix', filters.prix_min)
      }
      if (filters.prix_max) {
        query = query.lte('prix', filters.prix_max)
      }
      if (filters.nb_chambres) {
        query = query.eq('nb_chambres', filters.nb_chambres)
      }
      if (filters.garage !== undefined) {
        query = query.eq('garage', filters.garage)
      }
      if (filters.chap_chap !== undefined) {
        query = query.eq('chap_chap', filters.chap_chap)
      }
      if (filters.superficie_min) {
        query = query.gte('superficie_m2', filters.superficie_min)
      }
      if (filters.ville) {
        query = query.ilike('ville', `%${filters.ville}%`)
      }
      if (filters.quartier) {
        query = query.ilike('quartier', `%${filters.quartier}%`)
      }

      console.log('Executing Supabase query...')
      const { data, error: fetchError } = await query

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError)
        setError('Erreur lors de la récupération des propriétés')
        return
      }

      console.log('Raw data from Supabase:', data)

      // Simplifier temporairement - pas de récupération des propriétaires pour l'instant
      const chambresWithProprietaire = (data || []).map(chambre => ({
        ...chambre,
        proprietaire: chambre.maisons?.proprietaire || null
      }))

      console.log('Available chambres after filtering:', chambresWithProprietaire)
      setChambres(chambresWithProprietaire)
      setIsInitialized(true)
      console.log('FetchProperties completed successfully')
    } catch (err) {
      console.error('Error in fetchProperties:', err)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
      console.log('FetchProperties finished, loading set to false')
    }
  }, [loading]) // Ajouter loading comme dépendance pour éviter les appels multiples

  const createReservation = useCallback(async (reservationData: any) => {
    try {
      console.log('Creating reservation:', reservationData)
      const insertData: any = {
        id_locataire: reservationData.locataireId,
        id_chambre: reservationData.chambreId,
        date_debut: reservationData.dateDebut.toISOString(),
        date_fin: reservationData.dateFin.toISOString(),
        mode_location: reservationData.modeLocation,
        total_a_payer: reservationData.totalAPayer,
        statut: 'en_attente'
      };
      if (reservationData.nombreHeures || reservationData.nombre_heures) {
        insertData.nombre_heures = reservationData.nombreHeures || reservationData.nombre_heures;
      }
      const { data, error } = await supabase
        .from('reservations')
        .insert([insertData])
        .select()
        .single()
      if (error) throw error
      // Envoyer notification WhatsApp au propriétaire
      await sendWhatsAppNotification(reservationData)
      // Envoi email au propriétaire
      // Récupérer l'email du propriétaire
      const { data: chambre } = await supabase
        .from('chambres')
        .select('maisons(id_proprietaire)')
        .eq('id', reservationData.chambreId)
        .single();
      const maison = chambre?.maisons?.[0] || chambre?.maisons;
      let proprietaireEmail = null;
      if (maison && typeof maison === 'object' && 'id_proprietaire' in maison) {
        const { data: proprietaire } = await supabase
          .from('utilisateurs')
          .select('email')
          .eq('id', maison.id_proprietaire)
          .single();
        proprietaireEmail = proprietaire?.email;
      }
      if (proprietaireEmail) {
        await fetch('https://<project-ref>.functions.supabase.co/send-notification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: proprietaireEmail,
            subject: "Nouvelle location en attente",
            text: "Vous avez une nouvelle location en attente sur Lokaz.",
            html: "<b>Vous avez une nouvelle location en attente sur Lokaz.</b>"
          })
        });
      }
      return data
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error)
      throw error
    }
  }, [])

  const sendWhatsAppNotification = useCallback(async (reservationData: any) => {
    try {
      // Récupérer les infos du propriétaire et de la chambre
      const { data: chambre } = await supabase
        .from('chambres')
        .select(`
          numero_chambre,
          adresse,
          maisons (
            titre,
            id_proprietaire
          )
        `)
        .eq('id', reservationData.chambreId)
        .single();

      if (!chambre || !chambre.maisons || (Array.isArray(chambre.maisons) && chambre.maisons.length === 0)) {
        console.error('Chambre ou maison non trouvée');
        return;
      }

      const maison = Array.isArray(chambre.maisons) ? chambre.maisons[0] : chambre.maisons;

      // Récupérer le locataire
      const { data: locataire } = await supabase
        .from('utilisateurs')
        .select('nom, prenom, telephone')
        .eq('id', reservationData.locataireId)
        .single();

      // Récupérer le propriétaire
      const { data: proprietaire } = await supabase
        .from('utilisateurs')
        .select('nom, prenom, telephone')
        .eq('id', maison.id_proprietaire)
        .single();

      if (proprietaire?.telephone && locataire) {
        const message = `Nouvelle demande de réservation sur Lokaz!\n\n` +
          `Propriété: ${maison.titre}\n` +
          `Chambre: ${chambre.numero_chambre}\n` +
          `Adresse: ${chambre.adresse}\n` +
          `Locataire: ${locataire.prenom} ${locataire.nom}\n` +
          `Téléphone: ${locataire.telephone}\n` +
          `Du: ${reservationData.dateDebut.toLocaleDateString()}\n` +
          `Au: ${reservationData.dateFin.toLocaleDateString()}\n` +
          `Montant: ${reservationData.totalAPayer} FCFA\n\n` +
          `Connectez-vous à votre dashboard pour confirmer ou refuser cette réservation.`;

        const whatsappUrl = `https://wa.me/${proprietaire.telephone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`;
        console.log('WhatsApp notification URL:', whatsappUrl);

        // Ouvrir WhatsApp dans un nouvel onglet
        if (typeof window !== 'undefined') {
          window.open(whatsappUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification WhatsApp:', error);
    }
  }, []);

  // Récupérer toutes les villes distinctes depuis la base
  const fetchVillesDistinctes = useCallback(async () => {
    // On récupère toutes les villes non nulles depuis chambres
    const { data, error } = await supabase
      .from('chambres')
      .select('ville')
      .neq('ville', null)

    if (error) {
      console.error('Erreur lors de la récupération des villes:', error)
      return [];
    }
    // Filtrer les doublons (insensible à la casse)
    const villesUniques = Array.from(
      new Set(
        (data || [])
          .map((row: any) => (row.ville || '').trim().toLowerCase())
          .filter(Boolean)
      )
    ).map(v => v.charAt(0).toUpperCase() + v.slice(1));
    return villesUniques;
  }, []);

  return {
    chambres,
    maisons,
    loading,
    error,
    fetchProperties,
    createReservation,
    fetchVillesDistinctes,
  }
}