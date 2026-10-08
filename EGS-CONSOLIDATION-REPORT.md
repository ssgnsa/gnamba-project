# EGS — Rapport d'inventaire de consolidation

**Statut général : HOLD — inventaire effectué, migration non commencée**  
**Date : 7 octobre 2026**  
**Portée :** dépôt local `gnamba-project` et contrôles de lecture seule sur
`gnamba-server`. Ce document n'est pas le rapport final de consolidation.

## Mise à jour de consolidation — 8 octobre 2026

La migration Flask/Jinja n'est pas engagée. La cible opérationnelle retenue
pour le redeploiement contrôlé reste la pile présente dans le dépôt :
React/Vite → FastAPI `/api/v1` → PostgreSQL/Alembic.

Harmonisations réalisées dans le checkout :

- documentation backend alignée sur les routes `/api/v1` ;
- test de configuration backend rendu indépendant du répertoire d'appel ;
- CI recentrée sur l'API self-hosted et le Compose canonique ;
- workflow Edge Supabase désactivé supprimé, aucune source `supabase/` ne lui
  correspondant ;
- rôles des Compose documentés : racine canonique, nouvel hôte isolé, backend
  local de développement ;
- artefact frontend reconstruit avec les URLs de release self-hosted et validé.

Contrôles passés : typecheck, lint sans erreur, 127 tests frontend, 74 tests
backend ciblés CI, 21 tests du contrôleur nouvel hôte, `release-check`,
validation frontend, YAML CI et résolution Compose. Aucun conteneur, volume,
base de données, secret ou serveur de production n'a été modifié.

La simulation PostgreSQL nouvel hôte a ensuite exécuté la chaîne Alembic
`001 → 032` jusqu'à la tête `032_immobilier_v2_contract` sur une base vierge
éphémère. Elle a révélé et permis de corriger l'ordre d'initialisation de
`alembic_version` et une variable non initialisée dans la migration 032. La
validation finale `alembic check` reste en échec à cause d'une dérive
ORM↔schéma substantielle ; aucune publication ne doit contourner cette gate.

Au moment de la tentative contrôlée du 8 octobre, l'hôte courant est
`gnamba-server` : Docker répond mais ne possède aucun conteneur ni volume
actif, PostgreSQL/API ne répondent pas sur les ports locaux, tandis que Nginx
et Cloudflare Tunnel restent actifs. Le nouvel-hôte prévu par le script n'est
pas provisionné ici (`.env.new-host` et allowlist absents). Aucun service n'a
été démarré, arrêté ou migré.

Le redeploiement reste bloqué par conception tant qu'une release commitée sur
`main`/`master`, un hôte nouvellement confirmé et l'approbation explicite des
migrations ne sont pas fournis.

## Décision cible enregistrée

La demande jointe fixe la cible à Flask, PostgreSQL, SQLAlchemy et Alembic,
avec des pages rendues côté serveur (Jinja, HTML, CSS et JavaScript).
L'application actuelle est toutefois React/Vite + FastAPI. La cible est donc
une migration fonctionnelle importante, pas un nettoyage de fichiers.

PostgreSQL et la chaîne Alembic sont les candidats à conserver comme vérité
des données et du schéma. Aucune migration, suppression, bascule ni publication
n'a été effectuée.

## Phase 0 — Gel et état du dépôt

**STATUS: PASS — inspection seule, aucun fichier préexistant modifié.**

- Racine : `/home/soma/gnamba-project`.
- Branche : `codex/egs-release-candidate-20261006T153148Z`.
- HEAD : `dce8a11bb2b3be2a2b408773731cd8169702baa4`, release candidate du
  6 octobre 2026.
- Un remote Git `origin` est configuré.
- Inventaire : 1 626 chemins suivis, 9 non suivis et 46 356 chemins ignorés
  (principalement dépendances, environnements Python et artefacts générés).
