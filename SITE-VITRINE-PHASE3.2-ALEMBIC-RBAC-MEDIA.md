# PHASE 3.2

Audit réalisé le 2026-09-23. Phase 3.1 était NO-GO. Baseline complet des commandes Git/Alembic : [PHASE3.2-BASELINE.txt](PHASE3.2-BASELINE.txt). Sources et graphe récupérés : [SITE-VITRINE-ALEMBIC-CHAIN.md](SITE-VITRINE-ALEMBIC-CHAIN.md).

## 1. Verdict

**NO-GO. Phase 4 interdite.** La chaîne des sources 025–028 est connue, l'écriture CMS réelle a passé et le contrat de création d'audit Media a été rétabli. Mais l'origine de l'effet DB compatible avec 028 reste inconnue, Alembic ne peut pas charger le marker DB, aucun RBAC serveur par module/action n'existe, et des tables ERP/Clients/Media restent mutables par tout utilisateur authentifié.

Aucune migration, commande Alembic mutante ou DDL n'a été exécutée. PostgreSQL a été inspecté en `READ ONLY`; l'unique écriture PostgreSQL a été la ligne CMS de test par l'API, supprimée après vérification.

## 2. Chaîne Alembic 024 → 028

Le checkout actif se termine à 024. Les sources retrouvées décrivent la chaîne linéaire `024 → 025 → 026 → 027 → 028`; le détail de chaque `revision`, parent, portée et downgrade est dans le rapport de chaîne. Le marker PostgreSQL local est 027, pas 028; `alembic current` échoue car la révision 027 est absente du checkout. Le graphe enregistré dans Git et le graphe source retrouvé ne sont donc pas le même artefact reproductible.

## 3. Preuves Git / blobs

Les blobs 025–028 sont respectivement `b0eea638d91c6704b278a09d36d79ef63c2509bb`, `d9111c5547296814b80bbe7c15c865c642d037e9`, `3add81b38f8475123b0645239fca3ed67fdf5edf` et `2e25c325fa29386fd4c89abbae789fdf6feda5bf`. Le contenu 027 concorde bytecode/compilation avec le `.pyc` ignoré; marqueur DB 027 concordant. Aucun des 84 commits inaccessibles audités ne référence ces objets. Source récupérée avec certitude, mais provenance commit/auteur/application non établie. Détails dans [le rapport Phase 3.1](SITE-VITRINE-PHASE3.1-RECONCILIATION.md) et [la chaîne](SITE-VITRINE-ALEMBIC-CHAIN.md).

## 4. État réel DB

Base inspectée : PostgreSQL local `localhost:5433/egs_local`. Lectures d'audit en transaction read-only terminée par rollback. Aucun trigger visible sur les tables CMS/Vitrine/Media/Foncier inspectées. Colonnes physiques et données décrites dans le rapport Phase 3.1; résumé ciblé :

| Objet | DB observée | 024 | 025 | 026 | 027 | 028 | Conclusion |
|---|---|---|---|---|---|---|---|
| `page_layouts` | 42 lignes; PK id; `page_slug`, `page`, `published_at TEXT`; index 028 absent; doublon `page_key` et cinq lignes slug/page divergentes signalées | aucun effet | — | — | — | alias + index attendus | Effet partiel compatible, mais absence index, type différent, marker 027 : application de 028 non prouvée |
| `site_content` | PK composite `(section,key)`; un enregistrement; zéro doublon; champs historiques/type et traduction coexistent | aucun effet | — | — | — | aucun effet | `ON CONFLICT(section,key)` a bien une contrainte correspondante en DB |
| `vitrine_lots` | 1 ligne; id TEXT; liens UUID présents et NULL; documents TEXT, tags/caractéristiques ARRAY, créateurs TEXT; trois index 027 et FKs présents | — | — | — | champs/index/FK présents mais types hybrides | — | Effets compatibles en partie; types actuels divergents; les links NULL ne prouvent pas l'historique de cast |
| `foncier_attestations` | `row_version INTEGER NOT NULL DEFAULT 1`; une valeur observée = 1 | — | ajouté | — | répété | — | Schéma compatible, provenance entre 025/027 non distinguable |
| `foncier_attestation_temoins` | `entity_id UUID`, index et FK présents; deux lignes NULL | — | ajouté | — | colonne/index répétés | — | Compatible avec 025, valeur des associations absente |
| `foncier_lots` | un lot; `code_barre` non NULL et unique, colonnes cedant présentes | — | — | ajout/backfill/index unique | — | — | Résultat compatible avec 026; valeur antérieure au backfill inconnue |
| `site_realisations` | schéma hybride; PK id TEXT; index/unique métier attendus absents | — | — | — | aucun effet | — | Drift 012 indépendant |
| `contact_messages` | id TEXT; champs nullable/aliases; pas d'index/check au-delà du PK | — | — | — | aucun effet | — | Drift 012 indépendant |
| `media_audit_logs` | forme courante `media_id/action/actor_id/metadata/created_at` | `content_hash/taxonomy_id` ailleurs dans Media | — | — | aucun effet | aucun effet | Contrat actuel compatible avec repository; différent de la migration historique 011 |

