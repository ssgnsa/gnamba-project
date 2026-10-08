# 🚀 Foncier Module — Migration Deployment Runbook

**Date**: 2026-07-13  
**Target**: Production database (`postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_local`)
**Backup Location**: `backups/migration_backups/`  
**Status**: AUDIT ONLY — Awaiting approval

> **État courant vérifié le 2026-10-05 — HOLD contrôlé**
>
> Ce runbook conserve l'historique de l'audit Foncier du 13 juillet 2026. Ne
> pas exécuter ses commandes d'application telles quelles sans appliquer la
> gate ci-dessous. Les scripts opérationnels sont dans `scripts/` à la racine
> du dépôt et l'environnement Python est `backend/.venv/`.
>
> - `egs_local` est en révision `029_auth_password_lifecycle` et contient 27
>   biens Immobilier historiques sans les colonnes V2 de localité/référence/titre.
> - `egs_test` est en `032_immobilier_v2_contract` et vide pour `properties`;
>   `egs_phase34_staging` est en `028_normalize_vitrine_lots_types`.
> - Finance conserve des lignes historiques sans sens métier déterminable :
>   4 actives et 40 annulées sans type. Aucun reclassement automatique n'est
>   autorisé.
> - Aucun `alembic upgrade head` ne doit viser `egs_local` avant sauvegarde,
>   mapping métier validé et répétition complète sur staging. La migration
>   Immobilier V2 doit être testée avec `EGS_IMMO_V2_GUARD=1`, qui n'autorise
>   que `egs_test`.
> - Le backend API utilise encore localement le rôle PostgreSQL superutilisateur
>   `postgres`; la preuve append-only de production reste donc HOLD jusqu'à la
>   création contrôlée d'un rôle applicatif non-superutilisateur.
> - Recontrôle lecture seule du 2026-10-05 depuis `egs-api` : la base `egs_local`
>   retourne le rôle `postgres` superutilisateur et la révision
>   `029_auth_password_lifecycle`; l'image active expose seulement
>   `028_normalize_vitrine_lots_types`, et `alembic current` échoue avec
>   « Can't locate revision identified by 029_auth_password_lifecycle ».
>   Le DSN `.env.server` utilise le nom réseau `egs-postgres`, non résolvable
>   depuis le shell hôte hors réseau Compose.
> - Le frontend passe actuellement build, `release:check` et validation stricte
>   seulement avec une URL API de production explicite. Le script
>   `scripts/deploy-production.sh` refuse désormais tout worktree non propre.
> - La suite backend locale compte désormais 178 réussites et 15 tests ignorés
>   explicitement : 13 flux Finance sans fixture TOTP isolée, 1 test PostgreSQL
>   Immobilier V2 opt-in et 1 intégration Foncier opt-in. Aucun échec. Les
>   avertissements restants sont des dépréciations Python/FastAPI/SQLAlchemy,
>   pas des échecs de contrat. Cette preuve ne remplace pas les intégrations
>   PostgreSQL de staging/production.

**Séquence autorisée avant production** : backup vérifié → copie staging →
préflight de données et décision métier → migrations sur staging → tests API/DB
avec le rôle applicatif réel → commit CI propre et artefact signé → fenêtre de
maintenance → migration production contrôlée → smoke tests et monitoring.

Le contrôle runtime sans écriture est reproductible avec un DSN de rôle
applicatif :

```bash
DATABASE_URL='postgresql://<role-applicatif>:<mot-de-passe>@<hôte>/<base>' \
  scripts/verify-production-runtime.sh
```

Il doit confirmer un rôle non-superutilisateur et une révision Alembic connue
par l’image courante avant toute migration.

Le script racine refuse désormais toute migration sans confirmation explicite :

```bash
DATABASE_URL='postgresql://<role-applicatif>:<mot-de-passe>@<hôte>/<base>' \
EGS_BACKUP_VERIFIED=1 \
EGS_MIGRATION_APPROVED=1 \
scripts/apply-migrations.sh
```

Pour la mission Immobilier V2 uniquement, ajouter `EGS_IMMO_V2_GUARD=1` : la
cible doit alors être `egs_test`, jamais `egs_local` ni staging.

---

## 📋 ÉTAPE 1 : Pré-Déploiement (Validation Technique)

### 1.1 Vérifier l'état du schéma actuel

```bash
# Command to run
PYTHONPATH=. .venv/bin/python3 scripts/audit/schema_compare.py

# Expected output
# - Found 176 migration SQL files
# - Tables declared in migrations: 55
# - Tables in DB: 19
# - [Missing 36 tables — this is expected]
```

**Validation**: ✓ Confirmed gaps between migrations and current DB schema

### 1.2 Générer le plan de déploiement

```bash
PYTHONPATH=. .venv/bin/python3 scripts/audit/migration_dependency_analysis.py
cat backend/reports/migration_analysis.md

# Expected output
# - Total migrations: 116
# - Apply Order: functions → tables → RLS/policies → indexes → other
# - HIGH/MEDIUM/LOW risk classification
```

**Validation**: ✓ Confirmed migration order and dependencies

### 1.3 Tester la connectivité à la base

