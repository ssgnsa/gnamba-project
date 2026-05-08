-- ============================================
-- Migration: Lead Capture System (CDC Compliant)
-- ============================================
-- Date: 2026-04-05
-- Purpose: Universal phone number capture from all ERP forms
--          Multi-channel bot infrastructure
--          Conformité: Loi n° 2013-450 (Côte d'Ivoire)
-- ============================================

BEGIN;

-- ============================================
-- 1. LEADS TABLE — Central lead storage
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,                          -- E.164 format
  phone_normalized TEXT,                        -- Normalized for matching
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  source TEXT NOT NULL,                         -- URL/formulaire d'origine
  source_page TEXT,                             -- Page spécifique
  source_form TEXT,                             -- Nom du formulaire
  user_id UUID,                                 -- ID utilisateur si connecté
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_text TEXT NOT NULL DEFAULT 'J''accepte de recevoir des communications commerciales par SMS, WhatsApp, Email et Telegram de la part de Gnamba Services.',
  channels_optin JSONB NOT NULL DEFAULT '{"sms": true, "whatsapp": true, "email": true, "telegram": false}',
  status TEXT NOT NULL DEFAULT 'active',        -- active, opted_out, bounced, converted
  tags TEXT[] DEFAULT '{}',                     -- Segments/tags
  score INTEGER DEFAULT 0,                      -- Lead scoring (RFM)
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phone)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN(tags);

-- ============================================
-- 2. LEAD INTERACTIONS — History tracker
-- ============================================
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,                        -- sms, whatsapp, email, telegram
  type TEXT NOT NULL,                           -- outbound, inbound, campaign, auto_reply
  template_id TEXT,                             -- ID du template utilisé
  content TEXT,                                 -- Contenu du message
  status TEXT NOT NULL DEFAULT 'sent',          -- sent, delivered, read, failed, bounced
  metadata JSONB DEFAULT '{}',                  -- Données supplémentaires
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_lead ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_interactions_channel ON lead_interactions(channel);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON lead_interactions(created_at DESC);

-- ============================================
-- 3. CAMPAIGNS — Multi-channel campaign management
-- ============================================
CREATE TABLE IF NOT EXISTS lead_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  channels JSONB NOT NULL DEFAULT '["sms"]',    -- Canaux activés
  segment_filter JSONB DEFAULT '{}',            -- Filtres de segmentation
  template_content JSONB NOT NULL,              -- Templates par canal
  status TEXT NOT NULL DEFAULT 'draft',         -- draft, scheduled, running, completed, paused
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{"sent": 0, "delivered": 0, "read": 0, "clicked": 0, "converted": 0, "failed": 0, "opted_out": 0}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON lead_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON lead_campaigns(created_at DESC);

-- ============================================
-- 4. SOCIAL MEDIA POSTS — Auto-publishing
-- ============================================
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,                       -- facebook, instagram, linkedin, x, telegram
  content TEXT NOT NULL,
  content_variants JSONB,                       -- Variantes A/B testing
  hashtags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  post_id_platform TEXT,                        -- ID de publication sur la plateforme
  status TEXT NOT NULL DEFAULT 'draft',         -- draft, scheduled, posted, failed
  engagement JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0, "clicks": 0}',
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_scheduled ON social_posts(scheduled_at);

-- ============================================
-- 5. BOT WORKFLOWS — Automation rules
-- ============================================
CREATE TABLE IF NOT EXISTS bot_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,                   -- event, schedule, webhook
  trigger_config JSONB NOT NULL,                -- Configuration du déclencheur
  actions JSONB NOT NULL,                       -- Séquence d'actions
  status TEXT NOT NULL DEFAULT 'active',        -- active, paused, archived
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_status ON bot_workflows(status);

-- ============================================
-- 6. OPT-OUT LOG — Conformity tracking
-- ============================================
CREATE TABLE IF NOT EXISTS lead_optouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  reason TEXT,
  source TEXT,                                  -- Comment l'opt-out a été déclenché
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_optouts_lead ON lead_optouts(lead_id);
CREATE INDEX IF NOT EXISTS idx_optouts_channel ON lead_optouts(channel);

