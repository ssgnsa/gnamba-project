-- Additive migration for unified parties model
-- This phase is non-destructive and keeps clients/leads/locataires unchanged.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.parties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    party_type text NOT NULL CHECK (party_type IN ('personne_physique', 'entreprise')),
    nom text,
    prenom text,
    raison_sociale text,
    email text,
    telephone text,
    adresse text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    source_table text,
    source_id uuid
);

CREATE TABLE IF NOT EXISTS public.party_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('lead', 'client', 'locataire', 'fournisseur', 'employe')),
    status text NOT NULL DEFAULT 'actif',
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.party_lead_details (
    party_id uuid PRIMARY KEY REFERENCES public.parties(id) ON DELETE CASCADE,
    source text,
    source_page text,
    source_form text,
    score integer DEFAULT 0,
    status text DEFAULT 'active',
    ip_address text,
    consent_timestamp timestamptz,
    consent_text text,
    channels_optin jsonb DEFAULT '{}'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    notes text,
    created_by uuid,
    agent_id uuid,
    user_id uuid,
    last_interaction_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.party_merge_candidates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table text NOT NULL,
    source_id uuid NOT NULL,
    candidate_party_id uuid,
    candidate_source_table text,
    candidate_source_id uuid,
    match_criterion text NOT NULL,
    match_value text,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.party_merge_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    party_conservee_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    party_fusionnee_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    criterion_used text NOT NULL,
    source_table text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_party_roles_party_id ON public.party_roles(party_id);
CREATE INDEX IF NOT EXISTS idx_parties_email ON public.parties(email);
CREATE INDEX IF NOT EXISTS idx_parties_telephone ON public.parties(telephone);
CREATE INDEX IF NOT EXISTS idx_party_lead_details_status ON public.party_lead_details(status);
CREATE INDEX IF NOT EXISTS idx_party_merge_candidates_source ON public.party_merge_candidates(source_table, source_id);