```bash
psql "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_local" -c "SELECT version();"

# Expected output: PostgreSQL 15.x
```

**Validation**: ✓ Database connection confirmed

---

## 📋 ÉTAPE 2 : Création de Backup (Obligatoire)

### 2.1 Backup complet (avant toute application)

```bash
# Command
mkdir -p backups/migration_backups
pg_dump "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_local" \
  -Fp -f "backups/migration_backups/backup_predeployment_$(date +%Y%m%d_%H%M%S).sql"

# Verify backup
ls -lh backups/migration_backups/backup_*.sql | tail -5

# Expected: File size > 1MB (depends on current data)
```

**Validation Checklist**:
- [ ] Backup file created
- [ ] File size > 100KB (indicates data present)
- [ ] File is readable: `file backup_*.sql`
- [ ] Can restore: `psql postgresql://... < backup_*.sql` (DRY-RUN on test DB)

---

## 📋 ÉTAPE 3 : Dry-Run (Plan d'Application Sans Exécution)

### 3.1 Exécuter plan en mode dry-run

```bash
PYTHONPATH=. .venv/bin/python3 scripts/deploy/safe_migration_deploy.py --dry-run

# Expected output
# =====================================================================
# MIGRATION DEPLOYMENT PLAN
# =====================================================================
# 
# Already applied: X migrations
# To apply: Y migrations
#
# Execution Plan (in order):
#   1. 20260324000000_create_foncier_base_tables_and_rpc 🟡 [MEDIUM risk]
#      └─ Creates tables: foncier_villages, foncier_lots, foncier_audit, user_village_access
#   2. 20260326000000_create_foncier_attestations_tables 🟡
#   ... (rest of migrations)
#
# [DRY-RUN MODE] No migrations applied.
```

**Validation Checklist**:
- [ ] All 116 migrations scanned
- [ ] Correct number to apply (should be ~36 based on audit)
- [ ] Risk levels classified (mix of LOW/MEDIUM/HIGH)
- [ ] No errors in parsing

**STOP HERE**: Validate plan with team before proceeding.

---

## 📋 ÉTAPE 4 : Validation Fonctionnelle (Staging)

### 4.1 Créer copie de DB pour staging (optionnel)

```bash
# If you want to test on a copy first
pg_dump "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_local" | \
  psql "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_staging"

# Then apply migrations to staging
PYTHONPATH=. .venv/bin/python3 scripts/deploy/safe_migration_deploy.py \
  --db-url "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_staging" \
  --apply
```

### 4.2 Exécuter tests d'intégration sur staging

```bash
PYTHONPATH=. .venv/bin/python3 scripts/test/test_foncier_integration.py

# Expected output
# =====================================================================
# FONCIER MODULE INTEGRATION TESTS
# =====================================================================
#
# ✓ Village created: Village Test
# ✓ Village read: Village Test created at 2026-07-13 ...
# ✓ Lot created: LOT-001 (500.0 m²)
# ✓ Lots count: 1 total, 0 available
# ✓ Lot updated: lot-test-001 → reserve
# ✓ Lot archived: lot-test-001
# ✓ Lot restored: lot-test-001
# ✓ Hierarchy check: 1 villages, 1 lots, 0 available
# ✓ RLS policies found: 24 on Foncier tables
# ✓ Test data cleaned up
#
# =====================================================================
# SUMMARY: 10/10 tests passed
# =====================================================================
```

**Validation Checklist**:
- [ ] All 10 integration tests pass
- [ ] No SQL errors in test execution
- [ ] Villages can be created
- [ ] Lots can be created/updated/archived/restored
- [ ] RLS policies are present
- [ ] Cleanup successful

---

## 📋 ÉTAPE 5 : Checklist de Validation RLS & Permissions

### 5.1 Vérifier les politiques RLS

```sql
-- Query: See RLS policies on Foncier tables
psql "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_local" << 'EOF'
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('foncier_lots', 'foncier_villages', 'foncier_audit', 'foncier_attestations')
ORDER BY tablename, cmd;
EOF

# Expected output
# tablename | policyname | permissive | roles | cmd
# =========+============+============+=======+====
# foncier_audit | foncier_audit_delete | t | {authenticated} | DELETE
# foncier_audit | foncier_audit_insert | t | {authenticated} | INSERT
# foncier_audit | foncier_audit_select | t | {authenticated} | SELECT
# foncier_audit | foncier_audit_update | t | {authenticated} | UPDATE
# ... (24 policies total)
```

**Validation Checklist**:
- [ ] At least 1 policy per Foncier table
- [ ] Policies include SELECT, INSERT, UPDATE, DELETE
- [ ] Policies reference roles (admin, gestionnaire, employe)
- [ ] No "USING (true)" without role checks (security risk)

### 5.2 Vérifier colonnes clés

```sql
-- Query: Verify critical columns exist
psql "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_local" << 'EOF'
SELECT table_name, STRING_AGG(column_name, ', ')
FROM information_schema.columns
WHERE table_name IN ('foncier_lots', 'foncier_villages')
AND table_schema = 'public'
GROUP BY table_name;
EOF

# Expected: Both tables have id, created_at, updated_at, deleted_at
```

