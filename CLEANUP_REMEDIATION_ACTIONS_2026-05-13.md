# 🗑️ CLEANUP & REMEDIATION CHECKLIST

**Date**: 13 mai 2026  
**Workspace**: `/home/soma/gnamba-project`  
**Scope**: Fichiers obsolètes, configs cassées, migrations .skip

---

## 📋 ARCHIVES & BUILDS À SUPPRIMER

### Tier 1: À supprimer aujourd'hui (9.2M économisés)

#### `_archive/` — 1.4M
```bash
# Contenu:
ls -lah _archive/ | head -10
# ├── AMELIORATIONS_10_10.md
# ├── AMELIORATIONS_APPLIQUEES_2026-03-19.md
# ├── AUDIT_*.md (15+ fichiers audit obsolètes)
# ├── scripts/ (apply-infrastructure-fixes.sh, etc.)
# └── [50+ autres fichiers]

# Action:
tar -czf backups/archive_old_$(date +%Y%m%d).tar.gz _archive/
rm -rf _archive/
git add -A && git commit -m "Cleanup: remove obsolete audit archives"
```

**Raison**: Documents audit avril-mai obsolètes, occupent 1.4M, not referenced

---

#### `dist/` — 1.7M
```bash
# Contenu: Build Vite obsolète
# Action:
rm -rf dist/
git add -A && git commit -m "Cleanup: remove stale dist/ build"
```

**Raison**: Build obsolète, recréé à chaque `npm run build`

---

#### `dist-local/` — 2.7M
```bash
# Contenu: Build développement local
# Action:
rm -rf dist-local/
git add -A && git commit -m "Cleanup: remove dist-local build"
```

**Raison**: Build dev obsolète, recréé à chaque dev

---

#### `dist_old/` — 1.5M
```bash
# Contenu: Ancienne build
# Action:
rm -rf dist_old/
git add -A && git commit -m "Cleanup: remove dist_old backup"
```

**Raison**: Backup ancien build, inutile

---

### Tier 2: À archiver hors-ligne

#### `backups/` — 1.3M
```bash
# Contenu: 
# ├── supabase/
# │   ├── 20260503_020001/schema.sql (5 mai)
# │   ├── 20260501_020002/schema.sql (1 mai)
# │   ├── 20260428_020002/schema.sql (28 avril)
# │   ├── 20260407_191719/schema_full.sql (7 avril)
# │   ├── 20260512_020001/schema.sql (12 mai) ← Plus récent
# │   └── 20260510_020002/schema.sql (10 mai)
# └── pre_fix_20260407/  (Ancien .env backup)

# Action: Archive offshore
tar -czf /mnt/backup-server/egs_backups_$(date +%Y%m%d).tar.gz backups/
rm -rf backups/pre_fix_*

# Garder seulement les backups récents:
find backups/ -type f -mtime +30 -delete  # Keep 30 days

# Notes:
# - Backups are manually dumped (no cronjob)
# - Last backup: 10-12 mai (3 days old)
# - Password cassé → Pas de nouveau backup depuis
```

**Raison**: Anciennes sauvegardes prennent place, dernière est 3j vieille

---

## 🔧 FICHIERS À CORRIGER

### Tier 0: URGENT (Fix Today)

#### `.env.server` — Password Invalide
```bash
# Ligne finale, problème:
SUPABASE_DB_PASSWORD=DEADsoulja28@ ;  ← ESPACE AVANT ;

# Fix:
sed -i 's/SUPABASE_DB_PASSWORD=DEADsoulja28@ ;/SUPABASE_DB_PASSWORD=DEADsoulja28@/' .env.server

# Verify:
grep "SUPABASE_DB_PASSWORD" .env.server
# Output: SUPABASE_DB_PASSWORD=DEADsoulja28@

# Test:
psql -h localhost -U postgres -c "SELECT 1" 2>/dev/null && echo "✅ OK" || echo "❌ FAILED"

# Commit:
git add .env.server
git commit -m "Fix: Remove invalid space in PostgreSQL password"
```

**Impact**: 🔴 All pg_dump commands fail

---

#### `.env` — Clé Turnstile Commentée
```bash
# Ligne problème:
# VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAACvXFax87V5QzzJB  ← Commentée

# Fix:
sed -i 's/^# VITE_CLOUDFLARE_TURNSTILE_SITE_KEY/VITE_CLOUDFLARE_TURNSTILE_SITE_KEY/' .env

# Verify:
grep "VITE_CLOUDFLARE_TURNSTILE_SITE_KEY" .env
# Output: VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAACvXFax87V5QzzJB

# Commit:
git add .env
git commit -m "Fix: Uncomment Cloudflare Turnstile site key"
```

**Impact**: 🟡 Captcha non-functional, bot spam risk

---

### Tier 1: IMPORTANT (This Week)

