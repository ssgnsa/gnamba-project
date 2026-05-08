-- RLS: locataires (after rename)
ALTER TABLE public.locataires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "locataires_select_auth" ON public.locataires;
DROP POLICY IF EXISTS "locataires_insert_auth" ON public.locataires;
DROP POLICY IF EXISTS "locataires_update_auth" ON public.locataires;
DROP POLICY IF EXISTS "locataires_delete_auth" ON public.locataires;
DROP POLICY IF EXISTS "ten_auth" ON public.locataires;
DROP POLICY IF EXISTS "Tenants all for authenticated" ON public.locataires;
DROP POLICY IF EXISTS "Tenants viewable by public" ON public.locataires;
DROP POLICY IF EXISTS "locataires_select" ON public.locataires;
DROP POLICY IF EXISTS "locataires_insert" ON public.locataires;
DROP POLICY IF EXISTS "locataires_update" ON public.locataires;
DROP POLICY IF EXISTS "locataires_delete" ON public.locataires;
CREATE POLICY "locataires_select" ON public.locataires FOR SELECT TO authenticated USING (true);
CREATE POLICY "locataires_insert" ON public.locataires FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));
CREATE POLICY "locataires_update" ON public.locataires FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant')) WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));
CREATE POLICY "locataires_delete" ON public.locataires FOR DELETE TO authenticated USING (current_user_role() = 'admin');
