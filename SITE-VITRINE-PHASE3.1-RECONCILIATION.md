# PHASE 3.1 — RÉCONCILIATION

Audit du 2026-09-23. Mode lecture seule pour le code et PostgreSQL; aucun fichier source/migration n'a été restauré et aucune donnée DB n'a été écrite. Les deux seuls fichiers créés pendant cette Phase 3.1 sont ce rapport et `PHASE3.1-GIT-MODIFICATIONS.md`.

## 1. Verdict

**NO-GO.** La migration 027 est maintenant récupérable comme artefact source, mais sa provenance commit/auteur n'est pas retrouvée; la DB porte des effets physiques supplémentaires non représentés par sa version Alembic; le RBAC API reste incomplet; le contrat Media de création de log est cassé; une partie des tests Phase 3 utilise une DB fictive et ne prouve pas le succès d'écriture réel.

La Phase 4 demeure interdite. Le rapport initial [Phase 3](/home/soma/gnamba-project/SITE-VITRINE-PHASE3-SECURITY-SCHEMA.md) indiquait n'avoir retrouvé aucune trace de 027. Cette conclusion était incomplète : l'audit Phase 3.1 a trouvé le `.pyc` ignoré et des objets Git orphelins.

## 2. État Git

- Branche courante `audit/fix-schema-site`; HEAD `634938c8`; suivi par `origin/audit/fix-schema-site` à la même révision.
- Baseline : 24 fichiers suivis modifiés, quatre non suivis; `git diff --check` propre.
- Huit modifications suivies et deux rapports non suivis existaient avant Phase 3. Les seize autres fichiers suivis, le test API sécurité et le rapport Phase 3 non suivi sont attribués à Phase 3 : total **18 fichiers** (liste/justification/risques dans [PHASE3.1-GIT-MODIFICATIONS.md](/home/soma/gnamba-project/PHASE3.1-GIT-MODIFICATIONS.md)).
- Après capture du baseline, `src/lib/dbClient.service.ts` a aussi été modifié et `src/lib/dbClient.service.test.ts` est apparu non suivi (mtime environ 2026-09-23 19:22 UTC). Ces changements Foncier n'étaient pas présents dans le premier status/diff de la Phase 3.1; leur auteur/intention ne sont pas établis par Git. Ils sont exclus des 18 fichiers Phase 3, préservés sans modification et décrits dans le rapport Git.
- Branches locales/distantes et reflogs examinés; les recherches d'historique et de chemins ne révèlent aucun commit ou tag portant ces migrations. `git fsck --full --no-reflogs --unreachable` trouve 6 190 objets inaccessibles, dont 84 commits inaccessibles; aucun de ces arbres de commit ne référence les blobs de migration retrouvés.
- Aucun `reset`, `clean`, changement de branche, fetch, restauration ou modification de référence n'a été effectué.

## 3. 027 — origine

**Résultat : contenu source retrouvé, historique Git/auteur non retrouvé.**

Preuves concordantes :

1. La DB locale `egs_local` a exactement `027_fix_public_site_schema_drift` dans `alembic_version`.
2. Un fichier ignoré `backend/alembic/versions/__pycache__/027_fix_public_site_schema_drift.cpython-312.pyc` existe (8 452 octets; mtime 2026-09-22 08:03 UTC environ). Son `co_filename` est le chemin source de 027 dans ce dépôt.
3. Le blob Git orphelin `3add81b38f8475123b0645239fca3ed67fdf5edf` est la source 027 (7 534 octets). Sa compilation Python 3.12 donne un code objet identique au `.pyc`; la taille source de l'en-tête `.pyc` est aussi 7 534. Il ne s'agit donc pas d'une supposition basée uniquement sur le nom.
4. La migration source annonce `Revises: 026_add_lot_barcode_and_cedant`. Un blob orphelin `d9111c5547296814b80bbe7c15c865c642d037e9` fournit la source 026, qui annonce 025 comme parent. Un autre blob orphelin `b0eea638d91c6704b278a09d36d79ef63c2509bb` fournit 025, parent 024.
5. Un blob orphelin supplémentaire `2e25c325fa29386fd4c89abbae789fdf6feda5bf` fournit 028, parent 027.

Chaîne retrouvée en contenu :

```text
024_add_media_taxonomy_and_content_hash
  → 025_fix_missing_foncier_schema_columns
  → 026_add_lot_barcode_and_cedant
  → 027_fix_public_site_schema_drift
  → 028_reconcile_page_layout_columns
```