Références des types/defaults/index/FK de migration : blobs sources listés dans [SITE-VITRINE-ALEMBIC-CHAIN.md](SITE-VITRINE-ALEMBIC-CHAIN.md). Ces comparaisons au checkout/migrations ne prouvent pas quelles commandes DDL ont été exécutées.

## 5. Drift

- 028 : colonnes présentes, `published_at` est TEXT au lieu de TIMESTAMPTZ, index `idx_page_layout_page_slug` absent; marker absent. **Origine inconnue** (migration partielle, DDL manuel, ou colonnes préexistantes compatibles sont indiscernables).
- 027 : données de `vitrine_lots` et colonnes/index/FK peuvent être compatibles avec 027 mais les types sont hybrides et plusieurs colonnes n'ont pas les types déclarés par la migration; impossible d'en déduire toute la séquence historique.
- 025/027 se chevauchent pour `row_version`, `entity_id` et l'index témoin; état DB seul ne permet pas d'attribuer leur apparition.
- 026 : état courant compatible avec code-barres et snapshot cédant; le backfill initial ne peut pas être démontré sur les valeurs agrégées actuelles.
- Aucun trigger sur les dix tables inspectées (`page_layouts`, `site_content`, `site_realisations`, `vitrine_lots`, `contact_messages`, tables Media, tables Foncier concernées).

## 6. Stratégies de réconciliation

| Option | Avantages | Risques / impact | Rollback et préconditions |
|---|---|---|---|
| A — restaurer l'historique perdu | reprend le graphe source original et permet à Alembic de reconnaître 027; chaîne 025–028 récupérable | provenance inconnue; effets DB peut-être seulement partiels; downgrades destructifs; production bloquée tant que snapshot/diff ne concordent pas | rollback Git simple avant livraison, mais DB non réversible par les downgrades retrouvés. Précondition : récupérer provenance/déploiements, sauvegarde restaurée et comparer migration par migration |
| B — recréer les migrations manquantes | sources/effets exacts connus en majorité et peuvent être republiés dans un historique propre | réécrire les mêmes révisions avec divergence possible; 028 application non prouvée; migration 027 casts texte invalide vers NULL | rollback code possible avant livraison; DB nécessite stratégie additive testée sur clone. Précondition : revue des sources exactes, snapshot complet et accord de migration |
| C — migration de réconciliation | aligne explicitement l'état observé sans prétendre connaître l'historique; permet une convergence documentée | peut masquer l'origine; contraindre/dédoublonner les layouts et convertir types peut échouer ou altérer des liens; risque production élevé | prévoir uniquement migration additive, sauvegarde restaurée, vérification de données/contraintes et rollback compensatoire. Précondition : identifier chaque colonne/valeur et plan de reprise |

Décision humaine requise. Aucune option exécutée ou retenue comme migration à ce stade.

## 7. RBAC existant

