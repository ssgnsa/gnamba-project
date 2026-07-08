-- ============================================================
-- MIGRATION : Table vitrine_lots
--
-- Catalogue commercial séparé du module foncier opérationnel.
-- Permet de saisir librement les lots à vendre avec une fiche
-- simple, puis de les publier sur la vitrine publique.
-- ============================================================


CREATE TABLE IF NOT EXISTS public.vitrine_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  titre TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  village TEXT NOT NULL,
  quartier TEXT NOT NULL DEFAULT '',
  commune TEXT NOT NULL DEFAULT '',
  departement TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  superficie NUMERIC(12, 2) NOT NULL DEFAULT 0,
  prix_vente BIGINT NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'disponible'
    CHECK (statut IN ('disponible', 'reserve', 'vendu')),
  documents TEXT NOT NULL DEFAULT '',
  caracteristiques TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT NOT NULL DEFAULT '',
  image_alt TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '+225 07 77 96 01 49',
  contact_email TEXT NOT NULL DEFAULT 'contact@gnambaservices.ci',
  publier_sur_vitrine BOOLEAN NOT NULL DEFAULT TRUE,
  ordre_affichage INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vitrine_lots_publier_sur_vitrine
  ON public.vitrine_lots (publier_sur_vitrine)
  WHERE publier_sur_vitrine = TRUE;

CREATE INDEX IF NOT EXISTS idx_vitrine_lots_village
  ON public.vitrine_lots (village);

CREATE INDEX IF NOT EXISTS idx_vitrine_lots_statut
  ON public.vitrine_lots (statut);

CREATE INDEX IF NOT EXISTS idx_vitrine_lots_ordre_affichage
  ON public.vitrine_lots (ordre_affichage, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_vitrine_lots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_vitrine_lots_updated_at ON public.vitrine_lots;
CREATE TRIGGER set_vitrine_lots_updated_at
  BEFORE UPDATE ON public.vitrine_lots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vitrine_lots_updated_at();

ALTER TABLE public.vitrine_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vitrine_lots_select_public" ON public.vitrine_lots;
DROP POLICY IF EXISTS "vitrine_lots_insert_manage" ON public.vitrine_lots;
DROP POLICY IF EXISTS "vitrine_lots_update_manage" ON public.vitrine_lots;
DROP POLICY IF EXISTS "vitrine_lots_delete_manage" ON public.vitrine_lots;

CREATE POLICY "vitrine_lots_select_public" ON public.vitrine_lots
  FOR SELECT TO anon, authenticated
  USING (publier_sur_vitrine = TRUE);

CREATE POLICY "vitrine_lots_insert_manage" ON public.vitrine_lots
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'gestionnaire', 'gerant', 'secretaire')
    )
  );

CREATE POLICY "vitrine_lots_update_manage" ON public.vitrine_lots
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'gestionnaire', 'gerant', 'secretaire')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'gestionnaire', 'gerant', 'secretaire')
    )
  );

CREATE POLICY "vitrine_lots_delete_manage" ON public.vitrine_lots
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'gestionnaire', 'gerant', 'secretaire')
    )
  );

GRANT SELECT ON public.vitrine_lots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vitrine_lots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitrine_lots TO service_role;

COMMENT ON TABLE public.vitrine_lots IS
  'Catalogue commercial libre pour les lots à vendre sur la vitrine publique.';

