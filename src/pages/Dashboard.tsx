import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Sofa,
  Phone,
  Mail,
  Building2
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import PropertyModal from '@/components/PropertyModal'
import PropertyDetailsModal from '@/components/PropertyDetailsModal'
import ProfileModal from '@/components/ProfileModal'
import EnhancedReservationModal from '@/components/booking/EnhancedReservationModal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import TerrainModal from '@/components/TerrainModal'

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
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showTerrainModal, setShowTerrainModal] = useState(false);
  const [selectedTerrain, setSelectedTerrain] = useState(null)
  const [terrains, setTerrains] = useState([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)

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
    console.log('Dashboard - properties:', properties)
    console.log('Dashboard - chambres:', chambres)
    console.log('Dashboard - reservations:', reservations)
    console.log('Dashboard - messages:', messages)
  }, [userData, loading, properties, chambres, reservations, messages])

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

  const fetchDashboardData = useCallback(async () => {
    if (!userData) return;

    setLoading(true);
    setFetchError(null);

    try {
      console.log('Dashboard - Début fetchDashboardData pour user:', userData.id);

      // Fetch des réservations - requête simplifiée
      let reservationsData = [];

      // Récupérer les réservations où l'utilisateur est locataire
      const { data: locataireReservations, error: locataireError } = await supabase
        .from('reservations')
        .select(`
          *,
          chambres!id_chambre (
            *,
            proprietaire:utilisateurs!id_proprietaire (*)
          ),
          utilisateurs!id_locataire (*)
        `)
        .eq('id_locataire', userData.id)
        .order('date_debut', { ascending: false });

      if (locataireError) {
        console.error('Erreur fetch réservations locataire:', locataireError);
      } else {
        console.log('Réservations locataire récupérées:', locataireReservations);
        reservationsData = [...(locataireReservations || [])];
      }

      // Récupérer les réservations où l'utilisateur est propriétaire
      const { data: proprietaireReservations, error: proprietaireError } = await supabase
        .from('reservations')
        .select(`
          *,
          chambres!id_chambre (
            *,
            proprietaire:utilisateurs!id_proprietaire (*)
          ),
          utilisateurs!id_locataire (*)
        `)
        .order('date_debut', { ascending: false });

      if (proprietaireError) {
        console.error('Erreur fetch réservations propriétaire:', proprietaireError);
      } else {
        console.log('Réservations propriétaire récupérées:', proprietaireReservations);
        // Filtrer côté client pour les réservations où l'utilisateur est propriétaire
        const filteredProprietaireReservations = (proprietaireReservations || []).filter(reservation => {
          return reservation.chambres?.id_proprietaire === userData.id;
        });
        reservationsData = [...reservationsData, ...filteredProprietaireReservations];
      }

      // Fetch des propriétés
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('maisons')
        .select('*')
        .eq('id_proprietaire', userData.id)
        .order('date_publication', { ascending: false });

      if (propertiesError) {
        console.error('Erreur fetch propriétés:', propertiesError);
        throw new Error(`Erreur propriétés: ${propertiesError.message}`);
      }

      // Fetch des chambres - requête complète
      let chambresData = [];

      // 1. Récupérer les chambres avec id_proprietaire direct
      const { data: chambresDirectes, error: chambresDirectesError } = await supabase
        .from('chambres')
        .select('*')
        .eq('id_proprietaire', userData.id)
        .order('id', { ascending: false });

      if (chambresDirectesError) {
        console.error('Erreur fetch chambres directes:', chambresDirectesError);
      } else {
        chambresData = [...(chambresDirectes || [])];
      }

      // 2. Récupérer les chambres liées aux maisons du propriétaire
      if (propertiesData && propertiesData.length > 0) {
        const maisonIds = propertiesData.map(m => m.id);
        const { data: chambresViaMaisons, error: chambresViaMaisonsError } = await supabase
          .from('chambres')
          .select('*')
          .in('id_maison', maisonIds)
          .order('id', { ascending: false });

        if (chambresViaMaisonsError) {
          console.error('Erreur fetch chambres via maisons:', chambresViaMaisonsError);
        } else {
          // Éviter les doublons en filtrant par ID
          const chambresUniques = (chambresViaMaisons || []).filter(chambre =>
            !chambresData.some(existing => existing.id === chambre.id)
          );
          chambresData = [...chambresData, ...chambresUniques];
        }
      }

      console.log('Chambres récupérées:', {
        chambresDirectes: chambresDirectes?.length || 0,
        chambresViaMaisons: chambresData.length - (chambresDirectes?.length || 0),
        totalChambres: chambresData.length
      });

      // Diagnostic: Vérifier toutes les chambres disponibles
      const { data: toutesChambres, error: toutesChambresError } = await supabase
        .from('chambres')
        .select('*')
        .order('id', { ascending: false });

      if (!toutesChambresError) {
        console.log('Diagnostic - Toutes les chambres:', {
          totalChambresDisponibles: toutesChambres?.length || 0,
          chambresAvecProprietaire: toutesChambres?.filter(c => c.id_proprietaire === userData.id).length || 0,
          chambresAvecMaison: toutesChambres?.filter(c => c.id_maison).length || 0
        });
      }

      // Fetch des messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`expediteur_id.eq.${userData.id},destinataire_id.eq.${userData.id}`)
        .order('date_envoi', { ascending: false });

      if (messagesError) {
        console.error('Erreur fetch messages:', messagesError);
        throw new Error(`Erreur messages: ${messagesError.message}`);
      }

      // Fetch des terrains
      const { data: terrainsData, error: terrainsError } = await supabase
        .from('terrains')
        .select('*')
        .eq('id_proprietaire', userData.id)
        .order('date_publication', { ascending: false });

      if (terrainsError) {
        console.error('Erreur fetch terrains:', terrainsError);
      }

      setReservations(reservationsData);
      setProperties(propertiesData || []);
      setChambres(chambresData || []);
      setMessages(messagesData || []);
      setTerrains(terrainsData || []);

      // Calculer les statistiques
      const totalReservations = reservationsData.length;
      const totalRevenue = reservationsData
        .filter(r => r.statut === 'confirmee')
        .reduce((sum, r) => sum + (r.total_a_payer || 0), 0);

      // Propriétés actives = maisons disponibles + chambres disponibles + terrains disponibles
      const activeMaisons = (propertiesData || []).filter(p => p.disponible).length;
      const activeChambres = (chambresData || []).filter(c => c.disponible).length;
      const activeTerrains = (terrainsData || []).filter(t => t.statut_vente === 'disponible').length;
      const activeProperties = activeMaisons + activeChambres + activeTerrains;

      const unreadMessages = (messagesData || []).filter(m => !m.lu && m.destinataire_id === userData.id).length;
      const pendingReservations = reservationsData.filter(r => r.statut === 'en_attente').length;
      const monthlyGrowth = 0; // À calculer selon tes besoins

      console.log('Données brutes:', {
        reservationsData: reservationsData.length,
        propertiesData: propertiesData?.length || 0,
        chambresData: chambresData?.length || 0,
        messagesData: messagesData?.length || 0,
        userData: userData.id
      });

      console.log('Calculs détaillés:', {
        totalReservations,
        reservationsConfirmees: reservationsData.filter(r => r.statut === 'confirmee').length,
        totalRevenue,
        activeMaisons,
        activeChambres,
        activeProperties,
        unreadMessages,
        messagesNonLus: (messagesData || []).filter(m => !m.lu && m.destinataire_id === userData.id).length,
        pendingReservations
      });

      setStats({
        totalReservations,
        totalRevenue,
        activeProperties,
        unreadMessages,
        pendingReservations,
        monthlyGrowth
      });

      console.log('Dashboard - Données récupérées avec succès');
      console.log('Stats calculées:', {
        totalReservations,
        totalRevenue,
        activeProperties,
        unreadMessages,
        pendingReservations
      });
    } catch (error) {
      console.error('Erreur fetchDashboardData:', error);
      setFetchError(error.message);
      toast({
        title: 'Erreur de chargement',
        description: `Impossible de charger les données: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userData, toast]);

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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette chambre ?')) {
      try {
        const { error } = await supabase
          .from('chambres')
          .delete()
          .eq('id', chambreId);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Chambre supprimée avec succès",
        });

        fetchDashboardData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression de la chambre",
          variant: "destructive",
        });
      }
    }
  }

  const handleDeleteTerrain = async (terrainId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce terrain ?')) {
      try {
        const { error } = await supabase
          .from('terrains')
          .delete()
          .eq('id', terrainId);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Terrain supprimé avec succès",
        });

        fetchDashboardData();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression du terrain",
          variant: "destructive",
        });
      }
    }
  }

  const handleToggleTerrainStatus = async (terrainId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'disponible' ? 'vendu' : 'disponible';

    try {
      const { error } = await supabase
        .from('terrains')
        .update({ statut_vente: newStatus })
        .eq('id', terrainId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Terrain marqué comme ${newStatus === 'vendu' ? 'vendu' : 'disponible'}`,
      });

      fetchDashboardData();
    } catch (error) {
      console.error('Erreur mise à jour statut terrain:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut du terrain',
        variant: 'destructive',
      });
    }
  };

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

  const handleViewDetails = (property) => {
    setSelectedProperty(property)
    setShowDetailsModal(true)
  }

  const handleEditProperty = (property) => {
    setSelectedProperty(property)
    setPropertyModalOpen(true)
  }

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
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-background">

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold font-baloo text-lokaz-black dark:text-white">
                Dashboard {userData.type_utilisateur === 'admin' ? 'Administrateur' :
                  userData.type_utilisateur === 'proprietaire' ? 'Propriétaire' : 'Locataire'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Bonjour {userData.prenom} {userData.nom}
              </p>
            </div>

            <div className="flex gap-2">
              {userData.type_utilisateur === 'proprietaire' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => setProfileModalOpen(true)}
                    variant="outline"
                    className="w-full sm:w-auto text-lokaz-black dark:text-white border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Mon profil
                  </Button>
                  <Button
                    onClick={() => setPropertyModalOpen(true)}
                    className="bg-lokaz-orange hover:bg-lokaz-orange-light w-full sm:w-auto text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle propriété
                  </Button>
                  <Button
                    onClick={() => setShowTerrainModal(true)}
                    className="bg-lokaz-orange hover:bg-lokaz-orange-light w-full sm:w-auto text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un terrain à vendre
                  </Button>
                </div>
              )}
            </div>
          </div>

          {userData.type_utilisateur === 'proprietaire' && (!userData.carte_identite || userData.carte_identite === '') && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6 text-center font-semibold">
              Veuillez uploader votre carte d'identité pour la vérification de votre identité.<br />
              <span className="text-sm font-normal">Rendez-vous dans votre profil pour faire cela.</span>
            </div>
          )}
          {userData.type_utilisateur === 'proprietaire' && userData.verifie && (
            <div className="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-6 text-center font-semibold">
              Félicitations ! Votre statut a été vérifié. Vous bénéficiez désormais de toutes les fonctionnalités de la plateforme.
            </div>
          )}
          {userData.type_utilisateur === 'proprietaire' && userData.carte_identite && !userData.verifie && (
            <div className="bg-blue-100 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded mb-6 text-center font-semibold">
              Votre identité est en cours de vérification
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow dark:bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {userData.type_utilisateur === 'locataire' ? 'Mes réservations' : 'Réservations'}
                    </p>
                    <p className="text-3xl font-bold text-lokaz-black dark:text-white">{stats?.totalReservations ?? 0}</p>
                  </div>
                  <div className="p-3 bg-lokaz-orange/10 dark:bg-lokaz-orange/20 rounded-full">
                    <Calendar className="h-6 w-6 text-lokaz-orange" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow dark:bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {userData.type_utilisateur === 'locataire' ? 'Total dépensé' :
                        userData.type_utilisateur === 'proprietaire' ? 'Revenus confirmés' : 'Revenus'}
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.totalRevenue?.toLocaleString?.() ?? 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">FCFA</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow dark:bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {userData.type_utilisateur === 'locataire' ? 'Réservations actives' : 'Propriétés actives'}
                    </p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats?.activeProperties ?? 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Home className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow dark:bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Messages non lus</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.unreadMessages ?? 0}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                    <MessageCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow dark:bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">En attente</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats?.pendingReservations ?? 0}</p>
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                    <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow dark:bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Croissance</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">+{stats?.monthlyGrowth ?? 0}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ce mois</p>
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
                    <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
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
            <TabsList className="hidden md:grid w-full grid-cols-3 lg:w-auto lg:grid-cols-4 dark:bg-gray-800">
              <TabsTrigger value="reservations" className="flex items-center gap-2 data-[state=active]:bg-lokaz-orange data-[state=active]:text-white">
                <Calendar className="h-4 w-4" />
                Réservations
              </TabsTrigger>
              {userData.type_utilisateur !== 'locataire' && (
                <TabsTrigger value="properties" className="flex items-center gap-2 data-[state=active]:bg-lokaz-orange data-[state=active]:text-white">
                  <Home className="h-4 w-4" />
                  {userData.type_utilisateur === 'admin' ? 'Propriétés' : 'Mes biens'}
                </TabsTrigger>
              )}
              <TabsTrigger value="messages" className="flex items-center gap-2 data-[state=active]:bg-lokaz-orange data-[state=active]:text-white">
                <MessageCircle className="h-4 w-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-lokaz-orange data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              {userData.type_utilisateur === 'proprietaire' && (
                <TabsTrigger value="locations" className="flex items-center gap-2 data-[state=active]:bg-lokaz-orange data-[state=active]:text-white">
                  <Home className="h-4 w-4" />
                  Mes locations (chambres)
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="reservations" ref={reservationsRef}>
              <Card className="dark:bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Calendar className="h-5 w-5 text-lokaz-orange" />
                    Réservations récentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 animate-spin mx-auto text-lokaz-orange mb-2" />
                      <p className="dark:text-gray-300">Chargement...</p>
                    </div>
                  ) : sortedReservations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p>Aucune réservation trouvée</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedReservations.slice(0, 10).map((reservation: any) => (
                        <div key={reservation.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                          <div className="flex-1 mb-4 sm:mb-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg dark:text-white">
                                Chambre {reservation.chambres?.numero_chambre || '-'}
                              </h3>
                              {getStatusBadge(reservation.statut)}
                            </div>
                            {reservation.chambres?.adresse && (
                              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-1">
                                <Home className="h-4 w-4" />
                                <span>{reservation.chambres.adresse}</span>
                                {reservation.chambres.ville && (
                                  <span className="ml-2 flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {reservation.chambres.ville}
                                  </span>
                                )}
                              </div>
                            )}
                            {reservation.mode_location === 'heure' && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <b>Nombre d'heures :</b> {reservation.nombre_heures || '-'}
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                {/* Affiche la ville si elle existe */}
                                {reservation.chambres?.ville ? (
                                  <span className="truncate">{reservation.chambres.ville}</span>
                                ) : null}
                              </div>
                              {reservation.chambres?.adresse && (
                                <a
                                  href={reservation.chambres.adresse}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-lokaz-orange hover:underline text-xs sm:text-sm"
                                >
                                  Voir sur maps
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Calendar className="h-4 w-4" />
                              Du {new Date(reservation.date_debut).toLocaleDateString()}
                              au {new Date(reservation.date_fin).toLocaleDateString()}
                            </div>
                            {reservation.utilisateurs && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Locataire: {reservation.utilisateurs.prenom} {reservation.utilisateurs.nom}
                              </p>
                            )}

                            {reservation.chambres?.adresse && (
                              <p className="text-sm text-gray-600 mt-1">
                                <a
                                  href={reservation.chambres.adresse}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-lokaz-orange hover:underline"
                                >
                                  Voir la propriété sur maps
                                </a>
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
                              className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950/30"
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
                                  className="w-full sm:w-auto text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-950/30"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirmer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReservationStatus(reservation.id, 'annulee')}
                                  className="w-full sm:w-auto text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-950/30"
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
                                className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-950/30"
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
                                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-400 dark:hover:bg-emerald-950/30"
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2">
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-lokaz-orange" />
                        {userData.type_utilisateur === 'admin' ? 'Toutes les propriétés' : 'Mes biens'}
                      </CardTitle>
                      {userData.type_utilisateur === 'proprietaire' && (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            onClick={() => setPropertyModalOpen(true)}
                            className="bg-lokaz-orange hover:bg-lokaz-orange-light w-full sm:w-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvelle propriété
                          </Button>
                          <Button
                            onClick={() => setShowTerrainModal(true)}
                            className="bg-lokaz-orange hover:bg-lokaz-orange-light w-full sm:w-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un terrain à vendre
                          </Button>
                        </div>
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
                        {/* Afficher les maisons */}
                        {properties && properties.length > 0 && (
                          <div className="col-span-full mb-4">
                            <h3 className="text-lg font-semibold mb-2">Maisons ({properties.length})</h3>
                          </div>
                        )}
                        {properties.map((maison: any) => (
                          <Card key={`maison-${maison.id}`} className="hover:shadow-lg transition-shadow group">
                            <CardContent className="p-0">
                              {maison.photos && (
                                <div className="relative h-48 overflow-hidden rounded-t-lg">
                                  {(() => {
                                    try {
                                      const photos = JSON.parse(maison.photos);
                                      const imageUrl = photos && photos.length > 0 ? photos[0] : null;
                                      return imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={`Maison ${maison.titre}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                              parent.innerHTML = '<div class=\"w-full h-full flex items-center justify-center bg-gray-100\"><p class=\"text-gray-500 text-sm\">Aucune image</p></div>';
                                            }
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                          <p className="text-gray-500 text-sm">Aucune image</p>
                                        </div>
                                      );
                                    } catch (e) {
                                      return (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                          <p className="text-gray-500 text-sm">Aucune image</p>
                                        </div>
                                      );
                                    }
                                  })()}
                                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg p-2">
                                    <div className="text-right">
                                      <div className="font-bold text-lg text-lokaz-orange">
                                        {maison.prix_par_mois?.toLocaleString() || maison.prix_par_jour?.toLocaleString() || maison.prix_par_heure?.toLocaleString()} FCFA
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {maison.type_location === 'mois' ? '/mois' : maison.type_location === 'jour' ? '/jour' : '/heure'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-bold text-lg text-lokaz-black flex items-center gap-2">
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
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                      <Ruler className="h-4 w-4" />
                                      <span>{maison.ville}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                      <Home className="h-4 w-4" />
                                      <span>{maison.type_bien || 'Maison'}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedProperty(maison);
                                        setShowDetailsModal(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditProperty(maison)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteProperty(maison.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {/* Afficher les terrains */}
                        {terrains && terrains.length > 0 && (
                          <div className="col-span-full mb-4 mt-8">
                            <h3 className="text-lg font-semibold mb-2">Terrains à vendre ({terrains.length})</h3>
                          </div>
                        )}
                        {terrains.map((terrain: any) => (
                          <Card key={`terrain-${terrain.id}`} className="hover:shadow-lg transition-shadow group">
                            <CardContent className="p-0">
                              {terrain.photos && (
                                <div className="relative h-48 overflow-hidden rounded-t-lg">
                                  {(() => {
                                    try {
                                      const photos = JSON.parse(terrain.photos);
                                      const imageUrl = photos && photos.length > 0 ? photos[0] : null;
                                      return imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={`Terrain ${terrain.titre}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                              parent.innerHTML = '<div class=\"w-full h-full flex items-center justify-center bg-gray-100\"><p class=\"text-gray-500 text-sm\">Aucune image</p></div>';
                                            }
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                          <p className="text-gray-500 text-sm">Aucune image</p>
                                        </div>
                                      );
                                    } catch (e) {
                                      return (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                          <p className="text-gray-500 text-sm">Aucune image</p>
                                        </div>
                                      );
                                    }
                                  })()}
                                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg p-2">
                                    <div className="text-right">
                                      <div className="font-bold text-lg text-lokaz-orange">
                                        {terrain.prix?.toLocaleString()} FCFA
                                      </div>
                                      <div className="text-xs text-gray-600">Prix de vente</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-bold text-lg text-lokaz-black flex items-center gap-2">
                                      {terrain.titre}
                                      <Badge className="bg-green-600 text-white">{terrain.type_terrain}</Badge>
                                      {terrain.statut_vente === 'vendu' && <Badge className="bg-red-600 text-white">Vendu</Badge>}
                                    </h3>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      {terrain.adresse && (
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(terrain.adresse)}`}
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
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleToggleTerrainStatus(terrain.id, terrain.statut_vente)}
                                      className={terrain.statut_vente === 'vendu' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}
                                    >
                                      {terrain.statut_vente === 'vendu' ? 'Marquer disponible' : 'Marquer vendu'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedTerrain(terrain);
                                        setShowTerrainModal(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteTerrain(terrain.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Ruler className="h-4 w-4" />
                                    <span>{terrain.superficie_m2} m²</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{terrain.ville}</span>
                                  </div>
                                </div>
                                {terrain.quartier && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    <span className="font-medium">Quartier:</span> {terrain.quartier}
                                  </div>
                                )}
                                {terrain.description && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    <p className="line-clamp-2">{terrain.description}</p>
                                  </div>
                                )}
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
                    <div className="h-[300px] w-full">
                      {reservations.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.entries(
                              reservations
                                .filter(r => r.statut === 'confirmee' || r.statut === 'terminee')
                                .reduce((acc: any, curr: any) => {
                                  const month = new Date(curr.date_debut).toLocaleDateString('fr-FR', { month: 'short' });
                                  acc[month] = (acc[month] || 0) + (curr.total_a_payer || 0);
                                  return acc;
                                }, {})
                            ).map(([name, total]) => ({ name, total }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value} FCFA`} />
                            <Legend />
                            <Bar dataKey="total" fill="#f97316" name="Revenus" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-500">
                          <p>Aucune donnée de revenus disponible</p>
                        </div>
                      )}
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
                        {/* Afficher les chambres */}
                        {chambres && chambres.length > 0 && (
                          <div className="col-span-full mb-4 mt-8">
                            <h3 className="text-lg font-semibold mb-2">Chambres ({chambres.length})</h3>
                          </div>
                        )}
                        {chambres.map((chambre: any) => (
                          <Card key={`chambre-${chambre.id}`} className="hover:shadow-lg transition-shadow group">
                            <CardContent className="p-0">
                              {chambre.photos && (
                                <div className="relative h-48 overflow-hidden rounded-t-lg">
                                  {(() => {
                                    try {
                                      const photos = JSON.parse(chambre.photos);
                                      const imageUrl = photos && photos.length > 0 ? photos[0] : null;
                                      return imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={`Chambre ${chambre.numero_chambre}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100"><p class="text-gray-500 text-sm">Aucune image</p></div>';
                                            }
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                          <p className="text-gray-500 text-sm">Aucune image</p>
                                        </div>
                                      );
                                    } catch (e) {
                                      return (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                          <p className="text-gray-500 text-sm">Aucune image</p>
                                        </div>
                                      );
                                    }
                                  })()}
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
                              <div className="p-4">
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
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedChambre(chambre);
                                        setChambreModalOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteChambre(chambre.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Ruler className="h-4 w-4" />
                                    <span>{chambre.superficie_m2} m²</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Bed className="h-4 w-4" />
                                    <span>{chambre.nb_chambres} chambre(s)</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Sofa className="h-4 w-4" />
                                    <span>{chambre.nb_salons} salon(s)</span>
                                  </div>
                                </div>
                                {chambre.quartier && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    <span className="font-medium">Quartier:</span> {chambre.quartier}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {/* Afficher les terrains */}
                        {terrains && terrains.length > 0 && (
                          <div className="col-span-full mb-4 mt-8">
                            <h3 className="text-lg font-semibold mb-2">Terrains à vendre ({terrains.length})</h3>
                          </div>
                        )}
                        {terrains.map((terrain: any) => (
                          <Card key={`terrain-${terrain.id}`} className="hover:shadow-lg transition-shadow group">
                            <CardContent className="p-0">
                              {terrain.photos && (
                                <div className="relative h-48 overflow-hidden rounded-t-lg">
                                  {(() => {
                                    try {
                                      const photos = JSON.parse(terrain.photos);
                                      const imageUrl = photos && photos.length > 0 ? photos[0] : null;
                                      return imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={`Terrain ${terrain.titre}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100"><p class="text-gray-500 text-sm">Aucune image</p></div>';
                                            }
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                          <p className="text-gray-500 text-sm">Aucune image</p>
                                        </div>
                                      );
                                    } catch (e) {
                                      return (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                          <p className="text-gray-500 text-sm">Aucune image</p>
                                        </div>
                                      );
                                    }
                                  })()}
                                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg p-2">
                                    <div className="text-right">
                                      <div className="font-bold text-lg text-lokaz-orange">
                                        {terrain.prix?.toLocaleString()} FCFA
                                      </div>
                                      <div className="text-xs text-gray-600">Prix de vente</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-bold text-lg text-lokaz-black flex items-center gap-2">
                                      {terrain.titre}
                                      <Badge className="bg-green-600 text-white">{terrain.type_terrain}</Badge>
                                      {terrain.statut_vente === 'vendu' && <Badge className="bg-red-600 text-white">Vendu</Badge>}
                                    </h3>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      {terrain.adresse && (
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(terrain.adresse)}`}
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
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleToggleTerrainStatus(terrain.id, terrain.statut_vente)}
                                      className={terrain.statut_vente === 'vendu' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}
                                    >
                                      {terrain.statut_vente === 'vendu' ? 'Marquer disponible' : 'Marquer vendu'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedTerrain(terrain);
                                        setShowTerrainModal(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteTerrain(terrain.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Ruler className="h-4 w-4" />
                                    <span>{terrain.superficie_m2} m²</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{terrain.ville}</span>
                                  </div>
                                </div>
                                {terrain.quartier && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    <span className="font-medium">Quartier:</span> {terrain.quartier}
                                  </div>
                                )}
                                {terrain.description && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    <p className="line-clamp-2">{terrain.description}</p>
                                  </div>
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

        <PropertyDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedProperty(null)
          }}
          chambre={selectedProperty}
        />

        <ProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onProfileUpdate={fetchDashboardData}
        />

        {/* Modal de détail de réservation */}
        <Dialog open={reservationDetailOpen} onOpenChange={setReservationDetailOpen}>
          <DialogContent
            className="bg-white dark:bg-card p-8 sm:p-12 flex flex-col gap-8 max-h-[90vh] overflow-y-auto max-w-3xl w-full border dark:border-border"
            aria-describedby="reservation-detail-description"
          >
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-bold mb-2 flex items-center justify-center gap-2 dark:text-foreground">
                <Building2 className="h-7 w-7 text-lokaz-orange" />
                Détail de la réservation
              </DialogTitle>
            </DialogHeader>

            <button
              onClick={() => setReservationDetailOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold focus:outline-none"
              aria-label="Fermer"
            >
              ×
            </button>

            <span id="reservation-detail-description" className="sr-only">
              Détail de la réservation, informations sur le propriétaire et le locataire.
            </span>

            {/* Contenu de la modale */}
            {(!selectedReservation || !selectedReservation.chambres) ? (
              <div className="text-center text-red-600 font-bold py-12">
                Impossible d'afficher le détail de la réservation : la chambre liée à cette réservation est introuvable ou a été supprimée.
              </div>
            ) : (
              // Contenu existant de la modale
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Colonne infos générales */}
                <div className="flex-1 space-y-4 text-gray-800 dark:text-gray-300">
                  <div className="flex items-center gap-4">
                    {/* Image chambre avec fallback et gestion Supabase/CDN améliorée */}
                    {(() => {
                      let photo = selectedReservation.chambres?.photos;
                      let url = null;
                      const supabaseUrl = "https://oxfagnwsqdzsujakzypy.supabase.co/storage/v1/object/public/proprietes-images/";
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
                        return <img src={url} alt="Photo chambre" className="w-32 h-32 object-cover rounded-lg border bg-gray-100 dark:bg-gray-700" />;
                      }
                      // Fallback SVG
                      return (
                        <div className="w-32 h-32 flex items-center justify-center rounded-lg border bg-gray-100 dark:bg-gray-700">
                          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-300 dark:text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                      );
                    })()}
                    <div>
                      <div className="font-bold text-lg flex items-center gap-2 dark:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-lokaz-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m0 0V3m0 18H4a2 2 0 01-2-2V7a2 2 0 012-2h16a2 2 0 012 2v11a2 2 0 01-2 2z" /></svg>
                        Chambre {selectedReservation.chambres?.numero_chambre || <span className="text-gray-400">Non renseigné</span>}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v4a1 1 0 001 1h3m10 0h3a1 1 0 001-1V7m-1 4V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4' /></svg>
                        {selectedReservation.chambres?.adresse ? (
                          <a
                            href={selectedReservation.chambres.adresse}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lokaz-orange hover:underline"
                          >
                            Voir la propriété sur maps
                          </a>
                        ) : (
                          <span className="text-gray-400">Non renseigné</span>
                        )}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 12.414a8 8 0 111.414-1.414l4.243 4.243a1 1 0 01-1.414 1.414z' /></svg>
                        Ville : {selectedReservation.chambres?.ville || <span className="text-gray-400">Non renseigné</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-semibold dark:text-gray-200">Superficie :</div>
                    <div>{selectedReservation.chambres?.superficie_m2 !== undefined && selectedReservation.chambres?.superficie_m2 !== null && selectedReservation.chambres?.superficie_m2 !== '' ? `${selectedReservation.chambres.superficie_m2} m²` : <span className="text-gray-400">Non renseigné</span>}</div>
                    <div className="font-semibold dark:text-gray-200">Nombre de chambres :</div>
                    <div>{selectedReservation.chambres?.nb_chambres !== undefined && selectedReservation.chambres?.nb_chambres !== null && selectedReservation.chambres?.nb_chambres !== '' ? selectedReservation.chambres.nb_chambres : <span className="text-gray-400">Non renseigné</span>}</div>
                    <div className="font-semibold dark:text-gray-200">Nombre de salons :</div>
                    <div>{selectedReservation.chambres?.nb_salons !== undefined && selectedReservation.chambres?.nb_salons !== null && selectedReservation.chambres?.nb_salons !== '' ? selectedReservation.chambres.nb_salons : <span className="text-gray-400">Non renseigné</span>}</div>
                    <div className="font-semibold dark:text-gray-200">Prix :</div>
                    <div>{selectedReservation.chambres?.prix !== undefined && selectedReservation.chambres?.prix !== null && selectedReservation.chambres?.prix !== '' ? `${selectedReservation.chambres.prix} FCFA` : <span className="text-gray-400">Non renseigné</span>}</div>
                    <div className="font-semibold dark:text-gray-200">Description :</div>
                    <div>{selectedReservation.chambres?.description ? selectedReservation.chambres.description : <span className="text-gray-400">Non renseigné</span>}</div>
                    <div className="font-semibold dark:text-gray-200">Adresse :</div>
                    <div className="col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                      <span className="font-semibold dark:text-gray-200">Adresse :</span>
                      {selectedReservation.chambres?.adresse ? (
                        <a
                          href={selectedReservation.chambres.adresse}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lokaz-orange hover:underline break-all text-sm"
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
                      <div className="font-semibold flex items-center gap-1 dark:text-gray-200"><svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z' /></svg>Date de début :</div>
                      <div>{selectedReservation.date_debut ? new Date(selectedReservation.date_debut).toLocaleString() : <span className="text-gray-400">Non renseignée</span>}</div>
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-1 dark:text-gray-200"><svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z' /></svg>Date de fin :</div>
                      <div>{selectedReservation.date_fin ? new Date(selectedReservation.date_fin).toLocaleString() : <span className="text-gray-400">Non renseignée</span>}</div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                    <div><span className="font-semibold dark:text-gray-200">Mode de location :</span> {selectedReservation.mode_location || <span className="text-gray-400">Non renseigné</span>}</div>
                    <div><span className="font-semibold dark:text-gray-200">Durée :</span> {selectedReservation.duree ? `${selectedReservation.duree} ${selectedReservation.mode_location === 'jour' ? 'jour(s)' : 'heure(s)'}` : <span className="text-gray-400">Non renseignée</span>}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2">
                    <div><span className="font-semibold dark:text-gray-200">Montant total :</span> <span className="text-green-700 dark:text-green-400 font-bold">{selectedReservation.total_a_payer !== undefined && selectedReservation.total_a_payer !== null && selectedReservation.total_a_payer !== '' ? `${selectedReservation.total_a_payer} FCFA` : <span className="text-gray-400">Non renseigné</span>}</span></div>
                    <div>
                      <span className="font-semibold dark:text-gray-200">Durée :</span> {
                        selectedReservation.nombre_heures !== undefined && selectedReservation.nombre_heures !== null && selectedReservation.nombre_heures !== ''
                          ? `${selectedReservation.nombre_heures} heure(s)`
                          : (selectedReservation.date_debut && selectedReservation.date_fin && selectedReservation.mode_location === 'jour'
                            ? `${Math.ceil((new Date(selectedReservation.date_fin).getTime() - new Date(selectedReservation.date_debut).getTime()) / (1000 * 60 * 60 * 24))} jour(s)`
                            : <span className="text-gray-400">Non renseignée</span>
                          )
                      }
                    </div>
                    <div>
                      <span className="font-semibold dark:text-gray-200">Statut :</span>
                      <span className={`ml-2 rounded px-2 py-1 text-xs ${selectedReservation.statut === 'en_attente' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                        selectedReservation.statut === 'confirmee' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          selectedReservation.statut === 'annulee' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                            selectedReservation.statut === 'terminee' ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                              'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}>
                        {selectedReservation.statut || <span className="text-gray-400">Non renseigné</span>}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Colonne contacts */}
                <div className="flex flex-col gap-4 min-w-[220px] w-full md:w-auto">
                  {/* Propriétaire */}
                  {selectedReservation.chambres?.proprietaire && (
                    <div className="rounded-lg border p-4 bg-gray-50 dark:bg-muted/50 dark:border-border">
                      <div className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2 mb-1">
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                        Propriétaire
                      </div>
                      <div className="dark:text-gray-200">{selectedReservation.chambres.proprietaire.prenom} {selectedReservation.chambres.proprietaire.nom}</div>
                      <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v4a1 1 0 001 1h3m10 0h3a1 1 0 001-1V7m-1 4V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4' /></svg>{selectedReservation.chambres.proprietaire.telephone}</div>
                      <div className="flex gap-2 mt-2">
                        <a href={`tel:${selectedReservation.chambres.proprietaire.telephone}`} className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" target="_blank" rel="noopener noreferrer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0-1.243 1.007-2.25 2.25-2.25h2.086c.966 0 1.81.684 2.02 1.63l.379 1.642a2.25 2.25 0 01-.516 2.09l-.7.7a16.001 16.001 0 006.586 6.586l.7-.7a2.25 2.25 0 012.09-.516l1.642.379c.946.21 1.63 1.054 1.63 2.02v2.086c0 1.243-1.007 2.25-2.25 2.25h-.75C9.022 21 3 14.978 3 7.5v-.75z" /></svg>
                          Contacter
                        </a>
                        <a href={`https://wa.me/${selectedReservation.chambres.proprietaire.telephone}`} className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                  {/* Locataire */}
                  {selectedReservation.utilisateurs && (
                    <div className="rounded-lg border p-4 bg-gray-50 dark:bg-muted/50 dark:border-border">
                      <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-1">
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z' /></svg>
                        Locataire
                      </div>
                      <div className="dark:text-gray-200">{selectedReservation.utilisateurs.prenom} {selectedReservation.utilisateurs.nom}</div>
                      <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 7v4a1 1 0 001 1h3m10 0h3a1 1 0 001-1V7m-1 4V7a2 2 0 00-2-2H5a2 2 0 00-2 2v4' /></svg>{selectedReservation.utilisateurs.telephone}</div>
                      <div className="flex gap-2 mt-2">
                        <a href={`tel:${selectedReservation.utilisateurs.telephone}`} className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" target="_blank" rel="noopener noreferrer">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 6.75c0-1.243 1.007-2.25 2.25-2.25h2.086c.966 0 1.81.684 2.02 1.63l.379 1.642a2.25 2.25 0 01-.516 2.09l-.7.7a16.001 16.001 0 006.586 6.586l.7-.7a2.25 2.25 0 012.09-.516l1.642.379c.946.21 1.63 1.054 1.63 2.02v2.086c0 1.243-1.007 2.25-2.25 2.25h-.75C9.022 21 3 14.978 3 7.5v-.75z" /></svg>
                          Contacter
                        </a>
                        <a href={`https://wa.me/${selectedReservation.utilisateurs.telephone}`} className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600" target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md dark:bg-gray-900/95 border-t border-gray-200 dark:border-white/10 flex justify-between px-2 py-2 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_15px_rgba(0,0,0,0.3)] pb-safe md:hidden transition-all duration-300">
          {userData.type_utilisateur === 'locataire' ? (
            <>
              <button
                className={`flex flex-col items-center flex-1 py-1 rounded-lg transition-all duration-200 ${activeTab === 'reservations' ? 'text-lokaz-orange font-bold -translate-y-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => handleSectionClick('reservations')}
              >
                <div className={`p-1 rounded-full ${activeTab === 'reservations' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <Calendar className="h-5 w-5 mb-0.5" />
                </div>
                <span className="text-[10px]">Réservations</span>
              </button>
              <button
                className={`flex flex-col items-center flex-1 py-1 rounded-lg transition-all duration-200 ${activeTab === 'messages' ? 'text-lokaz-orange font-bold -translate-y-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => navigate('/messages')}
              >
                <div className={`p-1 rounded-full ${activeTab === 'messages' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <MessageCircle className="h-5 w-5 mb-0.5" />
                </div>
                <span className="text-[10px]">Messages</span>
              </button>
              <button
                className={`flex flex-col items-center flex-1 py-1 rounded-lg transition-all duration-200 ${activeTab === 'analytics' ? 'text-lokaz-orange font-bold -translate-y-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => handleSectionClick('analytics')}
              >
                <div className={`p-1 rounded-full ${activeTab === 'analytics' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <BarChart3 className="h-5 w-5 mb-0.5" />
                </div>
                <span className="text-[10px]">Analytics</span>
              </button>
            </>
          ) : (
            <>
              <button
                className={`flex flex-col items-center flex-1 py-1 rounded-lg transition-all duration-200 ${activeTab === 'reservations' ? 'text-lokaz-orange font-bold -translate-y-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => handleSectionClick('reservations')}
              >
                <div className={`p-1 rounded-full ${activeTab === 'reservations' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <Calendar className="h-5 w-5 mb-0.5" />
                </div>
                <span className="text-[10px]">Réservations</span>
              </button>
              <button
                className={`flex flex-col items-center flex-1 py-1 rounded-lg transition-all duration-200 ${activeTab === 'properties' ? 'text-lokaz-orange font-bold -translate-y-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => handleSectionClick('properties')}
              >
                <div className={`p-1 rounded-full ${activeTab === 'properties' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <Home className="h-5 w-5 mb-0.5" />
                </div>
                <span className="text-[10px]">Mes biens</span>
              </button>
              <button
                className={`flex flex-col items-center flex-1 py-1 rounded-lg transition-all duration-200 ${activeTab === 'messages' ? 'text-lokaz-orange font-bold -translate-y-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => navigate('/messages')}
              >
                <div className={`p-1 rounded-full ${activeTab === 'messages' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <MessageCircle className="h-5 w-5 mb-0.5" />
                </div>
                <span className="text-[10px]">Messages</span>
              </button>
              <button
                className={`flex flex-col items-center flex-1 py-1 rounded-lg transition-all duration-200 ${activeTab === 'analytics' ? 'text-lokaz-orange font-bold -translate-y-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => handleSectionClick('analytics')}
              >
                <div className={`p-1 rounded-full ${activeTab === 'analytics' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <BarChart3 className="h-5 w-5 mb-0.5" />
                </div>
                <span className="text-[10px]">Analytics</span>
              </button>
              <button
                className={`flex flex-col items-center flex-1 py-1 rounded-lg transition-all duration-200 ${activeTab === 'locations' ? 'text-lokaz-orange font-bold -translate-y-1' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                onClick={() => handleSectionClick('locations')}
              >
                <div className={`p-1 rounded-full ${activeTab === 'locations' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <Home className="h-5 w-5 mb-0.5" />
                </div>
                <span className="text-[10px]">Mes locations</span>
              </button>
            </>
          )}
        </div>

        {/* TerrainModal */}
        {showTerrainModal && (
          <TerrainModal
            isOpen={showTerrainModal}
            onClose={() => {
              setShowTerrainModal(false);
              setSelectedTerrain(null);
              fetchDashboardData(); // Rafraîchir les données
            }}
            terrain={selectedTerrain}
          />
        )}
      </div>
    </>
  )
}

export default Dashboard
