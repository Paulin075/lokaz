
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oxfagnwsqdzsujakzypy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZmFnbndzcWR6c3VqYWt6eXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMjE3ODIsImV4cCI6MjA2NTU5Nzc4Mn0.2j01wz6ySK4p9MDlO8OhoN89OPc-p1tlVBWzKdkF7Z8'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types de base
export interface Utilisateur {
  id: number
  nom: string
  prenom: string
  email: string
  telephone: string
  type_utilisateur: 'admin' | 'proprietaire' | 'locataire'
  date_creation: string
  date_naissance?: string
  carte_identite?: string
  nombre_occupants?: number
  tmoney_number?: string
  flooz_number?: string
  mot_de_passe_temporaire?: string
  uuid?: string
  verifie?: boolean
}

export interface Maison {
  id: number
  id_proprietaire: number
  titre: string
  description: string
  adresse: string
  ville: string
  type_location: 'mois' | 'jour' | 'heure'
  prix_par_heure?: number
  prix_par_jour?: number
  prix_par_mois?: number
  disponible: boolean
  photos?: string
  chap_chap: boolean
  prix_eau: number
  prix_electricite: number
  date_publication: string
  id_proprietaire_uuid?: string
  type_bien?: 'maison' | 'villa' | 'immeuble'
  utilisateurs?: Utilisateur
}

export interface Chambre {
  id: number
  id_maison: number
  id_proprietaire?: number
  numero_chambre: string
  superficie_m2: number
  description: string
  prix: number
  disponible: boolean
  nb_chambres: number
  nb_salons: number
  nb_cuisines: number
  garage: boolean
  chap_chap: boolean
  photos?: string
  adresse: string
  ville: string
  prix_heure: number
  prix_jour: number
  maisons?: Maison
  proprietaire?: Utilisateur
  date_publication?: string
  // Champs vente/location
  type_propriete?: 'location' | 'vente' | 'les_deux'
  prix_vente?: number
  vendue?: boolean
  type_bien?: 'maison' | 'villa' | 'immeuble'
}

export interface Reservation {
  id: number
  id_locataire: number
  id_chambre: number
  date_debut: string
  date_fin: string
  statut: 'en_attente' | 'confirmee' | 'annulee' | 'terminee'
  mode_location: 'heure' | 'jour' | 'mois'
  total_a_payer: number
  id_locataire_uuid?: string
}

export interface Facture {
  id: number
  id_reservation: number
  date_facture: string
  montant_loyer: number
  consommation_eau: number
  consommation_electricite: number
  montant_eau: number
  montant_electricite: number
  total_a_payer: number
  statut_paiement: 'impayé' | 'payé'
}

export interface Message {
  id: number
  expediteur_id: number
  destinataire_id: number
  contenu: string
  date_envoi: string
  lu: boolean
}

export interface Paiement {
  id: number
  id_facture: number
  montant: number
  moyen_paiement: string
  date_paiement: string
}

export interface ReleveCompteur {
  id: number
  id_chambre: number
  date_releve: string
  compteur_eau: number
  compteur_electricite: number
  saisi_par: 'locataire' | 'proprietaire'
  commentaire?: string
}
