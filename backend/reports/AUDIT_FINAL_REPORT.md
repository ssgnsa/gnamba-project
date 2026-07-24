# 🔍 EGS — Audit Schéma & Stratégie de Conformité DB

**Date**: 13 juillet 2026  
**Statut**: ✅ **AUDIT COMPLET** — Awaiting deployment approval  
**Scope**: Vérification d'architecture unifiée, suppression Supabase, conformité migrations DB

---

## 📊 Résumé Exécutif

### État Actuel
| Aspect | État | Details |
|--------|------|---------|
| **Architecture** | ✅ Unified (local-only) | `VITE_API_MODE=local`, `VITE_LOCAL_API_URL` configuré |
| **Supabase Runtime** | ✅ Retiré | `@supabase/supabase-js` pas en `dependencies` |
| **Tunnel Cloudflare** | ✅ En place | `cloudflared.service`, scripts présents |
| **API Unifiée** | ✅ Fonctionnelle | `/api/v1/` routes exposées, `apiClient` utilisé |
| **Schéma DB** | ⚠️ **INCOMPLET** | 19/55 tables créées, 36 tables manquantes, 0 fonctions RPC |

### Problème Principal Identifié
**Gap entre migrations et état DB** : Les migrations déclarent 55 tables mais seulement 19 existent. Causes possibles :
1. Migrations non appliquées lors de l'initialisation de la base
2. Archivage de migrations sans exécution
3. Instance DB configurée comme « minimale » pour dev/test

**Impact** : 
- Module Foncier : villages/lots invisibles, hiérarchie cassée
- Module Immobilier : tables manquantes (properties, lease_contracts, rent_payments)
- Module CMS : site_content, page_layouts manquantes
- RLS/Security : 0 politique RLS appliquée (tous les objets visibles par tous les authentifiés)

---

## ✅ Validations Effectuées

### ✓ Architecture Unifiée Confirmée
```
Frontend (React)
    ↓ (apiClient)
API Unifiée (/api/v1/*)
    ↓ (FastAPI)
Backend (Python)
    ↓ (SQLAlchemy ORM)
PostgreSQL Local (egs_local)
```
- **Frontend** : Utilise `apiClient` et `getLocalApiBaseUrl()` pour toutes requêtes
- **Backend** : Toutes routes exposées via `/api/v1/`
- **Pas de Supabase** : Vérifiés dans `package.json`, `src/api/client.ts`, `backend/app/main.py`
- **Pas de legacy routes** : Data layer scripts (`check-data-layer.sh`) enforced

### ✓ Tunnel Cloudflare Validé
- Service `cloudflared` : présent (scripts, config, systemd unit)
- Status : en-place pour public domain (api.gnambaservices.ci)
- Impact : proxy pour accès extérieur (non-bloquant pour audit DB)

### ✓ Migration Analysis Complétée
- 176 fichiers SQL scannés (supabase/migrations + backups)
- 116 migrations uniques identifiées
- Dépendances et ordre d'application déterminé
- Risques classifiés (🟢 LOW / 🟡 MEDIUM / 🔴 HIGH)

---

## 🚨 Findings Détaillés

### 1️⃣ Tables Manquantes (36 x)

| Catégorie | Tables | Count | Impact |
|-----------|--------|-------|--------|
| **Foncier** | foncier_villages, foncier_lots, foncier_attestations, foncier_audit, foncier_village_config | 5 | 🔴 **CRITICAL** |
| **Immobilier** | properties, lease_contracts, rent_payments, locataires, tenants | 5 | 🔴 **CRITICAL** |
| **CMS** | site_content, page_layouts, site_realisations, contact_messages | 4 | 🔴 **CRITICAL** |
| **Leads** | leads, lead_campaigns, lead_interactions, campagnes, lead_optouts | 5 | 🟡 MEDIUM |
| **Media** | media_files, media_audit_logs, media_versions, media_usage | 4 | 🟡 MEDIUM |
| **RH** | user_profiles, user_village_access, employees, employes_presence | 4 | 🟡 MEDIUM |
| **Autres** | tasks, projects, clients, suppliers, documents, products, finances, etc. | 8 | 🟡 MEDIUM |

### 2️⃣ Fonctions SQL Manquantes (38 x)

**Impact RLS/Security** :
- `current_user_role()` : absent → impossible vérifier rôle utilisateur
- `is_admin()`, `has_finance_access()` : absent → pas de vérification rôle
- `soft_delete_foncier_lot()`, `restore_foncier_lot()` : absent → pas d'archivage sûr

**Impact Métier** :
- `search_foncier_lots()` : absent → recherche manuelle requise
- `ensure_foncier_hierarchy()` : absent → hiérarchie village/quartier non maintenue
- `foncier_stats_by_village()` : absent → compteurs unavailable

### 3️⃣ Politiques RLS Manquantes (0)

**Current State** : Aucune politique RLS appliquée
```
SELECT COUNT(*) FROM pg_policies WHERE schemaname='public';
→ 0
```

**Expected** :
- 24 policies on 6 critical tables (user_profiles, finances, app_settings, media_files, site_content, page_layouts)
- 32 policies on 8 business tables (clients, contacts, documents, employees, products, projects, suppliers, tasks)
- Plus RLS sur foncier, immobilier, leads, etc.

**Security Risk** : 🔴 **HIGH**
- Any authenticated user can SELECT/INSERT/UPDATE/DELETE any row
- Gestionnaires can see admin data
- Finance data not protected
- Soft-deleted items not actually hidden

---

## 📋 Plan de Correction Recommandé

### Phase 1 : Préparation (Immédiate)

