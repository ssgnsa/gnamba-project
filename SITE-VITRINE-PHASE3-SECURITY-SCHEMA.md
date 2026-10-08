# Phase 3 — Sécurité API et réconciliation du schéma

Date de l'audit : 2026-09-23. Base inspectée : PostgreSQL locale `egs_local` (localhost:5433), en lecture seule. Aucune requête d'écriture, migration, sauvegarde ou modification de schéma n'a été exécutée sur cette base.

## 1. Endpoints audités

| Route(s) | Avant correction | Après correction | Données / exposition |
| --- | --- | --- | --- |
| `GET /tables/{table}` | Anonyme pour toute table | Auth requise; anonyme seulement pour listes `site_realisations` et `vitrine_lots` publiées, avec projection publique | Expose les tables génériques ERP; deux listes vitrines restent publiques |
| `POST /tables/{table}` | Anonyme pour toute table | Anonyme autorisé uniquement sur `contact_messages`, whitelist de champs, tailles bornées et email/message requis; tables CMS/vitrines/médias admin seulement | Message public de contact; autres écritures passent par auth |
| `PATCH/DELETE /tables/{table}/{id}` | Auth absente | Auth requise; tables CMS/vitrines/médias admin seulement | Mise à jour et suppression génériques |
| `/site-content` GET | Public | Public inchangé | Contenu public clé/valeur |
| `/site-content` POST/PATCH/DELETE | Pas de dépendance d'auth | `require_admin_user` (`401` anonyme, `403` rôle non-admin) | Contenu CMS |
| `/page-layouts` GET liste | Public | Admin seulement | Liste pouvant contenir des brouillons |
| `/page-layouts/{slug}` GET | Public, y compris brouillons | Public limité aux layouts publiés; admins voient aussi les brouillons | Layouts du site |
| `/page-layouts` POST et `/{slug}/publish` PATCH | Auth et test de rôle dans le handler | Dépendance admin commune | Écriture/publication de layout |
| `/site/realisations` GET | Liste non filtrée | Publiés uniquement et colonnes sensibles omises | Réalisations vitrine |
| `/site/realisations/{id}` GET | Public | Admin seulement | Détail complet |
| `/site/realisations` POST/PATCH/DELETE | Auth puis test admin dans handler | Dépendance admin commune | Écritures vitrines |
| `/site/vitrine-lots` GET | Liste non filtrée, notes/audit inclus | Publiés uniquement, notes et champs d'audit omis | Lots vitrine |
| `/site/vitrine-lots/{id}` GET | Public | Admin seulement | Détail complet |
| `/site/vitrine-lots` POST/PATCH/DELETE | Auth puis test admin dans handler | Dépendance admin commune | Écritures vitrines |
| `/site/vitrine-lot-inquiries` POST | N'existait pas; page publique écrivait via clients/opportunités/tâches génériques | Endpoint public borné dédié, crée le suivi CRM nécessaire | Formulaire d'intérêt vitrine |
| `/media/brand-assets` GET | Public | Public inchangé | Assets de marque utilisés sur le site |
| `/media` upload/list/get/update/delete/restore/versions, `/usage` | Pas d'auth | Auth requise; purge et audit admin-only | Bibliothèque média, usages et versions |
| `/media/audit` GET/POST | Pas d'auth | Auth requise; POST et GET admin-only | Journal d'audit média |
| `/clients` CRUD, activation, recherche | Pas d'auth | Auth requise | Données clients/CRM |
| `/leads` CRUD/recherche | Pas d'auth sur plusieurs opérations | Admin; `/site/lead-capture` est public, `/leads/capture` reste admin-only | Données CRM; capture web conservée |
| `/leads/campaigns/*`, `/leads/automation/*` | Pas d'auth | Dépendance admin au routeur | Campagnes et règles d'automatisation |