Backend : JWT via `AuthService`, `get_current_user`, rôles `admin`, `gestionnaire`, `employe` et `access_level`. Dépendance réutilisable observée `require_admin_user` vérifie seulement `role == admin`. Permissions `ACCESS_LEVEL_MODULES` et `hasAccess` vivent côté frontend; aucune policy backend qui contrôle module × action × ressource n'a été trouvée. Les guards ponctuels par rôle ne constituent donc pas un RBAC EGS transversal; aucun rôle fonctionnel CMS/éditeur ne peut être inféré sans décision métier.

## 8. Matrice RBAC Site Vitrine

| Module / ressource | Action | Public | Authentifié ordinaire (`gestionnaire`/`employe`) | Admin | Protection actuelle / écart |
|---|---|---|---|---|---|
| Site Content | read | oui, tout contenu retourné par GET | oui, même endpoint public | oui | Aucun filtrage de brouillon ou `is_published` dans ce routeur; POST upsert / PATCH / DELETE exigent admin. Pas d'action publish/unpublish distincte |
| Page Layout | read publié | oui | oui | oui | GET par slug public seulement si publié; collection et drafts administratifs |
| Page Layout | create/update/delete/publish | non | refusé | oui | POST upsert et PATCH `/{slug}/publish` admin; aucun DELETE API vu; pas de permission éditeur |
| Réalisations vitrine | read public | oui, publiées | oui | oui | GET liste publique filtrée `publier_vitrine`; détails admin seulement |
| Réalisations vitrine | create/update/delete/publish | non | refusé | oui | CRUD admin; pas de permission par action ni publication séparée |
| Lots vitrine | read public | oui, publiés | oui | oui | GET liste publique; détail admin seulement |
| Lots vitrine | create/update/delete/publish | non | refusé | oui | CRUD admin; champ de publication modifié dans payload admin |
| Contact public | create | oui, champs limités dans `/tables/contact_messages`; inquiry lot a route publique dédiée | oui également | oui | Validation de champs; anti-abus/rate-limit n'est pas prouvé |
| Media | read brand-assets | oui | oui | oui | Route sans auth; les autres lectures du catalogue sont auth-only |
| Media | read private, upload, replace, delete, restore, usage create/delete, versions | non | **oui** | oui | Dépendance `get_current_user` seulement; tout compte authentifié peut agir |
| Media | audit read/create, purge | non | refusé | oui | `require_admin_user`; acteur d'audit désormais tiré du JWT admin |
| Clients / CRM | read/create/update/delete/activate/search | non | **oui** | oui | `get_current_user` sans rôle/action; tous rôles ont CRUD |
| `/tables/{table}` générique | GET/POST/PATCH/DELETE | exceptionnellement listes publiques `site_realisations`, `vitrine_lots`; POST public `contact_messages` strictement allowlisté | tables hors `ADMIN_TABLES`: **tous rôles connectés ont CRUD**; celles dans `ADMIN_TABLES`: 403 | oui, toutes les tables exposées | Contrôle par liste de tables + rôle admin pour quelques tables; aucun module/action/ressource par utilisateur |

Clés exposées par le routeur générique (avec alias éventuels) : `tasks`, `taches`, `properties`, `lease_contracts`, `rent_payments`, `documents`, `contact_messages`, `page_layouts`, `site_realisations`, `vitrine_lots`, `messages_direction`, `employes_presence`, `visites_en_cours`, `activites_journal`, `stats_journalieres`, `site_content`, `visiteurs`, `visites_du_jour`, `lead_campaigns`, `lead_interactions`, `foncier_villages`, `parties`, `party_roles`, `party_lead_details`, `leads`, `lead_captures`, `media_files`, `media_versions`, `media_usage`, `media_audit_logs`, `app_settings`, `user_profiles`, `visites_terrain`, `ventes_foncieres`, `campagnes_marketing`, `visites`, `opportunites`, `social_posts`. `ADMIN_TABLES` ne couvre que `site_content`, `page_layouts`, `site_realisations`, `vitrine_lots`, `contact_messages`, `media_files`, `media_versions`, `media_usage`, `media_audit_logs`; le reste est auth-only en lecture/écriture.

## 9. Écarts RBAC

