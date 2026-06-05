# 🐛 BUG & ISSUE TRACKER — EGS + SOMAGRO

**Audit Date**: 13 mai 2026  
**Total Issues**: 10 (3 P0, 2 P1, 4 P2, 1 P3)  
**Format**: Issue tracking pour action plan

---

## 🔴 P0 — CRITICAL (Bloques)

### ISSUE #001: PostgreSQL Password Invalid
**Severity**: 🔴 **CRITICAL**  
**Status**: 🆕 **NEW**  
**Filed**: 2026-05-13  
**Due**: 2026-05-13 (TODAY)

**Title**: Invalid space in PostgreSQL password breaks all backups

**Description**:
The `.env.server` file contains an invalid PostgreSQL password with trailing space:
```
SUPABASE_DB_PASSWORD=DEADsoulja28@ ;
```

The space before semicolon causes PostgreSQL authentication to fail.

**Impact**:
- ❌ `pg_dump` commands fail
- ❌ Backup automation broken
- ❌ Database restore impossible
- ❌ Migration scripts fail

**Evidence**:
- File: `.env.server` — last line
- Pattern: `...@ ;` (space before semicolon)
- Expected: `...@` (no trailing space/semicolon)

**Root Cause**: Manual typo when editing password

**Fix**:
```bash
# Change:
- SUPABASE_DB_PASSWORD=DEADsoulja28@ ;
+ SUPABASE_DB_PASSWORD=DEADsoulja28@

# Verify:
psql -h localhost -U postgres -c "SELECT 1" && echo OK
```

**Assignee**: DevOps  
**Effort**: 5 min  
**Tests**:
- [ ] `pg_dump` command succeeds
- [ ] `psql` connection test passes
- [ ] Backup script runs without error

---

### ISSUE #002: Supabase Local Completely Inactive
**Severity**: 🔴 **CRITICAL**  
**Status**: 🆕 **NEW**  
**Filed**: 2026-05-13  
**Due**: 2026-05-13 (TODAY)

**Title**: Supabase local services not running — development mode blocked

**Description**:
```
$ supabase status
failed to inspect container health: Error response from daemon: No such container: supabase_db_gnamba-project
```

The `.env` file is configured for local Supabase (`VITE_SUPABASE_MODE=local`), but no containers are running. This makes offline development impossible.

**Impact**:
- ❌ Local development mode unusable
- ❌ Docker workflows blocked
- ❌ Tests cannot run locally
- ❌ Scripts like `workspace-stack.sh` fail

**Evidence**:
- No containers: `docker ps | grep supabase` returns nothing
- Port 54321 not listening: `netstat -tuln | grep 54321` returns nothing
- Supabase CLI confirms: `supabase status` error

**Root Cause**: `supabase start` was not run recently

**Fix**:
```bash
cd /home/soma/gnamba-project
supabase start
# Wait 1-2 minutes
supabase status  # Should show 4 containers

# Verify ports:
ss -tuln | grep -E "54321|54322|54323|54324"
```

**Assignee**: DevOps  
**Effort**: 10 min  
**Tests**:
- [ ] `supabase status` shows 4 running containers
- [ ] Ports 54321-54324 are listening
- [ ] `curl http://localhost:54323` returns 200
- [ ] `workspace-stack.sh egs status` succeeds

---

### ISSUE #003: Critical Migrations Skipped (Attestation Generation)
**Severity**: 🔴 **CRITICAL**  
**Status**: 🆕 **NEW**  
**Filed**: 2026-05-13  
**Due**: 2026-05-13 (TODAY)

**Title**: Attestation sequencing migration not applied — data integrity at risk

**Description**:
Migration `20260430090000_create_atomic_attestation_generation.sql.skip` (16K) is marked `.skip` and not applied to the database.

This migration creates:
- `attestation_seq` — Official numbering sequence
- Unique indexes on reference + control_number
- Luhn validation functions
- Atomic transaction functions

**Without this**, attestation numbering is not guaranteed unique.

**Impact**:
- 🔴 Duplicate attestations possible in history
- 🔴 Official numbering not guaranteed
- 🔴 Witnesses may be orphaned
- 🔴 Cannot verify attestation authenticity

**Evidence**:
- File: `supabase/migrations/20260430090000_create_atomic_attestation_generation.sql.skip`
- Status: File exists with `.skip` suffix
- Applied?: NO (not applied to database)

