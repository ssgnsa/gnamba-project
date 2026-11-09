# 🧠 AI-MEMORY.md — Mémoire du projet EGS

> **Toute IA ou humain qui ouvre ce repo DOIT lire ce fichier en entier avant tout code.**
> Mis à jour à chaque commit important. Sections `<AUTO>` régénérées par `scripts/update-memory.sh`.

---

## 🚀 §1 QUICK START (2 min — lire en premier)

| Info | Valeur |
|---|---|
| **Projet** | EGS ERP (Gnam ba Services, Côte d'Ivoire) |
| **Stack** | React 18+TS+Vite 8 / FastAPI+PostgreSQL 16 / Docker |
| **Branche active** | `refonte/foncier-v2` ← **VÉRIFIER AVANT DE CODER** |
| **Phase en cours** | Refonte Foncier — Phase 1 (patterns communs) |
| **Build** | ✅ vert |
| **Tests** | ✅ 2 pass |

**Pour reprendre une session :**
1. `git branch --show-current` → doit matcher §2
2. `git log --oneline -3` → doit matcher §2
3. `npm run build` → doit être vert
4. Lire §5 (Phase en cours) **avant** tout code

---

## 📊 §2 ÉTAT ACTUEL

<!-- AUTO:git -->
### Branche active
`refonte/foncier-v2`

### Derniers commits
```
a9fe65b7 docs(memory): AI-MEMORY.md + script auto-update
31ac98ba docs(refonte-foncier): audit, architecture cible, plan migration
49530945 wip(foncier): pack îlot + cascade (à refondre en audit)
```

### Branches
    audit/fix-schema-site
    backup-index-2026-07-24
    backup/pre-refonte-foncier-20261107
    cleanup/untrack-builds-2026-06-05
  + codex/egs-host-09-main-review
  + codex/egs-j4-deps-security-20261001
  + codex/egs-j4-runtime-immutable-20261001
  + codex/egs-new-host-release-20261007
  + codex/egs-new-host-release-candidate-20261007
  + codex/egs-new-host-release-candidate-20261007-v2
    codex/egs-new-host-sanitized-20261007
  + codex/egs-new-host-sanitized-snapshot-20261007
  + codex/egs-origin-main-reconstructed-20260929
  + codex/egs-release-candidate-20260929
    codex/egs-release-candidate-20261006T153148Z
  + codex/egs-release-candidate-repair-20261006T160000Z
  + codex/egs-release-readiness-20260929
    feat/lazy-load-supabase
    feat/option-a-complete-removal
  + feat/phase-2-poc-refactor
    feat/remove-supabase-dep
    feat/selfhosted-adapter
  + feat/selfhosted-adapter-clean
    fix/codex-zero-casse-20260903
    fix/foncier-ecarts-dossier
    hotfix/readiness-036
    main
    refonte/clean-slate
  * refonte/foncier-v2
    wip/pack-ilot
    remotes/origin/audit/fix-schema-site
    remotes/origin/codex/egs-host-09-main-review
    remotes/origin/codex/egs-host-09-sanitized
    remotes/origin/codex/egs-j4-deps-security-20261001
    remotes/origin/codex/egs-j4-runtime-immutable-20261001
    remotes/origin/codex/egs-new-host-sanitized-snapshot-20261007
    remotes/origin/codex/egs-origin-main-reconstructed-20260929
    remotes/origin/feat/lazy-load-supabase
    remotes/origin/feat/option-a-complete-removal
    remotes/origin/feat/phase-2-poc-refactor
    remotes/origin/feat/remove-supabase-dep
    remotes/origin/feat/selfhosted-adapter
    remotes/origin/feat/selfhosted-adapter-clean
    remotes/origin/fix/foncier-ecarts-dossier
    remotes/origin/main
    remotes/origin/refonte/foncier-v2
<!-- /AUTO:git --><!-- AUTO:versions -->
### Versions
- Node : v22.23.1
- npm : 12.0.2
- Vite : 8.0.2
<!-- /AUTO:versions --><!-- AUTO:build -->
Build & tests
npx tsc --noEmit → 0 erreur

npm run build → ✓ built

npx vitest run → ✓ N tests

docker compose ps → 5/5 healthy

<!-- /AUTO:build --><!-- AUTO:sizes -->
### Tailles fichiers clés
| Fichier | Lignes |
|---|---|
| src/pages/Foncier.tsx | 756 |
| src/components/foncier/parts/LotFormModal.tsx | 673 |
| backend/app/api/v1/foncier/router.py | 1305 |
<!-- /AUTO:sizes -->
🏗️ §3 ARCHITECTURE & CONVENTIONS
Structure
text
src/           → Frontend React
  components/  pages/  hooks/  lib/
backend/
  app/         → api/ models/ schemas/ services/ repositories/
  alembic/     → migrations
docs/refonte-foncier/  → docs de référence
Conventions
Imports absolus : @/components/...

Composants : PascalCase, export default

Hooks : camelCase, export nommé

Tests : __tests__/<Nom>.test.tsx

TS strict : pas de any non justifié

⚠️ Pièges connus (à relire AVANT de coder)
NE JAMAIS sed -i sur du JSX complexe → casse les accolades

NE JAMAIS git add -A avec des .bak → nettoyer d'abord

NE JAMAIS coder sans que l'IA ait lu les 3 docs de référence

TOUJOURS git branch --show-current avant de coder

TOUJOURS vérifier le chunk hash (dist/assets/Foncier-*.js) après rebuild

apiClient.foncier typé any → méthodes fantômes → utiliser apiClient.request()

🌐 §4 ENVIRONNEMENT
URLs
Frontend : http://192.168.1.58/

API : http://192.168.1.58/api/v1/

SSH : ssh -p 2222 soma@192.168.1.58

.env local (HTTP dev)
text
PUBLIC_APP_URL=http://192.168.1.58
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAMESITE=lax
AUTH_REQUIRE_HTTPS=false
Commandes utiles
bash
docker compose up -d --build egs-api egs-web
docker logs egs-api --tail 50
docker exec -i egs-postgres psql -X -U postgres -d egs_local -c "..."
🚧 §5 PHASE EN COURS (CRITIQUE — lire avant de coder)
Refonte Foncier — Phase 1 : Patterns communs
Documents de référence (OBLIGATOIRES) :

docs/refonte-foncier/AUDIT-FONCIER.md

docs/refonte-foncier/TARGET-ARCHITECTURE.md

docs/refonte-foncier/MIGRATION-PLAN.md

Fichiers à créer :

□ src/components/ui/StatusBadge.tsx + test
□ src/components/ui/PageHeader.tsx + test
□ src/components/ui/ConfirmDialog.tsx + test
□ src/components/ui/FormModal.tsx + test
□ src/components/ui/DataTable.tsx + test
□ src/hooks/useCRUD.ts + test
Critères de sortie :

□ 12 fichiers créés
□ npx tsc --noEmit → 0 erreur
□ npm run build → ✓
□ npx vitest run → ✓
□ 1 commit atomique
Phases suivantes : 2-Fusion Villages, 3-Lotissements/Îlots, 4-Wizard LotFormModal, 5-Workflow, 6-DB, 7-Dashboard, 8-E2E

📅 §6 HISTORIQUE DES SESSIONS
2026-11-07 (session actuelle)
Objectif : Audit Foncier + préparer refonte
Réalisé :

8 fichiers d'audit (audit-foncier/*.txt)

3 docs de référence

8 commits stables sur fix/foncier-ecarts-dossier

Branche refonte/foncier-v2 + Phase 0 (nettoyage + docs)

Décisions validées :

Fusion Villages → onglet unique

Page hiérarchique Lotissements + Îlots

Wizard 3 étapes LotFormModal

Patterns communs avant refonte

En cours : Phase 1 — Claude Code doit créer les 6 patterns + tests

2026-11-06
Fix /ready, carte Leaflet Sikensi, site public, cookies HTTP

2026-11-02
Migration 040 — index UNIQUE partiels villages

📋 §7 BACKLOG (non prioritaire)
□ Bug Tenants (locataire_entity_id legacy) — 2-3h
□ Dette vitrine_lots (4 divergences Alembic) — 30min
□ Iframes Facebook/YouTube vides — 1h
□ Chunk Immobilier 545kB → code splitting — 2h
□ Filebrowser refresh token en localStorage (XSS) — 1h
□ Nettoyage foncier_villages_old — 30min
🔄 §8 PROTOCOLE DE MISE À JOUR
Automatique (à chaque commit)
bash
./scripts/update-memory.sh
git add AI-MEMORY.md
git commit -m "..."
Manuel (décisions importantes)
Après chaque phase validée : mettre à jour §5

Après chaque décision structurante : ajouter dans §6

Si un module change d'état : mettre à jour §3

Règle pour l'IA
Toute session DOIT :

Lire AI-MEMORY.md en entier

Lire les 3 docs de référence si §5 mentionne une phase

git branch --show-current avant tout code

Ne JAMAIS coder sans avoir compris §5

📞 §9 CONTACT
Propriétaire : Gnam ba Services

Serveur : 192.168.1.58 (SSH port 2222)

Email : contact@gnambaservices.ci

Dernière mise à jour : <auto> — <hash auto>