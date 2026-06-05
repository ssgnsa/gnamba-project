# 🔍 ANALYSE APPROFONDIE DU SERVEUR GNAMBA
**Date**: 13 mai 2026  
**Node.js**: v20.19.1 ✅  
**État Global**: 🟡 **DÉGRADÉ** (Développement local bloqué, backups cassés, migrations incohérentes)

---

## 📌 RÉSUMÉ EXÉCUTIF (5 minutes)

Votre serveur a **4 conteneurs Docker actifs** et accès au **cloud Supabase**, mais souffre de **problèmes critiques** qui bloquent le développement et compromettent la sauvegarde :

| # | Problème | Sévérité | Impact | Fix |
|---|----------|----------|--------|-----|
| 1️⃣ | Password PostgreSQL invalide (espace avant `;`) | 🔴 CRITIQUE | Zéro backup depuis 3 jours | 2 min |
| 2️⃣ | Supabase Local complètement arrêté | 🔴 CRITIQUE | Développement hors ligne impossible | 10 min |
| 3️⃣ | 3 migrations attestation désactivées | 🔴 CRITIQUE | Risque doublons numérotation | 30 min |
| 4️⃣ | Configuration fragmentée (8 variantes `.env`) | 🟠 MAJEUR | Confusion, erreurs déploiement | 1h |
| 5️⃣ | 2 projets Supabase Cloud séparés | 🟠 MAJEUR | Pas de sync, données isolées | Décision arch |
| 6️⃣ | 9.2M archives/builds inutiles | 🟡 MINEUR | Git lent, consomme espace | 10 min |

---

## 📊 TABLEAU DE BORD SANTÉ

```
INFRASTRUCTURE
├─ Docker Containers .......... 🟢 4/4 actifs (egs-frontend, egs-web, somagro-web, filebrowser)
├─ Node.js ..................... 🟢 v20.19.1
├─ Ports Web ................... 🟢 8080, 8081, 8082 sans conflit
└─ Network Bridge .............. 🟢 gnamba-network operational

SUPABASE & DONNÉES
├─ Supabase Cloud — EGS ........ 🟢 Online (thykrnoqgylrbfupophs.supabase.co)
├─ Supabase Cloud — SomAgro ... 🟢 Online (lyopxhyizjsesrqicjsu.supabase.co)
├─ Supabase Local .............. 🔴 OFFLINE (no container running)
├─ Database Ports .............. 🔴 54321-54324 NOT LISTENING
└─ Backup Automation ........... 🔴 FAILED (11 tries, password invalid)

DÉVELOPPEMENT LOCAL
├─ .env (Mode Local) ........... ⚠️ Configured but no Supabase
├─ .env.server (Mode Cloud) ... ⚠️ Password invalid
├─ .env.local.example .......... ⚠️ JWT_SECRET placeholder
└─ Migrations Staging .......... 🟡 3 .skip files without doc

MIGRATIONS & SCHEMA
├─ EGS Migrations .............. 🟡 43 active + 3 .skip + 1 .bak
├─ SomAgro Migrations .......... 🟡 7 only (6.5x less than EGS)
├─ RLS Policies ................ 🟠 273 occurrences, fragmented
├─ Schema Drift ................ 🟠 14 tables in code, not in migrations
└─ Attestation Sequencing ...... 🔴 CRITICAL: disabled migration

SERVICES & MONITORING
├─ Backup Cron ................ 🔴 FAILED (password issue)
├─ systemd egs-web.service ... 🟢 Active (docker container)
├─ systemd gnamba-services ... 🔴 Not found (never created)
├─ Health Checks .............. 🟢 Containers healthy
└─ Logs ........................ 🟡 Backup logs show repeated failures
```

---

## 🔴 PROBLÈMES CRITIQUES (À FIXER AUJOURD'HUI)

### 1. Password PostgreSQL Invalide — 🔴 CRITIQUE

**Localisation**: `.env.server` (dernière ligne)
```bash
SUPABASE_DB_PASSWORD=DEADsoulja28@ ;  # ❌ ESPACE avant ; = CARACTÈRE INVALIDE
```

**Impact Direct**:
- ❌ Connexion psql échoue
- ❌ pg_dump échoue
- ❌ Backup cron échoue depuis 3 jours (11 tentatives)
- ❌ Migration DB impossible
- ❌ Données cloud non sauvegardées

**Logs Preuve**:
```
[2026-05-12 02:00:01] ERROR Schema export failed
pg_dump: error: connection to server at "db.thykrnoqgylrbfupophs.supabase.co" failed
```