- [x] Audit schéma vs migrations ✅
- [x] Génération ordre d'application idempotent ✅
- [x] Création scripts de déploiement sûr ✅
- [x] Création tests d'intégration ✅
- [x] Documentation runbook production ✅

**Livrables** :
- `backend/reports/schema_audit.json`
- `backend/reports/migration_analysis.json`
- `backend/reports/DEPLOYMENT_RUNBOOK.md`
- `scripts/deploy/safe_migration_deploy.py`
- `scripts/test/test_foncier_integration.py`

### Phase 2 : Validation (Avant Déploiement)

**Étape 1 - Backup**
```bash
pg_dump postgresql://postgres:postgres@localhost:5432/egs_local \
  -Fp > backups/migration_backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

**Étape 2 - Dry-Run**
```bash
PYTHONPATH=. .venv/bin/python3 scripts/deploy/safe_migration_deploy.py --dry-run
# Valider le plan auprès de l'équipe avant exécution
```

**Étape 3 - Staging (Optionnel)**
```bash
# Copier la base vers staging
pg_dump ... | psql postgresql://...egs_staging

# Appliquer migrations à staging
PYTHONPATH=. .venv/bin/python3 scripts/deploy/safe_migration_deploy.py \
  --db-url postgresql://...egs_staging --apply

# Tester
PYTHONPATH=. .venv/bin/python3 scripts/test/test_foncier_integration.py
```

### Phase 3 : Déploiement Production (Fenêtre Contrôlée)

**Timing** : Hors heures d'affaires (après 19:00 ou weekend)

**Étapes** :
1. Notifier l'équipe 24h avant
2. Arrêter le service EGS (`systemctl stop egs-web`)
3. Exécuter backup
4. Appliquer migrations avec `safe_migration_deploy.py --apply`
5. Valider post-déploiement (tests, logs, UI)
6. Redémarrer service (`systemctl start egs-web`)
7. Monitorer pendant 1h

**Estimé** : 30-60 min (143 migrations à appliquer)

### Phase 4 : Validation Post-Déploiement

```bash
# Vérifier table count
psql ... -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
# Expected: ~55

# Exécuter tests
PYTHONPATH=. .venv/bin/python3 scripts/test/test_foncier_integration.py
# Expected: 10/10 PASS

# Vérifier RLS
psql ... -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname='public';"
# Expected: ~100+ policies

# Tester UI (Foncier, Immobilier, CMS, Leads)
curl http://localhost:5173
# Vérifier data appears in UI
```

---

## ⚠️ Risques & Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| Migration échoue → DB invalide | MEDIUM | 🔴 CRITICAL | Backup + rollback script |
| Duplication de tables (migration applied twice) | MEDIUM | 🟡 MEDIUM | Idempotent script (CREATE IF NOT EXISTS) |
| RLS bloque accès légitime après déploiement | LOW | 🟡 MEDIUM | Staging test first + admin override policy |
| Application crash après migration | LOW | 🟡 MEDIUM | Arrêt service pendant migration, restart après |
| Performance dégradée (145 migrations) | LOW | 🟢 LOW | Tables petites en dev/staging (peu d'impact) |

---

## 🎯 Recommandations Prioritaires

1. **Immédiate** : Valider plan dry-run avec DBA/Tech Lead
2. **Before Production** : Exécuter sur staging si possible
3. **Production Window** : Prévoir maintenance window 30-60 min
4. **Post-Deploy** : Monitorer logs + tester chaque module (Foncier, Immobilier, CMS, Leads)
5. **Documentation** : Mettre à jour MIGRATIONS.md avec statut d'application

---

## 📎 Artefacts

| Fichier | Description | Statut |
|---------|-------------|--------|
| `backend/reports/schema_audit.json` | Audit complet schéma vs migrations | ✅ Généré |
| `backend/reports/schema_audit.md` | Résumé audit (tables/fonctions/policies manquantes) | ✅ Généré |
| `backend/reports/migration_analysis.json` | Analyse dépendances migrations (ordre, risques) | ✅ Généré |
| `backend/reports/migration_analysis.md` | Plan d'application recommandé | ✅ Généré |
| `backend/reports/DEPLOYMENT_RUNBOOK.md` | Runbook complet prod (7 étapes, checklist, rollback) | ✅ Généré |
| `scripts/deploy/safe_migration_deploy.py` | Script déploiement sûr (backup, validation, confirm) | ✅ Créé |
| `scripts/test/test_foncier_integration.py` | Tests intégration Foncier (CRUD, archive, RLS) | ✅ Créé |
| `scripts/audit/schema_compare.py` | Audit schéma vs DB (collecte métadonnées) | ✅ Créé |
| `scripts/audit/migration_dependency_analysis.py` | Analyse dépendances migrations | ✅ Créé |

---

## ✅ Checklist Signoff

- [ ] **DBA** : Valider plan de déploiement
- [ ] **QA** : Exécuter tests staging
- [ ] **PM** : Confirmer fenêtre maintenance
- [ ] **DevOps** : Préparer rollback
- [ ] **Tech Lead** : Approuver mise en production

---

## 📞 Support & Escalation

**En cas de problème** :
1. Arrêter immédiatement (pas d'autres migrations)
2. Consulter backup : `ls -lh backups/migration_backups/`
3. Vérifier logs : `tail -200 backend/logs/app.log`
4. Contacter : [DBA] ou [Tech Lead]
5. Documenter incident : `incidents/incident_$(date +%s).md`

---

**Rapport généré par** : `scripts/audit/schema_compare.py` + `scripts/audit/migration_dependency_analysis.py`  
**Date** : 13 juillet 2026  
**Status** : ✅ **READY FOR APPROVAL** (pending team sign-off)