Les quatre migrations 025–028 sont absentes des sources du checkout et d'arbres de commit trouvés. Les objets source sont des blobs Git orphelins; ils ont pu provenir d'un `git add` sans commit ou d'un historique devenu inaccessible, mais on ne peut distinguer ces causes. Le bytecode établit qu'un fichier source nommé 027 a existé localement et a été compilé; la ligne Alembic DB établit que le marqueur 027 y a été enregistré. **Auteur, commit d'origine, date/commande d'application et contexte d'application précis : inconnus.** Aucun commit n'a été identifié pour `git show`.

## 4. Drift Alembic

- `alembic current` échoue avec le texte exact : `Can't locate revision identified by '027_fix_public_site_schema_drift'`.
- `alembic heads` : `024_add_media_taxonomy_and_content_hash (head)`.
- `alembic history --verbose` s'arrête au graphe versionné terminé en 024 (avec le mergepoint existant), sans 025–028.
- Version physique DB : 027, pas 028.
- Les effets 025/026/027 sont largement présents dans le schéma DB. Les effets compatibles avec 028 (`page_slug`, `page`, `published_at`) sont aussi présents, mais `idx_page_layout_page_slug`, demandé par la source 028, est absent; `published_at` est `TEXT` dans la DB alors que 028 le déclare `TIMESTAMPTZ`. La version Alembic restant 027, on ne peut conclure que 028 ait été appliquée proprement. Le schéma peut avoir été partiellement/manuellement modifié, ou des colonnes équivalentes préexistaient.

### Contenu récupéré de 027 — DDL et portée

La migration ne touche pas `page_layouts`, `site_content` ou `site_realisations`. Elle touche `vitrine_lots`, `foncier_attestations` et `foncier_attestation_temoins` :

- PostgreSQL uniquement; sur un autre dialecte elle retourne sans action.
- Ajoute si absentes 31 colonnes dans `vitrine_lots` : liens `lot_id/property_id`; champs de base `titre`, `description`, `prix`, `surface`, `localisation`, `photos`, `publier`, `ordre`, `tags`; puis référence/localisation détaillée, champs vitrine, publication/ordre, notes et créateurs/modificateurs. La migration n'applique pas les types aux colonnes déjà présentes.
- Crée les index non uniques `idx_vitrine_lot_reference`, `idx_vitrine_lot_statut`, `idx_vitrine_lot_publie`.
- Convertit `lot_id` et `property_id` en UUID si leur type n'est pas déjà UUID. Pour une valeur texte qui n'est pas un UUID au format attendu, le `CASE` écrit `NULL` : c'est une perte irréversible du lien.
- Ajoute les FKs `fk_vitrine_lot_lot/property` avec `ON DELETE CASCADE` si les tables cibles existent.
- Ajoute `foncier_attestations.row_version INTEGER NOT NULL DEFAULT 1`; ajoute `foncier_attestation_temoins.entity_id UUID` et son index. 025 avait déjà ces deux ajouts, avec en plus une FK `fk_attestation_temoins_entity`; ils sont donc redondants entre parents.
- Le downgrade retire les index/FKs puis tente de supprimer **toutes** les colonnes de la liste des 31 de `vitrine_lots`, sans vérifier si 027 les a créées ou si elles contenaient des données; il retire aussi `entity_id` et `row_version`. Ce downgrade peut détruire des données et même les colonnes de base que 012 créait. Il n'est pas une restauration sûre.

La migration 026 remplit `foncier_lots.code_barre` pour les valeurs NULL à partir de l'UUID du lot, rend la colonne NOT NULL et crée un index unique; elle ajoute aussi les champs snapshot du cédant. Son downgrade supprime ces champs. La source 025 ajoute les colonnes Foncier mentionnées ci-dessus et une FK SET NULL. Aucune des migrations récupérées ne doit être copiée/réintégrée ou exécutée sans revue de chaîne et de données.

## 5. Schéma DB réel

Connexion sélectionnée par le backend : PostgreSQL local `localhost:5433/egs_local` (mot de passe masqué; aucune valeur secrète affichée). L'inspection et les agrégats ont été exécutés dans une transaction `READ ONLY`, terminée par `ROLLBACK`. Aucun contenu de lignes n'a été affiché.

