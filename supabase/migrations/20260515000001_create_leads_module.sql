-- ============================================
-- EGS - Module Leads & Campagnes
-- Phase 1: Tables Core
-- Date: 2026-05-15
-- ============================================

-- ============================================
-- Table: leads
-- Cœur du CRM - Stocke tous les prospects
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Informations de base
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255),
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    
    -- Source et attribution
    source VARCHAR(50) NOT NULL DEFAULT 'bureau' 
        CHECK (source IN ('site', 'bureau', 'salon', 'appel', 'whatsapp', 'recommandation', 'facebook', 'google')),
    
    -- Statut dans le pipeline
    statut VARCHAR(50) NOT NULL DEFAULT 'nouveau'
        CHECK (statut IN ('nouveau', 'contacte', 'qualifie', 'chaud', 'converti', 'perdu', 'froid')),
    
    -- Scoring et priorisation
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    
    -- Attribution
    agent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Intérêt produit
    terrain_interet_id UUID, -- référence optionnelle vers terrains
    budget_min DECIMAL(15, 2),
    budget_max DECIMAL(15, 2),
    
    -- Tracking interactions
    derniere_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reponses_campagnes INTEGER DEFAULT 0,
    visites_realisees INTEGER DEFAULT 0,
    
    -- Liens vers autres modules
    visiteur_id UUID, -- référence optionnelle vers registre_visiteurs
    client_id UUID, -- référence optionnelle vers clients
    
    -- Notes et commentaires
    notes TEXT,
    
    -- RGPD / Consentement
    consentement_marketing BOOLEAN DEFAULT FALSE,
    consentement_le DATE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Contraintes
    CONSTRAINT chk_budget CHECK (budget_max IS NULL OR budget_min IS NULL OR budget_max >= budget_min),
    CONSTRAINT chk_contact CHECK (telephone IS NOT NULL OR email IS NOT NULL)
);

-- Index pour performance
CREATE INDEX idx_leads_statut ON leads(statut);
CREATE INDEX idx_leads_agent ON leads(agent_id);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_telephone ON leads(telephone);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_derniere_interaction ON leads(derniere_interaction DESC);

-- ============================================
-- Table: campagnes
-- Marketing multicanal
-- ============================================
CREATE TABLE IF NOT EXISTS campagnes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Canal et type
    canal VARCHAR(50) NOT NULL
        CHECK (canal IN ('sms', 'whatsapp', 'email', 'facebook', 'appel')),
    type VARCHAR(50) NOT NULL
        CHECK (type IN ('bienvenue', 'relance', 'promotion', 'evenement', 'information')),
    
    -- Contenu
    sujet VARCHAR(255), -- pour email
    contenu TEXT NOT NULL,
    contenu_personnalise BOOLEAN DEFAULT FALSE,
    
    -- Planification
    statut VARCHAR(50) NOT NULL DEFAULT 'brouillon'
        CHECK (statut IN ('brouillon', 'programmee', 'en_cours', 'terminee', 'annulee')),
    date_envoi TIMESTAMP WITH TIME ZONE,
    date_fin TIMESTAMP WITH TIME ZONE,
    
    -- Ciblage (filtres JSON)
    cibles_filtres JSONB DEFAULT '{}',
    -- Exemple: {"statut": ["nouveau"], "zone": ["Yopougon"], "budget_min": 1000000}
    
    -- Statistiques
    total_cibles INTEGER DEFAULT 0,
    stats_envoyes INTEGER DEFAULT 0,
    stats_ouvertes INTEGER DEFAULT 0,
    stats_cliquees INTEGER DEFAULT 0,
    stats_reponses INTEGER DEFAULT 0,
    stats_conversions INTEGER DEFAULT 0,
    
    -- Coût
    cout_total DECIMAL(12, 2) DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Index campagnes
CREATE INDEX idx_campagnes_statut ON campagnes(statut);
CREATE INDEX idx_campagnes_canal ON campagnes(canal);
CREATE INDEX idx_campagnes_type ON campagnes(type);
CREATE INDEX idx_campagnes_date_envoi ON campagnes(date_envoi);

