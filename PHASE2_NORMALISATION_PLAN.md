# PHASE 2 - NORMALISATION
**Objectif**: Réduire 50+ scripts → 15-20 scripts organisés  
**Date**: 2026-05-14

---

## 📊 ANALYSE ACTUELLE

### Scripts Existant (50 fichiers .sh)

| Catégorie | Nombre | Scripts |
|-----------|--------|---------|
| **BACKUP** | 6 | backup.sh, egs-supabase-backup.sh, egs-supabase-backup-api.sh, setup-backup-cron.sh, test-restore-backup.sh, verify-backup.sh |
| **DEPLOY** | 5 | deploy.sh, deploy_server.sh, deploy-via-api.sh, deploy-attestation.sh, deploy-edge-function.sh |
| **SYNC** | 4 | sync-workflow.sh, sync-supabase-migrations.sh, sync-staging-schema.sh, check-db-sync.sh |
| **MONITOR** | 5 | monitor.sh, gnamba-monitor.sh, monitor-somagro.sh, install-monitoring.sh, uninstall-monitoring.sh |
| **SUPABASE** | 6 | start-supabase-local.sh, setup-supabase-autostart.sh, test-supabase-config.sh, sync-supabase-migrations.sh, refresh-egs-cloud-schema.sh, reload-schema-cache.sh |
| **MAINTENANCE** | 8 | cleanup-archives.sh, fix-filebrowser-permissions.sh, fix-password.sh, decommission_legacy_stack.sh, reactivate-migrations.sh, consolidate-migrations.sh, verify-migrations.sh, apply-migrations.sh |
| **DIAGNOSTIC** | 5 | workspace-doctor.sh, check-ports.sh, test-db-connection.sh, audit-rls.sh, smb-diagnostic.sh |
| **SETUP** | 6 | init-workflow.sh, configure-filebrowser-shares.sh, securisation_filebrowser.sh, guide-filebrowser.sh, setup-backup-cron.sh, install-monitoring.sh |
| **UTILS** | 3 | validate-env.sh, update-docker-digests.sh, generate-types.sh |
| **WORKSPACE** | 3 | workspace-stack.sh, workspace-lib.sh, workspace-doctor.sh |
| **MISC** | 4 | gnamba-health.sh, egs-schema-audit.sh, test-edge-function.sh, attestation-data.example.json |

---

## 🎯 STRUCTURE CIBLE

```
scripts/
├── README.md                      # Documentation centrale
│
├── backup/                        # 2 scripts (vs 6)
│   ├── backup-manager.sh          # backup + restore + verify
│   └── backup-scheduler.sh        # cron + retention
│
├── deploy/                        # 2 scripts (vs 5)
│   ├── deploy-manager.sh          # deploy local + cloud + server
│   └── deploy-validate.sh         # validation pre/post deploy
│
├── sync/                          # 1 script (vs 4)
│   └── sync-manager.sh            # sync-workflow.sh amélioré
│
├── monitor/                       # 2 scripts (vs 5)
│   ├── monitor-system.sh          # health + metrics + alertes
│   └── monitor-install.sh         # install + config + uninstall
│
├── database/                      # 3 scripts (vs 12)
│   ├── db-migrate.sh              # migrations + schema + types
│   ├── db-audit.sh                # rls + structure + health
│   └── db-seed.sh                 # seed + reset + cache
│
├── maintenance/                   # 2 scripts (vs 8)
│   ├── maintenance-cleanup.sh       # cleanup + archive + prune
│   └── maintenance-fix.sh         # fix permissions + password + issues
│
├── setup/                         # 2 scripts (vs 6)
│   ├── setup-init.sh              # init project + workflow
│   └── setup-services.sh          # filebrowser + monitoring + autostart
│
├── diagnostic/                    # 1 script (vs 5)
│   └── diagnostic-run.sh          # doctor + ports + connection + audit
│
└── _archive/                      # Scripts obsolètes
    ├── (29 scripts archivés)
```

**Total cible**: 15 scripts (vs 50 actuels)  
**Réduction**: 70%

---

## 📋 PLAN DE MIGRATION

### Étape 1: Créer Structure (Aujourd'hui)
- [ ] Créer dossiers backup/, deploy/, sync/, monitor/, database/, maintenance/, setup/, diagnostic/
- [ ] Créer _archive/ pour scripts obsolètes
- [ ] Créer README.md central

### Étape 2: Consolider BACKUP (Priorité Haute)
**Scripts à fusionner**:
- `backup.sh`
- `egs-supabase-backup.sh`
- `egs-supabase-backup-api.sh`
- `test-restore-backup.sh`
- `verify-backup.sh`
- `setup-backup-cron.sh`

**Nouveau script**: `backup/backup-manager.sh`
```bash
#!/bin/bash
# Usage: ./backup-manager.sh [backup|restore|verify|list|cleanup]
# Gère: Supabase cloud, local, API, rotation
```

**Politique de rétention**:
- Daily: 7 jours
- Weekly: 4 semaines
- Monthly: 12 mois
- Yearly: 2 ans

### Étape 3: Consolider DEPLOY (Priorité Haute)
**Scripts à fusionner**:
- `deploy.sh`
- `deploy_server.sh`
- `deploy-via-api.sh`