| Objet | Code / modèle du checkout | Migrations récupérées/versionnées | DB locale observée | Écart / effet de données |
|---|---|---|---|---|
| `page_layouts` | Modèle 012 : UUID `id`, `page_key` non-null unique, `page_name`, `is_active`, `layout_json`; code API utilise aussi `page_slug/page_key`, `is_published`. | 012 exige `page_key` unique/index actif. Blob 028 ajoute aliases `page_slug`, `page`, `published_at`, backfill depuis `page_key/page_name`, puis index `idx_page_layout_page_slug`. | PK sur `id`; `page_key` nullable et pas unique; colonnes `page/layout/sections/is_published/page_slug/published_at` coexistent; pas d'index de layout listé par PostgreSQL; `published_at TEXT`. 42 lignes, un groupe `page_key` dupliqué, cinq lignes avec `page_slug IS DISTINCT FROM page_key`. | Ni migration 028 enregistrée ni index 028 présent; contenu comprend des doublons/alias; ne pas refaire le backfill avant d'étudier les cinq écarts et les 42 layouts. |
| `site_content` | Modèle 012 : PK composite `(section,key)`; contenu à valeur texte. | 012 prévoit aussi index section et champs de traduction. | PK composite `(section,key)` bien présent; un enregistrement; zéro groupe de doublons; champs `type`, `value_type`, `description`, `translations` coexistent; pas d'index section indépendant observé. | Correction importante au rapport Phase 3 : la PK composite garantit déjà l'unicité attendue par `ON CONFLICT(section,key)`; il n'y a pas une absence de contrainte unique effective. |
| `vitrine_lots` | Modèle hybride : PK UUID; `tags`, `documents`, `caracteristiques` déclarés JSON; créateurs UUID. | 012 crée les champs vitrine/relations; 027 reprend champs, index, conversion et FK cascade. | PK id **TEXT**; `tags ARRAY`, `documents TEXT`, `caracteristiques ARRAY`, `created_by/updated_by TEXT`, `region TEXT`; `lot_id/property_id UUID`; les trois index et FKs de 027 présents. Une ligne, avec `lot_id` et `property_id` tous deux NULL. | Types déjà présents divergents du modèle et de certains types déclarés par 027 (`caracteristiques JSON`, documents JSON, IDs créateur UUID). Les liens nuls indiquent que l'unique fiche vitrine locale n'est actuellement reliée à aucun lot/property; les suppressions en cascade restent un risque pour les futurs liens. |
| `site_realisations` | Modèle initial 012 incomplet vs API enrichie (`reference`, photos, publication, etc.). | 012 prévoit champs métier, unique reference et indexes/checks. 027 n'y touche pas. | Colonnes anciennes et enrichies coexistent; PK `id TEXT`; aucun index ni unique autres que PK vu par l'inspection. | Drift indépendant non corrigé par 027; risque si du code suppose les contraintes 012. |
| `contact_messages` | Modèle API générique et modèle 012 ont un contrat plus strict que la table legacy. | 012 prévoit UUID, champs obligatoires, statut/checks et indexes. | PK `id TEXT`; champs historiques/aliases ajoutés et plus tolérants; aucun index/check autre que PK observé. | L'API doit rester whitelistée; drift de validation et de contraintes non traité par 027. |
| `foncier_attestations` | Workflow Foncier utilise `row_version`; champs métier nombreux. | 025 et 027 ajoutent `row_version INTEGER NOT NULL DEFAULT 1`. | Colonne présente, NOT NULL, min/max 1 sur une ligne; FK/index métier et checks présents. | Effet de 025/027 compatible et physiquement présent; les deux migrations se chevauchent. |
| `foncier_attestation_temoins` | Modèle/workflow utilise l'association `entity_id`. | 025 ajoute `entity_id`, index et FK `entities`; 027 répète colonne/index. | Deux lignes; `entity_id` UUID présent mais NULL pour les deux; index et FK `fk_attestation_temoins_entity` présents. | Schéma compatible avec 025; aucune association entity enregistrée dans ces deux témoins au moment de l'audit. |
| `foncier_lots` | Modèle utilise les champs cédant et code-barres. | 026 les ajoute, peuple le code-barres, rend celui-ci non-null et unique. | Une ligne; code_barre non NULL et une valeur distincte; champs cédant constatés dans la DB. | Résultat matériel compatible avec 026; l'ancienne valeur avant le backfill n'est pas récupérable par ces seuls agrégats. |
| `media_files` | Modèle courant utilise `filename/storage_key/url/category/tags/content_hash/taxonomy_id`. | 011 décrit un autre contrat de stockage; 024 ajoute `content_hash`/`taxonomy_id`. | Schéma courant cohérent avec modèle récent; `content_hash` et `taxonomy_id` présents; PK `id`; aucun index listé par introspection. | Le drift Media est plus large que 027; source historique de la forme actuelle n'est pas 027. |
| `media_versions` / `media_usage` / `media_audit_logs` | Modèles/Repository courant utilise anciens champs (`old_url`, `usage_type`, `actor_id`, `metadata`). | 011 prévoit des champs différents et plusieurs contraintes/index. | FKs `media_versions/media_usage` vers Media présentes; contrats courants legacy et colonnes diffèrent de 011; pas de uniques/index additionnels observés. | Schéma et route/service Media ne sont pas alignés sur la migration initiale. |