**INCOMPLET / P0.** Un JWT valide rend le CRUD Client et Media disponible à chaque rôle. Sur la route générique, toute table hors liste admin est en CRUD pour toute session, y compris des ressources RH, foncières et financières. Les permissions d'interface ne sécurisent pas le serveur. Aucune matrice EGS backend existante ne peut être réutilisée et une nouvelle table politique ne doit pas être inventée à partir du seul frontend.

Tests existants de refus utilisent `dependency_overrides` pour définir l'identité, donc établissent le comportement des guards isolés, mais pas la sécurité bout en bout d'utilisateurs EGS. La session CMS admin réelle plus bas confirme un chemin autorisé; les cas d'utilisateur ordinaire réel et chaque action sensible n'ont pas été testés. L'écart empêche GO.

## 10. Contrat Media

Contrat avant correction : `POST /api/v1/media/audit` appelait `MediaService.create_media_audit_log`; l'application, le port repository et `SqlAlchemyMediaRepository` ne définissaient pas cette méthode. Le défaut était un `AttributeError`, pas une erreur d'autorisation.

```text
POST /api/v1/media/audit
  → MediaService
  → MediaApplicationService
  → MediaRepositoryPort
  → SqlAlchemyMediaRepository
  → INSERT media_audit_logs + commit
  → SELECT de confirmation / réponse
```

Modèle courant : `id`, `media_id`, `action`, `actor_id`, colonne JSON `metadata`, `created_at`; compatible avec la DB locale observée, mais différent du contrat historique de migration 011. La route exige un admin et remplace tout `actor_id` fourni par le client par l'id du compte du JWT. Le repository encode/décode JSON selon dialecte et renvoie la ligne effectivement lue après commit. Une erreur avant commit laisse la transaction SQLAlchemy être rollbackée à la fermeture; la création du journal est sa propre transaction, pas une transaction atomique englobant un autre changement Media.

Contrat frontend encore divergent : `src/data/media.repository.ts::logAction` cible le mapping `/media/audit-logs`; l'autre client `src/api/client.ts` utilise `/media/audit`. `logAction` n'avait pas d'appelant trouvé dans `src`; le chemin non utilisé n'a pas été changé sans preuve d'usage.

## 11. Corrections effectuées

- Ajout du contrat `create_media_audit_log` au port repository, au service applicatif et au repository SQLAlchemy; persistance JSON réelle et lecture après écriture.
- L'API audit utilise l'identité admin authentifiée comme auteur, pas le champ contrôlé par l'appelant.
- Remplacement de `NOW()` par `CURRENT_TIMESTAMP` sur les écritures CMS; syntaxe compatible PostgreSQL et SQLite.
- Test Media vérifie création, auteur fiable, relecture depuis la DB du test et suppression de sa propre ligne après assertions.
- Aucun RBAC transversal ajouté : système backend module/action inexistant, et politique attendue non définie.
- Pas de changement PageBuilder, de migration, de restauration des blobs, ni d'intervention sur les deux modifications Foncier post-baseline.

## 12. Tests

| Vérification | Résultat |
|---|---|
| `pytest -q tests/test_api_security.py tests/test_site_content_crud.py tests/test_media_api.py` | **9 passed**; gardes unitaires encore en identité surchargée, ne vaut pas E2E RBAC |
| `python -m compileall -q app` | PASS |
| CMS E2E sur PostgreSQL local `egs_local` | PASS : login `/api/v1/auth/login`, vrai JWT/admin EGS, POST, GET API et SELECT SQL concordants avec `TEST-SITE-VITRINE-E2E-*`; ligne identifiée supprimée en `finally` |
| Media audit DB | PASS sur DB SQLite isolée de tests via route : insert, commit, relecture, métadonnées et auteur contrôlé serveur; ligne de test supprimée |
| Tentative CMS sur copie SQLite préexistante | non retenue comme preuve : schéma de test différent du schéma courant, elle a exposé un écart de fixture; preuve finale faite sur PostgreSQL local |
| `npm run typecheck -- --pretty false` | FAIL, 35 erreurs préexistantes au périmètre Phase 3.2, détaillées §14 |
| `npm run build` | PASS; avertissements existants d'imports dynamiques Foncier |
| `alembic current` | FAIL exact : `Can't locate revision identified by '027_fix_public_site_schema_drift'` |
| `alembic heads` | PASS, unique head `024_add_media_taxonomy_and_content_hash` |
| `alembic history --verbose` | PASS pour le seul graphe versionné jusqu'à 024 |

