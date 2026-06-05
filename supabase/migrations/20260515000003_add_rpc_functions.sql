-- ============================================
-- EGS - Module Leads & Campagnes
-- RPC Functions for Edge Functions
-- ============================================

-- ============================================
-- RPC: Get agent workload
-- Used by auto-assign-agent Edge Function
-- ============================================
CREATE OR REPLACE FUNCTION get_agent_workload(agent_ids UUID[])
RETURNS TABLE (
    agent_id UUID,
    nom TEXT,
    total_leads BIGINT,
    active_leads BIGINT,
    nouveaux BIGINT,
    qualifies BIGINT,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id as agent_id,
        COALESCE(up.nom, up.email) as nom,
        COUNT(l.id) as total_leads,
        COUNT(CASE WHEN l.statut NOT IN ('converti', 'perdu', 'froid') THEN 1 END) as active_leads,
        COUNT(CASE WHEN l.statut = 'nouveau' THEN 1 END) as nouveaux,
        COUNT(CASE WHEN l.statut IN ('qualifie', 'chaud') THEN 1 END) as qualifies,
        COALESCE(
            (COUNT(CASE WHEN l.statut = 'converti' THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(CASE WHEN l.statut NOT IN ('nouveau') THEN 1 END), 0) * 100),
            0
        ) as conversion_rate
    FROM user_profiles up
    LEFT JOIN leads l ON l.agent_id = up.id
    WHERE up.id = ANY(agent_ids)
    GROUP BY up.id, up.nom, up.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: Get commercial funnel stats
-- Used by dashboard
-- ============================================
CREATE OR REPLACE FUNCTION get_funnel_stats(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    etape TEXT,
    total BIGINT,
    taux_conversion NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            'leads' as etape,
            COUNT(*)::BIGINT as total
        FROM leads
        WHERE created_at >= start_date AND created_at <= end_date
        
        UNION ALL
        
        SELECT 
            'qualifies' as etape,
            COUNT(*)::BIGINT
        FROM leads
        WHERE statut IN ('qualifie', 'chaud')
        AND created_at >= start_date AND created_at <= end_date
        
        UNION ALL
        
        SELECT 
            'visites' as etape,
            COUNT(*)::BIGINT
        FROM visites_terrain
        WHERE date_visite >= start_date AND date_visite <= end_date
        
        UNION ALL
        
        SELECT 
            'ventes' as etape,
            COUNT(*)::BIGINT
        FROM ventes_foncieres
        WHERE statut IN ('finalise', 'acte_signe')
        AND created_at >= start_date AND created_at <= end_date
    )
    SELECT 
        s.etape,
        s.total,
        CASE 
            WHEN s.etape = 'leads' THEN 100.0
            WHEN s.etape = 'qualifies' THEN (s.total::NUMERIC / NULLIF((SELECT total FROM stats WHERE etape = 'leads'), 0) * 100)
            WHEN s.etape = 'visites' THEN (s.total::NUMERIC / NULLIF((SELECT total FROM stats WHERE etape = 'qualifies'), 0) * 100)
            WHEN s.etape = 'ventes' THEN (s.total::NUMERIC / NULLIF((SELECT total FROM stats WHERE etape = 'visites'), 0) * 100)
            ELSE 0
        END as taux_conversion
    FROM stats s
    ORDER BY 
        CASE s.etape
            WHEN 'leads' THEN 1
            WHEN 'qualifies' THEN 2
            WHEN 'visites' THEN 3
            WHEN 'ventes' THEN 4
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: Get agent performance
-- Dashboard commercial
-- ============================================
CREATE OR REPLACE FUNCTION get_agent_performance(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days'
)
RETURNS TABLE (
    agent_id UUID,
    agent_nom TEXT,
    leads_assignes BIGINT,
    visites_realisees BIGINT,
    ventes_cloturees BIGINT,
    taux_conversion NUMERIC,
    revenu_total NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id as agent_id,
        COALESCE(up.nom, up.email) as agent_nom,
        COUNT(DISTINCT l.id) as leads_assignes,
        COUNT(DISTINCT vt.id) as visites_realisees,
        COUNT(DISTINCT vf.id) as ventes_cloturees,
        COALESCE(
            (COUNT(DISTINCT CASE WHEN vf.id IS NOT NULL THEN l.id END)::NUMERIC / 
             NULLIF(COUNT(DISTINCT l.id), 0) * 100),
            0
        ) as taux_conversion,
        COALESCE(SUM(vf.prix_vente), 0) as revenu_total
    FROM user_profiles up
    LEFT JOIN leads l ON l.agent_id = up.id AND l.created_at >= start_date
    LEFT JOIN visites_terrain vt ON vt.agent_id = up.id AND vt.date_visite >= start_date
    LEFT JOIN ventes_foncieres vf ON vf.agent_id = up.id 
        AND vf.statut IN ('finalise', 'acte_signe')
        AND vf.created_at >= start_date
    WHERE up.role IN ('gestionnaire', 'employe')
    GROUP BY up.id, up.nom, up.email
    ORDER BY ventes_cloturees DESC, revenu_total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: Get leads needing attention
-- Alertes pour dashboard
-- ============================================
CREATE OR REPLACE FUNCTION get_leads_needing_attention(
    inactivity_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    lead_id UUID,
    nom TEXT,
    telephone TEXT,
    statut TEXT,
    score INTEGER,
    agent_id UUID,
    agent_nom TEXT,
    jours_inactivite INTEGER,
    raison TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as lead_id,
        l.nom,
        l.telephone,
        l.statut,
        l.score,
        l.agent_id,
        COALESCE(up.nom, up.email) as agent_nom,
        EXTRACT(DAY FROM NOW() - l.derniere_interaction)::INTEGER as jours_inactivite,
        CASE 
            WHEN l.statut = 'chaud' AND EXTRACT(DAY FROM NOW() - l.derniere_interaction) > 3 THEN 'Lead chaud inactif +3j'
            WHEN l.score > 70 AND EXTRACT(DAY FROM NOW() - l.derniere_interaction) > 7 THEN 'Score élevé mais inactif'
            WHEN EXTRACT(DAY FROM NOW() - l.derniere_interaction) > 14 THEN 'Inactif depuis +14j'
            WHEN l.visites_realisees > 0 AND l.statut NOT IN ('converti', 'chaud') THEN 'Visite faite mais pas converti'
            ELSE 'À relancer'
        END as raison
    FROM leads l
    LEFT JOIN user_profiles up ON up.id = l.agent_id
    WHERE l.statut NOT IN ('converti', 'perdu', 'froid')
    AND (
        -- Lead chaud inactif depuis 3j
        (l.statut = 'chaud' AND l.derniere_interaction < NOW() - INTERVAL '3 days')
        OR
        -- Score élevé inactif
        (l.score > 70 AND l.derniere_interaction < NOW() - INTERVAL '7 days')
        OR
        -- Inactif depuis 14j
        (l.derniere_interaction < NOW() - INTERVAL '14 days')
        OR
        -- Visite faite mais pas avancé
        (l.visites_realisees > 0 AND l.statut IN ('qualifie', 'contacte'))
    )
    ORDER BY l.score DESC, l.derniere_interaction ASC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Grant execute permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_agent_workload(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_funnel_stats(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_agent_performance(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leads_needing_attention(INTEGER) TO authenticated;

-- Service role for edge functions
GRANT EXECUTE ON FUNCTION get_agent_workload(UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION get_funnel_stats(DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION get_agent_performance(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION get_leads_needing_attention(INTEGER) TO service_role;