**Root Cause**: Unknown — no documentation why skipped

**Fix**:
```bash
# 1. Backup first:
./scripts/egs-supabase-backup.sh

# 2. Reactivate locally:
cd /home/soma/gnamba-project
mv supabase/migrations/20260430090000_create_atomic_attestation_generation.sql.skip \
   supabase/migrations/20260430090000_create_atomic_attestation_generation.sql

# 3. Test locally:
supabase db push

# 4. Verify in Studio:
# http://localhost:54323
# - Check sequence attestation_seq exists
# - Check indexes created
# - Check functions deployed

# 5. Push to production:
supabase db push --db-url "postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres"
```

**Assignee**: Database  
**Effort**: 30 min (including testing)  
**Tests**:
- [ ] Sequence created: `SELECT currval('attestation_seq')`
- [ ] Unique indexes exist: `\d foncier_attestations` in psql
- [ ] Functions callable: `SELECT attestation_luhn_check_digit('12345')`
- [ ] RLS still working: Test with `employee` role

**Related Issues**: #004, #005

---

## 🟡 P1 — URGENT (24-48h)

### ISSUE #004: Attestation PDF Metadata Migration Skipped
**Severity**: 🟡 **URGENT**  
**Status**: 🆕 **NEW**  
**Filed**: 2026-05-13  
**Due**: 2026-05-14

**Title**: PDF metadata columns not available — cannot track print history

**Description**:
Migration `20260503084300_add_attestation_pdf_metadata.sql.skip` (1.3K) is not applied.

This migration adds:
- `hash_sha256` — PDF integrity verification
- `pdf_path` — Where PDF is stored
- `pdf_generated_at` — Generation timestamp  
- `printed_by` — Who printed it
- `printed_at` — When printed
- `print_count` — Number of times printed

**Impact**:
- ⚠️ Cannot track PDF versions
- ⚠️ Print history not logged
- ⚠️ No integrity verification via hash

**Evidence**:
- File: `supabase/migrations/20260503084300_add_attestation_pdf_metadata.sql.skip`
- Status: Not applied to database

**Fix**:
```bash
# Only after ISSUE #003 is resolved!

mv supabase/migrations/20260503084300_add_attestation_pdf_metadata.sql.skip \
   supabase/migrations/20260503084300_add_attestation_pdf_metadata.sql

supabase db push  # local
supabase db push --db-url "..."  # production
```

**Assignee**: Database  
**Effort**: 15 min  
**Dependency**: ✅ Must complete ISSUE #003 first  
**Tests**:
- [ ] Columns exist: `\d foncier_attestations`
- [ ] Function callable: `SELECT attach_foncier_attestation_pdf_metadata(...)`

**Related Issues**: #003

---

### ISSUE #005: Foncier Search Function Incomplete
**Severity**: 🟡 **URGENT**  
**Status**: 🆕 **NEW**  
**Filed**: 2026-05-13  
**Due**: 2026-05-14

**Title**: search_foncier_lots() not updated — missing search parameters

**Description**:
Migration `20260508100000_fix_foncier_standalone.sql.skip` (6.7K) not applied.

This migration replaces `search_foncier_lots()` function with complete parameter set:
- p_search, p_statut, p_village, p_quartier, p_lotissement
- p_sort, p_dir, p_page, p_limit, p_include_archived

**Impact**:
- ⚠️ Advanced search parameters unavailable
- ⚠️ Search performance may be suboptimal

**Evidence**:
- File: `supabase/migrations/20260508100000_fix_foncier_standalone.sql.skip`
- Status: Not applied

**Fix**:
```bash
# Only after ISSUE #003 is resolved!

mv supabase/migrations/20260508100000_fix_foncier_standalone.sql.skip \
   supabase/migrations/20260508100000_fix_foncier_standalone.sql

supabase db push  # local + prod
```

**Assignee**: Database  
**Effort**: 20 min  
**Dependency**: ✅ Must complete ISSUE #003 first  
**Tests**:
- [ ] Function signature matches expected parameters
- [ ] Search with all parameters works
- [ ] Performance acceptable (< 200ms for 1000 records)

**Related Issues**: #003

---

## 🟠 P2 — IMPORTANT (Week)

