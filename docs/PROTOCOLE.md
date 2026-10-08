PROMPT MAÎTRE — REFONTE GÉNÉRALE CONTRÔLÉE
Projet : gnamba-project (EGS / GNAMBA SERVICES)

═══════════════════════════════════════════
1. CONTEXTE ET DÉCISIONS DÉJÀ PRISES
═══════════════════════════════════════════

Stack :
- Backend : FastAPI + PostgreSQL (dossier gnamba-server)
- Frontend : React + TypeScript + Vite + Tailwind

Le projet a subi de très nombreuses modifications : doublons, anciennes
implémentations, fichiers obsolètes, configurations concurrentes. Je ne
m'y retrouve plus.

DÉCISION PRISE (ne la remets pas en question, ne me repose pas la question) :
- Refonte générale de TOUS les modules et de TOUTE l'application.
- On repart sur une base saine et neuve : base de données vierge,
  nouveau schéma, nouvelles migrations.
- Toutes les données actuelles sont des exemples : elles peuvent être
  supprimées (après dump de sauvegarde, voir Lot 0).
- L'ancien code sert UNIQUEMENT de référence fonctionnelle (savoir quoi
  reproduire). Il n'est jamais une base à conserver par défaut.

OBJECTIF FINAL :
UNE base PostgreSQL / UNE source de vérité DB / UN système de migrations /
UN backend FastAPI / UNE API / UN frontend React / UN client HTTP /
UNE stratégie d'authentification / UNE configuration / UN build /
des seeds propres / des tests / AUCUN code inutile / AUCUN doublon.

═══════════════════════════════════════════
2. RÈGLES PERMANENTES (valables du début à la fin)
═══════════════════════════════════════════

R1. ORDRE IMPOSÉ. Tu suis exactement ces lots, dans cet ordre :
    LOT 0  Git / sécurisation
    LOT 1  Audit complet (technique + fonctionnel)
    LOT 2  Spécifications (docs/SPEC.md)
    LOT 3  Schéma database
    LOT 4  API / Backend
    LOT 5  Frontend
    LOT 6  Build / Intégration
    LOT 7  Cleanup
    LOT 8  Seeds / données initiales
    LOT 9  Tests / validation finale
    Tu n'inverses jamais, ne fusionnes jamais deux lots, et ne commences
    jamais un lot sans que j'aie écrit « VALIDÉ LOT X » pour le précédent.
    Si tu penses qu'un autre ordre serait meilleur, tu l'expliques et tu
    ATTENDS mon autorisation.

R2. LECTURE SEULE. Tant que je n'ai pas écrit exactement « OK GO », tu es
    en lecture seule : aucune modification de code, de configuration, de
    fichier, de base ; aucun déplacement, aucune suppression, aucun commit.

R3. COMMANDES DESTRUCTIVES. Aucune sans mon accord explicite :
    rm, rm -rf, DROP, TRUNCATE, DELETE, git reset, git clean,
    docker compose down -v, docker system prune.
    Pour chacune : montre la commande, explique son impact, liste ce qui
    sera supprimé, attends mon autorisation. Ne touche jamais au dossier .git.
    git reset --hard et git clean -fdx sont interdits sauf autorisation
    écrite explicite.

R4. PAS D'IMPROVISATION. Si tu rencontres un fichier inattendu, une
    architecture différente, une dépendance inconnue, une migration
    incohérente, une route ambiguë, deux implémentations concurrentes ou
    une donnée impossible à classer : tu STOPPES et tu me demandes.
    Tu n'inventes pas, tu ne supposes pas, tu ne choisis pas en silence.

R5. PAS DE SOLUTION PARALLÈLE. Tu ne crées aucun fichier « au cas où »,
    aucune architecture parallèle, et tu ne gardes pas de vieux code « au
    cas où ». Chaque fichier créé a un rôle justifié.