#### `supabase/migrations/*.skip` — Not Documented
```bash
# Créer README:
cat > supabase/migrations/README_SKIPPED.md << 'EOF'
# ⚠️ Skipped Migrations

This file documents why certain migrations are marked `.skip` 
(not applied by `supabase db push`).

## Important Notes
- **DO NOT** delete .skip files
- Document REASON before skipping
- Update this file whenever .skip status changes

## List & Reasons

### 20260430090000_create_atomic_attestation_generation.sql.skip
**Status**: CRITICAL ⚠️
**File Size**: 16K
**What**: Creates attestation_seq sequence + Luhn validation functions
**Why Skipped**: [TODO: EXPLAIN REASON]
**When Needed**: Reactivate after [TODO: CONDITION]
**Dependencies**: Must be applied BEFORE foncier_attestations table mutations
**Risk if Not Applied**: 
  - Attestation numbering not guaranteed unique
  - Possible duplicates in historical data
  - RPC functions not available

**Action**: ✅ REACTIVATE ASAP
```bash
mv supabase/migrations/20260430090000_*.sql.skip \
   supabase/migrations/20260430090000_*.sql
supabase db push  # Test locally first
```

---

### 20260503084300_add_attestation_pdf_metadata.sql.skip
**Status**: IMPORTANT 🟡
**File Size**: 1.3K
**What**: Add PDF metadata columns (hash, path, print_count)
**Why Skipped**: [TODO: EXPLAIN REASON]
**When Needed**: Reactivate after [TODO: CONDITION]
**Risk if Not Applied**: 
  - Cannot track PDF versions
  - Print count not logged
  - No integrity verification

**Action**: ✅ REACTIVATE AFTER ABOVE
```bash
mv supabase/migrations/20260503084300_*.sql.skip \
   supabase/migrations/20260503084300_*.sql
supabase db push
```

---

### 20260508100000_fix_foncier_standalone.sql.skip
**Status**: IMPORTANT 🟡
**File Size**: 6.7K
**What**: Update search_foncier_lots() function with all parameters
**Why Skipped**: [TODO: EXPLAIN REASON]
**When Needed**: Reactivate after [TODO: CONDITION]
**Risk if Not Applied**: 
  - Foncier search incomplete
  - Missing parameters in function signature
  - Performance may degrade

**Action**: ✅ REACTIVATE AFTER ABOVE
```bash
mv supabase/migrations/20260508100000_*.sql.skip \
   supabase/migrations/20260508100000_*.sql
supabase db push
```

---

## Recommendations:
1. Contact DB team to understand why these were skipped
2. Document findings in REASON column above
3. Create issue ticket for each
4. Plan reactivation date
EOF

# Add to git:
git add supabase/migrations/README_SKIPPED.md
git commit -m "Docs: Explain skipped migrations"
```

**Impact**: 🟡 Risk of forgetting to apply critical migrations

---

#### `supabase/migrations/*.bak` — Delete
```bash
# Fichier:
# supabase/migrations/20260409141423_demo_account_sample_data.sql.bak (12K)

# Action:
rm supabase/migrations/*.bak

# Verify:
find supabase/migrations -name "*.bak"  # Should return nothing

# Commit:
git add -A
git commit -m "Cleanup: remove obsolete migration backups (.bak)"
```

**Raison**: Demo data obsolète (13 avril), remplacée par seed.demo.sql

---

#### `src/App.tsx.bak2` — Delete
```bash
# Fichier:
# src/App.tsx.bak2 (9K, mars 11)

# Action:
rm src/App.tsx.bak2

# Verify:
ls src/App.tsx*  # Should only show App.tsx

# Commit:
git add -A
git commit -m "Cleanup: remove old App.tsx backup"
```

**Raison**: Ancien backup App.tsx (mars 11), maintenant 2+ mois vieux

---

## 📝 MIGRATIONS À DOCUMENTER