### ISSUE #006: Migration Skipped Status Not Documented
**Severity**: 🟠 **IMPORTANT**  
**Status**: 🆕 **NEW**  
**Filed**: 2026-05-13  
**Due**: 2026-05-17

**Title**: No documentation explaining why 3 migrations are .skip

**Description**:
Files ending in `.skip` are not applied by Supabase, but there's no README explaining:
- WHY they are skipped
- WHEN they should be reactivated
- WHAT to watch for

This creates risk of:
- Developers forgetting about them
- Merge conflicts if multiple people edit
- Regression when code depends on them

**Impact**:
- ⚠️ Documentation incomplete
- ⚠️ Risk of confusion/regression
- ⚠️ Hard to onboard new team members

**Evidence**:
- 3 `.skip` files with NO comments
- NO README in migrations directory
- NO issue tickets filed

**Fix**:
```bash
# Create README:
cat > supabase/migrations/README_SKIPPED.md << 'EOF'
# Skipped Migrations

This directory contains migration files marked `.skip` that are not automatically
applied by Supabase CLI. See below for status and action items.

[Content: See CLEANUP_REMEDIATION_ACTIONS_2026-05-13.md]
EOF

git add supabase/migrations/README_SKIPPED.md
git commit -m "Docs: Explain skipped migrations"
```

**Assignee**: Technical Writer / Database  
**Effort**: 15 min  
**Tests**:
- [ ] README_SKIPPED.md exists
- [ ] All 3 .skip files documented
- [ ] Reasons explained
- [ ] Reactivation criteria clear

---

### ISSUE #007: Archives & Build Artifacts (9.2M) Consuming Space
**Severity**: 🟠 **IMPORTANT**  
**Status**: 🆕 **NEW**  
**Filed**: 2026-05-13  
**Due**: 2026-05-17

**Title**: 9.2M of obsolete files cluttering workspace

**Description**:
```
_archive/          1.4M    obsolete audit docs
backups/           1.3M    old SQL dumps
dist/              1.7M    stale build
dist-local/        2.7M    stale build
dist_old/          1.5M    stale build
src/App.tsx.bak2   9K      backup code
migrations/*.bak   12K     backup migration
```

These files:
- Take up disk space
- Slow down git operations
- Create confusion about "real" state
- Should be archived offline

**Impact**:
- ⚠️ +9.2M consumed
- ⚠️ Git operations slower
- ⚠️ Workspace larger than needed

**Evidence**:
- `du -sh _archive/ backups/ dist*` shows totals
- `.gitignore` excludes them but they still exist locally
- No `.gitkeep` or cleanup script

**Fix**:
```bash
# Archive offline:
tar -czf /mnt/backup-server/egs_archive_$(date +%Y%m%d).tar.gz \
  _archive/ backups/ 

# Delete locally:
rm -rf _archive/ dist* backups/pre_fix_*
rm src/App.tsx.bak2
rm supabase/migrations/*.bak

git add -A && git commit -m "Cleanup: Remove obsolete archives and builds"
```

**Assignee**: DevOps  
**Effort**: 10 min  
**Tests**:
- [ ] Files deleted from filesystem
- [ ] Git commit shows removals
- [ ] Archive backed up offline
- [ ] Disk space verified reclaimed

---

### ISSUE #008: RLS Policies Fragmented Across Migrations
**Severity**: 🟠 **IMPORTANT**  
**Status**: 🆕 **NEW**  
**Filed**: 2026-05-13  
**Due**: 2026-05-17

**Title**: RLS policies spread across 20+ migrations — audit risk

**Description**:
RLS (Row Level Security) policies are scattered across many migrations (273 total occurrences):
```
- 20260405130000_add_comprehensive_rls_policies.sql      40 policies
- 20260408070000_rls_lease_contracts.sql                 8 policies
- 20260408090000_rls_properties.sql                      ? policies
- 20260408100000_rls_locataires.sql                      ? policies
- [10+ more migrations with RLS]
```

**Risk**:
- ⚠️ Hard to audit completeness
- ⚠️ Easy to forget a table
- ⚠️ No central inventory

**Evidence**:
- 273 CREATE POLICY occurrences across 20+ files
- No audit script to verify all tables have policies
- SomAgro has better: all 23 tables in single migration (0005)

