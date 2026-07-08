-- RLS: properties
DROP POLICY IF EXISTS "properties_select" ON public.properties;
DROP POLICY IF EXISTS "properties_insert" ON public.properties;
DROP POLICY IF EXISTS "properties_update" ON public.properties;
DROP POLICY IF EXISTS "properties_delete" ON public.properties;
CREATE POLICY "properties_select" ON public.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "properties_insert" ON public.properties FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));
CREATE POLICY "properties_update" ON public.properties FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant')) WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));
CREATE POLICY "properties_delete" ON public.properties FOR DELETE TO authenticated USING (current_user_role() = 'admin');
