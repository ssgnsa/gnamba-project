-- ============================================
-- EGS - Module Leads & Campagnes
-- Phase 1: RLS Policies (Sécurité)
-- Date: 2026-05-15
-- ============================================

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campagnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_campagnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visites_terrain ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventes_foncieres ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function: Check if user is admin
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Helper function: Check if user is gestionnaire
-- ============================================
CREATE OR REPLACE FUNCTION is_gestionnaire()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'gestionnaire')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Table: leads
-- ============================================

-- Admin: full access
CREATE POLICY "Admin full access on leads"
ON leads
FOR ALL
TO authenticated
USING (is_admin());

-- Gestionnaire: full access
CREATE POLICY "Gestionnaire full access on leads"
ON leads
FOR ALL
TO authenticated
USING (is_gestionnaire());

-- Agent: can view and update their assigned leads
CREATE POLICY "Agent access own leads"
ON leads
FOR ALL
TO authenticated
USING (
    agent_id = auth.uid() OR
    created_by = auth.uid()
);

-- Public/Anonymous: no access (désactivé par défaut)

-- ============================================
-- Table: campagnes
-- ============================================

-- Admin: full access
CREATE POLICY "Admin full access on campagnes"
ON campagnes
FOR ALL
TO authenticated
USING (is_admin());

-- Gestionnaire: full access
CREATE POLICY "Gestionnaire full access on campagnes"
ON campagnes
FOR ALL
TO authenticated
USING (is_gestionnaire());

-- All users: can view campagnes
CREATE POLICY "All users can view campagnes"
ON campagnes
FOR SELECT
TO authenticated
USING (true);

-- Creator can update/delete own campagnes
CREATE POLICY "Creator can update own campagnes"
ON campagnes
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- ============================================
-- Table: lead_campagnes
-- ============================================

-- Admin: full access
CREATE POLICY "Admin full access on lead_campagnes"
ON lead_campagnes
FOR ALL
TO authenticated
USING (is_admin());

-- Gestionnaire: full access
CREATE POLICY "Gestionnaire full access on lead_campagnes"
ON lead_campagnes
FOR ALL
TO authenticated
USING (is_gestionnaire());

-- Agent: can view lead_campagnes for their leads
CREATE POLICY "Agent view lead_campagnes own leads"
ON lead_campagnes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = lead_campagnes.lead_id
        AND (leads.agent_id = auth.uid() OR leads.created_by = auth.uid())
    )
);

-- ============================================
-- Table: visites_terrain
-- ============================================

-- Admin: full access
CREATE POLICY "Admin full access on visites_terrain"
ON visites_terrain
FOR ALL
TO authenticated
USING (is_admin());

-- Gestionnaire: full access
CREATE POLICY "Gestionnaire full access on visites_terrain"
ON visites_terrain
FOR ALL
TO authenticated
USING (is_gestionnaire());

-- Agent: can access assigned visits
CREATE POLICY "Agent access assigned visits"
ON visites_terrain
FOR ALL
TO authenticated
USING (
    agent_id = auth.uid() OR
    created_by = auth.uid()
);

-- Agent can view visits for their leads
CREATE POLICY "Agent view visits for own leads"
ON visites_terrain
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM leads
        WHERE leads.id = visites_terrain.lead_id
        AND (leads.agent_id = auth.uid() OR leads.created_by = auth.uid())
    )
);

-- ============================================
-- Table: ventes_foncieres
-- ============================================

-- Admin: full access
CREATE POLICY "Admin full access on ventes_foncieres"
ON ventes_foncieres
FOR ALL
TO authenticated
USING (is_admin());

-- Gestionnaire: full access
CREATE POLICY "Gestionnaire full access on ventes_foncieres"
ON ventes_foncieres
FOR ALL
TO authenticated
USING (is_gestionnaire());

-- Agent: can view and update their sales
CREATE POLICY "Agent access own sales"
ON ventes_foncieres
FOR ALL
TO authenticated
USING (
    agent_id = auth.uid() OR
    created_by = auth.uid()
);

-- All users: can view finalised sales (for reference)
CREATE POLICY "All users view finalised sales"
ON ventes_foncieres
FOR SELECT
TO authenticated
USING (statut IN ('finalise', 'acte_signe'));

-- ============================================
-- Views sécurisées pour statistiques
-- ============================================

-- Vue: statistiques leads par agent (agent ne voit que ses données)
CREATE OR REPLACE VIEW leads_stats_agent AS
SELECT 
    agent_id,
    statut,
    COUNT(*) as total,
    AVG(score) as score_moyen,
    COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as nouveaux_ce_mois
FROM leads
WHERE 
    agent_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'gestionnaire'))
GROUP BY agent_id, statut;

-- Vue: pipeline commercial (funnel) - basée uniquement sur leads/visites/ventes
CREATE OR REPLACE VIEW commercial_pipeline AS
SELECT 
    'leads' as etape,
    COUNT(*) as total,
    100.0 as taux_conversion
FROM leads
WHERE created_at >= DATE_TRUNC('year', NOW())

UNION ALL

