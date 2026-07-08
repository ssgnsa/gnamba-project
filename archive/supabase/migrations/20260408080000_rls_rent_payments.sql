-- RLS: rent_payments
DROP POLICY IF EXISTS "rent_payments_select" ON public.rent_payments;
DROP POLICY IF EXISTS "rent_payments_insert" ON public.rent_payments;
DROP POLICY IF EXISTS "rent_payments_update" ON public.rent_payments;
DROP POLICY IF EXISTS "rent_payments_delete" ON public.rent_payments;
CREATE POLICY "rent_payments_select" ON public.rent_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "rent_payments_insert" ON public.rent_payments FOR INSERT TO authenticated WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));
CREATE POLICY "rent_payments_update" ON public.rent_payments FOR UPDATE TO authenticated USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant')) WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));
CREATE POLICY "rent_payments_delete" ON public.rent_payments FOR DELETE TO authenticated USING (current_user_role() = 'admin');