Les dépendances appellent `get_current_user`/`AuthService` et lisent le rôle existant. Aucun RBAC serveur par module n'a été trouvé; la fonction `hasAccess(role,module)` est côté frontend. Le dépôt ne contient donc pas de mécanisme existant pour appliquer les autorisations détaillées par module à toutes les tables métier.

## 2. Vulnérabilités confirmées

- Les routes génériques `/tables` permettaient les lectures et écritures anonymes sur les tables ERP et CMS.
- Les écritures `site-content` étaient atteignables anonymement.
- Les layouts brouillons, détails de réalisations et lots, notes d'annonces et données non publiées pouvaient être lus via routes génériques/spécifiques.
- Les routes média et CRM n'exigeaient pas systématiquement d'authentification. Les tests de baseline ont notamment confirmé que l'upload média et les usages fonctionnaient anonymement.
- Les routes campagne/automatisation Leads ne vérifiaient pas d'identité.

## 3. Protections ajoutées

- Ajout de `require_admin_user`, basé sur `get_current_user` et le rôle EGS existant; les refus d'autorisation sont désormais `403`.
- Protection des mutations CMS, des mutations vitrines, de la publication de layout et des opérations CRM d'administration.
- Filtrage des lectures publiques aux enregistrements publiés; suppression des notes/champs d'audit dans les projections publiques.
- Réduction de l'écriture anonyme à la réception d'un message de contact et au formulaire d'intérêt lot, avec schémas/champs/tailles bornés.
- Conservation des lectures nécessaires à la vitrine : contenu CMS, layouts publiés, réalisations/lots publiés, assets de marque.
- Retrait de `statut` des payloads des formulaires publics; le défaut serveur existant fixe les nouveaux messages à `nouveau`.
- Le formulaire PublicLots utilise maintenant le point d'entrée dédié au lieu de créer directement Client/Opportunity/Task via l'API générique; la capture de lead existante est conservée.

## 4. Tests sécurité avant/après

**Avant :** les tests existants `test_site_content_crud_flow` et les opérations média s'exécutaient sans token. Le POST CMS atteignait le handler, mais échouait ensuite sur le schéma SQLite de test. Upload et usage média anonymes passaient. Cela confirme l'absence de barrière d'accès, sans établir un effet DB CMS réussi.

**Après :** les tests dédiés vérifient :

- anonyme → `401` pour tables métier, clients, leads, média, écritures de layouts;
- rôle `gestionnaire` → `403` pour les lectures admin layouts, mutations vitrine et routes campagnes;
- écritures site-content → `401` anonyme, `403` gestionnaire, succès admin et commit observé avec session simulée;
- GET CMS public toujours disponible avec données simulées;
- listes de gestion média anonymes → `401`, purge par rôle non-admin → `403`.

Commande : `pytest -q tests/test_api_security.py tests/test_site_content_crud.py tests/test_media_api.py` — **8 passed, 1 failed**. Échec préexistant confirmé : `MediaService.create_media_audit_log` est absent alors que le test de contrat l'appelle. Ce défaut de service n'a pas été masqué ni étendu dans cette phase.

## 5–8. Révisions et drift DB/Git

- DB locale `alembic_version` : `027_fix_public_site_schema_drift`.
- HEAD Alembic du checkout : `024_add_media_taxonomy_and_content_hash`.
- `alembic history` aboutit à 024; `alembic heads` indique 024.
- `alembic current` échoue : `Can't locate revision identified by '027_fix_public_site_schema_drift'`.
- Recherche dans l'historique/branches/objets Git déjà effectuée : aucune définition ni objet récupérable correspondant à 027 n'a été retrouvé. Aucun fichier migration correspondant n'a été retrouvé dans l'espace de travail accessible.
- Auteur, parent, DDL précis de 027 et date d'application restent inconnus. La base est au-delà du HEAD Git; la cause est compatible avec une migration locale/manuelle ou une migration perdue/non versionnée, mais les preuves ne permettent pas de choisir entre ces scénarios.

