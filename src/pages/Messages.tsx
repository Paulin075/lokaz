import React, { useState, useEffect, useRef } from 'react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Send, MessageCircle, User, User as UserIcon, RefreshCw, Calendar, Home, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Messages = () => {
  const { userData } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [contacts, setContacts] = useState([])
  const inputRef = useRef(null)

  // Charger les contacts globaux pour sélection automatique
  useEffect(() => {
    const fetchContacts = async () => {
      if (!userData) return
      const { data, error } = await supabase
        .from('contacts')
        .select('contact_id, utilisateurs:contact_id(nom, prenom, email, telephone)')
        .eq('user_id', userData.id)
      if (!error) setContacts(data || [])
    }
    fetchContacts()
  }, [userData])

  // Sélection automatique du premier contact si aucun n'est sélectionné
  useEffect(() => {
    if (
      contacts.length > 0 &&
      (!selectedConversation || !selectedConversation.user || !selectedConversation.user.id)
    ) {
      // Cherche la conversation correspondante si elle existe
      const conv = conversations.find(c => c.user.id === contacts[0].contact_id)
      if (conv) {
        selectConversation(conv)
      } else {
        // Si pas de conversation existante, sélectionne le contact pour démarrer une nouvelle
        setSelectedConversation({ user: contacts[0].utilisateurs, messages: [] })
        setMessages([])
      }
    }
  }, [contacts, conversations])

  useEffect(() => {
    if (userData) {
      fetchConversations()
      // Rafraîchir toutes les 10 secondes
      const interval = setInterval(fetchConversations, 10000)
      return () => clearInterval(interval)
    }
  }, [userData])

  const fetchConversations = async () => {
    try {
      setRefreshing(true)
      console.log('🔄 Récupération des conversations pour utilisateur:', userData.id)
      
      // Requête simplifiée pour éviter les erreurs 403
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('*')
        .eq('expediteur_id', userData.id)
        .order('date_envoi', { ascending: false })

      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('*')
        .eq('destinataire_id', userData.id)
        .order('date_envoi', { ascending: false })

      console.log('📨 Messages envoyés:', sentMessages?.length || 0, sentError)
      console.log('📬 Messages reçus:', receivedMessages?.length || 0, receivedError)

      if (sentError || receivedError) {
        console.error('❌ Error fetching messages:', sentError || receivedError)
        setConversations([])
        return []
      }

      // Combiner les messages envoyés et reçus
      const allMessages = [...(sentMessages || []), ...(receivedMessages || [])]
        .sort((a, b) => new Date(b.date_envoi).getTime() - new Date(a.date_envoi).getTime())

      console.log('📋 Total messages:', allMessages.length)

      // Récupérer les informations des utilisateurs séparément
      let userIds = new Set()
      allMessages.forEach(message => {
        userIds.add(message.expediteur_id)
        userIds.add(message.destinataire_id)
      })
      const userIdsArray = Array.from(userIds).filter(Boolean) // retire null/undefined/0
      console.log('👥 IDs utilisateurs uniques:', userIdsArray)
      let usersData = []
      if (userIdsArray.length > 0) {
        const { data } = await supabase
          .from('utilisateurs')
          .select('id, nom, prenom, email')
          .in('id', userIdsArray)
        usersData = data || []
      }
      console.log('👤 Données utilisateurs récupérées:', usersData?.length || 0)

      const usersMap = new Map()
      usersData?.forEach(user => {
        usersMap.set(user.id, user)
      })

      // Grouper les messages par conversation
      const conversationMap = new Map()
      
      allMessages.forEach(message => {
        const expediteur = usersMap.get(message.expediteur_id)
        const destinataire = usersMap.get(message.destinataire_id)
        const otherUser = message.expediteur_id === userData.id ? destinataire : expediteur
        
        if (!otherUser) {
          console.warn('⚠️ Utilisateur non trouvé pour message:', message)
          return // Ignorer les messages avec utilisateurs invalides
        }
        
        const conversationKey = otherUser.id
        
        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            user: otherUser,
            lastMessage: message,
            unreadCount: 0,
            messages: []
          })
        }
        
        const conversation = conversationMap.get(conversationKey)
        conversation.messages.push(message)
        
        // Compter les messages non lus
        if (!message.lu && message.destinataire_id === userData.id) {
          conversation.unreadCount++
        }
      })

      const conversationsArray = Array.from(conversationMap.values())
      console.log('💬 Conversations créées:', conversationsArray.length)
      setConversations(conversationsArray)
      
      // Mettre à jour les messages de la conversation sélectionnée
      if (selectedConversation) {
        const updatedConversation = conversationsArray
          .find(conv => conv.user.id === selectedConversation.user.id)
        if (updatedConversation) {
          console.log('🔄 Mise à jour conversation sélectionnée:', updatedConversation.messages.length, 'messages')
          setMessages(updatedConversation.messages.slice().reverse())
        }
      }
      return conversationsArray
    } catch (error) {
      console.error('❌ Erreur lors du chargement des conversations:', error)
      setConversations([])
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive"
      })
      return []
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const selectConversation = async (conversation) => {
    console.log('userData.id (utilisateur connecté):', userData?.id)
    console.log('Messages de la conversation sélectionnée:', conversation.messages)
    setSelectedConversation(conversation)
    setMessages(conversation.messages.slice().reverse())
    
    // Marquer les messages comme lus
    const unreadMessages = conversation.messages.filter(
      m => !m.lu && (m.destinataire_id === userData.id || m.destinataire_uuid === userData.uuid)
    )
    
    if (unreadMessages.length > 0) {
      try {
        const { data: updateData, error: updateError } = await supabase
          .from('messages')
          .update({ lu: true })
          .in('id', unreadMessages.map(m => m.id))
        console.log('Résultat update Supabase (marquage lu):', { updateData, updateError })
        // Rafraîchir les conversations et mettre à jour la sélection avec la version à jour
        const updatedConvs = await fetchConversations()
        const updatedConv = updatedConvs.find(c => c.user.id === conversation.user.id)
        if (updatedConv) {
          setSelectedConversation(updatedConv)
          setMessages(updatedConv.messages.slice().reverse())
        }
      } catch (error) {
        console.error('Erreur lors du marquage des messages comme lus:', error)
      }
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    // Correction : vérifier que le destinataire existe et a un id valide
    if (!selectedConversation.user || !selectedConversation.user.id) {
      toast({
        title: "Erreur",
        description: "Aucun destinataire sélectionné.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSending(true)
      const messageContent = newMessage.trim()
      console.log('🚀 Envoi de message:', {
        expediteur_id: userData.id,
        destinataire_id: selectedConversation.user.id,
        contenu: messageContent
      })
      setNewMessage('')

      // Créer un message temporaire pour l'affichage immédiat
      const tempMessage = {
        id: `temp-${Date.now()}`,
        expediteur_id: userData.id,
        destinataire_id: selectedConversation.user.id,
        contenu: messageContent,
        date_envoi: new Date().toISOString(),
        lu: false
      }

      // Ajouter le message temporaire à l'affichage
      setMessages(prev => [...prev, tempMessage])

      // Envoyer le message à la base de données
      const { data: newMessageData, error } = await supabase
        .from('messages')
        .insert({
          expediteur_id: userData.id,
          destinataire_id: selectedConversation.user.id,
          contenu: messageContent,
          lu: false
        })
        .select()
        .single()

      console.log('📤 Réponse Supabase:', { data: newMessageData, error })

      if (error) {
        console.error('❌ Erreur Supabase:', error)
        throw error
      }

      console.log('✅ Message envoyé avec succès:', newMessageData)

      // Remplacer le message temporaire par le vrai message
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? newMessageData : msg
      ))

      // Rafraîchir les conversations pour mettre à jour la liste
      await fetchConversations()

      // Marquer tous les messages non lus de la conversation comme lus après envoi d'un message
      const unreadMessages = messages.filter(
        m => !m.lu && (m.destinataire_id === userData.id || m.destinataire_uuid === userData.uuid)
      );
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ lu: true })
          .in('id', unreadMessages.map(m => m.id));
      }

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès"
      })
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      })
      // Remettre le message dans le champ si erreur
      setNewMessage(newMessage)
    } finally {
      setSending(false)
    }
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
            <p className="text-gray-600">Vous devez être connecté pour accéder à la messagerie.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-baloo text-lokaz-black">
              Messagerie
            </h1>
            <p className="text-gray-600">
              Communiquez avec les propriétaires et locataires
            </p>
          </div>
          <Button
            onClick={fetchConversations}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Layout : sidebar toujours visible à gauche, même sur mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 h-[600px]">
          {/* Sidebar contacts */}
          <div className="col-span-1">
            <ContactsSidebar
              conversations={conversations}
              setSelectedConversation={setSelectedConversation}
              setMessages={setMessages}
              fetchConversations={fetchConversations}
              contacts={contacts}
            />
          </div>
          {/* Messagerie */}
          <div className="col-span-3 pb-20 md:pb-0">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lokaz-orange rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3>{selectedConversation.user.prenom} {selectedConversation.user.nom}</h3>
                      <p className="text-sm text-gray-500 font-normal">
                        {selectedConversation.user.email}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.expediteur_id === userData.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.expediteur_id === userData.id
                              ? 'bg-lokaz-orange text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.contenu}</p>
                          <p className={`text-xs mt-1 ${
                            message.expediteur_id === userData.id ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {new Date(message.date_envoi).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Zone de saisie */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Textarea
                        ref={inputRef}
                        placeholder="Tapez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 min-h-[60px] resize-none"
                        disabled={sending || !selectedConversation || !selectedConversation.user || !selectedConversation.user.id}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        onFocus={() => {
                          setTimeout(() => {
                            inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }, 200)
                        }}
                      />
                      <Button
                        onClick={sendMessage}
                        className="bg-lokaz-orange hover:bg-lokaz-orange-light"
                        disabled={!newMessage.trim() || sending || !selectedConversation || !selectedConversation.user || !selectedConversation.user.id}
                      >
                        <Send className={`h-4 w-4 ${sending ? 'animate-pulse' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
                  <p>Choisissez une conversation dans la liste pour commencer à discuter</p>
                </div>
              </CardContent>
            )}
          </div>
        </div>
      </div>
      {/* Barre de navigation mobile en bas (version locataire, minimaliste) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex justify-between px-2 py-1 shadow-lg md:hidden">
        <button
          className={`flex flex-col items-center flex-1 py-2 ${location.pathname === '/dashboard' ? 'text-lokaz-orange font-bold' : 'text-gray-500'}`}
          onClick={() => navigate('/dashboard')}
        >
          <Calendar className="h-6 w-6 mb-1" />
          <span className="text-xs">Réservations</span>
        </button>
        <button
          className={`flex flex-col items-center flex-1 py-2 ${location.pathname === '/messages' ? 'text-lokaz-orange font-bold' : 'text-gray-500'}`}
          onClick={() => navigate('/messages')}
          disabled={location.pathname === '/messages'}
        >
          <MessageCircle className="h-6 w-6 mb-1" />
          <span className="text-xs">Messages</span>
        </button>
        <button
          className="flex flex-col items-center flex-1 py-2 text-gray-300 cursor-not-allowed"
          disabled
        >
          <BarChart3 className="h-6 w-6 mb-1" />
          <span className="text-xs">Analytics</span>
        </button>
      </div>
    </div>
  )
}

// --- Début du composant ContactsSidebar ---
function ContactsSidebar({ conversations, setSelectedConversation, setMessages, fetchConversations, contacts }) {
  const { userData } = useAuth()
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Contacts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Section Contacts */}
        <div className="border-b pb-2">
          <h4 className="text-sm font-semibold px-4 pt-2 pb-1 text-gray-700">Nouveau message</h4>
          {contacts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Aucun contact</div>
          ) : (
            <div className="divide-y">
              {contacts.map((c) => (
                <div key={c.contact_id} className="p-4 flex items-center justify-between">
                  <span>{c.utilisateurs.prenom} {c.utilisateurs.nom}</span>
                  <Button
                    size="sm"
                    className="bg-lokaz-orange hover:bg-lokaz-orange-light text-white"
                    onClick={() => {
                      const existingConv = conversations.find(conv => conv.user.id === c.contact_id)
                      if (existingConv) {
                        setSelectedConversation(existingConv)
                        setMessages(existingConv.messages.slice().reverse())
                      } else {
                        setSelectedConversation({ user: { ...c.utilisateurs, id: c.contact_id }, messages: [] })
                        setMessages([])
                      }
                    }}
                  >
                    Discuter
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Section Conversations */}
        <div className="pt-2">
          <h4 className="text-sm font-semibold px-4 pb-1 text-gray-700">Conversations</h4>
          {conversations.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Aucune conversation</div>
          ) : (
            <div className="divide-y">
              {conversations.map((conversation, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedConversation(conversation)
                    setMessages(conversation.messages.slice().reverse())
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    conversation.user.id === userData.id ? 'bg-lokaz-orange/10' : ''
                  }`}
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
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
// --- Fin du composant ContactsSidebar ---

export default Messages