État Media : test de route SQLite utilise un override admin; il prouve persistance et réponse, pas l'autorisation EGS bout en bout. CMS E2E est une vraie session/token/DB locale. Pas de test d'échec/rollback d'audit vers une DB clonée PostgreSQL.

## 13. CMS write réel

PASS dans l'environnement local demandé. Vérification préalable stricte que la cible backend était `localhost:5433/egs_local`; clé de test aléatoire et unique. Login EGS par endpoint normal avec compte admin existant; aucun `dependency_override`. Résultat POST 200, GET 200 et lecture SQL identique. La ligne a été supprimée immédiatement par la clé `(section,key)` dans un bloc `finally`. La DB de production publique n'a pas été touchée. Ce succès prouve le chemin POST upsert et lecture par clé; les PATCH/DELETE par id ne sont pas démontrés.

## 14. TypeScript

Le typecheck produit 35 erreurs, déjà présentes lors des vérifications Phase 3 précédentes; aucun code TypeScript n'a été modifié dans Phase 3.2.

- `src/components/media/MediaUploader.tsx` : 4 erreurs TS6133 (Tag, `CATEGORY_LABELS`, `defaultCategory`, `addTag` non utilisés) — préexistantes, fichier non touché.
- `src/hooks/useFoncierState.ts` : 24 accès `FoncierLot` inexistants (`limites_nord/sud/est/ouest`, `gps_lat/lng`) — erreurs préexistantes du diff Foncier hors périmètre; non corrigées.
- `src/lib/whatsappService.ts` : 6 erreurs TS6133 (paramètre `message`, fonctions d'envoi et variable `config` non utilisées) — préexistantes, fichier non touché.
- `src/pages/Foncier.tsx` : 1 accès `UserProfile.name` absent — préexistant au présent changement et hors périmètre; non corrigé.

Le build production passe malgré ces erreurs de typecheck; il ne remplace pas ce contrôle.

## 15. Risques

1. **Critique — RBAC** : routes génériques ERP et Clients/Media donnent trop de droits à tous les utilisateurs connectés.
2. **Critique — Alembic** : marker 027 introuvable depuis le checkout; sources retrouvées mais non réattachées à un historique signé/versionné.
3. **Élevé — 028** : origine/type/index incompatibles; refaire migration ou backfill peut toucher 42 layouts, dont doublons et slugs divergents.
4. **Élevé — downgrade 027** : suppression en bloc des colonnes sans distinguer les colonnes préexistantes; perte possible de liens lors du cast en upgrade.
5. **Élevé — tests RBAC** : pas de matrice de permissions validée ni de preuves refus/succès E2E par action.
6. **Modéré — Media** : service audit corrigé; le chemin client `/media/audit-logs` et l'écart historique migration 011 restent à clarifier si le client associé devient utilisé.
7. Typecheck non vert pour les groupes préexistants §14.

## 16. Préconditions Phase 4

Phase 4 reste interdite jusqu'à ce que l'humain :

1. récupère la provenance et sauvegarde/restauration des migrations 025–028, puis valide A/B/C sur copie restaurée après diff de schéma et données; aucune de ces migrations ne doit être jouée sur `egs_local` ou production avant cela;
2. définisse et valide `role/access_level × module × action × ressource` avec les responsables métier, puis protège et teste les routes génériques, Clients et Media sur de vraies identités;
3. décide du contrat canonique du consommateur Media `/media/audit-logs` si cet appel est activé;
4. traite indépendamment les 35 erreurs TypeScript préexistantes et exécute les validations/navigation requises.

**Ne pas passer automatiquement à Phase 4. Attendre validation humaine.**