| Objet | Git (012/011 et migrations disponibles) | DB locale observée | Différence / risque |
| --- | --- | --- | --- |
| `page_layouts` | `page_key` unique/non-null, page_name/layout_json/is_active et index actif; FK utilisateurs/média | `page`, `layout`, `sections`, `is_published`, `page_slug`, `published_at` en plus; colonnes du Git également présentes; colonnes tolérantes au NULL, aucune unique/index/FK observé | Variantes de contrat, doublons de clé possibles; code lit/écrit différents noms (`page_slug`, `page_key`, `layout_json`) |
| `site_content` | `id`, section/key non-null, unique `(section,key)`, index section, translations/etc | `type` historique en plus; aucune contrainte unique/index observée par introspection; section/key non-null | `ON CONFLICT(section,key)` du handler suppose une contrainte unique absente de l'inspection: succès réel non prouvé |
| `site_realisations` | Contrat migration 012, champs métier et index/uniques/checks attendus | Colonnes anciennes (`categorie`, `image_url`) et nouvelles (`type_realisation`, photos, budgets, publication, etc.) coexistent; inspection sans indexes/uniques | Drift de colonnes; affichage dépend de plusieurs variantes |
| `vitrine_lots` | UUID id, lot/property, titre, prix/surface, publier/ordre et FK/index de migration | `id TEXT`, champs anciens et enrichis simultanément (prix/prix_vente, publier/publier_sur_vitrine, ordre/ordre_affichage), FK vers foncier/property et trois indexes observés | Différences de type/contrat; lectures/écritures utilisent les variantes enrichies |
| `contact_messages` | UUID id; champs non-null et statut contraint; indexes statut/type/assigné/date | `id TEXT`, plusieurs champs nullables, aliases `name/phone/subject`; pas de contrainte/index observé | Validations et contraintes diffèrent; endpoint générique doit rester étroit |
| `media_files` | Migration 011 définit file_name/path/mime_type/hash etc.; migration 024 ajoute content_hash/taxonomy | modèle opérationnel `filename/storage_key/url/category/...`, `content_hash`/`taxonomy_id`; colonnes attendues 011 absentes; pas d'index observé par introspection | Dérive majeure par rapport à 011; vraisemblablement migrations/DDL postérieurs, historique incomplet |
| `media_versions` | `file_name`, `file_path`, hash/description, unique(media_id,version_number) | `old_url`, `old_filename`, `replaced_by`; FK vers media; pas d'unique observée | Contrat Media historique divergent |
| `media_usage` | `entity_id` UUID non-null, usage_context/order, unique(media/entity/context) | `entity_id TEXT` nullable, `usage_type`, `label`; FK vers media, pas d'unique observée | Contrat évolué, intégrité et cardinalité différentes |
| `media_audit_logs` | `old_values/new_values/user_id/ip_address/...`, media_id non-null et FK | `actor_id`, `metadata`; media_id nullable, pas de FK observée | Schéma et contrat de service différents; test du service d'audit échoue aussi |

Les colonnes/types/defaults/indexes/FK cités pour la DB viennent de l'introspection SQLAlchemy en lecture seule le 2026-09-23. Les migrations Git sont la source de comparaison côté checkout. Cette comparaison n'est pas un dump exhaustif des checks PostgreSQL/enums; aucune preuve n'établit le contenu de 027.

## 9–10. Migration et backup

- Migration appliquée pendant cette phase : **NON**.
- Aucun `stamp`, `upgrade`, `downgrade`, `DROP` ou DDL n'a été exécuté.
- Aucun backup n'a été créé puisque le plan de convergence n'a pas été validé et aucune migration n'a été engagée. Il n'existe donc pas de preuve de snapshot/restauration attachée à cette phase.

## 11–12. Tests et régressions