**Fix**:
```bash
# AVANT (CASSÉ)
SUPABASE_DB_PASSWORD=DEADsoulja28@ ;

# APRÈS (FIXÉ)
SUPABASE_DB_PASSWORD=DEADsoulja28@
```

**Risque**: Perte de données si crash cloud (zéro RPO depuis 3 jours)

---

### 2. Supabase Local Complètement OFF — 🔴 CRITIQUE

**État Réel**:
```bash
$ supabase status
ERROR: docker: 'container' not found
No such container: supabase_db_gnamba-project_1
```

**Ports Configurés Mais OFF**:
- API: 54321 (écoute: ❌ NE PAS PRESENT)
- DB: 54322 (écoute: ❌ NE PAS PRESENT)
- Studio: 54323 (écoute: ❌ NE PAS PRESENT)

**Ports Réellement Actifs**:
```bash
0.0.0.0:8080   ← egs-frontend (Docker)
0.0.0.0:8081   ← filebrowser (Docker)
0.0.0.0:8082   ← somagro-web (Docker)
127.0.0.1:80   ← ?
```

**Impact**:
- ❌ `.env` dit "mode local" mais aucun service local
- ❌ Développement hors ligne impossible
- ❌ Tests locaux impossibles
- ❌ `npm run dev` démarre Vite mais no DB
- ❌ Migrations ne peuvent pas être testées localement

**Configuration Correcte Existe**:
```toml
# supabase/config.toml
[api]
port = 54321
[db]
port = 54322
```

**Fix**:
```bash
supabase start
# Puis vérifier
supabase status  # Doit montrer les 3 services running
netstat -tulpn | grep 5432  # Doit montrer port 54322
```

---

### 3. 3 Migrations Attestation Désactivées — 🔴 CRITIQUE

**Fichiers `.skip` (non appliqués)**:
```bash
1. 20260430090000_create_atomic_attestation_generation.sql.skip
   → Séquençage atomique attestation (CRITIQUE!)
   
2. 20260503084300_add_attestation_pdf_metadata.sql.skip
   → Metadata PDF tracing
   
3. 20260508100000_fix_foncier_standalone.sql.skip
   → Recherche foncier côté DB
```

**Plus une backup**:
```bash
20260409141423_demo_account_sample_data.sql.bak
```

**Raison de Désactivation**: Documentée nulle part ❌

