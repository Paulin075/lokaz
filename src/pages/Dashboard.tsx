import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { 
  Home, 
  Calendar, 
  MessageCircle, 
  CreditCard, 
  Users, 
  Settings,
  Eye,
  Plus,
  BarChart3,
  AlertCircle,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Send,
  User,
  TrendingUp,
  Activity,
  MapPin,
  Ruler,
  Bed,
  Sofa
} from 'lucide-react'
import PropertyModal from '@/components/PropertyModal'
import ProfileModal from '@/components/ProfileModal'
import EnhancedReservationModal from '@/components/booking/EnhancedReservationModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Fonction utilitaire pour regrouper les messages par conversation (copiée de Messages.tsx)
function groupMessagesByConversation(messages, userId) {
  const usersMap = new Map();
  messages.forEach(msg => {
    if (msg.utilisateurs_expediteur) usersMap.set(msg.expediteur_id, msg.utilisateurs_expediteur);
    if (msg.utilisateurs_destinataire) usersMap.set(msg.destinataire_id, msg.utilisateurs_destinataire);
  });
  const conversationMap = new Map();
  messages.forEach(message => {
    const expediteur = usersMap.get(message.expediteur_id);
    const destinataire = usersMap.get(message.destinataire_id);
    const otherUser = message.expediteur_id === userId ? destinataire : expediteur;
    if (!otherUser) return;
    const conversationKey = otherUser.id;
    if (!conversationMap.has(conversationKey)) {
      conversationMap.set(conversationKey, {
        user: otherUser,
        lastMessage: message,
        unreadCount: 0,
        messages: []
      });
    }
    const conversation = conversationMap.get(conversationKey);
    conversation.messages.push(message);
    if (!message.lu && message.destinataire_id === userId) {
      conversation.unreadCount++;
    }
    // Mettre à jour le dernier message si besoin
    if (new Date(message.date_envoi) > new Date(conversation.lastMessage.date_envoi)) {
      conversation.lastMessage = message;
    }
  });
  // Trier les conversations par date du dernier message
  return Array.from(conversationMap.values()).sort((a, b) => 
    new Date(b.lastMessage.date_envoi).getTime() - new Date(a.lastMessage.date_envoi).getTime()
  );
}