Les migrations 012/011 sont des comparateurs du checkout, pas preuve de l'historique exact de la DB après les migrations orphelines. Les comptes de lignes/NULL sont des agrégats locaux : `page_layouts=42`, `site_content=1`, `vitrine_lots=1`, `foncier_attestations=1`, témoins=2, lots Foncier=1. Aucune sauvegarde n'a été créée car aucune migration n'est proposée/appliquée dans cette phase.

## 6. RBAC serveur

Mécanismes constatés :

- Auth serveur existe : JWT/dependency `get_current_user`, rôles `admin`, `gestionnaire`, `employe` dans les modèles/schemas utilisateurs; `access_level` est aussi renvoyé par `/auth`.
- Le contrôle backend réutilisable trouvé est la nouvelle `require_admin_user`, qui vérifie uniquement `current_user.role == "admin"`.
- Les listes détaillées rôle→modules (`ACCESS_LEVEL_MODULES`, `hasAccess`) vivent dans `src/context/AuthContext.tsx`, donc dans le frontend. Aucun service/dependency backend ne fait la même vérification `module + action + ressource`.
- Le modèle backend expose `access_level`, mais les routes auditées n'exploitent pas la table frontend `hasAccess`/ses modules.

| Endpoint / groupe | Public | Auth actuelle | Rôle/permission actuelle | Écart |
|---|---|---|---|---|
| `/tables/{table}` GET | Oui uniquement pour listes vitrine publiées | `get_optional_current_user`; sinon auth | Tables CMS/media admin-only si connecté; autre table accessible à tout connecté | Pas de permission module/lecture; l'allowlist prive plusieurs tables, mais pas les autres données ERP |
| `/tables/{table}` POST | Contact limité public | Optional current user | Tables sensibles listées : admin; autre table : tout connecté | Tout rôle connecté peut créer dans les autres tables ERP |
| `/tables/{table}/{id}` PATCH/DELETE | Non | `get_current_user` | Tables sensibles : admin; autre table : tout connecté | **P0 RBAC** : actions et objets ERP pas autorisés par rôle/module |
| `/site-content` GET; `/page-layouts/{slug}` GET | Oui, contenu/layout publié | Aucune ou auth optionnelle pour layout | Pas de rôle sur lecture publiée | Conforme à l'intention publique, mais layout brouillon restreint à admin |
| Écritures site-content/page-layouts/site vitrines | Non | Auth via `require_admin_user` | Admin strict | Pas de rôle éditeur CMS distinct; choix prudent mais granularité métier inconnue |
| `/clients/*` | Non | Auth simple | Aucun rôle/action | Tout utilisateur connecté a lecture et CRUD clients |
| `/leads/*` hors capture | Non | Admin strict | Admin | Fonctionnel mais rôle admin seulement; les rôles CRM de l'UI ne sont pas traduits côté serveur |
| `/media/*` | Assets de marque publics | Auth pour bibliothèque; option spéciale audit/purge admin | La majorité des mutations utilise auth simple; purge et audit admin | Upload/update/delete/restore/replace/usage ne vérifient pas action/module; tout connecté peut agir |
| Formulaires `contact`, `lead capture`, intérêt lot | Explicitement oui | Pas de session | Validation de payload, pas d'identité | Pas de rate limit serveur/CAPTCHA démontré; risque de spam et création CRM automatisée |

**Conclusion RBAC : INCOMPLET.** Le changement Phase 3 protège l'anonymat et quelques périmètres admin, pas la séparation des modules/actions. Ne pas ajouter un deuxième RBAC ad hoc; la Phase 3.2 doit établir une politique serveur alignée sur les rôles/access_level EGS et la faire valider avant implémentation.

## 7. Contrat Media