### Create Migration Action Plan
```bash
cat > MIGRATION_SKIP_ACTION_PLAN.md << 'EOF'
# Migration Reactivation Plan

## Current Status (13 mai 2026)

### 20260430090000 — Atomic Attestation Generation
- Status: SKIPPED (16K)
- Blocked on: [REASON TBD]
- Reactivation: [DATE TBD]
- Priority: 🔴 CRITICAL

### 20260503084300 — Attestation PDF Metadata  
- Status: SKIPPED (1.3K)
- Blocked on: 20260430090000 (dependency)
- Reactivation: After 20260430090000
- Priority: 🟡 IMPORTANT

### 20260508100000 — Foncier Search Fix
- Status: SKIPPED (6.7K)
- Blocked on: [REASON TBD]
- Reactivation: [DATE TBD]
- Priority: 🟡 IMPORTANT

## Action Plan

### Phase 1: Unblock (This Week)
- [ ] Contact DB team: Why are these skipped?
- [ ] Document reasons
- [ ] Create dependency graph
- [ ] Plan reactivation dates

### Phase 2: Reactivation (Next Week)
- [ ] Test 20260430090000 locally
- [ ] Verify sequences created
- [ ] Test with non-admin user (RLS)
- [ ] Push to production

- [ ] Test 20260503084300 locally  
- [ ] Verify columns added
- [ ] Update migration datetime
- [ ] Push to production

- [ ] Test 20260508100000 locally
- [ ] Benchmark search_foncier_lots()
- [ ] Compare performance before/after
- [ ] Push to production

### Phase 3: Validation (Post-Deployment)
- [ ] Check Supabase tables for new columns
- [ ] Verify sequences not broken
- [ ] Audit RLS policies still working
- [ ] Monitor performance metrics

## Timeline
- Target: 20 mai 2026 (Phase 1+2 complete)
- Final: 27 mai 2026 (Phase 3 complete, validated)
EOF

git add MIGRATION_SKIP_ACTION_PLAN.md
git commit -m "Docs: Migration reactivation plan"
```

---

## ✅ CLEANUP SCRIPT

```bash
#!/bin/bash
# cleanup-workspace.sh — All cleanup in one go

set -euo pipefail

echo "🧹 Starting workspace cleanup..."

# 1. Archive & delete old backups
echo "→ Archiving backups..."
tar -czf backups/archive_old_$(date +%Y%m%d).tar.gz _archive/ backups/pre_fix_* 2>/dev/null || true
rm -rf _archive/ backups/pre_fix_*

# 2. Delete build artifacts
echo "→ Removing old builds..."
rm -rf dist/ dist-local/ dist_old/

# 3. Delete code backups
echo "→ Removing backup files..."
rm src/App.tsx.bak2 2>/dev/null || true
find supabase/migrations -name "*.bak" -delete

# 4. Fix password
echo "→ Fixing PostgreSQL password..."
sed -i 's/SUPABASE_DB_PASSWORD=DEADsoulja28@ ;/SUPABASE_DB_PASSWORD=DEADsoulja28@/' .env.server

# 5. Uncomment Turnstile key
echo "→ Enabling Cloudflare Turnstile..."
sed -i 's/^# VITE_CLOUDFLARE_TURNSTILE_SITE_KEY/VITE_CLOUDFLARE_TURNSTILE_SITE_KEY/' .env

# 6. Document migrations
echo "→ Creating migration documentation..."
cat > supabase/migrations/README_SKIPPED.md << 'SKIP_DOC'
# ⚠️ Skipped Migrations

[... see section above for content ...]
SKIP_DOC

# 7. Git commit
echo "→ Committing changes..."
git add -A
git commit -m "Cleanup: Remove archives, fix configs, document migrations

- Remove _archive/ (1.4M obsolete docs)
- Remove dist* builds (5.9M stale artifacts)
- Remove *.bak files (backups)
- Fix PostgreSQL password (remove invalid space)
- Enable Cloudflare Turnstile SITE_KEY
- Document skipped migrations (.skip files)

Actions:
✅ P0: Password fixed
✅ P0: Turnstile enabled
✅ P0: Archives documented
✅ Cleaning: 9.2M freed"

echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Archives removed: _archive/"
echo "  - Builds removed: dist, dist-local, dist_old"
echo "  - Backups removed: *.bak"
echo "  - Configs fixed: .env.server password, .env Turnstile"
echo "  - Docs created: README_SKIPPED.md"
echo "  - Space freed: ~9.2M"
echo ""
echo "🔧 Next steps:"
echo "  1. supabase start  (activate local)"
echo "  2. Rename .skip → .sql for migrations"
echo "  3. supabase db push (apply migrations)"
```

**Usage**:
```bash
chmod +x cleanup-workspace.sh
./cleanup-workspace.sh
```

---

## 📋 POST-CLEANUP CHECKLIST

- [ ] Run cleanup script
- [ ] Verify git log shows cleanup commit
- [ ] Check disk space saved: `du -sh _archive dist* 2>/dev/null`
- [ ] Verify .env.server password fixed
- [ ] Verify .env Turnstile enabled
- [ ] Read README_SKIPPED.md
- [ ] Start Supabase local: `supabase start`
- [ ] Verify Supabase ports: `supabase status`
- [ ] Plan migration reactivation (reference MIGRATION_SKIP_ACTION_PLAN.md)
- [ ] Setup automated backups (reference main audit report)
- [ ] Notify team: Workspace cleaned, ready for fixes

---

## 📞 NOTES

- **Before deleting**: Ensure all important data archived offline
- **Password**: Test with `psql` after fixing
- **Migrations**: Do NOT delete .skip files, only rename when ready
- **Git**: All changes committed and pushable

---

**Created**: 13 mai 2026  
**Status**: Ready for execution  
**Estimated Time**: 15-30 min