R6. PÉRIMÈTRE. Tu ne travailles que sur le lot en cours. Pas de « tant
    qu'on y est », pas d'anticipation des lots suivants (pas de code de
    migration pendant l'audit, pas de nettoyage avant l'identification
    précise de ce qui doit l'être, pas de réécriture avant les lots 4 et 5).

R7. SECRETS. Tu ne révèles jamais de mots de passe, clés ou tokens
    (dans les réponses, les logs, les commits, les documents).

R8. TRAÇABILITÉ. Deux fichiers font foi :
    - docs/JOURNAL.md : mis à jour à la fin de chaque lot (ce qui a été
      fait, décidé, abandonné, et pourquoi).
    - docs/ARCHITECTURE.md : la SEULE référence sur la structure du
      projet. Mise à jour à chaque lot qui la modifie.

R9. COMMITS. Un commit par lot validé, jamais de commit géant. Messages :
    refonte: sécurisation git | refonte: audit | refonte: spécifications |
    refonte: schema database | refonte: backend api | refonte: frontend |
    refonte: integration build | refonte: cleanup | refonte: seeds |
    refonte: tests

R10. FORMAT DE FIN DE LOT. Après CHAQUE lot, tu t'arrêtes et tu réponds :

    LOT TERMINÉ : LOT X
    Travail effectué : ...
    Fichiers créés / modifiés : ...
    Fichiers supprimés ou archivés : ...
    Commandes exécutées : ...
    Tests : ...
    Résultat : PASS / FAIL
    Risques restants : ...
    Journal mis à jour : oui / non
    PROCHAIN LOT : LOT X+1
    ATTENTE DE VALIDATION.

R11. AVANT TOUTE MODIFICATION IMPORTANTE, indique :
    OBJECTIF / FICHIERS CONCERNÉS / MODIFICATION / IMPACT / RISQUE / ROLLBACK
    AVANT TOUTE SUPPRESSION, indique :
    FICHIER / RAISON / PREUVE QU'IL EST INUTILE / DÉPENDANCES / RISQUE
    Ne supprime jamais « pour faire propre » sans preuve.

═══════════════════════════════════════════
3. LES LOTS
═══════════════════════════════════════════

─── LOT 0 — GIT / SÉCURISATION ───
Objectif : sécuriser l'état actuel avant toute chose.
- Vérifier l'état Git, la branche actuelle, le commit actuel, l'existence de main.
- Proposer (sans exécuter avant mon accord) :
    * création de la branche : refonte/clean-slate
    * création du tag sur l'état actuel : pre-refonte-YYYYMMDD
- Vérifier que la branche et le tag pointent vers le bon commit.
- Proposer un pg_dump complet de la base actuelle dans backups/ (même si
  ce sont des données d'exemple), et vérifier que le fichier est lisible.
- Vérifier qu'il existe un mécanisme de sauvegarde DB, sinon le signaler.
Tu me montres les commandes AVANT de les exécuter si elles modifient Git
ou le disque.

─── LOT 1 — AUDIT COMPLET (lecture seule stricte) ───
Rapport factuel, avec preuves. Aucune modification, aucune base touchée.

1.1 Arborescence (exclure node_modules/, .git/, venv/, .venv/,
    __pycache__/, dist/, build/).

1.2 Points d'entrée : backend, frontend, application FastAPI, routes API,
    scripts de démarrage / build / seed, Dockerfile, docker-compose,
    migrations, configuration, gestion des variables d'environnement, tests.

1.3 Sources de vérité concurrentes : plusieurs configurations, fichiers
    .env, schémas DB, systèmes de migration, clients PostgreSQL, ORM,
    clients HTTP frontend, systèmes d'authentification, gestionnaires
    d'état, systèmes de routing ; routes, modèles, types TypeScript,
    services et composants dupliqués.
    Pour chaque conflit : Élément | Fichier A | Fichier B | Rôle | Risque |
    Utilisation actuelle.

1.4 Code mort : *.bak, *.old, *.backup, old_*, copy_*, *_old.*, *_backup.*,
    fichiers non importés, composants / routes / services inutilisés,
    anciens scripts, tests, configurations.
    Un fichier n'est pas « mort » uniquement parce qu'il n'est pas importé
    directement (imports dynamiques, config, scripts). Présente les preuves.

1.5 Variables d'environnement : Variable | Utilisée dans | Backend/Frontend |
    Obligatoire ? | Valeur par défaut ? (jamais les valeurs secrètes).

1.6 Dépendances : déclarées vs réellement importées. Inutilisées,
    manquantes, doublons fonctionnels, versions incompatibles.

1.7 Base de données : moteur, connexion, ORM, modèles, migrations, tables,
    relations, contraintes, index, seeds, données d'exemple, incohérences
    entre modèles et DB.

1.8 INVENTAIRE FONCTIONNEL (essentiel pour ne rien perdre) :
    - modules et fonctionnalités existants ;
    - écrans / pages ;
    - rôles et permissions utilisateurs ;
    - workflows et règles métier trouvées dans le code (calculs, statuts,
      validations, contraintes de gestion) ;
    - fonctionnalités à moitié implémentées ou abandonnées.
    Pour chaque élément : où il se trouve dans le code, et son état
    (fonctionnel / partiel / cassé / incertain).

FIN DU LOT 1 : STOP. Présente uniquement : constat, problèmes, risques,
sources de vérité concurrentes, inventaire fonctionnel, recommandations
d'architecture, proposition de structure cible. Attends « VALIDÉ LOT 1 ».

─── LOT 2 — SPÉCIFICATIONS ───
Rien n'est construit dans ce lot. Tu rédiges docs/SPEC.md à partir de
l'inventaire du Lot 1, contenant :
- la liste des modules de l'application cible ;
- les rôles utilisateurs et leurs permissions ;
- les écrans par module ;
- les workflows et règles métier ;
- les entités de données principales et leurs relations (niveau conceptuel,
  pas encore de SQL).
Pour chaque module de l'ancien code, je décide : GARDER / MODIFIER /
SUPPRIMER / AJOUTER. Tu me présentes la liste, tu ne décides pas à ma place.
Les points flous sont posés en questions, jamais comblés par des suppositions.
Attends « VALIDÉ LOT 2 ».

─── LOT 3 — SCHÉMA DATABASE ───
Objectif : UNE seule source de vérité PostgreSQL.
Stratégie décidée : OPTION B — on repart d'un schéma neuf et de nouvelles
migrations propres (sauf tables que j'indiquerais explicitement à conserver).
- Définir le schéma cible à partir de docs/SPEC.md : tables, relations,
  contraintes, index, types, timestamps, champs obligatoires.
- Définir UN système de migrations.
- Présenter le schéma et attendre ma validation AVANT toute opération
  destructive (DROP / reset de la base), en rappelant que le dump du Lot 0
  existe.
- Après accord : exécuter, puis vérifier que les migrations s'appliquent
  depuis une base vide.
Attends « VALIDÉ LOT 3 ».

─── LOT 4 — API / BACKEND ───
Travaille UNIQUEMENT sur le backend. Objectifs : une seule application
FastAPI, une seule configuration, une seule connexion DB, un seul système
de migrations, architecture claire, routes / services / modèles / schémas
Pydantic cohérents, gestion d'erreurs cohérente, authentification
cohérente, variables d'environnement cohérentes.
Fin de lot : démarrer le backend ; vérifier routes principales, connexion
DB, migrations, authentification, erreurs critiques.
Attends « VALIDÉ LOT 4 ».

─── LOT 5 — FRONTEND ───
Travaille UNIQUEMENT sur le frontend (React, TypeScript, Vite, Tailwind).
Une seule configuration, un seul client HTTP, un seul système d'état si
nécessaire, types alignés avec l'API, routes et authentification
cohérentes, gestion des erreurs, variables d'environnement propres.
Le frontend consomme exclusivement l'API validée au Lot 4. Pas de logique
métier dupliquée, pas de modèles dupliqués inutilement.
Fin de lot : npm run build (ou la commande réelle du projet).
Attends « VALIDÉ LOT 5 ».

─── LOT 6 — BUILD / INTÉGRATION ───
Tester la chaîne complète : Frontend → API → Services → ORM → PostgreSQL.
Vérifier CORS, authentification, cookies/tokens, URLs API, variables
d'environnement, uploads, erreurs HTTP, migrations, build de production,
Docker si utilisé. Objectif : UNE chaîne fonctionnelle complète.
Pas de cleanup massif à ce stade.
Attends « VALIDÉ LOT 6 ».

─── LOT 7 — CLEANUP ───
Seulement quand l'application fonctionne de bout en bout.
Procédure en 2 temps :
 1. ARCHIVER : déplacer d'abord les éléments candidats dans _archive/
    (hors build), après avoir affiché la liste exacte et la justification
    de chaque élément (R11). Vérifier que build et tests passent.
 2. SUPPRIMER : après mon accord, supprimer _archive/ ou les éléments
    concernés (anciens fichiers, backups, doublons, composants et routes
    morts, anciennes configurations, dépendances inutiles, scripts inutiles,
    anciennes migrations, code temporaire).
Résultat attendu : un répertoire contenant uniquement ce qui est utilisé.
Attends « VALIDÉ LOT 7 ».

─── LOT 8 — SEEDS / DONNÉES INITIALES ───
Créer uniquement les données nécessaires au fonctionnement (rôles,
paramètres, compte administrateur initial, référentiels). Les seeds sont :
reproductibles, idempotents si possible, documentés, séparés des données
de production, compatibles avec le schéma final. Ne jamais mélanger seeds
et données réelles. Aucun mot de passe en clair dans le dépôt.
Attends « VALIDÉ LOT 8 ».

─── LOT 9 — TESTS / VALIDATION FINALE ───
Backend : tests unitaires, API, DB, auth, erreurs.
Frontend : TypeScript, lint, build, tests disponibles, routes principales.
Intégration (minimum) : connexion, authentification, dashboard, CRUD
principaux, upload, API, DB, déconnexion, gestion des erreurs, build de
production.
Rapport : TEST | STATUT | ERREUR | CORRECTION.
Mettre à jour README.md, docs/ARCHITECTURE.md et docs/JOURNAL.md.

═══════════════════════════════════════════
4. ARCHITECTURE CIBLE (proposition, à comparer à l'existant)
═══════════════════════════════════════════

gnamba-project/
├── frontend/      (src/, public/, package.json, vite.config.*)
├── backend/       (app/, migrations/, tests/, requirements.*)
├── scripts/
├── backups/
├── docs/          (SPEC.md, ARCHITECTURE.md, JOURNAL.md)
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md

Cette structure est une proposition : ne la crée pas automatiquement,
elle est validée au Lot 1 puis appliquée aux lots suivants.

═══════════════════════════════════════════
5. PREMIÈRE ACTION
═══════════════════════════════════════════

Commence UNIQUEMENT par le LOT 0 : propose-moi les commandes, ne les
exécute pas avant mon accord. Puis, après « VALIDÉ LOT 0 », passe au
LOT 1 en lecture seule.

Tu n'as PAS l'autorisation de commencer le LOT 2 avant « VALIDÉ LOT 1 ».
Ne propose ni code de migration, ni nettoyage, ni réécriture du backend
ou du frontend avant les lots correspondants. Ne touche pas à la DB.
Commence par l'inventaire factuel de l'existant.