- `backend/app/api/v1/media/router.py:185` appelle `service.create_media_audit_log(...)`.
- `MediaService` hérite de `MediaApplicationService`; cette classe offre `list_media_audit_logs` mais **pas** `create_media_audit_log`.
- `MediaRepositoryPort` ne déclare pas de méthode create pour audit; `SqlAlchemyMediaRepository` implémente uniquement la lecture audit.
- Le test `test_media_audit_route_contract` atteint donc un appel de méthode inexistante et échoue en `AttributeError`. C'est un échec réel, pas un problème de permission.
- Une autre voie frontend `src/data/media.repository.ts:logAction` insère dans `media_audit_logs` via `dbClient`; `src/data/client.ts` mappe cette table sur `/media/audit-logs`. Le routeur backend audité expose `/media/audit`, pas `/media/audit-logs`. Une abstraction distincte `src/api/client.ts` appelle bien `/media/audit`. Les contrats d'appel sont donc divergents et `logAction` n'a pas d'appelant dans `src` au moment de la recherche.
- Le modèle DB courant `media_audit_logs` (media_id/action/actor_id/metadata/created_at) est compatible avec le contrat API response, mais pas avec la migration initiale 011 (user_id/old_values/new_values, etc.).

Diagnostic : méthode de création non implémentée dans le contrat application/port/repository, endpoint serveur pourtant déclaré; route d'alias frontend divergente. Il faut décider d'un contrat canonique et d'une persistance audit réelle, puis tester la ligne créée. Ajouter une méthode vide ou mockée serait incorrect.

## 8. Modifications Phase 3

Les 18 fichiers (modification, justification, priorité, test, indispensable, régression) sont détaillés par fichier dans [PHASE3.1-GIT-MODIFICATIONS.md](/home/soma/gnamba-project/PHASE3.1-GIT-MODIFICATIONS.md).

Constats importants :

- Le périmètre principal était la réduction de l'accès anonyme, mais les routes génériques restent sans contrôle module/action.
- Le nouveau `POST /site/vitrine-lot-inquiries` est une modification de contrat plus large qu'une simple dépendance d'accès; il n'a pas de test succès complet et augmente l'exposition au spam.
- Le test CMS Phase 3 a remplacé un parcours DB en échec par un succès `FakeSession`; ce test établit le garde mais pas le write réel. Conserver explicitement le statut « write DB non prouvé ».
- L'ancienne conclusion « 027 inconnue/non retrouvée » doit être remplacée par celle de cette Phase 3.1 : contenu source récupéré depuis blob orphelin, origine commit/auteur inconnue.

## 9. Tests

Exécutions sans changement source pendant la Phase 3.1 :

| Validation | Résultat | Lecture honnête |
|---|---|---|
| `python -m compileall -q backend` | PASS, avec `SyntaxWarning` dans les tests tiers `passlib` | Syntaxe compile; ne prouve pas les routes ou DB |
| `pytest -q tests/test_api_security.py tests/test_site_content_crud.py tests/test_media_api.py` | **8 passed, 1 failed** | L'échec `MediaService.create_media_audit_log` est réel; tests sécurité utilisent override d'identité et CMS FakeSession; plusieurs chemins Media écrivent dans la DB/storage de test isolés |
| `npm run typecheck -- --pretty false` | FAIL | Même groupe d'erreurs déjà relevé après Phase 3 : unused dans `MediaUploader.tsx` et `whatsappService.ts`, propriétés Foncier (`FoncierLot`/`UserProfile`) dans `useFoncierState.ts`/`Foncier.tsx`. Les fichiers Foncier cités étaient déjà modifiés avant Phase 3; aucune erreur dans les quatre fichiers publics modifiés Phase 3. |
| `npm run build` | PASS | Bundle produit; avertissements non bloquants sur imports dynamiques Foncier. Une compilation ne vaut pas validation fonctionnelle. |
| `git diff --check` | PASS | Aucun whitespace error. |
| `alembic current/heads/history --verbose` | current FAIL sur revision 027; heads/history PASS mais HEAD=024 | Base et graphe versionné incongruents. |

Les tests route qui remplacent `get_current_user` établissent qu'une dépendance de rôle répond 401/403, mais ils ne valident pas le parcours d'un vrai utilisateur EGS de JWT à action métier. Aucun test Phase 3 n'atteste une migration sur une copie DB, une transaction PostgreSQL réussie ni une régression navigateur des formulaires publics.

## 10. Risques

