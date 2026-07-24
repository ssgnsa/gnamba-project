# AUTONOMY_POLICY.md — Politique de décision autonome pour Claude Code

_Complète `LOOP.md`, `loop-constraints.md`, `loop-budget.md` et `MISSION_CODEX_v6.3.md` déjà présents dans ce repo. Ne les remplace pas._

## 0. But

Ce fichier existe pour une seule raison : **empêcher l'agent de s'arrêter pour poser une question à chaque ambiguïté**. Pour chaque catégorie de blocage courant, il donne une décision par défaut que l'agent applique automatiquement, logue, et grâce à laquelle il continue.

Mission de référence : **un ERP EGS sain, fonctionnel, et correctement déployé** (voir `AGENTS.md` / `README.unified.md`).

Il existe **une seule catégorie d'arrêt dur** (§F). Tout le reste se résout par défaut, se journalise, et le cycle continue.

---

## A. Choix technique ambigu, sans risque de perte de données

**Défaut :** appliquer l'option déjà documentée dans `AGENTS.md` / `README.unified.md` / `docs/industrialisation/`. À défaut de documentation, choisir le pattern déjà utilisé ailleurs dans le code (cohérence > nouveauté). Journaliser le choix dans `loop-run-log.md`, continuer.

## B. Un test ou un vérificateur échoue

**Défaut :** ne jamais demander "je fais quoi ?". Tenter une correction ciblée, relancer le vérificateur concerné. Après **3 tentatives infructueuses** sur le même point, marquer la tâche `blocked` dans `loop_state.json` avec la raison précise, et **passer à la tâche indépendante suivante** plutôt que d'arrêter tout le cycle.

## C. Variable d'environnement ou config manquante

**Défaut :** utiliser la valeur présente dans `.env.example` / `.env.production` si elle existe. Sinon, générer une valeur placeholder explicite (`__A_DEFINIR__`) et le signaler dans `loop_state.json` (`notes`). Ne jamais inventer silencieusement une valeur de secret (clé API, mot de passe) — un placeholder explicite, jamais une fausse valeur plausible.

Rappel des variables officielles : `VITE_API_MODE`, `VITE_LOCAL_API_URL`, `VITE_API_KEY`, `VITE_STORAGE_BASE_URL`, `VITE_SELFHOSTED_MODE`. `VITE_API_URL` est legacy et ne doit jamais être réintroduite.

## D. Opération potentiellement destructive sur les données

**Défaut :** jamais automatique sur un environnement ambigu. `npm run db:local:reset` (ou équivalent) n'est exécuté que si la cible est explicitement et sans ambiguïté l'environnement **local/dev** — jamais si le nom, le host ou le port pourraient désigner la production. Avant toute migration de schéma, toujours faire un `pg_dump` de sauvegarde en premier, sans exception, sans demander.

## E. Déploiement

**Défaut :** un seul chemin autorisé : `bash scripts/deploy-production.sh`. Une seule cible : `/var/www/egs/current`. L'agent ne doit jamais inventer un chemin de déploiement alternatif. Avant déploiement : `npm run release:check` et `npm run validate:frontend` doivent être verts. Après déploiement : `scripts/check-erp.sh` doit être vert. Si `check-erp.sh` échoue après déploiement, revenir à la version précédente selon la procédure de `docs/industrialisation/DEPLOYMENT_UNIQUE.md` plutôt que de laisser la prod dans un état cassé.

## F. Secret ou credential détecté dans un diff — SEUL ARRÊT DUR

**Défaut :** STOP immédiat. Ne rien committer. Écrire le blocage dans `loop_state.json` (`status: blocked`, `notes: "secret détecté"`) et dans `loop-run-log.md` avec le fichier concerné (sans reproduire la valeur du secret elle-même dans le log). Le cycle s'arrête proprement et attend une intervention humaine. C'est la seule exception à la consigne "ne jamais s'arrêter pour demander".

Un vrai garde-fou technique existe en complément de cette règle : `scripts/pre-commit-secret-guard.sh` (à installer comme hook git, voir README de ce kit) — il bloque le commit au niveau git, indépendamment de ce que l'agent décide de faire.

## G. Incohérence contenu/marketing du site ↔ fonctionnalités réelles de l'ERP

**Défaut :** corriger le contenu pour refléter la réalité du produit plutôt que de laisser une promesse de fonctionnalité absente. Journaliser la correction.

## H. Blocage réel, sans option sûre, qui n'entre dans aucune règle ci-dessus

(risque concret de perte de données ou d'interruption de service en production, en dehors des cas déjà couverts)

**Défaut :** ne pas poser de question en direct dans le chat. Écrire le blocage dans `loop_state.json` (`status: blocked`) avec le détail complet dans `loop-run-log.md`, continuer sur une autre tâche indépendante de la liste, et signaler ce point dans le résumé de fin de cycle pour revue humaine différée.

---

## I. Point de vigilance connu à ce jour (à vérifier en premier)

D'après le dernier diagnostic disponible : `https://api.gnambaservices.ci/openapi.json` et `/api/v1/health` répondent en production via Kong, mais un test antérieur montrait une réponse `{"message":"no Route matched with those values"}` sur certaines routes publiques alors que le endpoint local (`127.0.0.1:8080`) renvoyait le HTML du frontend au lieu du JSON attendu de l'API — signe possible d'un routage nginx/Kong qui laisse le SPA catch-all intercepter des routes `/api/*`. À traiter comme **tâche prioritaire de diagnostic non destructif** (curl, `docker logs`, inspection de config nginx/Kong) avant toute autre action de déploiement — sans que cela nécessite de poser de question : diagnostiquer, proposer un correctif, vérifier avec `scripts/check-erp.sh` avant/après, journaliser.