const Dashboard = () => {
  const { userData, signOut, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [reservations, setReservations] = useState([])
  const [properties, setProperties] = useState([])
  const [messages, setMessages] = useState([])
  const [stats, setStats] = useState({
    totalReservations: 0,
    totalRevenue: 0,
    activeProperties: 0,
    unreadMessages: 0,
    pendingReservations: 0,
    monthlyGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const [propertyModalOpen, setPropertyModalOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [chambreModalOpen, setChambreModalOpen] = useState(false)
  const [chambres, setChambres] = useState([])
  const [selectedChambre, setSelectedChambre] = useState(null)
  const [activeTab, setActiveTab] = useState('reservations')
  const [reservationDetailOpen, setReservationDetailOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [lastUnreadCount, setLastUnreadCount] = useState(0);

  // Ajout refs pour scroll automatique
  const reservationsRef = useRef(null);
  const messagesRef = useRef(null);
  const analyticsRef = useRef(null);

  useEffect(() => {
    if (userData) {
      setFetchError(null)
      setLoading(true)
      fetchDashboardData().catch((err) => {
        setFetchError('Erreur lors du chargement des données du dashboard : ' + (err?.message || String(err)))
        setLoading(false)
      })
    }
  }, [userData])

  useEffect(() => {
    // Log pour déboguer les états
    console.log('Dashboard - userData:', userData)
    console.log('Dashboard - loading:', loading)
    console.log('Dashboard - reservations:', reservations)
    console.log('Dashboard - properties:', properties)
    console.log('Dashboard - messages:', messages)
  }, [userData, loading, reservations, properties, messages])

  useEffect(() => {
    if (reservationDetailOpen && selectedReservation) {
      console.log('DEBUG selectedReservation:', selectedReservation);
    }
  }, [reservationDetailOpen, selectedReservation]);

  useEffect(() => {
    // Affiche un toast si l'utilisateur a des messages non lus à l'ouverture du dashboard
    const checkUnreadMessages = async () => {
      if (!userData) return
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('destinataire_id', userData.id)
        .eq('lu', false)
      if (!error && data && data.length > 0) {
        toast({
          title: "Nouveaux messages",
          description: `Vous avez ${data.length} message(s) non lu(s) dans votre messagerie.`,
          variant: "default"
        })
      }
    }
    checkUnreadMessages()
  }, [userData, toast])

  useEffect(() => {
    const handleFocus = () => {
      if (userData) {
        fetchDashboardData();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('Fetching dashboard data for user:', userData)

      if (userData?.type_utilisateur === 'admin') {
        // Données pour admin
        const { data: allReservations } = await supabase
          .from('reservations')
          .select(`*, nombre_heures, utilisateurs!reservations_id_locataire_fkey(nom, prenom, email, telephone), chambres(numero_chambre, adresse, prix)`)
          .order('date_debut', { ascending: false })

        const { data: allProperties } = await supabase
          .from('chambres')
          .select(`
            *,
            maisons(titre, ville, prix_eau, prix_electricite, id_proprietaire)
          `)

        const { data: allMessages } = await supabase
          .from('messages')
          .select(`
            *,
            utilisateurs!messages_expediteur_id_fkey(nom, prenom),
            utilisateurs!messages_destinataire_id_fkey(nom, prenom)
          `)
          .order('date_envoi', { ascending: false })

        setReservations(allReservations || [])
        setProperties(allProperties || [])
        setMessages(allMessages || [])

        // Calculer les statistiques admin
        const totalRevenue = allReservations?.reduce((sum, res) => sum + (res.total_a_payer || 0), 0) || 0
        const pendingReservations = allReservations?.filter(r => r.statut === 'en_attente').length || 0
        
        setStats({
          totalReservations: allReservations?.length || 0,
          totalRevenue,
          activeProperties: allProperties?.filter(p => p.disponible).length || 0,
          unreadMessages: allMessages?.filter(m => !m.lu).length || 0,
          pendingReservations,
          monthlyGrowth: 12 // Exemple
        })

      } else if (userData?.type_utilisateur === 'proprietaire') {
        // 1. Récupérer les maisons du propriétaire
        const { data: myMaisons, error: maisonError } = await supabase
          .from('maisons')
          .select('*')
          .eq('id_proprietaire', userData.id)
        if (maisonError) {
          console.error('Error fetching maisons:', maisonError)
        }
        // 2. Récupérer les chambres du propriétaire
        let myChambres = []
        let maisonIds = []
        if (myMaisons && myMaisons.length > 0) {
          maisonIds = myMaisons.map(m => m.id)
          const { data: chambresData, error: chambresError } = await supabase
            .from('chambres')
            .select('*')
            .in('id_maison', maisonIds)
          if (chambresError) {
            console.error('Error fetching chambres:', chambresError)
          }
          myChambres = chambresData || []
        }
        // Récupère aussi les chambres sans maison mais avec id_proprietaire = userData.id
        const { data: chambresDirectes, error: chambresDirectesError } = await supabase
          .from('chambres')
          .select('*')
          .is('id_maison', null)
          .eq('id_proprietaire', userData.id)
        if (chambresDirectesError) {
          console.error('Error fetching chambres directes:', chambresDirectesError)
        }
        // Fusionne les deux listes (en évitant les doublons par id)
        const allChambres = [
          ...(myChambres || []),
          ...(chambresDirectes || [])
        ].filter((ch, idx, arr) => arr.findIndex(c2 => c2.id === ch.id) === idx)
        setChambres && setChambres(allChambres)
        // Récupération des réservations pour toutes les chambres du propriétaire
        let myReservations = []
        if (allChambres && allChambres.length > 0) {
          const chambresAvecMaison = allChambres.filter(c => c.id_maison)
          const chambresSansMaison = allChambres.filter(c => !c.id_maison)

          // Chambres avec maison (jointure profonde)
          let reservationsAvecMaison = []
          if (chambresAvecMaison.length > 0) {
            const chambreIds = chambresAvecMaison.map(c => c.id)
            const { data, error } = await supabase
              .from('reservations')
              .select(`*, locataire:utilisateurs!reservations_id_locataire_fkey(nom, prenom, telephone), chambre:chambres!reservations_id_chambre_fkey(
                id, numero_chambre, photos, adresse, id_maison, prix, prix_jour, prix_heure,
                maison:maisons!chambres_id_maison_fkey(
                  titre, ville, id_proprietaire
                )
              )`)
              .in('id_chambre', chambreIds)
            if (error) {
              console.error('Error fetching reservations (avec maison):', error)
            }
            reservationsAvecMaison = data || []
          }

          // Chambres sans maison (pas de jointure)
          let reservationsSansMaison = []
          if (chambresSansMaison.length > 0) {
            const chambreIds = chambresSansMaison.map(c => c.id)
            const { data, error } = await supabase
              .from('reservations')
              .select(`*, locataire:utilisateurs!reservations_id_locataire_fkey(nom, prenom, telephone), chambre:chambres!reservations_id_chambre_fkey(
                id, numero_chambre, photos, adresse, id_maison, prix, prix_jour, prix_heure
              )`)
              .in('id_chambre', chambreIds)
            if (error) {
              console.error('Error fetching reservations (sans maison):', error)
            }
            reservationsSansMaison = data || []
          }

          myReservations = [...reservationsAvecMaison, ...reservationsSansMaison]
        }
        setProperties(myMaisons || [])
        setReservations(myReservations || [])
        // --- Correction : récupération des messages reçus par le propriétaire ---
        let allReceivedMessages = []
        if (allChambres && allChambres.length > 0) {
          const chambreIds = allChambres.map(c => c.id)
          // On suppose que les locataires envoient des messages au propriétaire via les chambres
          const { data: receivedMessages, error: receivedError } = await supabase
            .from('messages')
            .select('*')
            .in('destinataire_id', [userData.id])
          if (receivedError) {
            console.error('Error fetching received messages:', receivedError)
          } else {
            allReceivedMessages = receivedMessages || []
          }
        }
        // 4. Calculer les stats
        const totalRevenue = myReservations.filter(r => r.statut === 'confirmee').reduce((sum, r) => sum + (r.total_a_payer || 0), 0)
        const pendingReservations = myReservations.filter(r => r.statut === 'en_attente').length
        setStats({
          totalReservations: myReservations.length,
          totalRevenue,
          activeProperties: myMaisons?.filter(m => m.disponible).length || 0,
          unreadMessages: allReceivedMessages.filter(m => !m.lu && m.destinataire_id === userData.id).length || 0,
          pendingReservations,
          monthlyGrowth: 0
        })
        console.log('Messages non lus récupérés (dashboard):', allReceivedMessages.filter(m => !m.lu && m.destinataire_id === userData.id))
      } else {
        // Données pour locataire - utiliser l'UUID
        console.log('Fetching data for locataire:', userData.id, userData.uuid)
        
        const { data: myReservations, error: resError } = await supabase
          .from('reservations')
          .select(`*,
            locataire:utilisateurs!reservations_id_locataire_fkey(nom, prenom, telephone),
            chambre:chambres!reservations_id_chambre_fkey(
              numero_chambre,
              photos,
              adresse,
              prix,
              prix_jour,
              prix_heure,
              maison:maisons!chambres_id_maison_fkey(
                titre,
                ville,
                id_proprietaire
              )
            )
          `)
          .eq('id_locataire', userData.id)
          .order('date_debut', { ascending: false });
        console.log('RES ERROR', resError, myReservations);

        // Récupérer les infos propriétaires pour chaque réservation
        let proprietaires = {};
        if (myReservations && myReservations.length > 0) {
          const ids = [...new Set(myReservations.map(r => r.chambre?.maison?.id_proprietaire).filter(Boolean))];
          if (ids.length > 0) {
            const { data: proprietairesData } = await supabase
              .from('utilisateurs')
              .select('id, nom, prenom, telephone')
              .in('id', ids);
            if (proprietairesData) {
              proprietaires = Object.fromEntries(proprietairesData.map(u => [u.id, u]));
            }
          }
        }
        // Injecter les infos propriétaires dans chaque réservation
        const reservationsWithProprietaire = (myReservations || []).map(r => {
          if (r.chambre?.maison?.id_proprietaire && proprietaires[r.chambre.maison.id_proprietaire]) {
            r.chambre.maison.proprietaire = proprietaires[r.chambre.maison.id_proprietaire];
          }
          return r;
        });
        setReservations(reservationsWithProprietaire);

        console.log('Locataire reservations query:', { myReservations, resError })

        if (resError) {
          console.error('Error fetching locataire reservations:', resError)
        }

        // Récupérer les messages de l'utilisateur avec une requête simplifiée
        let myMessages = []
        try {
          // Requête très simple pour éviter les erreurs 403
          console.log('Tentative de récupération des messages pour utilisateur:', userData.id)
          
          // Essayer d'abord les messages envoyés
          const { data: sentMessages, error: sentError } = await supabase
            .from('messages')
            .select('id, expediteur_id, destinataire_id, contenu, date_envoi, lu')
            .eq('expediteur_id', userData.id)

          if (sentError) {
            console.error('Error fetching sent messages:', sentError)
            // Si erreur 403, on ignore les messages pour l'instant
            if (sentError.code === '403') {
              console.log('Erreur 403 détectée, on ignore les messages')
              setMessages([])
            } else {
              setMessages([])
            }
          } else {
            // Essayer les messages reçus
            const { data: receivedMessages, error: receivedError } = await supabase
              .from('messages')
              .select('id, expediteur_id, destinataire_id, contenu, date_envoi, lu')
              .eq('destinataire_id', userData.id)

            if (receivedError) {
              console.error('Error fetching received messages:', receivedError)
              myMessages = sentMessages || []
            } else {
              // Combiner et trier les messages
              const allMessages = [...(sentMessages || []), ...(receivedMessages || [])]
              myMessages = allMessages.sort((a, b) => new Date(b.date_envoi).getTime() - new Date(a.date_envoi).getTime())
            }
            
            setMessages(myMessages)
            console.log('Messages récupérés avec succès:', myMessages.length)
          }
        } catch (error) {
          console.error('Error in messages query:', error)
          setMessages([])
        }

        // Calculer les statistiques locataire
        // Ancien code :
        // const totalSpent = myReservations?.reduce((sum, res) => sum + (res.total_a_payer || 0), 0) || 0
        // Correction : ne prendre en compte que les réservations confirmées
        const totalSpent = myReservations?.filter(r => r.statut === 'confirmee').reduce((sum, res) => sum + (res.total_a_payer || 0), 0) || 0
        const activeReservations = myReservations?.filter(r => r.statut === 'confirmee').length || 0
        
        // Récupérer les messages reçus par le locataire
        let allReceivedMessages = [];
        const { data: receivedMessages, error: receivedError } = await supabase
          .from('messages')
          .select('*')
          .eq('destinataire_id', userData.id);
        if (receivedError) {
          console.error('Error fetching received messages (locataire):', receivedError);
        } else {
          allReceivedMessages = receivedMessages || [];
        }
        setStats({
          totalReservations: myReservations?.length || 0,
          totalRevenue: totalSpent,
          activeProperties: activeReservations,
          unreadMessages: allReceivedMessages.filter(m => !m.lu && m.destinataire_id === userData.id).length || 0,
          pendingReservations: myReservations?.filter(r => r.statut === 'en_attente').length || 0,
          monthlyGrowth: 5
        });
        console.log('Messages non lus récupérés (dashboard locataire):', allReceivedMessages.filter(m => !m.lu && m.destinataire_id === userData.id));
      }

    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error)
      if (error?.code === '403') {
        setFetchError("Vous n'avez pas les droits pour accéder à ces données. Contactez l'administrateur ou vérifiez vos permissions Supabase.");
        toast({
          title: "Accès interdit",
          description: "Erreur 403 : Vous n'avez pas les droits pour accéder à ces données.",
          variant: "destructive"
        });
      } else {
        setFetchError("Impossible de charger les données du dashboard.");
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du dashboard",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReservationStatus = async (reservationId: number, newStatus: string) => {
    try {
      // Récupérer la réservation pour obtenir l'id de la chambre, la date de fin, et les utilisateurs
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('id, id_chambre, date_fin, id_locataire, chambres(id_maison), statut')
        .eq('id', reservationId)
        .single();
      if (fetchError || !reservation) throw fetchError || new Error('Réservation non trouvée');

      // Mettre à jour le statut de la réservation
      const { error } = await supabase
        .from('reservations')
        .update({ statut: newStatus })
        .eq('id', reservationId)
      if (error) throw error

      // Si on confirme, passer la chambre à occupé
      if (newStatus === 'confirmee') {
        await supabase
          .from('chambres')
          .update({ disponible: false })
          .eq('id', reservation.id_chambre)
        // Envoi email au locataire
        // Récupérer l'email du locataire
        let locataireEmail = null;
        if (reservation.id_locataire) {
          const { data: locataire } = await supabase
            .from('utilisateurs')
            .select('email')
            .eq('id', reservation.id_locataire)
            .single();
          locataireEmail = locataire?.email;
        }
        if (locataireEmail) {
          await fetch('https://oxfagnwsqdzsujakzypy.functions.supabase.co/send-notification-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: locataireEmail,
              subject: "Votre location est confirmée !",
              text: "Félicitations, votre location sur Lokaz est confirmée.",
              html: "<b>Félicitations, votre location sur Lokaz est confirmée.</b>"
            })
          });
        }
      }

      toast({
        title: "Réservation mise à jour",
        description: `Statut changé vers: ${newStatus}`
      })

      fetchDashboardData()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la réservation",
        variant: "destructive"
      })
    }
  }

  const handleEndReservation = async (reservation: any) => {
    try {
      // 1. Mettre à jour le statut de la réservation à 'terminee'
      await supabase
        .from('reservations')
        .update({ statut: 'terminee' })
        .eq('id', reservation.id)
      // 2. Rendre la chambre disponible
      await supabase
        .from('chambres')
        .update({ disponible: true })
        .eq('id', reservation.id_chambre)
      toast({
        title: "Réservation terminée",
        description: "La réservation a été clôturée et la chambre est de nouveau disponible."
      })
      fetchDashboardData()
    } catch (error) {
      console.error('Erreur lors de la clôture de la réservation:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre fin à la réservation",
        variant: "destructive"
      })
    }
  }

  const handleDeleteProperty = async (propertyId: number) => {
    try {
      // 1. Supprimer toutes les chambres associées à la maison
      const { error: chambresError } = await supabase
        .from('chambres')
        .delete()
        .eq('id_maison', propertyId)
      if (chambresError) throw chambresError
      // 2. Supprimer la maison
      const { error: maisonError, data: deletedMaisons } = await supabase
        .from('maisons')
        .delete()
        .eq('id', propertyId)
        .select('id')
      if (maisonError || !deletedMaisons || deletedMaisons.length === 0) {
        throw maisonError || new Error('Aucune propriété supprimée')
      }
      toast({
        title: "Propriété supprimée",
        description: "La propriété a été supprimée avec succès"
      })
      fetchDashboardData()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la propriété",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'en_attente': { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'confirmee': { label: 'Confirmée', className: 'bg-green-100 text-green-800 border-green-200' },
      'annulee': { label: 'Annulée', className: 'bg-red-100 text-red-800 border-red-200' },
      'terminee': { label: 'Terminée', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
    const config = statusConfig[status] || statusConfig['en_attente']
    return <Badge className={config.className} variant="outline">{config.label}</Badge>
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  // Ajout de la fonction pour supprimer une chambre
  const handleDeleteChambre = async (chambreId: number) => {
    try {
      const { error: chambreError, data: deletedChambre } = await supabase
        .from('chambres')
        .delete()
        .eq('id', chambreId)
        .select('id')
      if (chambreError || !deletedChambre || deletedChambre.length === 0) {
        throw chambreError || new Error('Aucune location supprimée')
      }
      toast({
        title: "Location supprimée",
        description: "La location a été supprimée avec succès"
      })
      fetchDashboardData()
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la location",
        variant: "destructive"
      })
    }
  }

  // Synchronise les contacts pour toutes les réservations confirmées (passées, en cours, à venir)
  const syncConfirmedReservationContacts = async () => {
    if (!userData) return;
    let confirmedReservations = [];
    if (userData.type_utilisateur === 'proprietaire') {
      // Récupérer toutes les chambres du propriétaire
      const { data: myMaisons } = await supabase
        .from('maisons')
        .select('id')
        .eq('id_proprietaire', userData.id)
      const maisonIds = (myMaisons || []).map(m => m.id)
      const { data: myChambres } = await supabase
        .from('chambres')
        .select('id')
        .in('id_maison', maisonIds.length > 0 ? maisonIds : [-1])
      const chambreIds = (myChambres || []).map(c => c.id)
      // Récupérer toutes les réservations confirmées pour ces chambres
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, id_locataire, id_chambre')
        .in('id_chambre', chambreIds.length > 0 ? chambreIds : [-1])
        .eq('statut', 'confirmee')
      confirmedReservations = reservations || []
    } else if (userData.type_utilisateur === 'locataire') {
      // Récupérer toutes les réservations confirmées du locataire
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, id_locataire, id_chambre')
        .eq('id_locataire', userData.id)
        .eq('statut', 'confirmee')
      confirmedReservations = reservations || []
    }
    // Pour chaque réservation, ajouter le contact manquant
    for (const res of confirmedReservations) {
      // Récupérer le propriétaire de la chambre
      const { data: chambre } = await supabase
        .from('chambres')
        .select('id_proprietaire')
        .eq('id', res.id_chambre)
        .single()
      const idProprietaire = chambre?.id_proprietaire
      const idLocataire = res.id_locataire
      if (idProprietaire && idLocataire) {
        // Ajout pour le locataire
        await supabase
          .from('contacts')
          .upsert({ user_id: idLocataire, contact_id: idProprietaire }, { onConflict: 'user_id,contact_id' })
        // Ajout pour le proprio
        await supabase
          .from('contacts')
          .upsert({ user_id: idProprietaire, contact_id: idLocataire }, { onConflict: 'user_id,contact_id' })
      }
    }
  }

  useEffect(() => {
    if (reservations.length > 0) {
      syncConfirmedReservationContacts()
    }
  }, [reservations])

  // --- Ajout de l'effet de notification toast lors de la réception d'un nouveau message ---
  useEffect(() => {
    if (!userData) return;
    if (activeTab === 'messages' && messages.length > 0) {
      const grouped = groupMessagesByConversation(messages, userData.id);
      const unread = grouped.reduce((sum, conv) => sum + conv.unreadCount, 0);
      if (unread > lastUnreadCount) {
        toast({
          title: 'Nouveau message',
          description: 'Vous avez reçu un nouveau message.',
          variant: 'default',
        });
      }
      setLastUnreadCount(unread);
    }
  }, [messages, activeTab, userData, lastUnreadCount]);

  // Fonction pour scroll sur mobile
  const handleSectionClick = (section) => {
    if (window.innerWidth < 768) {
      if (section === 'reservations' && reservationsRef.current) reservationsRef.current.scrollIntoView({ behavior: 'smooth' });
      if (section === 'messages' && messagesRef.current) messagesRef.current.scrollIntoView({ behavior: 'smooth' });
      if (section === 'analytics' && analyticsRef.current) analyticsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveTab(section);
  };

  if (!authLoading && !loading && !userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 font-bold text-lg mb-4">Erreur : impossible de charger votre profil utilisateur.</div>
        <div className="text-gray-500">Veuillez réessayer ou contacter le support.</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Navigation />
        <h2 className="text-2xl font-bold text-red-600 mb-2">Erreur Dashboard</h2>
        <p className="text-gray-700 mb-2">{fetchError}</p>
        <p className="text-gray-500">Vérifiez vos droits Supabase ou contactez l'administrateur.</p>
      </div>
    )
  }

  console.log('Dashboard (avant render) :', { userData, loading, fetchError });
  const sortedReservations = [...reservations].sort((a, b) => {
    const statusOrder = {
      'en_attente': 0,
      'confirmee': 1,
      'annulee': 2,
      'terminee': 3
    };
    const aOrder = statusOrder[a.statut] ?? 99;
    const bOrder = statusOrder[b.statut] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // Sinon, trier par date décroissante
    return new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-baloo text-lokaz-black">
              Dashboard {userData.type_utilisateur === 'admin' ? 'Administrateur' : 
                       userData.type_utilisateur === 'proprietaire' ? 'Propriétaire' : 'Locataire'}
            </h1>
            <p className="text-gray-600">
              Bonjour {userData.prenom} {userData.nom}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setProfileModalOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Mon Profil
            </Button>
            
            {userData.type_utilisateur === 'proprietaire' && (
              <Button 
                onClick={() => setPropertyModalOpen(true)}
                className="bg-lokaz-orange hover:bg-lokaz-orange-light flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter une propriété
              </Button>
            )}
          </div>
        </div>

        {userData.type_utilisateur === 'proprietaire' && (!userData.carte_identite || userData.carte_identite === '') && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center font-semibold">
            Veuillez uploader votre carte d'identité pour la vérification de votre identité.<br />
            <span className="text-sm font-normal">Rendez-vous dans votre profil pour faire cela.</span>
          </div>
        )}
        {userData.type_utilisateur === 'proprietaire' && userData.verifie && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 text-center font-semibold">
            Félicitations ! Votre statut a été vérifié. Vous bénéficiez désormais de toutes les fonctionnalités de la plateforme.
          </div>
        )}
        {userData.type_utilisateur === 'proprietaire' && userData.carte_identite && !userData.verifie && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6 text-center font-semibold">
            Votre identité est en cours de vérification
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    {userData.type_utilisateur === 'locataire' ? 'Mes réservations' : 'Réservations'}
                  </p>
                  <p className="text-3xl font-bold text-lokaz-black">{stats?.totalReservations ?? 0}</p>
                </div>
                <div className="p-3 bg-lokaz-orange/10 rounded-full">
                  <Calendar className="h-6 w-6 text-lokaz-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    {userData.type_utilisateur === 'locataire' ? 'Total dépensé' : 
                     userData.type_utilisateur === 'proprietaire' ? 'Revenus confirmés' : 'Revenus'}
                  </p>
                  <p className="text-3xl font-bold text-green-600">{stats?.totalRevenue?.toLocaleString?.() ?? 0}</p>
                  <p className="text-xs text-gray-500">FCFA</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    {userData.type_utilisateur === 'locataire' ? 'Réservations actives' : 'Propriétés actives'}
                  </p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.activeProperties ?? 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Messages non lus</p>
                  <p className="text-3xl font-bold text-purple-600">{stats?.unreadMessages ?? 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">En attente</p>
                  <p className="text-3xl font-bold text-amber-600">{stats?.pendingReservations ?? 0}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Croissance</p>
                  <p className="text-3xl font-bold text-emerald-600">+{stats?.monthlyGrowth ?? 0}%</p>
                  <p className="text-xs text-gray-500">ce mois</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          if (val === 'messages') navigate('/messages');
        }} defaultValue="reservations" className="space-y-6">
          <TabsList className="hidden md:grid w-full grid-cols-3 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Réservations
            </TabsTrigger>
            {userData.type_utilisateur !== 'locataire' && (
              <TabsTrigger value="properties" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                {userData.type_utilisateur === 'admin' ? 'Propriétés' : 'Mes biens'}
              </TabsTrigger>
            )}
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            {userData.type_utilisateur === 'proprietaire' && (
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Mes locations (chambres)
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="reservations" ref={reservationsRef}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-lokaz-orange" />
                  Réservations récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 animate-spin mx-auto text-lokaz-orange mb-2" />
                    <p>Chargement...</p>
                  </div>
                ) : sortedReservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Aucune réservation trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedReservations.slice(0, 10).map((reservation: any) => (
                      <div key={reservation.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                        <div className="flex-1 mb-4 sm:mb-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              Chambre {reservation.chambre?.numero_chambre || '-'}
                            </h3>
                            {getStatusBadge(reservation.statut)}
                          </div>
                          {reservation.chambre?.maison && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                              <Home className="h-4 w-4" />
                              <span>{reservation.chambre.maison.titre}</span>
                              {reservation.chambre.maison.ville && (
                                <span className="ml-2 flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {reservation.chambre.maison.ville}
                                </span>
                              )}
                            </div>
                          )}
                          {reservation.mode_location === 'heure' && (
                            <div className="text-sm text-gray-600 mb-1">
                              <b>Nombre d'heures :</b> {reservation.nombre_heures || '-'}
                            </div>
                          )}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
  <MapPin className="h-4 w-4" />
  {/* Affiche la ville si elle existe, que ce soit via maison ou directement sur la chambre */}
  {reservation.chambre?.maison?.ville || reservation.chambre?.ville ? (
    <span>{reservation.chambre?.maison?.ville || reservation.chambre?.ville}</span>
  ) : null}
  {reservation.chambre?.adresse && (
    <a
      href={reservation.chambre.adresse}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-2 text-lokaz-orange hover:underline"
    >
      Voir sur maps
    </a>
  )}
</div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            Du {new Date(reservation.date_debut).toLocaleDateString()} 
                            au {new Date(reservation.date_fin).toLocaleDateString()}
                          </div>
                          {reservation.utilisateurs && (
                            <p className="text-sm text-gray-600 mt-1">
                              Locataire: {reservation.utilisateurs.prenom} {reservation.utilisateurs.nom}
                            </p>
                          )}
                          {reservation.chambre?.maison && (
                            <p className="text-sm text-gray-600 mt-1">
                              Propriété: {reservation.chambre.maison.titre}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-xl text-lokaz-orange">
                              {reservation.total_a_payer?.toLocaleString()} FCFA
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {reservation.mode_location}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setSelectedReservation(reservation); setReservationDetailOpen(true); }}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détail
                          </Button>
                          {userData?.type_utilisateur === 'proprietaire' && reservation.statut === 'en_attente' && (
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReservationStatus(reservation.id, 'confirmee')}
                                className="w-full sm:w-auto text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirmer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReservationStatus(reservation.id, 'annulee')}
                                className="w-full sm:w-auto text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Refuser
                              </Button>
                            </div>
                          )}
                          {userData?.type_utilisateur === 'locataire' && reservation.statut === 'en_attente' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReservationStatus(reservation.id, 'annulee')}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Annuler
                            </Button>
                          )}
                          {userData?.type_utilisateur === 'proprietaire' && reservation.statut === 'confirmee' && new Date(reservation.date_fin) > new Date() && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEndReservation(reservation)}
                              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mettre fin
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {userData.type_utilisateur !== 'locataire' && (
            <TabsContent value="properties">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-lokaz-orange" />
                      {userData.type_utilisateur === 'admin' ? 'Toutes les propriétés' : 'Mes biens'}
                    </CardTitle>
                    {userData.type_utilisateur === 'proprietaire' && (
                      <Button 
                        onClick={() => setPropertyModalOpen(true)}
                        className="bg-lokaz-orange hover:bg-lokaz-orange-light"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle propriété
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 animate-spin mx-auto text-lokaz-orange mb-2" />
                      <p>Chargement...</p>
                    </div>
                  ) : properties.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Home className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Aucune propriété trouvée</p>
                      {userData.type_utilisateur === 'proprietaire' && (
                        <Button 
                          onClick={() => setPropertyModalOpen(true)}
                          className="mt-4 bg-lokaz-orange hover:bg-lokaz-orange-light"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter votre première propriété
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {properties.map((maison: any) => (
                        <Card key={maison.id} className="hover:shadow-lg transition-shadow group">
                          <CardContent className="p-0">
                            {maison.photos && (
                              <div className="relative h-48 overflow-hidden rounded-t-lg">
                                <img
                                  src={JSON.parse(maison.photos)[0] || '/placeholder.svg'}
                                  alt={maison.titre}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="p-4">
                                  <h3 className="font-bold text-lg text-lokaz-black">
                                {maison.titre}
                                  </h3>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                {maison.adresse && (
                                  <a
                                    href={maison.adresse}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-lokaz-orange hover:underline"
                                  >
                                    <MapPin className="h-4 w-4" />
                                    <span>Voir sur maps</span>
                                  </a>
                                )}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{maison.superficie_m2} m²</span>
                                <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{maison.nb_chambres} ch.</span>
                                <span className="flex items-center gap-1"><Sofa className="h-4 w-4" />{maison.nb_salons} salon</span>
                              </p>
                              <p className="text-sm text-gray-600 mt-2">
                                {maison.description}
                              </p>
                              <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" className="bg-lokaz-orange hover:bg-lokaz-orange-light text-white">
                                  <Eye className="h-4 w-4 mr-1" />
                                  Voir
                                </Button>
                                <Button variant="outline" size="sm" className="bg-lokaz-orange hover:bg-lokaz-orange-light text-white" onClick={() => { setSelectedProperty(maison); setPropertyModalOpen(true); }}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Modifier
                                    </Button>
                                <Button variant="outline" size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDeleteProperty(maison.id)}>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Supprimer
                                    </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="messages" ref={messagesRef}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-lokaz-orange" />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 animate-spin mx-auto text-lokaz-orange mb-2" />
                    <p>Chargement...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Aucune conversation trouvée</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {userData && groupMessagesByConversation(messages, userData.id).map((conversation, idx) => {
                      return (
                        <div key={idx} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => navigate('/messages')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">
                                {conversation.user.prenom} {conversation.user.nom}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {conversation.user.email}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-lokaz-orange text-white">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.contenu}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(conversation.lastMessage.date_envoi).toLocaleString()}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" ref={analyticsRef}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-lokaz-orange" />
                    Statistiques mensuelles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Graphiques des revenus à venir...</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-lokaz-orange" />
                    Tendances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Réservations ce mois</span>
                      <span className="text-green-600 font-bold">+{stats.monthlyGrowth}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Taux d'occupation</span>
                      <span className="text-blue-600 font-bold">78%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium">Satisfaction client</span>
                      <span className="text-purple-600 font-bold">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {userData.type_utilisateur === 'proprietaire' && (
            <TabsContent value="locations">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-lokaz-orange" />
                      Mes locations (chambres)
                    </CardTitle>
                    <Button 
                      onClick={() => setChambreModalOpen(true)}
                      className="bg-lokaz-orange hover:bg-lokaz-orange-light"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle location
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 animate-spin mx-auto text-lokaz-orange mb-2" />
                      <p>Chargement...</p>
                    </div>
                  ) : (!chambres || chambres.length === 0) ? (
                    <div className="text-center py-8 text-gray-500">
                      <Home className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>Aucune location trouvée</p>
                      <Button 
                        onClick={() => setChambreModalOpen(true)}
                        className="mt-4 bg-lokaz-orange hover:bg-lokaz-orange-light"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter votre première location
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {chambres.map((chambre: any) => (
                        <Card key={chambre.id} className="hover:shadow-lg transition-shadow group">
                          <CardContent className="p-0">
                            {chambre.photos && (
                              <div className="relative h-48 overflow-hidden rounded-t-lg">
                                <img
                                  src={JSON.parse(chambre.photos)[0] || '/placeholder.svg'}
                                  alt={`Chambre ${chambre.numero_chambre}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {/* Affiche le prix de vente si applicable */}
                                {(chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') && chambre.prix_vente > 0 ? (
                                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg p-2">
                                    <div className="text-right">
                                      <div className="font-bold text-lg text-lokaz-orange">
                                        {chambre.prix_vente.toLocaleString()} FCFA
                                      </div>
                                      <div className="text-xs text-gray-600">Prix de vente</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg p-2">
                                    <div className="text-right">
                                      <div className="font-bold text-lg text-lokaz-orange">
                                        {chambre.prix.toLocaleString()} FCFA
                                      </div>
                                      <div className="text-xs text-gray-600">/mois</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-lg text-lokaz-black flex items-center gap-2">
                                  {chambre.type_bien === 'chambre' && chambre.numero_chambre
                                    ? `Chambre ${chambre.numero_chambre}${(chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') ? ' à vendre' : ''}`
                                    : chambre.type_bien
                                      ? `${chambre.type_bien.charAt(0).toUpperCase() + chambre.type_bien.slice(1)}${(chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') ? ' à vendre' : ''}`
                                      : (chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') ? 'Bien à vendre' : 'Chambre'}
                                  {(chambre.type_propriete === 'vente' || chambre.type_propriete === 'les_deux') && <Badge className="bg-red-600 text-white">À vendre</Badge>}
                                </h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  {chambre.adresse && (
                                    <a
                                      href={chambre.adresse}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-lokaz-orange hover:underline"
                                    >
                                      <MapPin className="h-4 w-4" />
                                      <span>Voir sur maps</span>
                                    </a>
                                  )}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="icon" variant="ghost" className="bg-lokaz-orange hover:bg-lokaz-orange-light text-white" onClick={() => { setSelectedChambre(chambre); setChambreModalOpen(true); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteChambre(chambre.id)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2 mb-4">
                              <p className="text-sm text-gray-600 flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1"><Ruler className="h-4 w-4" />{chambre.superficie_m2} m²</span>
                                <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{chambre.nb_chambres} ch.</span>
                                <span className="flex items-center gap-1"><Sofa className="h-4 w-4" />{chambre.nb_salons} salon</span>
                              </p>
                              {chambre.garage && (
                                <Badge variant="secondary" className="text-xs">🚗 Garage</Badge>
                              )}
                              {chambre.chap_chap && (
                                <Badge variant="secondary" className="text-xs bg-lokaz-orange/10 text-lokaz-orange">⚡ Chap-Chap</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <EnhancedReservationModal
                isOpen={chambreModalOpen}
                onClose={() => {
                  setChambreModalOpen(false)
                  fetchDashboardData()
                  setSelectedChambre(null)
                }}
                property={selectedChambre}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modals */}
      <PropertyModal
        isOpen={propertyModalOpen}
        onClose={() => {
          setPropertyModalOpen(false)
          setSelectedProperty(null)
        }}
        property={selectedProperty}
        onSuccess={fetchDashboardData}
        onDelete={handleDeleteProperty}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onProfileUpdate={fetchDashboardData}
      />

      {/* Modal de détail de réservation */}
      <Dialog open={reservationDetailOpen} onOpenChange={setReservationDetailOpen}>
        <DialogContent
          className="bg-white p-8 sm:p-12 flex flex-col gap-8 max-h-[90vh] overflow-y-auto max-w-3xl w-full"
          aria-describedby="reservation-detail-description"
        >
          <button
            onClick={() => setReservationDetailOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
            aria-label="Fermer"
          >
            ×
          </button>
          <span id="reservation-detail-description" className="sr-only">
            Détail de la réservation, informations sur le propriétaire et le locataire.
          </span>
          {/* Guard: si selectedReservation est null ou selectedReservation.chambre est null, afficher un message d'erreur user-friendly */}
          {(!selectedReservation || !selectedReservation.chambre) ? (
            <div className="text-center text-red-600 font-bold py-12">
              Impossible d'afficher le détail de la réservation : la chambre liée à cette réservation est introuvable ou a été supprimée.
            </div>
          ) : (
          <>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-7 text-lokaz-orange' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m5 0h-2a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v11a2 2 0 01-2 2z' /></svg>
              Détail de la réservation
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Colonne infos générales */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-4">
                {/* Image chambre avec fallback et gestion Supabase/CDN améliorée */}
                {(() => {
                  let photo = selectedReservation.chambre?.photos;
                  let url = null;
                  const supabaseUrl = "https://xyz.supabase.co/storage/v1/object/public/ton-bucket/"; // Remplace par ton vrai bucket si besoin
                  try {
                    let first = '';
                    if (Array.isArray(photo)) {
                      first = photo[0];
                    } else if (typeof photo === 'string') {
                      if (photo.trim().startsWith('[')) {
                        // JSON.stringify
                        const arr = JSON.parse(photo);
                        first = arr[0];
                      } else {
                        const arr = photo.split(',');
                        first = arr[0] && arr[0].trim() !== '' ? arr[0].trim() : '';
                      }
                    }
                    if (first && first.startsWith('http')) {
                      url = first;
                    } else if (first) {
                      url = supabaseUrl + first;
                    }
                  } catch (e) {
                    console.log('Erreur parsing photo:', e);
                  }
                  if (url) {
                    return <img src={url} alt="Photo chambre" className="w-32 h-32 object-cover rounded-lg border bg-gray-100" />;
                  }
                  // Fallback SVG
                  return (
                    <div className="w-32 h-32 flex items-center justify-center rounded-lg border bg-gray-100">
                      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2zm0 0l7 7 4-4 5 5" />
                      </svg>
                    </div>
                  );
                })()}
                <div>
                  <div className="font-bold text-lg flex items-center gap-2">
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5 text-lokaz-orange' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 17l4 4 4-4m0 0V3m0 18H4a2 2 0 01-2-2V7a2 2 0 012-2h16a2 2 0 012 2v11a2 2 0 01-2 2z' /></svg>
                    Chambre {selectedReservation.chambre?.numero_chambre || <span className="text-gray-400">Non renseigné</span>}
                  </div>
                  <div className="text-gray-500 flex items-center gap-2">
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v4a1 1 0 001 1h3m10 0h3a1 1 0 001-1V7m-1 4V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4m16 0V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4' /></svg>
                    Propriété : {selectedReservation.chambre?.maison?.titre || <span className="text-gray-400">Non renseigné</span>}
                  </div>
                  <div className="text-gray-500 flex items-center gap-2">
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 12.414a8 8 0 111.414-1.414l4.243 4.243a1 1 0 01-1.414 1.414z' /></svg>
                    Ville : {selectedReservation.chambre?.maison?.ville || selectedReservation.chambre?.ville || <span className="text-gray-400">Non renseigné</span>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-semibold">Superficie :</div>
                <div>{selectedReservation.chambre?.superficie_m2 !== undefined && selectedReservation.chambre?.superficie_m2 !== null && selectedReservation.chambre?.superficie_m2 !== '' ? `${selectedReservation.chambre.superficie_m2} m²` : <span className="text-gray-400">Non renseigné</span>}</div>
                <div className="font-semibold">Nombre de chambres :</div>
                <div>{selectedReservation.chambre?.nb_chambres !== undefined && selectedReservation.chambre?.nb_chambres !== null && selectedReservation.chambre?.nb_chambres !== '' ? selectedReservation.chambre.nb_chambres : <span className="text-gray-400">Non renseigné</span>}</div>
                <div className="font-semibold">Nombre de salons :</div>
                <div>{selectedReservation.chambre?.nb_salons !== undefined && selectedReservation.chambre?.nb_salons !== null && selectedReservation.chambre?.nb_salons !== '' ? selectedReservation.chambre.nb_salons : <span className="text-gray-400">Non renseigné</span>}</div>
                <div className="font-semibold">Prix :</div>
                <div>{selectedReservation.chambre?.prix !== undefined && selectedReservation.chambre?.prix !== null && selectedReservation.chambre?.prix !== '' ? `${selectedReservation.chambre.prix} FCFA` : <span className="text-gray-400">Non renseigné</span>}</div>
                <div className="font-semibold">Description :</div>
                <div>{selectedReservation.chambre?.description ? selectedReservation.chambre.description : <span className="text-gray-400">Non renseigné</span>}</div>
                <div className="font-semibold">Adresse :</div>
                <div className="col-span-2 flex items-center">
                  <span className="font-semibold mr-2">Adresse :</span>
                  {selectedReservation.chambre?.adresse ? (
                    <a
                      href={selectedReservation.chambre.adresse}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lokaz-orange hover:underline"
                    >
                      Voir sur maps
                    </a>
                  ) : (
                    <span className="text-gray-400">Non renseigné</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="font-semibold flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z' /></svg>Date de début :</div>
                  <div>{selectedReservation.date_debut ? new Date(selectedReservation.date_debut).toLocaleString() : <span className="text-gray-400">Non renseignée</span>}</div>
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z' /></svg>Date de fin :</div>
                  <div>{selectedReservation.date_fin ? new Date(selectedReservation.date_fin).toLocaleString() : <span className="text-gray-400">Non renseignée</span>}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 items-center">
                <div><span className="font-semibold">Mode de location :</span> {selectedReservation.mode_location || <span className="text-gray-400">Non renseigné</span>}</div>
                <div><span className="font-semibold">Durée :</span> {selectedReservation.duree ? `${selectedReservation.duree} ${selectedReservation.mode_location === 'jour' ? 'jour(s)' : 'heure(s)'}` : <span className="text-gray-400">Non renseignée</span>}</div>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 items-center">
                <div><span className="font-semibold">Montant total :</span> <span className="text-green-700 font-bold">{selectedReservation.total_a_payer !== undefined && selectedReservation.total_a_payer !== null && selectedReservation.total_a_payer !== '' ? `${selectedReservation.total_a_payer} FCFA` : <span className="text-gray-400">Non renseigné</span>}</span></div>
                <div>
                  <span className="font-semibold">Durée :</span> {
                    selectedReservation.nombre_heures !== undefined && selectedReservation.nombre_heures !== null && selectedReservation.nombre_heures !== ''
                      ? `${selectedReservation.nombre_heures} heure(s)`
                      : (selectedReservation.date_debut && selectedReservation.date_fin && selectedReservation.mode_location === 'jour'
                          ? `${Math.ceil((new Date(selectedReservation.date_fin).getTime() - new Date(selectedReservation.date_debut).getTime()) / (1000 * 60 * 60 * 24))} jour(s)`
                          : <span className="text-gray-400">Non renseignée</span>
                        )
                  }
                </div>
                <div>
                  <span className="font-semibold">Statut :</span>
                  <span className={`ml-2 rounded px-2 py-1 text-xs ${
                    selectedReservation.statut === 'en_attente' ? 'bg-orange-100 text-orange-800' :
                    selectedReservation.statut === 'confirmee' ? 'bg-green-100 text-green-800' :
                    selectedReservation.statut === 'annulee' ? 'bg-red-100 text-red-800' :
                    selectedReservation.statut === 'terminee' ? 'bg-gray-200 text-gray-700' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {selectedReservation.statut || <span className="text-gray-400">Non renseigné</span>}
                  </span>
                </div>
              </div>
            </div>
            {/* Colonne contacts */}
            <div className="flex flex-col gap-4 min-w-[220px] w-full md:w-auto">
              {/* Propriétaire */}
              {selectedReservation.chambre?.maison?.proprietaire && (
                <div className="rounded-lg border p-4 bg-gray-50">
                  <div className="font-bold text-orange-600 flex items-center gap-2 mb-1">
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                    Propriétaire
                  </div>
                  <div>{selectedReservation.chambre.maison.proprietaire.prenom} {selectedReservation.chambre.maison.proprietaire.nom}</div>
                  <div className="text-gray-500 flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v4a1 1 0 001 1h3m10 0h3a1 1 0 001-1V7m-1 4V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4m16 0V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4' /></svg>{selectedReservation.chambre.maison.proprietaire.telephone}</div>
                  <div className="flex gap-2 mt-2">
                    <a href={`tel:${selectedReservation.chambre.maison.proprietaire.telephone}`} className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" target="_blank" rel="noopener noreferrer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0-1.243 1.007-2.25 2.25-2.25h2.086c.966 0 1.81.684 2.02 1.63l.379 1.642a2.25 2.25 0 01-.516 2.09l-.7.7a16.001 16.001 0 006.586 6.586l.7-.7a2.25 2.25 0 012.09-.516l1.642.379c.946.21 1.63 1.054 1.63 2.02v2.086c0 1.243-1.007 2.25-2.25 2.25h-.75C9.022 21 3 14.978 3 7.5v-.75z" /></svg>
                      Contacter
                    </a>
                    <a href={`https://wa.me/${selectedReservation.chambre.maison.proprietaire.telephone}`} className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" target="_blank" rel="noopener noreferrer">
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path d='M16.403 12.803c-.278-.139-1.646-.812-1.9-.904-.254-.093-.439-.139-.625.14-.186.278-.719.904-.881 1.09-.163.186-.325.209-.603.07-.278-.14-1.175-.433-2.24-1.38-.828-.738-1.387-1.65-1.55-1.927-.163-.278-.017-.428.123-.567.127-.126.278-.326.417-.488.14-.163.186-.279.278-.465.093-.186.047-.349-.023-.488-.07-.14-.625-1.51-.857-2.07-.226-.545-.456-.471-.625-.48-.163-.007-.349-.009-.535-.009-.186 0-.488.07-.744.326-.256.256-.977.954-.977 2.32 0 1.366.999 2.687 1.137 2.874.14.186 2.01 3.07 4.87 4.183.681.294 1.21.47 1.624.601.682.217 1.303.187 1.793.113.547-.082 1.646-.672 1.88-1.322.233-.65.233-1.207.163-1.322-.07-.116-.256-.186-.534-.325z' /></svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
              {/* Locataire */}
              {selectedReservation.locataire && (
                <div className="rounded-lg border p-4 bg-gray-50">
                  <div className="font-bold text-blue-600 flex items-center gap-2 mb-1">
                    <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                    Locataire
                  </div>
                  <div>{selectedReservation.locataire.prenom} {selectedReservation.locataire.nom}</div>
                  <div className="text-gray-500 flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v4a1 1 0 001 1h3m10 0h3a1 1 0 001-1V7m-1 4V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4m16 0V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4' /></svg>{selectedReservation.locataire.telephone}</div>
                  <div className="flex gap-2 mt-2">
                    <a href={`tel:${selectedReservation.locataire.telephone}`} className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" target="_blank" rel="noopener noreferrer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0-1.243 1.007-2.25 2.25-2.25h2.086c.966 0 1.81.684 2.02 1.63l.379 1.642a2.25 2.25 0 01-.516 2.09l-.7.7a16.001 16.001 0 006.586 6.586l.7-.7a2.25 2.25 0 012.09-.516l1.642.379c.946.21 1.63 1.054 1.63 2.02v2.086c0 1.243-1.007 2.25-2.25 2.25h-.75C9.022 21 3 14.978 3 7.5v-.75z" /></svg>
                      Contacter
                    </a>
                    <a href={`https://wa.me/${selectedReservation.locataire.telephone}`} className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" target="_blank" rel="noopener noreferrer">
                      <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path d='M16.403 12.803c-.278-.139-1.646-.812-1.9-.904-.254-.093-.439-.139-.625.14-.186.278-.719.904-.881 1.09-.163.186-.325.209-.603.07-.278-.14-1.175-.433-2.24-1.38-.828-.738-1.387-1.65-1.55-1.927-.163-.278-.017-.428.123-.567.127-.126.278-.326.417-.488.14-.163.186-.279.278-.465.093-.186.047-.349-.023-.488-.07-.14-.625-1.51-.857-2.07-.226-.545-.456-.471-.625-.48-.163-.007-.349-.009-.535-.009-.186 0-.488.07-.744.326-.256.256-.977.954-.977 2.32 0 1.366.999 2.687 1.137 2.874.14.186 2.01 3.07 4.87 4.183.681.294 1.21.47 1.624.601.682.217 1.303.187 1.793.113.547-.082 1.646-.672 1.88-1.322.233-.65.233-1.207.163-1.322-.07-.116-.256-.186-.534-.325z' /></svg>
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-between px-2 py-1 shadow-lg md:hidden">
        {userData.type_utilisateur === 'locataire' ? (
          <>
            <button
              className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'reservations' ? 'text-lokaz-orange font-bold' : 'text-gray-500'}`}
              onClick={() => handleSectionClick('reservations')}
            >
              <Calendar className="h-6 w-6 mb-1" />
              <span className="text-xs">Réservations</span>
            </button>
            <button
              className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'messages' ? 'text-lokaz-orange font-bold' : 'text-gray-500'}`}
              onClick={() => navigate('/messages')}
            >
              <MessageCircle className="h-6 w-6 mb-1" />
              <span className="text-xs">Messages</span>
            </button>
            <button
              className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'analytics' ? 'text-lokaz-orange font-bold' : 'text-gray-500'}`}
              onClick={() => handleSectionClick('analytics')}
            >
              <BarChart3 className="h-6 w-6 mb-1" />
              <span className="text-xs">Analytics</span>
            </button>
          </>
        ) : (
          <>
            <button
              className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'reservations' ? 'text-lokaz-orange font-bold' : 'text-gray-500'}`}
              onClick={() => handleSectionClick('reservations')}
            >
              <Calendar className="h-6 w-6 mb-1" />
              <span className="text-xs">Réservations</span>
            </button>
            <button
              className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'properties' ? 'text-lokaz-orange font-bold' : 'text-gray-500'}`}
              onClick={() => handleSectionClick('properties')}
            >
              <Home className="h-6 w-6 mb-1" />
              <span className="text-xs">Mes biens</span>
            </button>
            <button
              className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'messages' ? 'text-lokaz-orange font-bold' : 'text-gray-500'}`}
              onClick={() => navigate('/messages')}
            >
              <MessageCircle className="h-6 w-6 mb-1" />
              <span className="text-xs">Messages</span>
            </button>
            <button
              className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'analytics' ? 'text-lokaz-orange font-bold' : 'text-gray-500'}`}
              onClick={() => handleSectionClick('analytics')}
            >
              <BarChart3 className="h-6 w-6 mb-1" />
              <span className="text-xs">Analytics</span>
            </button>
            <button
              className={`flex flex-col items-center flex-1 py-2 ${activeTab === 'locations' ? 'text-lokaz-orange font-bold' : 'text-gray-500'}`}
              onClick={() => handleSectionClick('locations')}
            >
              <Home className="h-6 w-6 mb-1" />
              <span className="text-xs">Mes locations</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard
