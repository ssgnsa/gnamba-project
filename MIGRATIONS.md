# 📋 EGS — Guide de Migrations Supabase

> **Règle d'or** : Ne jamais modifier l'historique des migrations. Toujours créer une migration correctrice.

---

## 📁 Structure des migrations

```
supabase/migrations/
├── 20260326000000_create_foncier_attestations_tables.sql
├── 20260330000000_fix_unique_constraint.sql
├── 20260402080000_create_immobilier_tables.sql
├── ...
└── YYYYMMDDHHMMSS_action_table.sql     ← Format obligatoire
```

**Convention de nommage** : `YYYYMMDDHHMMSS_action_table.sql`

| Partie           | Description              | Exemples                                       |
| ---------------- | ------------------------ | ---------------------------------------------- |
| `YYYYMMDDHHMMSS` | Timestamp précis         | `20260408120000`                               |
| `action`         | Ce que fait la migration | `create`, `fix`, `rls`, `rename`, `add_column` |
| `table`          | Table concernée          | `foncier_lots`, `user_profiles`                |

---

## 🔄 Workflow de Migration

### 1. Développement Local

```bash
# 1. Démarrer Supabase Local
supabase start

# 2. Créer la migration SQL
touch supabase/migrations/20260408150000_create_ma_table.sql

# 3. Écrire la migration (voir checklist ci-dessous)

# 4. Appliquer en local
supabase db push

# 5. Vérifier dans le Studio
# → http://localhost:54323

# 6. Tester avec des comptes non-admin pour valider RLS
```

### 2. Déploiement Production (Cloud)

```bash
# Option A : Push direct (petites migrations)
supabase db push --db-url "postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres"

# Option B : Exécuter manuellement (grosses migrations / timeouts)
# 1. Exporter le backup avant toute modification
./scripts/egs-supabase-backup.sh

# 2. Copier le SQL de la migration
cat supabase/migrations/20260408120000_rls_critical_tables.sql | pbcopy

# 3. Aller dans Supabase Dashboard → SQL Editor
# 4. Coller et exécuter
# 5. Vérifier les résultats dans Table Editor
```

### 3. Correction d'un Bug de Schema

```bash
# ❌ JAMAIS : modifier une migration existante
# rm supabase/migrations/20260402080000_create_immobilier_tables.sql  ← INTERDIT

# ✅ TOUJOURS : créer une migration correctrice
touch supabase/migrations/20260408160000_fix_ma_table_colonne_manquante.sql

# Exemple de correction :
cat > supabase/migrations/20260408160000_fix_ma_table_colonne_manquante.sql << 'EOF'
-- Fix: Ajouter la colonne "date_echeance" manquante sur lease_contracts
-- Contexte: La migration 20260402080000 avait oublié cette colonne
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS date_echeance DATE;
EOF

supabase db push
```

---

## ✅ Checklist avant de Créer une Migration

- [ ] **Nom** : suit le format `YYYYMMDDHHMMSS_action_table.sql`
- [ ] **Idempotent** : utilise `IF NOT EXISTS`, `DROP ... IF EXISTS`, `ADD COLUMN IF NOT EXISTS`
- [ ] **RLS** : `ENABLE ROW LEVEL SECURITY` si table sensible
- [ ] **Politiques** : `CREATE POLICY` pour SELECT/INSERT/UPDATE/DELETE
- [ ] **Commentaires** : explique le "pourquoi" (pas le "comment")
- [ ] **Test local** : `supabase db push` en local réussi
- [ ] **Test RLS** : vérifié avec un compte `employe` ET un compte `admin`
- [ ] **Backup** : exporter le schema avant de push en prod (pour les migrations critiques)

---

## 📝 Template de Migration

```sql
-- ============================================
-- Migration: [Description courte]
-- ============================================
-- Date: YYYY-MM-DD
-- Purpose: [Pourquoi cette migration est nécessaire]
-- Impact: [Quelles tables/colonnes sont modifiées]
-- Risk: [LOW / MEDIUM / HIGH — HIGH = backup obligatoire avant prod]
-- RUN MANUALLY: [Oui/Non — si Oui, expliquer pourquoi (timeout, grosse table, etc.)]
-- ============================================

BEGIN;

-- 1. Créer/modifier la table
CREATE TABLE IF NOT EXISTS public.ma_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- ... autres colonnes
);

-- 2. Activer RLS (TOUJOURS pour les tables sensibles)
ALTER TABLE public.ma_table ENABLE ROW LEVEL SECURITY;

-- 3. Créer les politiques RLS
-- Pattern standard :
-- SELECT → tous authentifiés (ou restreint par rôle/village)
-- INSERT → admin, gestionnaire, gerant
-- UPDATE → admin, gestionnaire, gerant
-- DELETE → admin uniquement

DROP POLICY IF EXISTS "ma_table_select" ON public.ma_table;
CREATE POLICY "ma_table_select" ON public.ma_table
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ma_table_insert" ON public.ma_table;
CREATE POLICY "ma_table_insert" ON public.ma_table
  FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

DROP POLICY IF EXISTS "ma_table_update" ON public.ma_table;
CREATE POLICY "ma_table_update" ON public.ma_table
  FOR UPDATE TO authenticated
  USING (current_user_role() IN ('admin', 'gestionnaire', 'gerant'))
  WITH CHECK (current_user_role() IN ('admin', 'gestionnaire', 'gerant'));

DROP POLICY IF EXISTS "ma_table_delete" ON public.ma_table;
CREATE POLICY "ma_table_delete" ON public.ma_table
  FOR DELETE TO authenticated
  USING (current_user_role() = 'admin');

-- 4. Index pour les performances (optionnel)
CREATE INDEX IF NOT EXISTS idx_ma_table_created_at ON public.ma_table(created_at DESC);

COMMIT;
```

---

## 🔐 RLS — Patterns Standards

### Pattern 1 : Ouvert en lecture, restreint en écriture

```sql
-- Utilisé pour : properties, locataires, lease_contracts, rent_payments
SELECT  → tous authentifiés
INSERT  → admin, gestionnaire, gerant
UPDATE  → admin, gestionnaire, gerant
DELETE  → admin uniquement
```

### Pattern 2 : Restreint par rôle (finances)

```sql
-- Utilisé pour : finances
SELECT  → admin, gestionnaire, gerant (PAS employe)
INSERT  → admin, gestionnaire, gerant
UPDATE  → admin, gestionnaire, gerant
DELETE  → admin uniquement
```

### Pattern 3 : Village-scoped (foncier)

```sql
-- Utilisé pour : foncier_attestations, foncier_lots
SELECT  → admin voit tout, autres voient leurs villages via user_village_access
INSERT  → admin, gestionnaire (avec village access)
UPDATE  → admin, gestionnaire (avec village access)
DELETE  → admin uniquement
```

### Pattern 4 : User-scoped (user_profiles)

```sql
-- Utilisé pour : user_profiles
SELECT  → own profile OR admin/gestionnaire sees all
INSERT  → admin uniquement
UPDATE  → own profile OR admin
DELETE  → admin uniquement
```

### Pattern 5 : Admin-write, public-read (settings, content)

```sql
-- Utilisé pour : app_settings, site_content, page_layouts
SELECT  → tous authentifiés (rendu site public)
INSERT  → admin uniquement (ou admin/gestionnaire)
UPDATE  → admin uniquement
DELETE  → admin uniquement
```

---

## 🚨 Gestion des Problèmes

### Timeout pendant `supabase db push`

```bash
# Si la migration contient des sous-requêtes complexes ou touche une grosse table :
# 1. Marquer la migration avec "RUN MANUALLY" dans les commentaires
# 2. Exporter le backup
./scripts/egs-supabase-backup.sh

# 3. Exécuter manuellement via Supabase Dashboard → SQL Editor
```

### Migration appliquée partiellement

```bash
# 1. Vérifier l'état actuel
supabase db remote --db-url "postgresql://..."

# 2. Créer une migration correctrice (jamais modifier l'originale)
# 3. Tester en local d'abord
```

### RLS bloque les opérations légitimes

```bash
# Vérifier les politiques actuelles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ma_table';

# Vérifier si RLS est activé
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'ma_table';
```

---

## 🗄️ Tables Pré-Existantes (Sans Migration de Création)

Ces tables existent dans la base mais n'ont **pas de migration de création** dans le repo (créées manuellement ou avant l'historique) :

| Table           | RLS               | Dernière Migration RLS                   | Notes              |
| --------------- | ----------------- | ---------------------------------------- | ------------------ |
| `user_profiles` | ✅ 20260408120000 | `20260408120000_rls_critical_tables.sql` | Rôles, permissions |
| `finances`      | ✅ 20260408120000 | `20260408120000_rls_critical_tables.sql` | Vérifié RLS activé |
| `app_settings`  | ✅ 20260408120000 | `20260408120000_rls_critical_tables.sql` | Brand settings     |
| `media_files`   | ✅ 20260408120000 | `20260408120000_rls_critical_tables.sql` | Media library      |
| `site_content`  | ✅ 20260408120000 | `20260408120000_rls_critical_tables.sql` | CMS key-value      |
| `page_layouts`  | ✅ 20260408120000 | `20260408120000_rls_critical_tables.sql` | Page builder       |

---

## 📜 Historique des Migrations

| Migration        | Date       | Description                                                                              | Risk     |
| ---------------- | ---------- | ---------------------------------------------------------------------------------------- | -------- |
| `20260326000000` | 2026-03-26 | Création foncier attestations                                                            | MEDIUM   |
| `20260330000000` | 2026-03-30 | Fix unique constraint                                                                    | LOW      |
| `20260402080000` | 2026-04-02 | Création tables immobilier                                                               | MEDIUM   |
| `20260402090000` | 2026-04-02 | Fix tenants schema                                                                       | LOW      |
| `20260404080000` | 2026-04-04 | Fix RLS foncier attestations                                                             | MEDIUM   |
| `20260405120000` | 2026-04-05 | Rename tenants → locataires                                                              | HIGH     |
| `20260405130000` | 2026-04-05 | RLS comprehensive immobilier                                                             | MEDIUM   |
| `20260405140000` | 2026-04-05 | Lead capture system                                                                      | MEDIUM   |
| `20260405150000` | 2026-04-05 | Foncier base tables + RPC                                                                | MEDIUM   |
| `20260405160000` | 2026-04-05 | Fix lease_contracts FK + RLS cleanup                                                     | LOW      |
| `20260407020000` | 2026-04-07 | Master RLS cleanup part 1                                                                | MEDIUM   |
| `20260408030000` | 2026-04-08 | current_user_role() function                                                             | LOW      |
| `20260408070000` | 2026-04-08 | RLS lease_contracts (remote)                                                             | LOW      |
| `20260408080000` | 2026-04-08 | RLS rent_payments (remote)                                                               | LOW      |
| `20260408090000` | 2026-04-08 | RLS properties (remote)                                                                  | LOW      |
| `20260408100000` | 2026-04-08 | RLS locataires (remote)                                                                  | LOW      |
| `20260408120000` | 2026-04-08 | **RLS critical tables** (user_profiles, finances, app_settings, media, content, layouts) | **HIGH** |

---

## 🧪 Commandes Utiles

```bash
# Pousser les migrations en local
supabase db push

# Pousser en production (Cloud)
supabase db push --db-url "postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres"

# Exporter le schema actuel
supabase db dump -f backup.sql

# Exporter uniquement le schema (pas les données)
supabase db dump --schema-only -f schema.sql

# Voir l'état des migrations
supabase migration list

# Reset local DB (⚠️ destructif)
supabase db reset
```

---

**Dernière mise à jour** : 2026-04-08  
**Mainteneur** : Équipe EGS