**Validation Checklist**:
- [ ] foncier_lots: id, village_id, numero, superficie, statut, created_at, updated_at, deleted_at, created_by
- [ ] foncier_villages: id, nom, region, created_at, updated_at, deleted_at, created_by
- [ ] foncier_audit: id, lot_id, action, data, timestamp

### 5.3 Vérifier les fonctions RPC

```sql
-- Query: List Foncier functions
psql "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_local" << 'EOF'
SELECT proname FROM pg_proc
JOIN pg_namespace ns ON pg_proc.pronamespace = ns.oid
WHERE ns.nspname = 'public' AND proname LIKE '%foncier%'
ORDER BY proname;
EOF

# Expected: Functions for soft delete, restore, search, hierarchy
# - soft_delete_foncier_lot
# - restore_foncier_lot
# - search_foncier_lots
# - ensure_foncier_hierarchy
# - foncier_stats_by_village
```

**Validation Checklist**:
- [ ] At least 5 Foncier functions present
- [ ] Functions have SECURITY DEFINER flag (to bypass RLS)
- [ ] No errors when calling: `SELECT soft_delete_foncier_lot(...)`

---

## 📋 ÉTAPE 6 : Application en Production

### 6.1 Fenêtre de Maintenance

**Conditions**:
- [ ] Outside business hours (after 19:00 CI time or weekend)
- [ ] Team notified 24h in advance
- [ ] Rollback plan validated
- [ ] DBA on standby
- [ ] Staging validation complete

### 6.2 Appliquer les migrations

```bash
# PRODUCTION DEPLOYMENT
# This will prompt for confirmation before applying

PYTHONPATH=. .venv/bin/python3 scripts/deploy/safe_migration_deploy.py \
  --db-url "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_local" \
  --apply

# Expected output
# =====================================================================
# MIGRATION DEPLOYMENT PLAN
# =====================================================================
# Already applied: X migrations
# To apply: Y migrations
#
# Execution Plan (in order):
#   [list of migrations to apply]
#
# Apply Y migrations? (yes/no) > yes
#
# Creating backup...
# ✓ Backup created: backups/migration_backups/backup_20260713_143022.sql
#
# Applying Y migrations...
#
# 1/Y  ✓ 20260324000000_create_foncier_base_tables_and_rpc [OK]
# 2/Y  ✓ 20260326000000_create_foncier_attestations_tables [OK]
# ... (all should be ✓)
#
# =====================================================================
# ✓ All Y migrations applied successfully!
# =====================================================================
```

### 6.3 Validation Post-Déploiement

```bash
# 1. Vérifier les tables
psql "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_local" -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Expected: Should be 55 (or close)

# 2. Exécuter les tests
PYTHONPATH=. .venv/bin/python3 scripts/test/test_foncier_integration.py

# Expected: 10/10 tests passed

# 3. Vérifier les logs API
tail -100 backend/logs/app.log | grep -i "error\|exception" || echo "✓ No errors"
```

**Validation Checklist**:
- [ ] All migrations applied (0 failures)
- [ ] Backup created and stored
- [ ] Table count increased to ~55
- [ ] Integration tests pass
- [ ] No API errors in logs
- [ ] Frontend loads and data displays correctly

---

## 🔄 ÉTAPE 7 : Rollback (En Cas de Problème)

### 7.1 Identifier le backup à restaurer

```bash
ls -lh backups/migration_backups/ | tail -5
```

### 7.2 Arrêter le service

```bash
systemctl stop egs-web
```

### 7.3 Restaurer depuis backup

```bash
# Restore to a new DB first for verification
psql "postgresql://<role-applicatif>:<mot-de-passe>@<hôte>:5432/egs_local" < \
  backups/migration_backups/backup_20260713_143022.sql

# Verify
PYTHONPATH=. .venv/bin/python3 scripts/test/test_foncier_integration.py
```

### 7.4 Redémarrer le service

```bash
systemctl start egs-web
```

---

## ✅ Checklist de Signoff

| Rôle | Nom | Date | Signature |
|------|------|------|-----------|
| Audit | [DBA/Tech Lead] | __ | __ |
| Validation | [QA/Tester] | __ | __ |
| Approbation | [Director/PM] | __ | __ |
| Exécution | [DevOps] | __ | __ |
| Vérification Post | [Tech Lead] | __ | __ |

---

## 📞 Escalation & Support

**En cas de problème** :
- [ ] Arrêter immédiatement (ne pas appliquer d'autres migrations)
- [ ] Vérifier les logs: `tail -200 backend/logs/app.log`
- [ ] Consulter le backup: `ls -lh backups/migration_backups/`
- [ ] Contacter: [DBA contact] ou [Tech lead contact]
- [ ] Documenter l'incident: `incidents/incident_YYYYMMDD_HHMMSS.md`

---

**Status**: ✅ READY FOR DEPLOYMENT (pending final approval)

---

_Généré par: scripts/audit/schema_compare.py + scripts/audit/migration_dependency_analysis.py_  
_Date: 2026-07-13_
