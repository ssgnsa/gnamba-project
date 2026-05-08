/*
  Migration: RLS policies pour toutes les tables Somagro ERP
  Date: 2026-04-04
  Purpose: Isolation multi-tenant — 23 tables sans RLS → policies tenant_id

  Principe : Chaque table avec tenant_id est protégée par :
  - SELECT : voir uniquement les données de son tenant
  - INSERT : uniquement pour son tenant
  - UPDATE : uniquement les données de son tenant
  - DELETE : uniquement les données de son tenant

  Exception : tables de référence (species, breeds, building_types, inventory_categories)
  → SELECT pour tous les authenticated, write pour admin/tenant_owner
*/

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT users.tenant_id
  FROM public.users
  WHERE users.id = auth.uid()
$$;

-- ============================================
-- 1. Tables métier (isolation stricte par tenant_id)
-- ============================================

-- animals
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_animals_select" ON public.animals FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_animals_insert" ON public.animals FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_animals_update" ON public.animals FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_animals_delete" ON public.animals FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- fields
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_fields_select" ON public.fields FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_fields_insert" ON public.fields FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_fields_update" ON public.fields FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_fields_delete" ON public.fields FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- crop_cycles
ALTER TABLE public.crop_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_crop_cycles_select" ON public.crop_cycles FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_crop_cycles_insert" ON public.crop_cycles FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_crop_cycles_update" ON public.crop_cycles FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_crop_cycles_delete" ON public.crop_cycles FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- crop_interventions
ALTER TABLE public.crop_interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_crop_interventions_select" ON public.crop_interventions FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_crop_interventions_insert" ON public.crop_interventions FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_crop_interventions_update" ON public.crop_interventions FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_crop_interventions_delete" ON public.crop_interventions FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- harvests
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_harvests_select" ON public.harvests FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_harvests_insert" ON public.harvests FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_harvests_update" ON public.harvests FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_harvests_delete" ON public.harvests FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- buildings
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_buildings_select" ON public.buildings FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_buildings_insert" ON public.buildings FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_buildings_update" ON public.buildings FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_buildings_delete" ON public.buildings FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- building_types
ALTER TABLE public.building_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_building_types_select" ON public.building_types FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_building_types_insert" ON public.building_types FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_building_types_update" ON public.building_types FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_building_types_delete" ON public.building_types FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- construction_projects
ALTER TABLE public.construction_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_construction_projects_select" ON public.construction_projects FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_construction_projects_insert" ON public.construction_projects FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_construction_projects_update" ON public.construction_projects FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_construction_projects_delete" ON public.construction_projects FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- cameras
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_cameras_select" ON public.cameras FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_cameras_insert" ON public.cameras FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_cameras_update" ON public.cameras FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_cameras_delete" ON public.cameras FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- counting_sessions
ALTER TABLE public.counting_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_counting_sessions_select" ON public.counting_sessions FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_counting_sessions_insert" ON public.counting_sessions FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_counting_sessions_update" ON public.counting_sessions FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_counting_sessions_delete" ON public.counting_sessions FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_customers_select" ON public.customers FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_customers_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_customers_update" ON public.customers FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_customers_delete" ON public.customers FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- equipment
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_equipment_select" ON public.equipment FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_equipment_insert" ON public.equipment FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_equipment_update" ON public.equipment FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_equipment_delete" ON public.equipment FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_financial_transactions_select" ON public.financial_transactions FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_financial_transactions_insert" ON public.financial_transactions FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_financial_transactions_update" ON public.financial_transactions FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_financial_transactions_delete" ON public.financial_transactions FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- health_records
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_health_records_select" ON public.health_records FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_health_records_insert" ON public.health_records FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_health_records_update" ON public.health_records FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_health_records_delete" ON public.health_records FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- livestock_events
ALTER TABLE public.livestock_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_livestock_events_select" ON public.livestock_events FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_livestock_events_insert" ON public.livestock_events FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_livestock_events_update" ON public.livestock_events FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_livestock_events_delete" ON public.livestock_events FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- lots
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_lots_select" ON public.lots FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_lots_insert" ON public.lots FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_lots_update" ON public.lots FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_lots_delete" ON public.lots FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_sales_select" ON public.sales FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_sales_insert" ON public.sales FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_sales_update" ON public.sales FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_sales_delete" ON public.sales FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- sale_items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_sale_items_select" ON public.sale_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_items.sale_id AND s.tenant_id = public.current_user_tenant_id()));
CREATE POLICY "tenant_isolation_sale_items_insert" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_items.sale_id AND s.tenant_id = public.current_user_tenant_id()));
CREATE POLICY "tenant_isolation_sale_items_update" ON public.sale_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_items.sale_id AND s.tenant_id = public.current_user_tenant_id())) WITH CHECK (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_items.sale_id AND s.tenant_id = public.current_user_tenant_id()));
CREATE POLICY "tenant_isolation_sale_items_delete" ON public.sale_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM sales s WHERE s.id = sale_items.sale_id AND s.tenant_id = public.current_user_tenant_id()));

-- inventory_categories
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_inventory_categories_select" ON public.inventory_categories FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_inventory_categories_insert" ON public.inventory_categories FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_inventory_categories_update" ON public.inventory_categories FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_inventory_categories_delete" ON public.inventory_categories FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_inventory_items_select" ON public.inventory_items FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_inventory_items_insert" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_inventory_items_update" ON public.inventory_items FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_inventory_items_delete" ON public.inventory_items FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- inventory_movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_inventory_movements_select" ON public.inventory_movements FOR SELECT TO authenticated USING (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_inventory_movements_insert" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_inventory_movements_update" ON public.inventory_movements FOR UPDATE TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());
CREATE POLICY "tenant_isolation_inventory_movements_delete" ON public.inventory_movements FOR DELETE TO authenticated USING (tenant_id = public.current_user_tenant_id());

-- ============================================
-- 2. Tables de référence (SELECT pour tous, write restreint)
-- ============================================

-- species
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
CREATE POLICY "species_select_all" ON public.species FOR SELECT TO authenticated USING (true);
CREATE POLICY "species_write_tenant" ON public.species FOR ALL TO authenticated USING (tenant_id = public.current_user_tenant_id()) WITH CHECK (tenant_id = public.current_user_tenant_id());

-- breeds
ALTER TABLE public.breeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "breeds_select_all" ON public.breeds FOR SELECT TO authenticated USING (true);
CREATE POLICY "breeds_write_tenant" ON public.breeds FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM species s WHERE s.id = breeds.species_id AND s.tenant_id = public.current_user_tenant_id())) WITH CHECK (EXISTS (SELECT 1 FROM species s WHERE s.id = breeds.species_id AND s.tenant_id = public.current_user_tenant_id()));

-- ============================================
-- END OF MIGRATION
-- ============================================
