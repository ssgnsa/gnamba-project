-- RLS: lease_contracts
DROP POLICY IF EXISTS "lease_contracts_select" ON public.lease_contracts;
DROP POLICY IF EXISTS "lease_contracts_insert" ON public.lease_contracts;
DROP POLICY IF EXISTS "lease_contracts_update" ON public.lease_contracts;
DROP POLICY IF EXISTS "lease_contracts_delete" ON public.lease_contracts;
CREATE POLICY "lease_contracts_select" ON public.lease_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "lease_contracts_insert" ON public.lease_contracts FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));
CREATE POLICY "lease_contracts_update" ON public.lease_contracts FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant')) WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));
CREATE POLICY "lease_contracts_delete" ON public.lease_contracts FOR DELETE TO authenticated USING (current_user_role() = 'admin');