**Nouveau script**: `deploy/deploy-manager.sh`
```bash
#!/bin/bash
# Usage: ./deploy-manager.sh [local|server|cloud] [--validate]
# Gère: Build, test, deploy, rollback
```

### Étape 4: Consolider MONITOR (Priorité Moyenne)
**Scripts à fusionner**:
- `monitor.sh`
- `gnamba-monitor.sh`
- `monitor-somagro.sh`

**Nouveau script**: `monitor/monitor-system.sh`
```bash
#!/bin/bash
# Usage: ./monitor-system.sh [status|watch|health|report]
# Gère: Docker, Supabase, services, métriques
```

### Étape 5: Consolider DATABASE (Priorité Moyenne)
**Scripts à fusionner**:
- `apply-migrations.sh`
- `consolidate-migrations.sh`
- `verify-migrations.sh`
- `reactivate-migrations.sh`
- `sync-supabase-migrations.sh`
- `refresh-egs-cloud-schema.sh`
- `reload-schema-cache.sh`
- `generate-types.sh`

**Nouveau script**: `database/db-migrate.sh`
```bash
#!/bin/bash
# Usage: ./db-migrate.sh [status|apply|verify|sync|types]
# Gère: Migrations, schema, types TypeScript
```

### Étape 6: Archiver Scripts Obsolètes (Priorité Basse)
**Scripts à archiver**:
- `deploy-attestation.sh` (spécifique, peu utilisé)
- `deploy-edge-function.sh` (spécifique, peu utilisé)
- `start-supabase-local.sh` (obsolète, mode cloud privilégié)
- `setup-supabase-autostart.sh` (obsolète)
- `test-supabase-config.sh` (obsolète)
- `sync-staging-schema.sh` (redondant avec sync-workflow)
- `fix-filebrowser-permissions.sh` (one-time fix)
- `fix-password.sh` (one-time fix)
- `decommission_legacy_stack.sh` (déjà exécuté)
- `smb-diagnostic.sh` (spécifique SMB)
- `guide-filebrowser.sh` (documentation, pas script)
- `securisation_filebrowser.sh` (one-time setup)
- `configure-filebrowser-shares.sh` (one-time setup)
- `update-docker-digests.sh` (rarement utilisé)
- `check-ports.sh` (intégrable dans diagnostic)
- `test-db-connection.sh` (intégrable dans diagnostic)
- `test-edge-function.sh` (spécifique)
- `attestation-data.example.json` (fichier de données)

---

## 🚀 COMMANDES NPM STANDARDISÉES

### Proposition: Simplifier package.json

**AVANT** (59 scripts):
```json
"scripts": {
  "backup:run": "bash scripts/egs-supabase-backup.sh",
  "backup:setup": "sudo bash scripts/setup-backup-cron.sh",
  "backup:test-restore": "bash scripts/test-restore-backup.sh",
  "ops:status": "bash scripts/workspace-stack.sh status",
  "ops:doctor": "bash scripts/workspace-doctor.sh",
  ...
}
```

**APRÈS** (20 scripts):
```json
"scripts": {
  "backup": "bash scripts/backup/backup-manager.sh",
  "backup:schedule": "bash scripts/backup/backup-scheduler.sh",
  "deploy": "bash scripts/deploy/deploy-manager.sh",
  "sync": "bash scripts/sync/sync-manager.sh",
  "monitor": "bash scripts/monitor/monitor-system.sh",
  "db:migrate": "bash scripts/database/db-migrate.sh",
  "db:audit": "bash scripts/database/db-audit.sh",
  "maintenance": "bash scripts/maintenance/maintenance-cleanup.sh",
  "setup": "bash scripts/setup/setup-init.sh",
  "diagnostic": "bash scripts/diagnostic/diagnostic-run.sh",
  ...
}
```

---

## 📁 ARCHIVAGE

### Scripts à Déplacer Immédiatement
```bash
mkdir -p scripts/_archive
cd scripts

# One-time fixes
mv fix-filebrowser-permissions.sh fix-password.sh _archive/

# Obsolètes (Supabase local)
mv start-supabase-local.sh setup-supabase-autostart.sh test-supabase-config.sh _archive/

# Déjà exécutés
mv decommission_legacy_stack.sh _archive/

# Spécifiques rares
mv deploy-attestation.sh deploy-edge-function.sh smb-diagnostic.sh _archive/
mv guide-filebrowser.sh securisation_filebrowser.sh configure-filebrowser-shares.sh _archive/
```

---

## ⏱️ ESTIMATION TEMPS

| Tâche | Durée Estimée |
|-------|---------------|
| Créer structure | 15 min |
| Consolider BACKUP | 1h |
| Consolider DEPLOY | 45 min |
| Consolider MONITOR | 45 min |
| Consolider DATABASE | 1h |
| Archiver obsolètes | 15 min |
| Mettre à jour package.json | 15 min |
| Tester scripts | 30 min |
| **TOTAL** | **~5h** |

---

## ✅ PROCHAINES ACTIONS

1. **Créer structure de dossiers** (15 min)
2. **Archiver scripts obsolètes** (15 min)
3. **Consolider BACKUP** (priorité haute - 1h)
4. **Tester nouveaux scripts** (30 min)
5. **Mettre à jour documentation** (15 min)

**Prêt à commencer?**