- État avant création de ce rapport : 259 entrées de statut, dont 248 chemins
  avec changements indexés, 8 avec changements non indexés et 9 non suivis ;
  six chemins ont des changements dans les deux index.
- Le dépôt contient 23 branches locales. Aucun commit, push ou déploiement
  n'a été effectué pendant cet inventaire.
- Les fichiers `.env` et leurs sauvegardes locales sont ignorés par Git. Leurs
  valeurs n'ont pas été lues.
- Les fichiers `dist`, `node_modules`, `.venv`, `.pytest_cache` et les
  rapports temporaires sont présents localement, mais ne sont pas suivis.

### Risques d'exposition relevés sans afficher de valeurs

- `nginx/ssl/privkey.pem` et son certificat correspondant sont suivis dans
  HEAD. La clé privée est parseable et correspond au certificat. Il faut
  considérer cette clé comme compromise et la remplacer si elle est utilisée.
- `n8n/database.sqlite3` est suivie dans HEAD, bien que nul conteneur n8n ne
  soit actuellement présent. L'inspection limitée au schéma et aux nombres de
  lignes a relevé des entrées dans des tables de clés de déploiement et de clés
  API utilisateur. Aucune valeur ni ligne n'a été lue.
- Un nom de fichier suivi contient une chaîne ayant la forme d'une valeur de
  secret. Sa valeur et son chemin exact ne sont pas reproduits ici.
- Des instantanés CSV nommés pour des données métier sont également suivis.
  Leur contenu n'a pas été lu ; leur sensibilité réelle reste à confirmer.
- Aucun outil de détection de secrets dédié (`gitleaks`, `trufflehog`,
  `detect-secrets`) n'est installé. L'absence d'autres secrets n'est donc pas
  établie.

**Conséquence :** l'affirmation « aucune donnée sensible enregistrée » n'est
pas vérifiable pour les lignes PostgreSQL, qui n'ont pas été inspectées, et
ne peut pas être étendue au dépôt : celui-ci contient au minimum une clé
privée suivie et une base SQLite avec des enregistrements de tables de clés.

## Phase 1 — Inventaire et classification

| Élément | État constaté | Classement provisoire |
|---|---|---|
| Frontend React/Vite/TypeScript (`src/`, 845 fichiers suivis) | Application actuelle, 36 fichiers de tests frontend | **À remplacer/migrer** vers Jinja/HTML/CSS/JS après inventaire des parcours et validation de parité ; ne pas supprimer maintenant |
| Backend FastAPI (`backend/app/`, 23 modules de routes) | API actuelle, avec modèles, schémas, services et repositories | **À migrer** vers des blueprints/services Flask ; préserver les règles métier et contrats avant toute suppression |
| Flask/Jinja | Aucune dépendance Flask ni application Flask détectée ; `templates/` contient un HTML statique et des assets, pas une application Jinja | **À créer** pour la cible ; le HTML existant est à évaluer séparément |
| PostgreSQL | Conteneur de production actif et base `egs_local` | **À conserver** comme base métier unique ; accès au contenu des tables non effectué |
| SQLAlchemy/Alembic | 34 fichiers de versions suivis | **À conserver et réconcilier** ; l'analyse locale détecte deux têtes, l'image API active n'en connaît qu'une et la DB live est à une révision différente |
| SQLite n8n | Base suivie dans Git, données de clés présentes, aucun conteneur n8n actif | **Inconnu / à isoler** jusqu'à décision sur le rôle de n8n, sauvegarde et révocation des clés ; ne pas supprimer |
| Authentification/RBAC | Un système FastAPI existe ; tokens locaux frontend et cookies de refresh sont utilisés | **À migrer** vers une seule autorité serveur Flask ; vérifier chaque permission métier avant bascule |
| Compose/Docker | `docker-compose.yml` racine et `backend/docker-compose.yml`, deux Dockerfiles | **Doublons candidats** ; choisir une configuration canonique après comparaison des volumes, ports et responsabilités |
| Builds/tests | npm/Vite/TypeScript/Vitest et pip/Pytest coexistent | **À remplacer/consolider** vers les commandes Python de la cible, seulement après transfert de tests et comportements |
| `_reconcile/`, sauvegardes et rapports | Nombreux fichiers suivis ou ignorés, provenance et rôle variables | **Inconnu** ; conserver jusqu'à attribution et preuve de remplacement |
| Configuration/secrets locaux | Plusieurs fichiers `.env` et sauvegardes ignorés | **À unifier** en configuration centrale ; aucune valeur lue ni copiée |
| Filebrowser et Redis | Services auxiliaires présents dans Compose ; Filebrowser est publié séparément | **À arbitrer** : services d'exploitation éventuels, pas des bases métier secondaires ; aucune suppression effectuée |

