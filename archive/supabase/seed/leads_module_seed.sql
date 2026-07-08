-- ============================================
-- EGS - Seed Data for Leads Module Testing
-- Date: 2026-05-15
-- ============================================

-- ============================================
-- Test Data: Leads
-- ============================================
INSERT INTO leads (nom, prenom, telephone, email, source, statut, score, budget_min, budget_max, notes, consentement_marketing) VALUES
('Kouassi', 'Jean', '+225 01 02 03 04 05', 'jean.kouassi@email.com', 'site', 'nouveau', 0, 5000000, 10000000, 'Intéressé par terrain à Yopougon', true),
('Bamba', 'Aminata', '+225 05 06 07 08 09', 'aminata.bamba@email.com', 'facebook', 'qualifie', 45, 3000000, 8000000, 'Cherche terrain pour maison familiale', true),
('Diallo', 'Moussa', '+225 07 08 09 10 11', NULL, 'appel', 'chaud', 75, 10000000, 15000000, 'Prêt à signer rapidement', true),
('Touré', 'Fatou', '+225 09 10 11 12 13', 'fatou.toure@email.com', 'whatsapp', 'contacte', 25, 2000000, 5000000, 'Hésite sur la localisation', true),
('Koné', 'Seydou', '+225 11 12 13 14 15', 'seydou.kone@email.com', 'recommandation', 'nouveau', 0, 8000000, 12000000, 'Client recommandé par M. Diallo', true),
('Yao', 'Marie', '+225 13 14 15 16 17', 'marie.yao@email.com', 'salon', 'qualifie', 55, 4000000, 9000000, 'Visite terrain déjà effectuée', true),
('NGuessan', 'Koffi', '+225 15 16 17 18 19', NULL, 'bureau', 'chaud', 80, 15000000, 20000000, 'Budget important, très intéressé', true);

-- ============================================
-- Test Data: Campagnes
-- ============================================
INSERT INTO campagnes (nom, canal, type, contenu, statut, cibles_filtres) VALUES
('Bienvenue Nouveaux Leads', 'sms', 'bienvenue', 'Bonjour ! Bienvenue chez G-NAMBA. Un agent vous contactera sous 24h.', 'terminee', '{"statut": ["nouveau"]}'),
('Promotion Terrains Yopougon', 'whatsapp', 'promotion', '🎉 Promo spéciale sur les terrains à Yopougon ! Contactez-nous vite.', 'en_cours', '{"zone": ["Yopougon"], "budget_min": 3000000}'),
('Relance Visites', 'email', 'relance', 'Objet: Suite à votre visite terrain...', 'programmee', '{"statut": ["qualifie", "chaud"]}'),
('Événement Portes Ouvertes', 'sms', 'evenement', 'Venez découvrir nos terrains ce samedi !', 'brouillon', '{}');

-- ============================================
-- Test Data: Lead-Campagnes (Liens)
-- ============================================
-- Link leads 1, 2, 3 with campaign 1 (welcome)
INSERT INTO lead_campagnes (lead_id, campagne_id, envoye_le, statut)
SELECT 
    l.id,
    c.id,
    NOW() - INTERVAL '2 days',
    'envoye'
FROM leads l, campagnes c
WHERE c.nom = 'Bienvenue Nouveaux Leads'
AND l.nom IN ('Kouassi', 'Bamba', 'Diallo');

-- Link leads with campaign 3 (relance)
INSERT INTO lead_campagnes (lead_id, campagne_id, envoye_le, ouvert_le, repondu_le, statut)
SELECT 
    l.id,
    c.id,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '2 hours',
    NOW() - INTERVAL '12 hours',
    'repondu'
FROM leads l, campagnes c
WHERE c.nom = 'Relance Visites'
AND l.nom IN ('Bamba', 'Yao');

-- ============================================
-- Test Data: Terrains (if not exists)
-- ============================================
-- Assuming terrains table exists with some data
-- We'll reference existing terrains or create test ones

-- ============================================
-- Test Data: Visites Terrain
-- ============================================
INSERT INTO visites_terrain (lead_id, terrain_id, date_visite, heure_debut, agent_id, resultat, notes)
SELECT 
    l.id,
    t.id,
    CURRENT_DATE - INTERVAL '3 days',
    '10:00',
    (SELECT id FROM user_profiles WHERE role = 'gestionnaire' LIMIT 1),
    'tres_interesse',
    'Client très intéressé, a demandé un devis'
FROM leads l, terrains t
WHERE l.nom = 'Diallo'
AND t.statut_vente = 'disponible'
LIMIT 1;

INSERT INTO visites_terrain (lead_id, terrain_id, date_visite, heure_debut, agent_id, resultat, notes)
SELECT 
    l.id,
    t.id,
    CURRENT_DATE - INTERVAL '7 days',
    '14:00',
    (SELECT id FROM user_profiles WHERE role = 'gestionnaire' LIMIT 1),
    'hesitant',
    'Aime le terrain mais hésite sur le prix'
FROM leads l, terrains t
WHERE l.nom = 'Yao'
AND t.statut_vente = 'disponible'
LIMIT 1;

-- ============================================
-- Update Leads with Visit Counts
-- ============================================
UPDATE leads SET visites_realisees = 1 WHERE nom = 'Diallo';
UPDATE leads SET visites_realisees = 1 WHERE nom = 'Yao';

-- Update Leads with Response Counts
UPDATE leads SET reponses_campagnes = 1 WHERE nom IN ('Bamba', 'Yao');

-- Update Leads with Terrain Interest
UPDATE leads SET terrain_interet_id = (SELECT id FROM terrains WHERE statut_vente = 'disponible' LIMIT 1)
WHERE nom IN ('Diallo', 'NGuessan');

-- ============================================
-- Update Scores based on activity
-- ============================================
UPDATE leads SET score = 25 WHERE nom = 'Bamba';  -- qualified + response
UPDATE leads SET score = 75 WHERE nom = 'Diallo'; -- hot + visit + terrain
UPDATE leads SET score = 55 WHERE nom = 'Yao';   -- qualified + visit
UPDATE leads SET score = 80 WHERE nom = 'NGuessan'; -- hot + terrain + budget
UPDATE leads SET score = 10 WHERE nom = 'Touré'; -- contacted, hesitant

-- ============================================
-- Verify Test Data
-- ============================================
SELECT 
    l.nom,
    l.statut,
    l.score,
    l.visites_realisees,
    l.reponses_campagnes,
    COUNT(vt.id) as visites_count
FROM leads l
LEFT JOIN visites_terrain vt ON vt.lead_id = l.id
GROUP BY l.id, l.nom, l.statut, l.score, l.visites_realisees, l.reponses_campagnes
ORDER BY l.score DESC;

-- ============================================
-- Query: Pipeline Stats
-- ============================================
SELECT * FROM commercial_pipeline;

-- ============================================
-- Query: Leads Needing Attention
-- ============================================
SELECT * FROM get_leads_needing_attention(7);

-- ============================================
-- Fin Seed Data
-- ============================================