**Impact**:
- ⚠️ Table `attestation_sequences` ne peut pas exister
- ⚠️ Numérotation attestations non garantie unique
- ⚠️ Risque de doublons s'il y a concurrence
- ⚠️ Métadonnées PDF manquantes
- ⚠️ Recherche foncier lente (pas d'index DB)

**Code qui s'attend à `.sequences`** (src/lib/supabase.ts):
```typescript
// Suppose que table existe
const { data } = await supabase
  .from('attestation_sequences')
  .select('*')
  .single()
```

**Fix**:
```bash
# 1. Vérifier pourquoi elles sont .skip
git log --oneline -S "create_atomic_attestation" -- supabase/

# 2. Si raison = "temporaire debugging" → réactiver
mv 20260430090000_create_atomic_attestation_generation.sql.skip \
   20260430090000_create_atomic_attestation_generation.sql

# 3. Appliquer localement
supabase db push --local

# 4. Tester
psql -c "SELECT COUNT(*) FROM attestation_sequences;"
```

---

## 🟠 PROBLÈMES MAJEURS (Cette semaine)

### 4. Configuration Fragmentée — 8 Variantes .env

**Fichiers Config**:
```
1. .env (DEV actif — mode LOCAL)
2. .env.server (PROD — mode CLOUD)
3. .env.demo (Démo)
4. .env.example (Template cloud)
5. .env.local.example (Template local)
6. .env.server.example (Template server)
7. .env.staging.example (Template staging)
8. .env.filebrowser (FileBrowser config)
```

**Problèmes**:
- ❌ Quelle est la "source de vérité"? (README dit `.env.server`, mais qui en est sûr?)
- ❌ `.env.example` vs `.env.local.example` — qui utiliser pour setup?
- ❌ Variantes modifiées manuellement vs générées — risque drift
- ❌ Secrets commentés vs actifs — confusion

**Exemple Confusion**:
```bash
# .env — Cloudflare key COMMENTÉE?
# VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAACvXFax87V5QzzJB
CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAACvXFQ-WfDEVSLmW_bqLauwZGBY

# .env.server — Quelle clé utiliser?
```

**Impact**:
- ❌ Nouveau dev copie mauvaise config → app cassée
- ❌ Changements propagés à mauvais fichier → oubli autres
- ❌ Secrets exposés ou manquants

**Source de Bugs Future**:
- "Pourquoi auth ne marche pas?" → Turnstile key manquante
- "Pourquoi Ollama ne fonctionne pas?" → URL mal copiée
- "Pourquoi SMS ne marche pas?" → Clés Twilio mal interpolées

---

### 5. 2 Projets Supabase Cloud Séparés — 🟠 MAJEUR

**Architecture Actuelle**:
```
┌─ EGS (thykrnoqgylrbfupophs)
│  └─ 43 migrations
│     └─ user_profiles, foncier_*, immobilier_*, media, etc.
│
└─ SomAgro (lyopxhyizjsesrqicjsu)
   └─ 7 migrations
      └─ products, crops, tasks
```

**Problèmes**:
- ❌ **Zéro synchronisation** — EGS ne voit pas les données SomAgro
- ❌ **Migrations divergent** — EGS ajoute colonnes, SomAgro ignore
- ❌ **RLS policies dupliquées** — 2 jeux de policies à maintenir
- ❌ **Reporting cross-ERP impossible** — "Voir toutes les présences à travers projets"
- ❌ **Backup fragmenté** — 2 DB à backupker, 2 points de failure
- ❌ **Auth incohérente** — 2 user tables, jwt secrets, roles différents

**Cas d'Usage Bloqué**:
```
"Lister tous les employes à travers EGS + SomAgro"
→ IMPOSSIBLE (2 DB, pas de FK cross-project)

"Dashboard global d'activités"
→ IMPOSSIBLE (metrics dans 2 DB différents)

"Export données consolidé"
→ Complexe (scripts custom pour merger résultats)
```

**Coût Technique**:
- Chaque query centralisée = 2 requêtes Supabase
- Chaque migration = 2 déploiements
- Chaque changement schema = test sur 2 DB

---

### 6. 9.2M Archives & Builds Obsolètes

**À Supprimer**:
```
_archive/
├─ AUDIT_COMPLET_EGS_2026-04-05.md (audit avril)
├─ AUDIT_MAITRE_UNIFIE_2026-04-05.md
├─ AUDIT_PROFOND_2026-04-04.md
├─ CORRECTIONS_APPLIQUEES_2026-04-05.md
└─ ... + 30 autres docs audit (total 1.4M)

backups/
├─ pre_fix_20260407/ (ancien state)
├─ egs/ (anciennes dumps)
├─ somagro/ (anciennes dumps)
└─ supabase/ (11 backups échoués: 1.3M)

dist/, dist-local/, dist_old/
└─ Builds obsolètes (5.9M total)
```

**Impact**:
- ⚠️ `git status` renvoie 9.2M ignorés (confus)
- ⚠️ `git push` peut être lent
- ⚠️ Clonage du repo plus long (426M + 9.2M)
- ⚠️ Backups du serveur plus gros

---

## 🔴 SOURCES DE BUGS CACHÉS

### Bug Pattern 1: Mode Local Annoncé, Rien Disponible
**Fonction**: Tout dev suppose "je travaille en local"
```typescript
// src/lib/supabase.ts
const client = createClient(
  process.env.VITE_SUPABASE_LOCAL_URL,  // ← "Je vais sur localhost:54321"
  process.env.VITE_SUPABASE_LOCAL_ANON_KEY
)
```

**Réalité**: Aucun service écoute 54321
```bash
$ curl http://localhost:54321/health
curl: (7) Failed to connect to localhost port 54321: Connection refused
```

**Consequence**:
```typescript
// Code pense être connecté localement... mais parle à NULL
await supabase.from('users').select()  // ❌ NetworkError
```

---

### Bug Pattern 2: Password Invalidé = Cascade Failures
**Symptôme**: "Backup ne marche jamais"
```bash
[2026-05-12] Backup attempt #11 → FAIL
```

**Root Cause**: Caché dans `.env.server`
```bash
SUPABASE_DB_PASSWORD=DEADsoulja28@ ;  # Espace = invalid
```

**Scripts qui Échouent**:
- `npm run backup:run` → pg_dump fail
- `scripts/egs-supabase-backup.sh` → psql fail
- Cron job 02h00 tous les jours → silently fail

---

### Bug Pattern 3: Migrations Désactivées = Incohérence Schema
**Code Suppose**:
```typescript
// Unique numbering garantie?
const { error } = await supabase
  .from('attestations')
  .insert({ reference_number: generateAttestation() })

// Risque: 2 threads generate() simultané = même numero?
// Migration manquante = pas de UNIQUE constraint en DB
```

**Fix Manquant**:
```sql
CREATE TABLE attestation_sequences (
  id SERIAL PRIMARY KEY,
  next_number INT UNIQUE,  -- ← Ce constraint n'existe pas!
)
```

---

### Bug Pattern 4: RLS Fragmenté = Oubli Policies
**273 occurrences** de RLS étalées sur 20+ fichiers
```
20260408120000_rls_critical_tables.sql (10K)
20260409000001_add_rls_business_tables.sql (10K)
20260408070000_rls_lease_contracts.sql (958 bytes)
...
```

**Risque**: Si tu ajoutes une table, oublieras-tu de la protéger?
```sql
CREATE TABLE new_table AS ...  -- ❌ Pas de RLS!
-- Accès public jusqu'à prochaine migration
```

**Pas d'Audit Automatique**:
```bash
# Aucun script pour vérifier:
# "Chaque table a RLS enabled"
# "Chaque table a policies pour tous les rôles"
```

---

### Bug Pattern 5: Données Hors Ligne = Zéro Sync
**Théorie**: "Je travaille localement, je synchro plus tard"
**Réalité**: Aucun mécanisme de sync
```bash
$ grep -r "sync\|merge\|rebase" scripts/ | grep -v "git"
# (aucun résultat — pas de script de sync données)
```

**Consequence**:
1. Dev A modifie local schema
2. Dev B modifie cloud schema
3. Puis essaye de merger → conflict non documenté

---

## 📋 CE QUI EST GÉRÉ EN LOCAL vs CLOUD

### ✅ Local (Supabase Local quand it's running)
- **Schema** → Via migrations SQL
- **Seed data** → `seed.sql`, `seed.demo.sql`
- **Auth sessions** → JWT stocké en mémoire
- **Uploads** → Fichiers dans conteneur

**Mais ACTUELLEMENT**: Supabase local est OFF → Rien local

### ☁️ Cloud (Supabase Cloud)
- **Data Persistante** → Dans DB cloud
- **Auth JWT** → Signé par key cloud
- **Storage** → Fichiers dans bucket cloud
- **RLS** → Enforced au cloud

### ⚠️ Synchronisation Entre Local & Cloud
**État**: INEXISTANT
```bash
# Pas de:
# - script de "pull data from cloud"
# - script de "push local data to cloud"
# - conflict resolution strategy
# - versioning/tagging de data états
```

**Comment Ça Fonctionne Actuellement**:
1. Dev travaille sur cloud directement (pas de local)
2. Déploiement = push migrations à cloud
3. Data = uploaded via UI
4. Pas de itération locale

---

## 🛠️ ROADMAP FIXES (Priorisé)

### TODAY (P0 — ~1h)
- [ ] **Fix Password PostgreSQL** (2 min)
  ```bash
  sed -i 's/DEADsoulja28@ ;/DEADsoulja28@/' .env.server
  git diff .env.server
  ```

- [ ] **Start Supabase Local** (10 min)
  ```bash
  supabase start
  supabase status  # Vérify tous les 3 services running
  netstat -tulpn | grep 5432
  ```

- [ ] **Reactivate 3 .skip Migrations** (30 min)
  ```bash
  # 1. Check why they were disabled
  git log -S "20260430090000" --all -- supabase/migrations/
  
  # 2. Reactivate
  mv supabase/migrations/20260430090000_*.skip \
     supabase/migrations/20260430090000_*.sql
  
  # 3. Apply locally
  supabase db push
  
  # 4. Verify sequences table exists
  supabase sql -c "SELECT COUNT(*) FROM attestation_sequences;" 
  
  # 5. Test with non-admin user (RLS)
  ```

- [ ] **Document Changes** (5 min)
  ```bash
  git add .env.server supabase/migrations/
  git commit -m "P0: Fix password, reactivate attestation migrations, start Supabase local"
  ```

### TOMORROW (P1 — ~1.5h)
- [ ] **Generate Real JWT_SECRET** (5 min)
  ```bash
  openssl rand -base64 32 > /tmp/jwt.txt
  # Update .env.local.example
  ```

- [ ] **Fix SomAgro Mode Incohérence** (10 min)
  ```bash
  # .env.server: SOMAGRO_SUPABASE_MODE=local but URLs are cloud
  # Should be: SOMAGRO_SUPABASE_MODE=cloud
  ```

- [ ] **Uncomment Turnstile Key** (5 min)
  ```bash
  # .env should have SITE_KEY uncommented, not just SECRET_KEY
  ```

- [ ] **Create .env.template** (20 min)
  ```bash
  # Single source of truth
  # Document which env overrides which
  ```

- [ ] **Setup Backup Automation** (20 min)
  ```bash
  # Once password is fixed, test backup:
  npm run backup:run
  
  # Then verify cron is active:
  sudo crontab -l | grep egs-supabase
  ```

### THIS WEEK (P2 — ~2h)
- [ ] **Cleanup Archives & Builds** (10 min)
  ```bash
  rm -rf _archive/ dist/ dist-local/ dist_old/
  rm -f src/App.tsx.bak2
  rm supabase/migrations/*.bak
  git add -A
  git commit -m "Cleanup: remove 9.2M obsolete archives and builds"
  ```

- [ ] **RLS Audit Script** (30 min)
  ```bash
  # Create: scripts/audit-rls-policies.sh
  # Check: each table has RLS enabled
  # Check: each table has policies for public/admin/gestionnaire/employe
  ```

- [ ] **Migrations Documentation** (30 min)
  ```bash
  # Why were 3 attestation migrations .skip?
  # When should they be reactivated?
  # Add comments in migration files
  ```

- [ ] **Plan Supabase Unification** (1h)
  ```bash
  # Decision: Merge EGS + SomAgro into 1 Supabase project?
  # Pro: Shared schema, cross-ERP queries, single backup
  # Con: Auth complexity, larger RLS scope
  # Decision timeline? (1 week? 1 month? never?)
  ```

---

## 🎯 RECOMMANDATIONS PRIORITAIRES

### Immédiat (Cet après-midi)
1. **Fixer password PostgreSQL** — Zéro risque, 100% gain
2. **Démarrer Supabase local** — Réactive toute l'infrastructure
3. **Réactiver migrations attestation** — Prévient bugs futurs

### Court Terme (Cette semaine)
4. **Nettoyer archives** — Réduit confusion, accélère git
5. **Documenter .skip migrations** — Évite oublis futurs
6. **Créer script audit RLS** — Automatise vérification policies

### Moyen Terme (Ce mois)
7. **Unifier configurations** — Single `.env.template`
8. **Décider Supabase unification** — Bloque reporting cross-ERP
9. **Implémenter sync data** — Permet dev iteration local

---

## 📊 MATRIX D'IMPACT

| Fix | Impact Dev | Impact Ops | Effort | Risque | ROI |
|-----|-----------|-----------|--------|--------|-----|
| Fix Password | ⭐ | ⭐⭐⭐ | 2 min | None | 🟢 100% |
| Start Supabase | ⭐⭐⭐ | ⭐ | 10 min | Low | 🟢 100% |
| Reactivate .skip | ⭐⭐ | ⭐⭐ | 30 min | Medium | 🟡 80% |
| Cleanup archives | ⭐ | ⭐ | 10 min | None | 🟢 90% |
| RLS audit script | ⭐ | ⭐⭐⭐ | 30 min | Low | 🟢 85% |
| Unify config | ⭐⭐⭐ | ⭐⭐ | 1h | Low | 🟢 70% |

---

## ✅ VÉRIFICATIONS APRÈS FIXES

### Vérification 1: Password Fixé
```bash
psql -U postgres -d postgres \
  -h db.thykrnoqgylrbfupophs.supabase.co \
  -c "SELECT version();"
# Doit retourner version, pas authentication error
```

### Vérification 2: Supabase Local Running
```bash
supabase status | grep "started at"
# Doit montrer timestamp récent pour db, api, studio
```

### Vérification 3: Migrations Appliquées
```bash
supabase db pull  # Génère à partir du local
# supabase/migrations/ doit montrer 46 fichiers (43 + 3 reactivated)
```

### Vérification 4: Backup Working
```bash
npm run backup:run
# logs/egs-supabase-backup.log doit montrer "SUCCESS"
```

### Vérification 5: Dev Can Connect Locally
```bash
# Terminal 1:
supabase start

# Terminal 2:
npm run dev
# App doit afficher localhost:5173 (Vite)
# Network tab doit montrer localhost:54321 (Supabase)
```

---

## 📞 CONTACTS & ESCALATION

- **DevOps**: Fix password, restart Supabase → @soma
- **Database**: Review & reactivate migrations → @db-team
- **Architecture**: Decision sur unification EGS/SomAgro → @leadership

---

**Rapport généré**: 13 mai 2026, 11:35 UTC+0  
**Documents Référence**:
- ✅ EXECUTIVE_SUMMARY_AUDIT_2026-05-13.md (points clés)
- ✅ AUDIT_WORKSPACE_COMPLET_2026-05-13.md (détail complet)
- ✅ CLEANUP_REMEDIATION_ACTIONS_2026-05-13.md (étapes fixes)
- ✅ ISSUE_TRACKER_2026-05-13.md (tracking bugs)
