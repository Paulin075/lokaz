-- Script pour vérifier et corriger la table messages dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si la table messages existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'messages'
);

-- 2. Créer la table messages si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  expediteur_id BIGINT NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  destinataire_id BIGINT NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lu BOOLEAN DEFAULT FALSE
);

-- 3. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_messages_expediteur_id ON public.messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire_id ON public.messages(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_messages_date_envoi ON public.messages(date_envoi);
CREATE INDEX IF NOT EXISTS idx_messages_lu ON public.messages(lu);

-- 4. Vérifier les politiques RLS (Row Level Security)
-- Activer RLS sur la table messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS pour permettre aux utilisateurs de voir leurs messages
-- Politique pour voir les messages envoyés
CREATE POLICY IF NOT EXISTS "Users can view sent messages" ON public.messages
  FOR SELECT USING (expediteur_id = auth.uid()::bigint);

-- Politique pour voir les messages reçus
CREATE POLICY IF NOT EXISTS "Users can view received messages" ON public.messages
  FOR SELECT USING (destinataire_id = auth.uid()::bigint);

-- Politique pour envoyer des messages
CREATE POLICY IF NOT EXISTS "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (expediteur_id = auth.uid()::bigint);

-- Politique pour marquer les messages comme lus
CREATE POLICY IF NOT EXISTS "Users can update received messages" ON public.messages
  FOR UPDATE USING (destinataire_id = auth.uid()::bigint);

-- 6. Vérifier la structure actuelle de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- 7. Vérifier les politiques RLS existantes
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'messages';

-- 8. Insérer quelques messages de test (optionnel)
-- INSERT INTO public.messages (expediteur_id, destinataire_id, contenu) VALUES
--   (1, 2, 'Bonjour, comment allez-vous ?'),
--   (2, 1, 'Très bien, merci !');

-- 9. Vérifier les messages existants
SELECT 
  m.id,
  m.contenu,
  m.date_envoi,
  m.lu,
  e.prenom || ' ' || e.nom as expediteur,
  d.prenom || ' ' || d.nom as destinataire
FROM public.messages m
JOIN public.utilisateurs e ON m.expediteur_id = e.id
JOIN public.utilisateurs d ON m.destinataire_id = d.id
ORDER BY m.date_envoi DESC
LIMIT 10; 

-- Ajout des colonnes quartier aux tables existantes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maisons' AND column_name = 'quartier') THEN
    ALTER TABLE public.maisons ADD COLUMN quartier character varying;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chambres' AND column_name = 'quartier') THEN
    ALTER TABLE public.chambres ADD COLUMN quartier character varying;
  END IF;
END $$;

-- Création de la séquence pour terrains
CREATE SEQUENCE IF NOT EXISTS terrains_id_seq;

-- Suppression de l'ancienne table terrains si elle existe
DROP TABLE IF EXISTS public.terrains CASCADE;

-- Création de la table terrains avec le bon schéma
CREATE TABLE public.terrains (
  id integer NOT NULL DEFAULT nextval('terrains_id_seq'::regclass),
  id_proprietaire integer,
  titre character varying,
  description text,
  adresse text,
  quartier character varying,
  ville character varying,
  superficie_m2 numeric,
  prix numeric, -- Champ prix unique
  type_terrain character varying DEFAULT 'residentiel'::character varying,
  statut_vente character varying DEFAULT 'disponible'::character varying CHECK (statut_vente::text = ANY (ARRAY['disponible'::character varying, 'vendu'::character varying, 'reserve'::character varying]::text[])),
  photos text,
  date_publication timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  vendu boolean DEFAULT false,
  id_proprietaire_uuid uuid,
  CONSTRAINT terrains_pkey PRIMARY KEY (id),
  CONSTRAINT terrains_id_proprietaire_fkey FOREIGN KEY (id_proprietaire) REFERENCES public.utilisateurs(id)
); 