-- ============================================
-- 7. HELPER FUNCTION: Normalize phone to E.164
-- ============================================
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned TEXT;
BEGIN
  -- Remove all non-digit characters
  cleaned := regexp_replace(phone_input, '[^0-9]', '', 'g');

  -- If starts with 00, replace with +
  IF cleaned LIKE '00%' THEN
    cleaned := '+' || substring(cleaned FROM 3);
  -- If starts with 0 and is 10 digits (Ivorian), add +225
  ELSIF cleaned LIKE '0%' AND length(cleaned) = 10 THEN
    cleaned := '+225' || substring(cleaned FROM 2);
  -- If already starts with +225
  ELSIF cleaned LIKE '+225%' THEN
    cleaned := cleaned;
  -- If starts with + and is valid
  ELSIF cleaned LIKE '+%' THEN
    cleaned := cleaned;
  -- If 10 digits without prefix (Ivorian local)
  ELSIF length(cleaned) = 10 THEN
    cleaned := '+225' || cleaned;
  ELSE
    cleaned := phone_input;  -- Return as-is if unrecognizable
  END IF;

  RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 8. TRIGGER: Auto-normalize phone on insert
-- ============================================
CREATE OR REPLACE FUNCTION trigger_normalize_lead_phone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.phone_normalized := normalize_phone(NEW.phone);
  NEW.phone := NEW.phone_normalized;  -- Store normalized
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_lead_phone_trigger
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_normalize_lead_phone();

-- ============================================
-- 9. TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_trigger();

CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON lead_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_trigger();

CREATE TRIGGER set_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_trigger();

CREATE TRIGGER set_workflows_updated_at
  BEFORE UPDATE ON bot_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_trigger();

-- ============================================
-- 10. RLS POLICIES — Role-based access
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_optouts ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM user_profiles WHERE id = auth.uid()),
    'employe'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Leads: read for all authenticated, write for admin/gestionnaire/gerant
CREATE POLICY "leads_select" ON leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "leads_insert" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant', 'secretaire'));

CREATE POLICY "leads_update" ON leads
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

CREATE POLICY "leads_delete" ON leads
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- Interactions
CREATE POLICY "interactions_select" ON lead_interactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "interactions_insert" ON lead_interactions
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

-- Campaigns
CREATE POLICY "campaigns_all" ON lead_campaigns
  FOR ALL TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

-- Social posts
CREATE POLICY "social_posts_select" ON social_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "social_posts_all" ON social_posts
  FOR ALL TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

-- Workflows
CREATE POLICY "workflows_all" ON bot_workflows
  FOR ALL TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

-- Optouts
CREATE POLICY "optouts_select" ON lead_optouts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "optouts_insert" ON lead_optouts
  FOR INSERT TO authenticated
  WITH CHECK (true);  -- Anyone can log opt-outs

-- ============================================
-- 11. DEFAULT WORKFLOWS — Pre-configured automations
-- ============================================

-- Workflow 1: Welcome sequence (new lead → SMS + WhatsApp)
INSERT INTO bot_workflows (name, description, trigger_type, trigger_config, actions)
VALUES (
  'Séquence Bienvenue',
  'Message de bienvenuto multi-canal pour nouveaux leads',
  'event',
  '{"event": "lead_created", "delay_minutes": 0}',
  '[
    {"channel": "sms", "template": "Bienvenue chez Gnamba Services, {first_name}! Nous vous contacterons bientôt.", "condition": "channels_optin.sms"},
    {"channel": "whatsapp", "template": "Bonjour {first_name}! Bienvenue chez Gnamba Services 🏗️. Découvrez nos services BTP, Immobilier et Foncier.", "condition": "channels_optin.whatsapp", "delay_minutes": 5}
  ]'
);

-- Workflow 2: Inactivity follow-up (30 days no interaction)
INSERT INTO bot_workflows (name, description, trigger_type, trigger_config, actions)
VALUES (
  'Relance Inactivité 30j',
  'Relance automatique après 30 jours sans interaction',
  'schedule',
  '{"cron": "0 9 * * *", "condition": "last_interaction_at < NOW() - INTERVAL ''30 days'' AND status = ''active''"}',
  '[
    {"channel": "whatsapp", "template": "Bonjour {first_name}, cela fait un moment! Nous avons de nouvelles offres pour vous.", "condition": "channels_optin.whatsapp"}
  ]'
);

-- Workflow 3: Auto-publish new product/service
INSERT INTO bot_workflows (name, description, trigger_type, trigger_config, actions)
VALUES (
  'Publication Auto Réseaux Sociaux',
  'Publication automatique lors d''un nouveau projet/produit',
  'event',
  '{"event": "new_project_created"}',
  '[
    {"platform": "facebook", "ai_generate": true, "template": "Nouveau projet: {project_name} à {location}. Contactez-nous!"},
    {"platform": "linkedin", "ai_generate": true, "template": "Gnamba Services lance {project_name}. Expertise BTP en Côte d''Ivoire."},
    {"platform": "instagram", "ai_generate": true, "template": "🏗️ Nouveau projet {project_name} ✨ #BTP #Abidjan #Construction"}
  ]'
);

COMMIT;