- `python -m compileall -q app` : PASS.
- Tests backend ciblés : 8 PASS, 1 FAIL (`MediaService.create_media_audit_log` manquant).
- `npm run typecheck` : FAIL sur erreurs déjà présentes dans `MediaUploader.tsx`, `useFoncierState.ts`, `whatsappService.ts` et `Foncier.tsx`; aucun diagnostic nouveau dans `PublicLots.tsx`.
- `npm run build` : PASS; avertissements Rollup non bloquants sur les imports dynamiques Foncier.
- Backend/PostgreSQL local examiné en lecture seule; pas de scénario E2E auth/dashboard/immobilier/foncier exécuté. Pas de vérification API/DB de production: l'API de production était injoignable lors du précédent contrôle.

## 13. Fichiers modifiés pour cette phase

- `backend/app/api/deps/__init__.py`
- `backend/app/api/v1/tables/router.py`
- `backend/app/api/v1/site_content/router.py`
- `backend/app/api/v1/page_layouts/router.py`
- `backend/app/api/v1/site/router.py`
- `backend/app/api/v1/media/router.py`
- `backend/app/api/v1/clients/router.py`
- `backend/app/api/v1/leads/router.py`
- `backend/app/api/v1/leads/automation_routes.py`
- `backend/app/api/v1/leads/campaign_routes.py`
- `backend/tests/test_api_security.py`
- `backend/tests/test_site_content_crud.py`
- `backend/tests/test_media_api.py`
- `src/pages/public/PublicLots.tsx`
- `src/pages/public/PublicHome.tsx`
- `src/pages/public/PublicContact.tsx`
- `src/components/public/PublicPageLayoutRenderer.tsx`
- `SITE-VITRINE-PHASE3-SECURITY-SCHEMA.md`

Les fichiers pré-modifiés par l'utilisateur ou par les phases précédentes ne sont pas attribués à cette phase.

## 14. Risques restants et plan proposé

1. **Ne pas lancer la Phase 4.** Le défaut Media, les erreurs de typecheck, le schéma divergence et l'accès ERP trop large empêchent de qualifier le socle de fiable.
2. Retrouver le dépôt/backup/serveur qui a produit 027; récupérer son fichier et son parent, ou obtenir un dump `pg_dump --schema-only`/historique DDL validé. Comparer le SQL exact à la DB avant toute convergence.
3. Construire une migration de convergence seulement après cette comparaison, avec snapshot dont la restauration est vérifiée, revue des données et downgrade/rollback documenté.
4. Définir/valider les rôles et modules serveur en réutilisant la source d'autorisation EGS. Aujourd'hui l'authentification ferme l'accès anonyme, mais les utilisateurs authentifiés disposent de droits trop larges sur de nombreuses tables ERP et certains endpoints Clients/Media.
5. Ajouter limitation de débit/anti-abus au formulaire public contact et capture lead; les bornes de taille ne préviennent pas le spam.
6. Résoudre le contrat `MediaService.create_media_audit_log`, puis retester les opérations Media avec DB représentative.

### État final

```text
SECURITY : FAIL (protections ajoutées; droits ERP complets non résolus)
API ÉCRITURE : FAIL (anonyme fermé sauf formulaires bornés; RBAC par module incomplet)
AUTH : PASS (routes testées : 401 sans identité)
PERMISSIONS : FAIL (aucun RBAC serveur par module identifié)
ALEMBIC : BLOCKED (révision 027 introuvable dans le checkout)
DB/GIT ALIGNMENT : FAIL
MIGRATION : NON APPLIQUÉE
TESTS : 8 passed, 1 failed; compileall PASS; typecheck FAIL; build PASS
RÉGRESSION : BLOCKED (couverture ERP/E2E et production indisponibles)
VERDICT : NO-GO
PROCHAINE PHASE : différée jusqu'à récupération/revue de 027, convergence contrôlée et fermeture des risques RBAC/Media
```
