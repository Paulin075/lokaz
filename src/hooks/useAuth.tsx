import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Utilisateur } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  userData: Utilisateur | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userType: 'proprietaire' | 'locataire') => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<Utilisateur | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)
  const userDataFetched = useRef(false)

  // Fonction pour récupérer les données utilisateur
const fetchUserData = async (userId: string) => {
    try {
      console.log("fetchUserData appelé avec userId:", userId);
      console.log('user.id utilisé pour fetch:', userId);

      const url = `https://oxfagnwsqdzsujakzypy.supabase.co/rest/v1/utilisateurs?select=*&uuid=eq.${userId}`;
      const res = await fetch(url, {
        headers: {
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZmFnbndzcWR6c3VqYWt6eXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMjE3ODIsImV4cCI6MjA2NTU5Nzc4Mn0.2j01wz6ySK4p9MDlO8OhoN89OPc-p1tlVBWzKdkF7Z8",
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZmFnbndzcWR6c3VqYWt6eXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMjE3ODIsImV4cCI6MjA2NTU5Nzc4Mn0.2j01wz6ySK4p9MDlO8OhoN89OPc-p1tlVBWzKdkF7Z8"
        }
      });
      const json = await res.json();
      console.log("FETCH MANUEL utilisateurs:", json);

      // Retourne le premier utilisateur trouvé ou null
      return Array.isArray(json) && json.length > 0 ? json[0] : null;
    } catch (e) {
      console.error("Erreur fetch manuel:", e);
      return null;
    }
  };
  console.log('user.id utilisé pour fetch:', user?.id);
  
  useEffect(() => {
    console.log("useEffect [auth] déclenché, initialized:", initialized.current);
    if (initialized.current) return
    initialized.current = true

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        // Récupère la session actuelle au démarrage
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error)
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('Session trouvée pour user:', session.user.email)
          setUser(session.user)
          
          // Récupérer les données utilisateur seulement si pas déjà fait
          if (!userDataFetched.current) {
            const userData = await fetchUserData(session.user.id);
            console.log('Résultat fetch userData:', userData);
            setUserData(userData)
            userDataFetched.current = true
          }
        } else {
          console.log('Aucune session trouvée')
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Écoute les changements d'auth (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      if (session?.user) {
        setUser(session.user)
        // Récupérer les données utilisateur seulement si pas déjà fait
        if (!userDataFetched.current) {
          const userData = await fetchUserData(session.user.id);
          console.log('Résultat fetch userData:', userData);
          setUserData(userData)
          userDataFetched.current = true
        }
      } else {
        setUser(null)
        setUserData(null)
        userDataFetched.current = false
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentative de connexion pour:', email)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        console.error('Erreur de connexion:', error)
        throw error
      }
      
      console.log('Connexion réussie:', data)
      
      // Réinitialiser le flag pour forcer la récupération des données
      userDataFetched.current = false
      
    } catch (error) {
      console.error('Erreur de connexion:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, userType: 'proprietaire' | 'locataire') => {
    try {
      console.log('Tentative d\'inscription pour:', email, 'type:', userType)
      
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password 
      })
      
      if (authError) {
        console.error('Erreur Auth lors de l\'inscription:', authError)
        throw authError
      }

      console.log('Inscription Auth réussie:', authData)

      // Insérer les données utilisateur de base seulement si l'inscription Auth a réussi
      if (authData.user) {
        const { error: dbError } = await supabase
          .from('utilisateurs')
          .insert([
            {
              email: email,
              type_utilisateur: userType,
              uuid: authData.user.id
            }
          ])

        if (dbError) {
          console.error('Erreur lors de l\'insertion utilisateur:', dbError)
          // Ne pas throw l'erreur, l'inscription Auth a réussi
          // L'utilisateur pourra compléter son profil plus tard
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      console.log('Tentative de déconnexion...')
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Erreur lors de la déconnexion:', error)
        throw error
      }
      
      // Forcer la déconnexion même si la session persiste
      setUser(null)
      setUserData(null)
      userDataFetched.current = false
      
      console.log('Déconnexion réussie')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Forcer la déconnexion même en cas d'erreur
      setUser(null)
      setUserData(null)
      userDataFetched.current = false
      throw error
    }
  }

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
  }