-- ============================================
-- Table: lead_campagnes (Many-to-Many)
-- Traçabilité: quels leads ont reçu quelles campagnes
-- ============================================
CREATE TABLE IF NOT EXISTS lead_campagnes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    campagne_id UUID NOT NULL REFERENCES campagnes(id) ON DELETE CASCADE,
    
    -- Tracking individuel
    envoye_le TIMESTAMP WITH TIME ZONE,
    ouvert_le TIMESTAMP WITH TIME ZONE,
    clique_le TIMESTAMP WITH TIME ZONE,
    repondu_le TIMESTAMP WITH TIME ZONE,
    
    -- Contenu de la réponse
    reponse_contenu TEXT,
    
    -- Statut de livraison
    statut VARCHAR(50) DEFAULT 'en_attente'
        CHECK (statut IN ('en_attente', 'envoye', 'livre', 'ouvert', 'clique', 'repondu', 'erreur', 'bounce')),
    
    -- Erreur éventuelle
    erreur_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unique: un lead ne peut recevoir une campagne qu'une fois
    CONSTRAINT unique_lead_campagne UNIQUE (lead_id, campagne_id)
);

-- Index lead_campagnes
CREATE INDEX idx_lead_campagnes_lead ON lead_campagnes(lead_id);
CREATE INDEX idx_lead_campagnes_campagne ON lead_campagnes(campagne_id);
CREATE INDEX idx_lead_campagnes_statut ON lead_campagnes(statut);

-- ============================================
-- Table: visites_terrain
-- Suivi des rendez-vous terrain
-- ============================================
CREATE TABLE IF NOT EXISTS visites_terrain (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Participants
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_id UUID, -- référence optionnelle vers clients
    
    -- Terrain visité
    terrain_id UUID NOT NULL,
    lot_id UUID REFERENCES foncier_lots(id) ON DELETE SET NULL,
    
    -- Planification
    date_visite DATE NOT NULL,
    heure_debut TIME,
    heure_fin TIME,
    
    -- Attribution
    agent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Résultat
    resultat VARCHAR(50)
        CHECK (resultat IN ('interesse', 'tres_interesse', 'hesitant', 'pas_interesse', 'a_revoir', 'annule', 'no_show')),
    
    -- Détails
    notes TEXT,
    points_positifs TEXT,
    points_negatifs TEXT,
    
    -- Suivi commercial
    prochaine_action VARCHAR(255),
    date_prochaine_action TIMESTAMP WITH TIME ZONE,
    
    -- Documents
    photos JSONB DEFAULT '[]', -- URLs des photos prises
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Contrainte: soit lead soit client
    CONSTRAINT chk_participant CHECK (
        (lead_id IS NOT NULL AND client_id IS NULL) OR 
        (lead_id IS NULL AND client_id IS NOT NULL)
    )
);

-- Index visites_terrain
CREATE INDEX idx_visites_terrain_lead ON visites_terrain(lead_id);
CREATE INDEX idx_visites_terrain_client ON visites_terrain(client_id);
CREATE INDEX idx_visites_terrain_terrain ON visites_terrain(terrain_id);
CREATE INDEX idx_visites_terrain_agent ON visites_terrain(agent_id);
CREATE INDEX idx_visites_terrain_date ON visites_terrain(date_visite DESC);
CREATE INDEX idx_visites_terrain_resultat ON visites_terrain(resultat);

