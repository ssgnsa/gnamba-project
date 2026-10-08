# AUDIT FONCIER — INTERACTIONS, WORKFLOWS ET API

## A. Résumé exécutif

Cette mission a été conduite en lecture seule, sans modification de code, sans commit, sans push et sans déploiement.

### Quantités observées
- Boutons audités : 25+
- Liens audités : 6+
- Onglets audités : 5
- Modales auditées : 5
- Formulaires audités : 3 (lot, attestation, configuration)
- Workflows audités : 6
- Endpoints associés : 15+
- Tests examinés : 4+
- Anomalies relevées : 5

### Fichiers principaux analysés
- src/pages/Foncier.tsx
- src/components/FoncierContainer.tsx
- src/components/foncier/parts/LotTable.tsx
- src/components/foncier/parts/AttestationModal.tsx
- src/components/foncier/parts/ConfigModal.tsx
- src/lib/dbClient.service.ts
- src/hooks/foncier.ts (si présent dans le repo réel, l’interface est utilisée via le composant principal)
- src/components/foncier/FoncierConstants.ts
- src/lib/foncierValidation.ts
- src/lib/foncierVillageConfig.ts

## B. Matrice des interactions

| ID | Sévérité | Écran | Élément | Fichier | Action déclenchée | API impliquée | Résultat constaté | Statut |
|---|---|---|---|---|---|---|---|---|
| INT-01 | MAJEUR | Lots | Nouveau lot | src/pages/Foncier.tsx | setActiveTab + modal d’ajout | /foncier/lots (POST via repository) | Action existante, dépend de canManage | OK statique |
| INT-02 | MAJEUR | Lots | Recherche | src/components/foncier/parts/LotTable.tsx | setSearch + filtre local | /foncier/lots (GET) | Filtre et recherche présents | OK |
| INT-03 | MAJEUR | Lots | Filtre statut | LotTable.tsx | setFilterStatut | /foncier/lots (GET) | État est lié au backend via refetch | OK |
| INT-04 | MAJEUR | Lots | Filtre village | LotTable.tsx | setFilterVillage | /foncier/lots (GET) | Utilisé pour le filtrage | OK |
| INT-05 | MAJEUR | Lots | Afficher archivés | LotTable.tsx | setShowArchived | /foncier/lots (GET) | Présent | OK |
| INT-06 | MAJEUR | Lots | Ouvrir attestation | LotTable.tsx | onOpenAttestation | /foncier/attestations, /rpc/* | Bouton présent, logique de modal | OK |
| INT-07 | MAJEUR | Lots | Valider chef | LotTable.tsx | onOpenWorkflow | /foncier/attestations + workflow | Bouton présent, workflow exposé | OK statique |
| INT-08 | MAJEUR | Lots | Imprimer attestation | LotTable.tsx | onPrintAttestation | RPC / génération document | Action existante | OK |
| INT-09 | MAJEUR | Lots | Imprimer annexe | LotTable.tsx | onPrintAttestationAnnex | RPC / génération document | Action existante | OK |
| INT-10 | MAJEUR | Lots | Historique | LotTable.tsx | onOpenAttestationHistory | /foncier/attestations | Modal d’historique | OK |
| INT-11 | MAJEUR | Lots | Modifier | LotTable.tsx | onOpenEdit | /foncier/lots/:id (PATCH) | Action existante | OK |
| INT-12 | MAJEUR | Lots | Archiver / restaurer | LotTable.tsx | onHandleArchive / onHandleRestore | soft delete / restore RPC | Présent, logique de soft delete | OK |
| INT-13 | CRITIQUE | Public / API | CORS local / hybride | validation externe | OPTIONS Origin: http://localhost:5173 | API publique | `HTTP 400` + `Disallowed CORS origins` | BLOQUANT |
| INT-14 | MAJEUR | Config | Configurer village | Foncier.tsx | setActiveTab('config') | /foncier/villages / config_jsonb | Présent | OK |
| INT-15 | MAJEUR | Config | Sauvegarde config | ConfigModal.tsx | handleSave | localStorage + DB fallback | Double sauvegarde locale + DB | OK mais à surveiller |
| INT-16 | MAJEUR | Config | Logo village | ConfigModal.tsx + VillageLogoUploader.tsx | assignMedia + MediaPicker | media API / media_usage | Présent | OK |
| INT-17 | MOYEN | Audit | Ouvrir journal | Foncier.tsx | openAudit | /foncier/audit | Modal ouverte | OK statique |
| INT-18 | MOYEN | Tabs | Attestations placeholder | Foncier.tsx | setActiveTab('lots') | — | Le tab est un placeholder | PARTIEL |
| INT-19 | MOYEN | Tabs | Validation placeholder | Foncier.tsx | setActiveTab('lots') | — | Le tab est un placeholder | PARTIEL |

## C. Matrice des workflows

### Workflow 1 — Lot
- Entrée : liste des lots, recherche, filtres, village, statut
- Étapes : chargement -> recherche -> selection -> ouvrir -> modifier / archiver / imprimer / attester
- API : /foncier/lots, /foncier/villages, /foncier/attestations, /rpc/soft_delete_foncier_lot
- Résultat : structure fonctionnelle présente et cohérente
- Erreurs : absence de validation de rôle explicite dans tous les cas ; dépend de canManage
- Statut : OK statique

### Workflow 2 — Attestation
- Entrée : lot sélectionné
- Étapes : ouvrir modal -> remplir formulaire -> valider -> générer QR -> créer attestation -> log audit -> onSuccess
- API : /rpc/..., foncierRepository.createAttestation, logFoncierAudit
- Résultat : workflow structurellement présent
- Erreurs : la génération de QR / RPC / popup d’impression n’a pas été validée en runtime dans cette mission
- Statut : OK statique / validation partielle

### Workflow 3 — Validation Chef
- Entrée : lot + action de validation
- Étapes : bouton -> modal/workflow -> validation -> logs
- API : workflow selection / attestation history / audit logs
- Résultat : bouton présent, but tab est placeholder dans la page principale
- Erreurs : pas de UI complète dans la page active
- Statut : PARTIEL

### Workflow 4 — Configuration village
- Entrée : village sélectionné + config modal
- Étapes : loader -> édition -> sauvegarde locale -> fallback DB -> onSuccess
- API : localStorage + DB fallback / media
- Résultat : logique bien structurée
- Erreurs : traitement de base de données non bloquant silencieux ; logs console.warn
- Statut : OK statique

### Workflow 5 — Audit
- Entrée : bouton “Ouvrir l’historique complet”
- Étapes : modal -> historique
- API : /foncier/audit + journal
- Résultat : structure présente
- Erreurs : aucune preuve de validation fonctionnelle dans cette mission
- Statut : PARTIEL

### Workflow 6 — Synchronisation / offline
- Entrée : isOnline / syncPending / deviceId
- Étapes : offline indicator + queue logic + pending count
- API : repo / sync engine / offline queue
- Résultat : présence du mécanisme de synchronisation, mais pas entièrement audité fonctionnellement ici
- Statut : PARTIEL

## D. Anomalies

### 1. CRITIQUE — CORS public / front local
- Fichier/élément : validation externe + configuration CORS
- Cause probable : configuration CORS côté backend publique ne autorise `http://localhost:5173` pour l’OPTIONS
- Preuve : `HTTP 400` + `Disallowed CORS origins` lors du test OPTIONS depuis localhost:5173
- Impact : blocage fonctionnel du développement local / front-to-back avec l’API publique
- Statut : CAUSE CONFIRMÉE

### 2. MAJEUR — Onglets “Attestations” et “Validation” sont placeholders
- Fichier : src/pages/Foncier.tsx
- Preuve : le contenu de ces onglets affiche simplement un message d’invitation et un bouton pour revenir à “Lots”
- Impact : le flux d’attestation et le workflow de validation ne sont pas réellement déployés dans l’interface principale
- Statut : CAUSE CONFIRMÉE

### 3. MAJEUR — double mécanisme de persistance de config
- Fichier : src/components/foncier/parts/ConfigModal.tsx
- Preuve : saveVillageConfig() puis fallback DB update, avec catch silencieux console.warn
- Impact : possible divergence entre stockage local et stockage DB ; erreurs peuvent être masquées pour l’utilisateur
- Statut : CAUSE PROBABLE

### 4. MOYEN — droits et états UI non entièrement explicites à tous les niveaux
- Fichier : src/pages/Foncier.tsx + LotTable.tsx
- Preuve : le bouton est désactivé selon canManage, mais les cas “gestionnaire”, “gerant”, “secretaire” et “admin” ne sont pas testés dans la mission
- Impact : risque d’incohérence entre UI et permissions réelles
- Statut : CAUSE PROBABLE

### 5. MOYEN — génération / impression d’attestation non vérifiée au runtime
- Fichier : src/components/foncier/parts/AttestationModal.tsx
- Preuve : génération QR, RPC, ouverture d’impression, historique / verification URL ; pas de validation fonctionnelle runtime durant cette mission
- Impact : gestion popup / document / print peut varier selon navigateur et contexte de sécurité
- Statut : CAUSE NON DÉTERMINÉE

## E. Couverture des tests

### Couvert statiquement
- Filtres et table lots
- Création / édition de lot
- Config village et logo
- API repository pattern via dbClient.service.ts
- Validation front de formulaires

### Non couvert dans cette mission
- Cas de validation réel du workflow chef
- Cas d’intégration attestation complet
- Cas d’impression d’attestation/popup réel
- Cas sync offline/online
- Cas CORS local / front-to-back réel sur environnement public

## F. Risques de livraison

Risque réel démontré :
- CORS public mauvais avec `Origin: http://localhost:5173` en environnement public, ce qui peut bloquer les workflows de frontend local.

Risque potentiel :
- Onglets de workflow non implémentés dans l’UI principale.
- Configuration locale + base de données partiellement divergentes.
- Impression / popup qualité non validée.

## G. Corrections recommandées

1. Corriger la configuration CORS publique / locale pour accepter explicitement les origines front de dev et production selon la politique autorisée.
2. Implémenter ou compléter les onglets “Attestations” et “Validation” au lieu de les laisser en placeholder.
3. Unifier le mécanisme de sauvegarde de configuration (localStorage + DB) et afficher un message utilisateur si le stockage DB échoue.
4. Ajouter des tests fonctionnels sur le workflow attestation, impression et validation.
5. Ajouter une validation plus explicite des permissions rôle par rôle et des états d’erreur UI.

## H. Verdict

Verdict : GO SOUS RÉSERVES

Justification :
- Le cœur du module Lots est présent et cohérent au niveau du code.
- Les flux principaux de liste, filtre, création, édition, attestation et configuration sont structurés.
- Le module n’est pas “NO-GO” au niveau de la structure, mais il reste sous réserve car des pièces essentielles (onglets placeholder, CORS public) ne sont pas validées de bout en bout.

## Rapport terminal

=== AUDIT FONCIER — TERMINÉ ===

Fichiers modifiés : 0
Fichiers créés hors rapport : 0
Commit : aucun
Push : aucun
Déploiement : aucun
Base de données modifiée : non

Boutons audités : 25+
Liens audités : 6+
Workflows audités : 6
Endpoints audités : 15+
Tests examinés : 4+

Critiques : 1
Bloquants : 1
Majeurs : 3
Moyens : 2
Mineurs : 0

Rapport : AUDIT_FONCIER_INTERACTIONS_REPORT.md

CONCLUSION : GO SOUS RÉSERVES

## Mise à jour après corrections et validation — 2026-09-24

Cette mise à jour complète le constat statique initial. Les lignes ci-dessus décrivent l’état observé lors de l’audit d’origine; les points ci-dessous reflètent les corrections et contrôles effectués ensuite.

### Corrections vérifiées

- La configuration village passe par le repository REST Foncier et `config_jsonb`; les erreurs de chargement et d’écriture sont retournées à l’interface au lieu d’être présentées comme une sauvegarde réussie. Le chemin `localStorage` n’est plus le stockage concurrent de cette configuration.
- Les parcours des onglets Attestations et Workflow existent dans l’interface courante; leurs transitions sont couvertes partiellement par les tests, mais ne constituent pas une recette navigateur complète.
- Le frontend des lots, villages, attestations et audit utilise désormais les routes Foncier dédiées sur les parcours corrigés. La surface générique ne publie plus la table `foncier_villages`.
- Les noms d’acteur transmis par le client pour témoin/agent/chef sont remplacés côté serveur par le nom issu de l’utilisateur authentifié.
- Les statistiques agrègent les tables enfants séparément. Les routes de village utilisent l’état `actif` existant; elles ne supposent plus une colonne `deleted_at` absente.
- Les suppressions physiques de lotissements et d’îlots ne sont plus exposées par les routes corrigées; elles renvoient un conflit tant qu’une politique de cycle de vie n’est pas décidée.
- L’historique d’attestation et l’audit s’appuient sur les routes REST Foncier. La révocation d’accès suit un corps de requête explicite. La réémission d’attestation indique clairement qu’elle n’est pas exposée au lieu de tenter un RPC inconnu.
- La réponse publique des lots ne renvoie pas les coordonnées de contact du détenteur; seules les lignes explicitement publiées sont retournées.
- Le préflight CORS FastAPI local accepte `http://localhost:5173` et `http://localhost:3000` (HTTP 200 avec `Access-Control-Allow-Origin` correspondant) et rejette `https://not-authorized.invalid` (HTTP 400 sans en-tête d’autorisation CORS). L’origine réellement déployée n’a pas été vérifiée.

### Validation technique courante

- Tests frontend : **124 réussis / 36 fichiers** après ajout des tests de connectivité, de résolution de hiérarchie lot et de refus des mutations hors ligne.
- Tests backend Foncier/sécurité ciblés après sécurisation du test d’intégration : **9 réussis, 1 sauté**.
- `npm run typecheck` : réussi.
- `npm run lint` : réussi, avec **17 avertissements** et aucune erreur.
- `npm run build` : réussi. Vite signale deux avertissements `INEFFECTIVE_DYNAMIC_IMPORT` concernant les imports de `foncierAudit.ts` et `foncierOffline.ts`.
- `git diff --check` : réussi.

Ces contrôles valident compilation et contrats testés; ils ne remplacent pas une recette navigateur, une vérification CORS depuis l’origine réellement autorisée, ni une validation d’accès avec des comptes de chaque catégorie métier.

### Risques et blocages restants

1. **NO-GO métier/RBAC** : les décisions B.6 Foncier sont toujours `UNKNOWN`. L’API reste volontairement restrictive; l’attribution initiale des ACL `UserVillageAccess` n’a pas de parcours de bootstrap défini et ne doit pas être inventée. Les usages opérationnels par village et par niveau ne peuvent donc pas être déclarés validés.
2. **NO-GO migrations** : la base locale porte le marqueur Alembic `027_fix_public_site_schema_drift`, absent de la chaîne de révisions courante qui se termine à `024_add_media_taxonomy_and_content_hash`. Les anciens blobs de migrations ne sont pas réappliqués sans provenance établie; aucune migration n’a été exécutée dans cette validation.
3. **Publication publique à décider** : le contrôle public d’attestation reste fermé par défaut dans la configuration d’accès courante tant que B6-PUB-02 n’est pas arbitré. Le CORS public/local n’a pas été revalidé depuis un navigateur contre l’origine de déploiement autorisée; le précédent échec OPTIONS reste à traiter dans cette recette.
4. **Parcours runtime incomplets** : les tests couvrent les composants et routes ciblés, mais pas l’enchaînement navigateur complet création → attestation → validation → impression/QR, ni la synchronisation hors ligne, ni les profils d’accès métiers en environnement de staging.
5. **Données de test** : les données Foncier ont été purgées de la base locale `egs_local` après sauvegarde complète vérifiée dans `/tmp/egs-local-foncier-go-2026-09-24.dump`. Cette action locale ne purge pas les données de l’environnement de production; une purge production distincte reste nécessaire avant GO production.
6. **Sécurité des tests d’intégration** : l’ancien `backend/tests/test_foncier_village_crud.py` exécutait des suppressions sans filtre sur `foncier_village_access`, `foncier_lots`, `foncier_lotissements` et `foncier_villages` dès qu’il pouvait joindre son hôte PostgreSQL par défaut. Il a été rendu opt-in (`EGS_ALLOW_FONCIER_INTEGRATION=1`), limité à une base dont le nom finit par `_test`, et transactionnel avec rollback garanti. Le test ne nettoie désormais aucune table entière.
7. **Suite backend globale** : `pytest backend/tests -q --tb=no` n’est pas verte (**15 échecs, 1 sauté**). Les causes observées incluent des tests applicatifs dépendant d’un dialecte PostgreSQL tout en tournant sous SQLite, des attentes d’authentification incompatibles avec certaines routes générales, ainsi qu’un test de seed administrateur en échec. Le test PostgreSQL Foncier dangereux est maintenant sauté par défaut grâce à sa nouvelle garde; les échecs restants ne sont pas les tests Foncier ciblés, mais la suite backend entière ne peut donc pas être déclarée validée.

### Inventaire préliminaire pour la purge future

Cet inventaire vient des modèles et migrations versionnés, pas d’une inspection du schéma de production. Il ne constitue pas un ordre d’exécution SQL; la divergence Alembic impose de confirmer chaque FK dans `pg_constraint` sur l’environnement cible avant l’opération.

- Chaîne principale observée dans les modèles : `foncier_villages` → `foncier_lotissements` → `foncier_ilots` → `foncier_lots` → `foncier_attestations` → `foncier_attestation_temoins`.
- Les accès `user_village_access` référencent un village avec `ON DELETE CASCADE`; les lots référencent `parties` comme propriétaires avec `ON DELETE SET NULL`, et les témoins peuvent référencer `entities` avec `ON DELETE SET NULL`. Ces référentiels partagés ne doivent pas être purgés avec les données Foncier.
- Des dépendances externes sont déclarées sur `foncier_lots`: `properties`, `rent_payments` et `finances` ont des liens `SET NULL` selon les migrations consultées; `vitrine_lots` a un lien `CASCADE`. `visites_du_jour.lot_id` est documenté comme référence sans FK dans le modèle. Les tables d’audit (`activity_logs`) et d’usage média (`media_usage`) portent des références polymorphes qui nécessitent une politique explicite de conservation/nettoyage.
- Avant purge réelle : exporter une sauvegarde restaurable, relever les compteurs par relation, valider les contraintes réelles et les dépendances polymorphes, obtenir la portée métier, exécuter dans une fenêtre approuvée avec un script revu et transactionnel si possible, puis contrôler zéro ligne de test résiduelle et l’intégrité des références conservées.

### Vérification PostgreSQL locale en lecture seule — 2026-09-24

Une requête directe aux catalogues PostgreSQL et aux seuls compteurs a confirmé la base `egs_local`, sans exposer de valeurs de personnes ou de références métier :

- Les tables `foncier_villages`, `foncier_lotissements`, `foncier_ilots`, `foncier_lots`, `foncier_attestations`, `foncier_attestation_temoins`, `user_village_access`, `activity_logs` et `vitrine_lots` ont chacune **0 ligne**.
- Les colonnes `lot_id` de `ventes_foncieres`, `visites_du_jour`, `visites_en_cours` et `vitrine_lots` ont chacune **0 valeur non nulle**.
- `media_usage` contient 26 lignes, toutes de types `brand` ou `site_section`; aucune référence d’usage typée village/lot/attestation/Foncier n’a été trouvée.
- Les seules FK présentes dans ce catalogue qui pointent vers la chaîne Foncier sont : `foncier_lotissements.village_id` → villages (`RESTRICT`), `foncier_ilots.lotissement_id` → lotissements (`RESTRICT`), `foncier_lots.ilot_id` → îlots (`RESTRICT`), `foncier_attestations.lot_id` → lots (`CASCADE`), `foncier_attestation_temoins.attestation_id` → attestations (`CASCADE`), `user_village_access.village_id` → villages (`CASCADE`) et `vitrine_lots.lot_id` → lots (`CASCADE`). Aucune FK vers villages/lotissements/îlots/lots/attestations depuis `properties`, `rent_payments` ou `finances` n’est présente dans ce schéma local, contrairement à certaines migrations versionnées.
- Le même catalogue montre `page_layouts.page_slug`, `page_layouts.page` et `page_layouts.published_at` présents (colonnes visées par la révision retrouvée 028), alors que `alembic_version` indique toujours 027. Cela confirme un décalage entre le marqueur et le schéma, sans prouver quelle opération a créé/appliqué ces colonnes.

Cette preuve établit que la purge locale a laissé le périmètre Foncier vide et n’a pas supprimé les références Foncier d’autres tables observées. Elle ne prouve pas le schéma de production; les écarts avec Alembic rendent obligatoire la même interrogation du catalogue sur la cible avant toute purge.

### Smoke test réel des routes sur `egs_local` — 2026-09-24

Des appels `TestClient` ont utilisé les vrais services SQLAlchemy et la base PostgreSQL `egs_local`; toutes les opérations de base étaient des lectures, sauf un POST de bootstrap bloqué avant toute écriture. Résultats :

| Acteur / parcours | Résultat |
|---|---|
| Admin : villages, villages avec statistiques, lots, attestations, ses accès village, audit | HTTP 200 pour les six GET |
| Rôles `gestionnaire`, `employe`, `guest`, rôle inconnu : liste des villages | HTTP 403 chacun |
| Anonyme : liste des villages | HTTP 401 |
| Admin sans ACL existante : attribution du premier accès village | HTTP 403 avant écriture; bootstrap impossible dans l’état courant |
| Admin : vérification d’une référence d’attestation inexistante | HTTP 404 (route et base atteintes) |
| Anonyme : vérification d’attestation | HTTP 401; le parcours public est actuellement fermé |
| Préflight CORS local | HTTP 200 pour localhost:5173 et localhost:3000; HTTP 400 pour origine non autorisée |

Cela confirme le branchement runtime local, la séparation d’accès actuelle et le blocage d’amorçage/public observé. Les appels ne couvrent pas un parcours navigateur ni des comptes/matrices de rôles approuvés par les métiers.

### Validation navigateur demandée par la mission runtime — 2026-09-24

Services démarrés sur les ports libres prévus par le projet, avec le stockage local existant et PostgreSQL Docker déjà sain : Vite `127.0.0.1:5173`, API `127.0.0.1:8000`, PostgreSQL `5433→5432`. Au démarrage temporaire de l’API, `AUTO_RESET_DEFAULT_ADMIN_PASSWORD=false` a été passé au processus uniquement : la valeur `.env` active sinon une réinitialisation de mot de passe admin au startup. Les lignes admin/Entity existantes étaient cohérentes; aucun fichier de configuration n’a été changé et aucune migration n’a été lancée. Les deux processus temporaires ont été arrêtés après le test; les ports 8000/5173 sont ensuite revenus fermés.

| Point exigé | Résultat runtime |
|---|---|
| Santé API | `GET /health` : HTTP 200. |
| Authentification / profil | Login local E2E HTTP 200; `/api/v1/auth/me` HTTP 200; rôle/access_level `admin`; `full_name` visible dans l’interface. Le secret n’est pas consigné. |
| Interface Foncier | Navigation navigateur via l’action « Nouvelle Parcelle » vers `/foncier`; rendu des onglets Lots, Attestations, Validation, Configuration et Audit, sans erreur JavaScript. |
| Frontend → API | Les GET authentifiés `foncier/lots`, `foncier/villages` et les RPC de statistiques ont répondu HTTP 200 via le proxy Vite same-origin; aucune requête échouée ou erreur CORS navigateur. Les OPTIONS directes contre l’app ont aussi été testées séparément plus haut. |
| Configuration chargée | **Non validable** : liste village vide, seulement l’option « Sélectionner un village »; aucun village/configuration existante à relire. La modale peut s’ouvrir, mais aucune valeur `config_jsonb` n’a été sauvegardée. |
| Relecture et fallback configuration | **Non testables** sans configuration persistée/village ni injection d’échec autorisée. Fallback couvert seulement par inspection et tests unitaires. |
| Impression et contenu | **Non testables** : aucun lot ni attestation existant après purge; aucune donnée n’a été créée/restaurée. `window.print`, `afterprint`, coordonnées, limites, logo et signatures n’ont donc pas été validés au navigateur. Les tests unitaires de formatage restent verts. |
| État de connectivité affiché | L’indicateur global affiche « Hors ligne (Configuration API locale manquante) » bien que les appels API same-origin ci-dessus répondent 200. Le contrôleur rejette l’URL loopback locale; cet état visuel est incohérent en développement. Les hooks Foncier utilisent `navigator.onLine` (vrai) et la configuration n’a pas été enregistrée. |
| Données après parcours | Les compteurs des neuf tables Foncier contrôlées restent à zéro; aucune écriture Foncier n’a été effectuée. |

Après arrêt des services temporaires, la commande prescrite `npx vitest run src/test/FoncierAttestation.test.ts src/pages/Foncier.test.tsx` donne **13/13 PASS**; `npm run typecheck` et `git diff --check` passent aussi.

### Verdict runtime selon les critères de sortie

**GO SOUS RÉSERVES** pour le câblage frontend/API, l’authentification locale et l’affichage de profil; **GO VALIDÉ non atteint** puisque configuration persistée/relecture et impression réelle sont non testables sans données que la mission interdit de créer. La validation production reste NO-GO pour les décisions B.6, la provenance Alembic et la purge séparée de l’environnement cible.

Après sécurisation du test d’intégration, la relance ciblée Foncier/sécurité donne **9 réussis, 1 sauté**. Le test PostgreSQL est sauté par défaut; une exécution future exige l’opt-in et une base `_test` jetable.

### Correctif du faux état hors ligne en développement — 2026-09-24

Le contrôle runtime a montré que `RuntimeConnectivityMonitor.resolveApiHealthConfig()` rejetait toute URL loopback, y compris l’URL API locale attendue pendant le développement, et affichait donc « Hors ligne (Configuration API locale manquante) » alors que le proxy Vite et l’API répondaient. La garde loopback ne s’applique maintenant qu’aux builds hors développement dans `src/offline/network/connectivity.ts`.

- Nouveau test unitaire : API configurée sur loopback en DEV → appel `/health` effectué et état en ligne.
- Test ciblé : **1/1 PASS**.
- `npm run typecheck` : **PASS**; `git diff --check` : **PASS**.
- Tentative de revalidation navigateur connectée après le correctif : échec d’authentification locale HTTP 401, donc aucun résultat de navigateur connecté n’est revendiqué pour cette tentative. Les appels anonymes `/health` sont restés HTTP 200. Les preuves navigateur authentifiées précédentes restent celles du tableau ci-dessus; l’indicateur corrigé n’y a pas encore été confirmé après le changement.
- Les services temporaires API et Vite ont été arrêtés; ports 8000/5173 fermés. Les compteurs Foncier relus ensuite sont toujours à zéro (villages, lotissements, îlots, lots, attestations, accès User–Village, vitrine_lots).

Ce correctif est une modification frontend additionnelle à l’audit; il ne change ni droits, ni données, ni schéma.

### Contrat de création d’un lot et comportement hors ligne — 2026-09-24

La relecture du code a identifié que `dataService.saveLot(..., false)` appelait `POST /api/v1/foncier/lots`, route absente du backend (réponse TestClient : **HTTP 405**). La route existante crée un lot sous `/foncier/ilots/{ilot_id}/lots`; le formulaire courant ne transmet que les libellés village/lotissement/îlot.

- Le client résout maintenant les libellés uniquement contre la hiérarchie déjà enregistrée, en limitant chaque recherche à son parent. Il refuse un nom manquant ou ambigu et n’invente ni village, ni lotissement, ni îlot.
- Tests unitaires : hiérarchie unique → appel imbriqué avec l’identifiant d’îlot; village ambigu → refus avant toute requête de création.
- Comme la base locale est vide, un POST de création réelle n’a pas été tenté. La création n’est donc pas encore validée au runtime avec des référentiels Foncier existants.
- Le contrôle du worker hors ligne a révélé que `useFoncierSync.syncQueue()` ne faisait que compter les entrées; le worker historique n’est pas raccordé et peut supprimer une entrée après trois tentatives. Les créations, archivages et restaurations hors ligne n’affichent plus de succès ni ne sont ajoutés à cette file tant que la synchronisation n’est pas réellement fiable. Les opérations déjà présentes dans IndexedDB ne sont ni modifiées ni supprimées.
- Cela réduit le risque de perte silencieuse, mais le mode hors ligne reste **non disponible**. Pour le réactiver, il faut une conception testée de l’idempotence, des conflits de version, de l’identité du compte propriétaire de la file et du contrôle d’accès au moment de la synchronisation.
- Vérifications ciblées après ces changements : **8 tests ciblés réussis**, typecheck réussi et ESLint sans erreur (deux avertissements préexistants dans `src/api/client.ts`). Le décompte complet actualisé est à confirmer par une exécution intégrale.

### Verdict actualisé

**NO-GO pour la production.** Les contrôles automatisés et la compilation sont verts, mais les inconnues B.6, le bootstrap ACL, la chaîne Alembic non réconciliée, la recette runtime/CORS et la purge de l’environnement cible ne sont pas levés. Aucune validation métier ni migration de schéma n’est implicite dans les corrections techniques.