1. **P0 — droits ERP trop larges** : toute personne authentifiée peut lire/écrire/supprimer de nombreuses tables génériques, et CRUD Clients; la plupart des mutations Media ne vérifient qu'une session.
2. **P1 — historique migratoire non attaché à un commit** : sources récupérables dans les blobs orphelins, mais pas d'auteur ni commit reproductible; 028 est matériellement non enregistré.
3. **P1 — migration 027 non sûre en rollback** : downgrade supprime toutes les colonnes vitrine ciblées et peut perdre les liens en castant du texte invalide vers NULL.
4. **P1 — types hybrides persistants** : DB a `vitrine_lots.id TEXT`, `documents TEXT`, `caracteristiques ARRAY`, créateurs TEXT malgré modèle/types de migration différents. 027 ne convertit pas ces colonnes existantes.
5. **P1 — confiance de test CMS insuffisante** : faux session/cache SQL laisse l'effet réel non vérifié.
6. **P1 — audit média cassé** : endpoint de création d'audit non fonctionnel et chemins client divergents.
7. **P2 — formulaire lot public sans anti-abus serveur prouvé**; formulaires Contact/CMS et inquiry sans vérification de succès E2E.
8. DB de production non inspectée; seule la base locale a été examinée.

## 11. Corrections nécessaires — plan, pas exécution

1. Conserver en lieu sûr les quatre blobs source identifiés par leurs SHA, puis proposer une récupération versionnée de 025–028 après revue. Rechercher la copie originale/auteur dans les sauvegardes, autres clones ou serveur d'application avant d'attribuer la provenance.
2. Vérifier auprès de l'environnement de déploiement l'historique DDL/Alembic et déterminer comment les colonnes de 028 sont arrivées alors que la ligne version reste 027.
3. Sur une copie restaurée et vérifiée, produire un snapshot `pg_dump --schema-only` + données nécessaires, comparer FK/index/types/defaults/contraintes/valeurs avant de décider d'une migration de convergence. Aucun downgrade 027 ne doit être utilisé comme rollback de données.
4. Cartographier et faire valider une politique serveur `role/access_level × module × action × ressource`, compatible avec les modules réellement autorisés. Tester refus et succès réels, en particulier `/tables/*`, Clients et Media.
5. Résoudre le contrat Media : chemin canonique, méthode de création de journal, champs et transaction; test d'intégration prouvant l'insertion réelle.
6. Restaurer/compléter un test CMS d'intégration sur DB SQLite/PostgreSQL représentant le schéma visé; garder les tests FakeSession uniquement comme tests unitaires d'autorisation, sans leur donner valeur d'acceptation write.
7. Valider les formulaires publics et rate limiting sur environnement de test; ne pas activer sur prod depuis cette phase.

## 12. Corrections interdites à ce stade

- Ne pas restaurer aveuglément des sources 025–028 dans les migrations actives; leur contenu a des downgrades destructifs.
- Ne pas créer une migration 029/027 corrigée ou exécuter un `stamp`, `upgrade`, `downgrade`, DDL, `DROP`, backfill ou fix de colonnes sur `egs_local`/prod à partir de cette comparaison seule.
- Ne pas transformer le succès simulé CMS en preuve DB.
- Ne pas faire la Phase 4 ni modifier Page Builder, SiteEditor, les layouts, les routes publiques ou le modèle CMS.
- Ne pas supprimer les artefacts pyc/blobs ni changer secrets.

## 13. Plan Phase 3.2

Phase 3.2 proposée : récupérer les historiques de déploiement et DB, obtenir un snapshot restaurable, réattacher les sources originales 025–028 avec provenance si possible, produire un diff DB/code vérifiable, puis traiter séparément RBAC et Media. Elle ne doit appliquer une migration que sur un clone de DB restauré et après approbation explicite du plan. La production reste hors périmètre.

## 14. Condition exacte de passage à Phase 4

Phase 4 ne sera autorisée qu'après :

- provenance de migration documentée (ou reconnue formellement inconnue), chaîne 024–028 reproductible dans Git et état Alembic/DDL DB expliqué;
- migration de convergence validée sur copie restaurée avec backup restauré avec succès, contrôles de données pré/post, downgrade/rollback évalué;
- permissions serveur module/action définies et vérifiées avec identités réelles, sans accès transversal générique non autorisé;
- contrat Media canonique et création audit réellement opérationnels;
- tests d'intégration du write CMS, des lectures publiques et des modules affectés sans échec réel non expliqué;
- erreurs TypeScript préexistantes soit résolues dans leur propre changement, soit précisément attribuées et acceptées par la revue;
- confirmation que la vitrine publique et les modules ERP exposés passent les validations ciblées.

Jusque-là : **PHASE 4 INTERDITE**.