SELECT 
    'qualifies' as etape,
    COUNT(*) as total,
    (COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM leads WHERE created_at >= DATE_TRUNC('year', NOW())), 0) * 100) as taux_conversion
FROM leads
WHERE statut IN ('qualifie', 'chaud') 
AND created_at >= DATE_TRUNC('year', NOW())

UNION ALL

SELECT 
    'visites' as etape,
    COUNT(*) as total,
    (COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM leads WHERE statut IN ('qualifie', 'chaud') AND created_at >= DATE_TRUNC('year', NOW())), 0) * 100) as taux_conversion
FROM visites_terrain
WHERE date_visite >= DATE_TRUNC('year', NOW())

UNION ALL

SELECT 
    'ventes' as etape,
    COUNT(*) as total,
    (COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM visites_terrain WHERE date_visite >= DATE_TRUNC('year', NOW())), 0) * 100) as taux_conversion
FROM ventes_foncieres
WHERE statut IN ('finalise', 'acte_signe')
AND created_at >= DATE_TRUNC('year', NOW());

-- ============================================
-- Functions pour triggers métier
-- ============================================

-- Fonction: Auto-update derniere_interaction quand un lead reçoit une réponse
CREATE OR REPLACE FUNCTION update_lead_derniere_interaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads
    SET derniere_interaction = NOW()
    WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Met à jour derniere_interaction quand lead_campagnes est modifié
CREATE TRIGGER update_lead_interaction_on_campagne
    AFTER UPDATE ON lead_campagnes
    FOR EACH ROW
    WHEN (OLD.repondu_le IS NULL AND NEW.repondu_le IS NOT NULL)
    EXECUTE FUNCTION update_lead_derniere_interaction();

-- Fonction: Incrémenter reponses_campagnes
CREATE OR REPLACE FUNCTION increment_lead_reponses()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.repondu_le IS NOT NULL AND OLD.repondu_le IS NULL THEN
        UPDATE leads
        SET reponses_campagnes = COALESCE(reponses_campagnes, 0) + 1
        WHERE id = NEW.lead_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Incrémente le compteur de réponses
CREATE TRIGGER increment_lead_reponses_trigger
    AFTER UPDATE ON lead_campagnes
    FOR EACH ROW
    EXECUTE FUNCTION increment_lead_reponses();

-- Fonction: Incrémenter visites_realisees
CREATE OR REPLACE FUNCTION increment_lead_visites()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE leads
        SET visites_realisees = COALESCE(visites_realisees, 0) + 1,
            derniere_interaction = NOW()
        WHERE id = NEW.lead_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Incrémente le compteur de visites
CREATE TRIGGER increment_lead_visites_trigger
    AFTER INSERT ON visites_terrain
    FOR EACH ROW
    WHEN (NEW.lead_id IS NOT NULL)
    EXECUTE FUNCTION increment_lead_visites();

-- Fonction: Créer automatiquement une tâche après visite
CREATE OR REPLACE FUNCTION create_task_after_visite()
RETURNS TRIGGER AS $$
DECLARE
    v_lead_nom VARCHAR;
    v_task_title VARCHAR;
BEGIN
    -- Récupérer le nom du lead
    SELECT nom INTO v_lead_nom FROM leads WHERE id = NEW.lead_id;
    
    IF NEW.resultat = 'tres_interesse' THEN
        v_task_title := 'Faire offre formelle à ' || COALESCE(v_lead_nom, 'Lead');
    ELSIF NEW.resultat = 'interesse' THEN
        v_task_title := 'Relancer ' || COALESCE(v_lead_nom, 'Lead') || ' - visite positive';
    ELSIF NEW.resultat = 'hesitant' THEN
        v_task_title := 'Relancer ' || COALESCE(v_lead_nom, 'Lead') || ' - objections à lever';
    ELSE
        v_task_title := 'Relancer ' || COALESCE(v_lead_nom, 'Lead') || ' après visite';
    END IF;
    
    INSERT INTO taches (
        titre,
        description,
        type,
        priorite,
        date_echeance,
        assignee_a,
        lead_id,
        visite_terrain_id,
        statut
    ) VALUES (
        v_task_title,
        'Suite à la visite terrain du ' || NEW.date_visite || ' - Résultat: ' || NEW.resultat,
        'relance',
        CASE 
            WHEN NEW.resultat = 'tres_interesse' THEN 'haute'
            WHEN NEW.resultat = 'interesse' THEN 'moyenne'
            ELSE 'basse'
        END,
        COALESCE(NEW.date_prochaine_action, NOW() + INTERVAL '2 days'),
        COALESCE(NEW.agent_id, auth.uid()),
        NEW.lead_id,
        NEW.id,
        'a_faire'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Crée tâche automatique après visite (si résultat positif)
CREATE TRIGGER create_task_after_visite_trigger
    AFTER INSERT ON visites_terrain
    FOR EACH ROW
    WHEN (NEW.lead_id IS NOT NULL AND NEW.resultat IN ('interesse', 'tres_interesse', 'a_revoir'))
    EXECUTE FUNCTION create_task_after_visite();

-- ============================================
-- Fin migration RLS
-- ============================================