**Fix**:
```bash
# Create audit script:
cat > scripts/audit-rls-completeness.sh << 'SCRIPT'
#!/bin/bash
# Verify all public tables have RLS policies

psql -U postgres -d postgres <<SQL
SELECT 
  t.tablename,
  COUNT(p.policyname) as policy_count,
  CASE WHEN COUNT(p.policyname) = 0 THEN '❌ MISSING' ELSE '✅ OK' END
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
GROUP BY t.tablename
ORDER BY policy_count ASC, t.tablename;
SQL
SCRIPT

chmod +x scripts/audit-rls-completeness.sh

# Run audit:
./scripts/audit-rls-completeness.sh
```

**Assignee**: Database / Security  
**Effort**: 30 min  
**Tests**:
- [ ] Script created and executable
- [ ] All public tables have policies
- [ ] No tables with count=0
- [ ] Cronjob added for periodic audit

---

## 🔵 P3 — NICE-TO-HAVE (Backlog)

### ISSUE #009: SomAgro Mode Configuration Confusing
**Severity**: 🔵 **MINOR**  
**Status**: 🆕 **NEW**  
**Filed**: 2026-05-13  
**Due**: TBD (Backlog)

**Title**: somagro-erp/.env.server says local mode but URLs are cloud

**Description**:
```
SOMAGRO_SUPABASE_MODE=local  ← Says LOCAL
NEXT_PUBLIC_SUPABASE_URL=https://lyopxhyizjsesrqicjsu.supabase.co  ← But URL is CLOUD
```

This is confusing — the mode doesn't match the actual configuration.

**Fix**: Update documentation or rename variable

**Assignee**: Documentation  
**Effort**: 5 min

---

### ISSUE #010: SomAgro Service Not in Systemd
**Severity**: 🔵 **MINOR**  
**Status**: 🆕 **NEW**  
**Filed**: 2026-05-13  
**Due**: TBD (Backlog)

**Title**: somagro-web.service file exists but not installed in /etc/systemd/system/

**Description**:
The unit file exists at project root but is not active in systemd. Only `egs-web.service` is installed.

**Fix**: 
```bash
sudo cp somagro-web.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable somagro-web.service
sudo systemctl start somagro-web.service
```

**Assignee**: DevOps  
**Effort**: 10 min

---

## 📊 SUMMARY TABLE

| ID | Title | Severity | Status | Due | Effort | Owner |
|----|-------|----------|--------|-----|--------|-------|
| #001 | Invalid PostgreSQL password | 🔴 P0 | NEW | TODAY | 5min | DevOps |
| #002 | Supabase local inactive | 🔴 P0 | NEW | TODAY | 10min | DevOps |
| #003 | Attestation seq migration | 🔴 P0 | NEW | TODAY | 30min | Database |
| #004 | PDF metadata migration | 🟡 P1 | NEW | Tomorrow | 15min | Database |
| #005 | Foncier search migration | 🟡 P1 | NEW | Tomorrow | 20min | Database |
| #006 | .skip migrations not documented | 🟠 P2 | NEW | Fri | 15min | TechWriter |
| #007 | Archives 9.2M cleanup | 🟠 P2 | NEW | Fri | 10min | DevOps |
| #008 | RLS policies audit | 🟠 P2 | NEW | Fri | 30min | Database |
| #009 | SomAgro mode confusing | 🔵 P3 | NEW | Backlog | 5min | Docs |
| #010 | SomAgro service not in systemd | 🔵 P3 | NEW | Backlog | 10min | DevOps |

**Total Effort**:
- P0 (Critical): 45 min
- P1 (Urgent): 35 min  
- P2 (Important): 55 min
- P3 (Backlog): 15 min
- **TOTAL**: ~2.5 hours

---

## 📋 NEXT STEPS

### Action Sequence
1. [ ] Resolve #001 (5 min)
2. [ ] Resolve #002 (10 min)
3. [ ] Resolve #003 (30 min)
4. [ ] Resolve #004 (15 min)
5. [ ] Resolve #005 (20 min)
6. [ ] Resolve #006 (15 min)
7. [ ] Resolve #007 (10 min)
8. [ ] Resolve #008 (30 min)
9. [ ] Backlog #009, #010 for later

**Estimated Completion**: Today + Tomorrow (~1h today, 1h tomorrow)

---

**Tracker Created**: 13 mai 2026 11:30 UTC  
**Last Updated**: 13 mai 2026 11:34 UTC