-- ============================================
-- Table: ventes_foncieres
-- Contrats de vente / Réservations
-- ============================================
CREATE TABLE IF NOT EXISTS ventes_foncieres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parties
    client_id UUID NOT NULL, -- référence optionnelle vers clients
    agent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL, -- commercial
    
    -- Bien vendu
    terrain_id UUID, -- référence optionnelle vers terrains
    lot_id UUID REFERENCES foncier_lots(id) ON DELETE SET NULL,
    
    -- Contrainte: soit terrain soit lot
    CONSTRAINT chk_bien CHECK (terrain_id IS NOT NULL OR lot_id IS NOT NULL),
    
    -- Transaction
    prix_vente DECIMAL(15, 2) NOT NULL,
    frais_agence DECIMAL(15, 2) DEFAULT 0,
    commission DECIMAL(15, 2) DEFAULT 0,
    
    -- Paiement
    mode_paiement VARCHAR(50)
        CHECK (mode_paiement IN ('comptant', 'credit_bancaire', 'echeancier', 'promesse_vente')),
    montant_acompte DECIMAL(15, 2) DEFAULT 0,
    date_acompte DATE,
    
    -- Statut
    statut VARCHAR(50) NOT NULL DEFAULT 'reservation'
        CHECK (statut IN ('reservation', 'promesse_signee', 'contrat_signe', 'acte_signe', 'paiement_partiel', 'finalise', 'litigieux', 'annule')),
    
    -- Dates clés
    date_reservation DATE,
    date_promesse DATE,
    date_contrat DATE,
    date_acte DATE,
    date_finalisation DATE,
    
    -- Échéancier (si applicable)
    echeancier JSONB DEFAULT '[]',
    -- Exemple: [{"date": "2026-06-15", "montant": 500000, "paye": false}]
    
    -- Documents
    documents JSONB DEFAULT '[]', -- URLs des documents signés
    
    -- Origine
    lead_source_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    
    -- Notes
    notes TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Index ventes_foncieres
CREATE INDEX idx_ventes_client ON ventes_foncieres(client_id);
CREATE INDEX idx_ventes_terrain ON ventes_foncieres(terrain_id);
CREATE INDEX idx_ventes_statut ON ventes_foncieres(statut);
CREATE INDEX idx_ventes_date_reservation ON ventes_foncieres(date_reservation DESC);
CREATE INDEX idx_ventes_agent ON ventes_foncieres(agent_id);

-- ============================================
-- Extensions schéma existant
-- ============================================

-- Extensions schéma existant (conditionnel: uniquement si les tables existent)
DO $$
BEGIN
    -- Ajouter colonne lead_source_id à clients
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_source_id UUID REFERENCES leads(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_clients_lead_source ON clients(lead_source_id);
    END IF;

    -- Ajouter statut_vente à terrains
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'terrains') THEN
        ALTER TABLE terrains ADD COLUMN IF NOT EXISTS statut_vente VARCHAR(20) DEFAULT 'disponible'
            CHECK (statut_vente IN ('disponible', 'reserve', 'vendu', 'indisponible'));
        CREATE INDEX IF NOT EXISTS idx_terrains_statut_vente ON terrains(statut_vente);
    END IF;

    -- Ajouter colonnes à taches pour lien avec leads
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'taches') THEN
        ALTER TABLE taches ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE CASCADE;
        ALTER TABLE taches ADD COLUMN IF NOT EXISTS visite_terrain_id UUID REFERENCES visites_terrain(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_taches_lead ON taches(lead_id);
        CREATE INDEX IF NOT EXISTS idx_taches_visite ON taches(visite_terrain_id);
    END IF;
END
$$;

-- ============================================
-- Fonctions utilitaires
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campagnes_updated_at
    BEFORE UPDATE ON campagnes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visites_terrain_updated_at
    BEFORE UPDATE ON visites_terrain
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ventes_foncieres_updated_at
    BEFORE UPDATE ON ventes_foncieres
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Commentaires documentation
-- ============================================

COMMENT ON TABLE leads IS 'Table principale des prospects/leads du CRM';
COMMENT ON TABLE campagnes IS 'Campagnes marketing multicanal (SMS, WhatsApp, Email)';
COMMENT ON TABLE lead_campagnes IS 'Junction table: tracking des envois de campagnes aux leads';
COMMENT ON TABLE visites_terrain IS 'Suivi des visites terrain (rendez-vous)';
COMMENT ON TABLE ventes_foncieres IS 'Transactions de vente foncière (réservations et contrats)';

COMMENT ON COLUMN leads.score IS 'Score de qualification 0-100 (calculé automatiquement)';
COMMENT ON COLUMN campagnes.cibles_filtres IS 'Filtres JSON pour segmenter les leads cibles';
COMMENT ON COLUMN ventes_foncieres.echeancier IS 'Tableau JSON des échéances de paiement';

-- ============================================
-- Fin migration
-- ============================================
