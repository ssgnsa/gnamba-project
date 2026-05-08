/*
  Migration: Index sur toutes les foreign keys Somagro ERP
  Date: 2026-04-04
  Purpose: Performance — 52 FK sans index → index B-tree

  Les FK sans index causent :
  - Scans séquentiels sur chaque jointure
  - DELETE cascade très lent (scan complet de la table enfant)
  - Requêtes multi-tenant lentes (WHERE tenant_id = ?)
*/

-- ============================================
-- Index sur tenant_id (22 tables — le plus critique)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_animals_tenant_id ON public.animals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fields_tenant_id ON public.fields(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_tenant_id ON public.crop_cycles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crop_interventions_tenant_id ON public.crop_interventions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_harvests_tenant_id ON public.harvests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_buildings_tenant_id ON public.buildings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_building_types_tenant_id ON public.building_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_construction_projects_tenant_id ON public.construction_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cameras_tenant_id ON public.cameras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_counting_sessions_tenant_id ON public.counting_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_equipment_tenant_id ON public.equipment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant_id ON public.financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_health_records_tenant_id ON public.health_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_livestock_events_tenant_id ON public.livestock_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lots_tenant_id ON public.lots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON public.sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_categories_tenant_id ON public.inventory_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_id ON public.inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant_id ON public.inventory_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON public.tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);

-- ============================================
-- Index sur les autres FK relationnelles
-- ============================================

-- animals
CREATE INDEX IF NOT EXISTS idx_animals_lot_id ON public.animals(lot_id);

-- breeds
CREATE INDEX IF NOT EXISTS idx_breeds_species_id ON public.breeds(species_id);

-- building_types (tenant_id déjà indexé ci-dessus)

-- buildings
CREATE INDEX IF NOT EXISTS idx_buildings_building_type_id ON public.buildings(building_type_id);

-- cameras
CREATE INDEX IF NOT EXISTS idx_cameras_building_id ON public.cameras(building_id);

-- construction_projects
CREATE INDEX IF NOT EXISTS idx_construction_projects_building_id ON public.construction_projects(building_id);

-- counting_sessions
CREATE INDEX IF NOT EXISTS idx_counting_sessions_camera_id ON public.counting_sessions(camera_id);
CREATE INDEX IF NOT EXISTS idx_counting_sessions_lot_id ON public.counting_sessions(lot_id);

-- crop_cycles
CREATE INDEX IF NOT EXISTS idx_crop_cycles_field_id ON public.crop_cycles(field_id);

-- crop_interventions
CREATE INDEX IF NOT EXISTS idx_crop_interventions_applied_by ON public.crop_interventions(applied_by);
CREATE INDEX IF NOT EXISTS idx_crop_interventions_crop_cycle_id ON public.crop_interventions(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_crop_interventions_product_id ON public.crop_interventions(product_id);

-- equipment
CREATE INDEX IF NOT EXISTS idx_equipment_building_id ON public.equipment(building_id);

-- financial_transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_by ON public.financial_transactions(created_by);

-- harvests
CREATE INDEX IF NOT EXISTS idx_harvests_crop_cycle_id ON public.harvests(crop_cycle_id);

-- health_records
CREATE INDEX IF NOT EXISTS idx_health_records_administered_by ON public.health_records(administered_by);
CREATE INDEX IF NOT EXISTS idx_health_records_animal_id ON public.health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_records_lot_id ON public.health_records(lot_id);
CREATE INDEX IF NOT EXISTS idx_health_records_medication_id ON public.health_records(medication_id);

-- inventory_items
CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON public.inventory_items(category_id);

-- inventory_movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_by ON public.inventory_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON public.inventory_movements(item_id);

-- livestock_events
CREATE INDEX IF NOT EXISTS idx_livestock_events_animal_id ON public.livestock_events(animal_id);
CREATE INDEX IF NOT EXISTS idx_livestock_events_created_by ON public.livestock_events(created_by);
CREATE INDEX IF NOT EXISTS idx_livestock_events_lot_id ON public.livestock_events(lot_id);

-- lots
CREATE INDEX IF NOT EXISTS idx_lots_breed_id ON public.lots(breed_id);
CREATE INDEX IF NOT EXISTS idx_lots_building_id ON public.lots(building_id);
CREATE INDEX IF NOT EXISTS idx_lots_species_id ON public.lots(species_id);

-- sale_items
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);

-- sales
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);

-- species (tenant_id déjà indexé ci-dessus)

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

-- users (tenant_id déjà indexé ci-dessus)

-- ============================================
-- Index composites pour les requêtes fréquentes
-- ============================================

-- Dashboard : données récentes par tenant
CREATE INDEX IF NOT EXISTS idx_harvests_tenant_date ON public.harvests(tenant_id, harvest_date DESC);
CREATE INDEX IF NOT EXISTS idx_crop_interventions_tenant_date ON public.crop_interventions(tenant_id, application_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_tenant_date ON public.health_records(tenant_id, administered_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tenant_date ON public.financial_transactions(tenant_id, transaction_date DESC);

-- Livestock : animaux par lot
CREATE INDEX IF NOT EXISTS idx_animals_lot_health ON public.animals(lot_id, health_status);

-- Inventory : mouvements par item
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_date ON public.inventory_movements(item_id, movement_date DESC);

-- ============================================
-- END OF MIGRATION
-- ============================================
