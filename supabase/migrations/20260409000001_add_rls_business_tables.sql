-- ============================================
-- Migration: RLS on business-critical tables (clients, projects, employees, suppliers, products, documents, tasks)
-- ============================================
-- Date: 2026-04-09
-- Purpose:
--   - These tables were identified with ZERO Row Level Security
--   - Any authenticated user (including lowest 'employe' role) could read/modify/delete ALL rows
--   - This migration adds role-based policies consistent with existing RLS patterns
--
-- RISK: Applying this on a live DB will immediately restrict access.
--   - SELECT is open to all authenticated (needed for page rendering)
--   - INSERT restricted to authenticated (no anonymous writes)
--   - UPDATE restricted to admin/gestionnaire for sensitive tables
--   - DELETE restricted to admin only
--   Test in local BEFORE applying to production.
--
-- RUN: supabase db push (or manually via Dashboard if timeout)
-- ============================================

BEGIN;

-- NOTE: If this migration hangs on Supabase Cloud, check for idle transactions:
--   SELECT pg_terminate_backend(pid) FROM pg_stat_activity
--   WHERE state = 'idle in transaction' AND pid != pg_backend_pid();

-- Reuse helper (idempotent — defined in 20260408030000 & 20260408120000)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'employe'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() IN ('admin', 'gestionnaire', 'gerant');
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- 1. CLIENTS — Client data (names, phones, emails, addresses)
-- ============================================
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;

CREATE POLICY "clients_select_policy" ON public.clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "clients_insert_policy" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (can_manage_content());

CREATE POLICY "clients_update_policy" ON public.clients
  FOR UPDATE TO authenticated
  USING (can_manage_content())
  WITH CHECK (can_manage_content());

CREATE POLICY "clients_delete_policy" ON public.clients
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 2. PROJECTS — Project data (budgets, notes, client links)
-- ============================================
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;

CREATE POLICY "projects_select_policy" ON public.projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "projects_insert_policy" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (can_manage_content());

CREATE POLICY "projects_update_policy" ON public.projects
  FOR UPDATE TO authenticated
  USING (can_manage_content())
  WITH CHECK (can_manage_content());

CREATE POLICY "projects_delete_policy" ON public.projects
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 3. EMPLOYEES — Employee data (salaries, personal info)
-- ============================================
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employees_select_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_update_policy" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON public.employees;

CREATE POLICY "employees_select_policy" ON public.employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "employees_insert_policy" ON public.employees
  FOR INSERT TO authenticated WITH CHECK (current_user_role() = 'admin');

CREATE POLICY "employees_update_policy" ON public.employees
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire'));

CREATE POLICY "employees_delete_policy" ON public.employees
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 4. SUPPLIERS — Supplier data (pricing, contact info)
-- ============================================
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suppliers_select_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update_policy" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete_policy" ON public.suppliers;

CREATE POLICY "suppliers_select_policy" ON public.suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "suppliers_insert_policy" ON public.suppliers
  FOR INSERT TO authenticated WITH CHECK (can_manage_content());

CREATE POLICY "suppliers_update_policy" ON public.suppliers
  FOR UPDATE TO authenticated
  USING (can_manage_content())
  WITH CHECK (can_manage_content());

CREATE POLICY "suppliers_delete_policy" ON public.suppliers
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 5. PRODUCTS — Product catalog (pricing, stock)
-- ============================================
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;

CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "products_insert_policy" ON public.products
  FOR INSERT TO authenticated WITH CHECK (can_manage_content());

CREATE POLICY "products_update_policy" ON public.products
  FOR UPDATE TO authenticated
  USING (can_manage_content())
  WITH CHECK (can_manage_content());

CREATE POLICY "products_delete_policy" ON public.products
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 6. DOCUMENTS — Document records (URLs, file sizes, client/project links)
-- ============================================
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_update_policy" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON public.documents;

CREATE POLICY "documents_select_policy" ON public.documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "documents_insert_policy" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (can_manage_content());

-- Documents don't have a traditional UPDATE (file URL is immutable after upload)
CREATE POLICY "documents_update_policy" ON public.documents
  FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

CREATE POLICY "documents_delete_policy" ON public.documents
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 7. TASKS — Task management (assignees, priorities, deadlines)
-- ============================================
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;

CREATE POLICY "tasks_select_policy" ON public.tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasks_insert_policy" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (can_manage_content());

-- All authenticated can update their own assigned tasks or manage content
CREATE POLICY "tasks_update_policy" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    current_user_role() IN ('admin', 'gestionnaire', 'gerant')
    OR assignee_id = auth.uid()
  )
  WITH CHECK (
    current_user_role() IN ('admin', 'gestionnaire', 'gerant')
    OR assignee_id = auth.uid()
  );

CREATE POLICY "tasks_delete_policy" ON public.tasks
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================
-- 8. CONTACT_MESSAGES — Public contact form submissions
-- ============================================
ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages_select_policy" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_insert_policy" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_update_policy" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_delete_policy" ON public.contact_messages;

-- SELECT: admin/gestionnaire only (sensitive contact data)
CREATE POLICY "contact_messages_select_policy" ON public.contact_messages
  FOR SELECT TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire'));

-- INSERT: anon allowed (public contact form)
CREATE POLICY "contact_messages_insert_policy" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "contact_messages_update_policy" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

CREATE POLICY "contact_messages_delete_policy" ON public.contact_messages
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '✅ RLS ajoutée sur: clients, projects, employees, suppliers, products, documents, tasks, contact_messages';
END $$;