## Vérifications live en lecture seule

- `docker ps` : web, API, PostgreSQL, Redis et Filebrowser étaient actifs.
- Les ports hôte de l'API (`8000`) et PostgreSQL (`5433`) étaient liés à
  `0.0.0.0`, de même que ceux du web (`8080`) et de Filebrowser (`8081`).
  L'accessibilité depuis Internet n'a pas été vérifiée.
- L'API utilise le rôle PostgreSQL `postgres`, confirmé superutilisateur.
- La base live est à `029_auth_password_lifecycle`; l'image API ne connaît que
  `028_normalize_vitrine_lots_types`. `alembic current` échoue donc sur une
  révision inconnue par l'image.
- `/ready` retourne `404`. L'endpoint `/api/attestations/verify` a retourné
  `200` et `document_authentic: true` pour une référence inventée. Aucun
  enregistrement métier n'a été consulté par cette sonde.
- `/api/v1/version` ne fournit pas de commit/build identifiable.
- Une inspection précédente du même hôte a relevé 69 tables publiques ; aucun
  contenu métier n'a été consulté.

## Phases suivantes — HOLD

**STATUS: HOLD — aucune phase de migration ou de nettoyage n'a commencé.**

Avant une migration Flask ou toute ingestion de données :

1. Remplacer la clé TLS suivie et évaluer la révocation des clés d'API/de
   déploiement contenues dans l'instantané SQLite ; ne pas publier le dépôt
   avec ces artefacts.
2. Résoudre le faux positif de vérification publique et tester le parcours
   contre une attestation réelle et une référence inexistante.
3. Restreindre les ports exposés et remplacer le rôle PostgreSQL superuser de
   l'application par un rôle à privilèges minimaux ; vérifier le pare-feu.
4. Vérifier une sauvegarde restaurable de PostgreSQL et des fichiers associés,
   puis examiner les sauvegardes métier suivies sans en exposer le contenu.
5. Établir une matrice de parité des modules ERP React/FastAPI à reprendre dans
   Flask, puis créer et tester l'application cible et sa chaîne unique Alembic.
6. Réconcilier la révision de production sur un environnement de test avant
   toute opération sur la base live.

Les phases 2 à 10 restent à exécuter. En particulier, la migration complète
vers Flask n'est pas validée par cet inventaire. Aucun code métier, migration,
secret, fichier de base ou configuration n'a été modifié.

## Preuves et commandes

Contrôles exécutés : `git rev-parse`, `git status --porcelain=v1 -z`,
`git ls-files`, `git diff --stat`, `docker ps`, `docker inspect`, requêtes
HTTP `GET` sur les endpoints de santé/version/vérification, requêtes
PostgreSQL limitées au rôle, à la révision Alembic et au nombre de tables,
inspection des tables SQLite limitée aux noms et nombres de lignes, et
validation cryptographique du couple certificat/clé sans afficher leur
contenu.

Tests, build Flask, migrations, sauvegarde/restauration et déploiement : **non
exécutés**. Aucun fichier existant n'a été modifié.
