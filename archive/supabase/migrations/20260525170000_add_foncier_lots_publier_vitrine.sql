-- ============================================================
-- MIGRATION : Ajout champ publier_sur_vitrine à foncier_lots
--
-- Permet de marquer les lots à afficher sur la vitrine publique
-- ============================================================

-- Ajout de la colonne si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'foncier_lots'
      AND column_name = 'publier_sur_vitrine'
  ) THEN
    ALTER TABLE public.foncier_lots
    ADD COLUMN publier_sur_vitrine BOOLEAN DEFAULT false;
    
    -- Index pour les performances des requêtes vitrine
    CREATE INDEX idx_foncier_lots_publier_sur_vitrine 
    ON public.foncier_lots(publier_sur_vitrine) 
    WHERE publier_sur_vitrine = true;
    
    RAISE NOTICE 'Colonne publier_sur_vitrine ajoutée à foncier_lots';
  ELSE
    RAISE NOTICE 'Colonne publier_sur_vitrine existe déjà';
  END IF;
END $$;

-- Mettre à jour les lots existants qui pourraient être publiés
-- Par défaut : les lots 'actif' avec prix > 0 seront candidats
-- UPDATE public.foncier_lots 
-- SET publier_sur_vitrine = true 
-- WHERE statut = 'actif' AND prix_cession > 0;

-- Vérification
SELECT 
  COUNT(*) as total_lots,
  COUNT(*) FILTER (WHERE publier_sur_vitrine = true) as lots_publies
FROM public.foncier_lots;
