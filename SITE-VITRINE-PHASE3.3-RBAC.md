# PHASE 3.3 — RBAC + TYPESCRIPT

Audit et correction au 2026-09-23. Décision de rôle approuvée par le responsable pendant cette phase : **Admin écrit; gestionnaire lit; employés limités jusqu’à validation.** Voir la matrice détaillée [SITE-VITRINE-RBAC-MATRIX.md](SITE-VITRINE-RBAC-MATRIX.md).

## 1. Verdict

**NO-GO pour la sortie de Phase 3.3; aucune Phase 4 n'est commencée.** Le guard central serveur est branché sur CMS, layouts, Vitrine, Media, Clients et les accès dynamiques `/tables`; plusieurs tests HTTP réels ciblés et la preuve CMS passent. Cependant, le parcours Media autorisé n'a pas été exercé contre le service PostgreSQL avec JWT réel; la suite Media utilise une base SQLite isolée et une identité de dépendance surchargée. Le critère de tests d'accès réels n'est donc pas entièrement démontré. Les erreurs TypeScript restent stables, le build et compileall passent.

Cette clôture n'autorise pas Phase 4 : l'affectation employé reste limitée en attente de validation métier, le drift Alembic demeure ouvert pour une piste dédiée, et le typecheck reste rouge avec ses 35 erreurs préexistantes.

## 2. Baseline Git

La capture avant toute modification de cette séquence est dans [SITE-VITRINE-PHASE3.3-BASELINE.txt](SITE-VITRINE-PHASE3.3-BASELINE.txt) : branche `audit/fix-schema-site`, HEAD `634938c8`, status Git complet, historique et zones interdites. Le workspace contenait déjà les changements des phases précédentes et des travaux Foncier; ils ont été préservés. Le détail Phase 3.3 est isolé en section 21 ci-dessous.

## 3. Système d'authentification découvert

- `POST /api/v1/auth/login` authentifie un compte via le `AuthService` et délivre access/refresh JWT.
- `get_current_user` vérifie le bearer JWT puis recharge l'utilisateur; les routes optionnelles utilisent `get_optional_current_user`.
- Le modèle User porte `role` et `access_level` (`admin`, `gestionnaire`, `employe`, `guest`). La décision d'autorisation serveur actuelle se base sur `role`.
- `AuthSession` existe dans le schéma, mais le chemin login/deps audité ne consulte pas cette table pour les contrôles HTTP de rôle.

## 4. Système RBAC existant

Il n'existait pas de catalogue transversal backend permission × module × ressource × action. `require_admin_user` donne un contrôle admin global ponctuel; l'ACL `UserVillageAccess` protège certaines opérations Foncier par village. `ACCESS_LEVEL_MODULES`/`hasAccess` côté React ne contrôle pas les requêtes API. La phase réutilise JWT, `get_current_user` et le rôle existants; elle ajoute un évaluateur central minimal, sans nouveau système d'identité ni table RBAC.

## 5. Matrice RBAC

| Identité | Lecture privée | Écriture / suppression / publication |
|---|---|---|
| Admin | Toutes les routes privées couvertes | Autorisée |
| Gestionnaire | Clients, Site Vitrine privé, Media privé et allowlist de tables | Refusée |
| Employé | Aucune lecture privée jusqu'à validation | Refusée |
| Anonyme | Routes publiques et projections prévues | Formulaires publics strictement validés seulement |

Le détail par endpoint, les 34 tables lisibles par le gestionnaire, et les exclusions sont dans [la matrice](SITE-VITRINE-RBAC-MATRIX.md). Le POST public du formulaire contact et l'enquête lot publique restent accessibles sans JWT.

## 6. Routes sensibles auditées

- `/api/v1/tables/{table}` GET/POST et `/{table}/{row_id}` PATCH/DELETE; aucune route PUT.
- `/api/v1/site-content` GET public et POST/PATCH/DELETE.
- `/api/v1/page-layouts` liste privée, détail publié/brouillon, upsert POST et publication PATCH.
- `/api/v1/site/realisations` et `/vitrine-lots`: listes publiques, détails privés, POST/PATCH/DELETE; inquiry public.
- `/api/v1/media`: brand-assets public; lecture privée, upload, replace, update, delete, restore, usage, audit, purge.
- `/api/v1/clients`: lecture, recherche, création, modification, désactivation et réactivation.
- Leads admin-only et capture publique ont été inspectés; leurs gardes préexistants sont conservés.

## 7. Vulnérabilités trouvées

Avant correction, les routes Clients et plusieurs routes Media n'exigeaient qu'un JWT. `/tables` permettait à un employé authentifié de tenter PATCH/DELETE sur des tables métier; le test réel avant correction recevait 404 sur ID absent, prouvant que la requête atteignait le repository au lieu d'être rejetée. Layouts, CMS et mutations Vitrine avaient des contrôles admin locaux, mais sans politique transversale. Preuve préalable : [PHASE3.3-ACCESS-BEFORE.txt](backend/PHASE3.3-ACCESS-BEFORE.txt).

## 8. Corrections effectuées

- Ajout d'une politique centralisée par rôle/action et d'une dépendance route statique + vérificateur pour ressource dynamique.
- CMS, upsert/publication layouts, détails/mutations Vitrine, toutes les routes Clients et routes privées/mutations Media utilisent la politique commune.
- Les lectures gestionnaire sont explicites; chaque mutation est admin-only selon la décision approuvée. Audit et purge Media restent admin-only.
- `/tables` conserve sa liste de noms exposés, ajoute l'autorisation de lecture par allowlist et refuse les mutations non-admin. Le formulaire public `contact_messages` garde sa validation de champs même si un utilisateur est connecté.
- Lectures publiques CMS/layout publié/lots/réalisations et formulaires publics préservées.

## 9. Tests anonymous

HTTP réels sans JWT sur PostgreSQL local `egs_local` : GET CMS 200; liste publique layouts → 401; liste publique lots 200; réalisations publiques 200; formulaire contact valide 200. Les lectures privées clients/media ne sont pas ouvertes aux anonymes. La liste layouts n'est pas publique; un layout publié se lit par le endpoint de détail.

## 10. Tests authenticated

Identités temporaires gestionnaire et employé insérées dans la base PostgreSQL locale; login réel, vrais JWT et appels HTTP. Gestionnaire : GET clients 200, `/tables/tasks` GET 200, page-layout list 200. Employé : GET clients 403. Aucune donnée de tâche/client n'a été imprimée ou modifiée par les tests.

## 11. Tests unauthorized

Avec vrai JWT employé : CMS POST 403, layout publish PATCH 403, `/tables/tasks/{id}` PATCH 403 et DELETE 403 pour UUID inexistant. Gestionnaire : CMS POST 403, publish 403 et POST générique tâches 403. Résultat avant/après conservé dans [PHASE3.3-ACCESS-AFTER.txt](backend/PHASE3.3-ACCESS-AFTER.txt).

## 12. Tests authorized

Le gestionnaire peut lire les ressources incluses dans la matrice (clients, tâches, layout list) et ne peut les modifier. Les tests de politique vérifient les exclusions `app_settings` et les actions write/publish/delete. L'admin est autorisé aux actions protégées par le guard central; CMS admin réel est couvert en section 15 et la publication réelle d'un layout temporaire en section 13. Le contrat Media fonctionnel est vérifié par la suite API SQLite isolée (section 16).

## 13. Tests admin

Login admin réel depuis `/auth/login` puis écriture CMS réelle validée en GET et SELECT SQL. Un layout temporaire unique a également été créé par POST, publié par PATCH, relu publié anonymement (200), puis supprimé. Les tests de politique couvrent les décisions Media/Vitrine, et la suite Media vérifie le contrat fonctionnel avec SQLite isolée et identité surchargée. Un succès Media PostgreSQL avec JWT admin réel n'est pas démontré; cette lacune bloque le verdict de sortie. Aucun contenu réel du site n'a été changé.

## 14. Tests d'escalade

Élévations anon→privé refusées, lecture gestionnaire→écriture refusée, employé→CMS/publish/table PATCH/DELETE refusé. Le POST public contact reste disponible mais n'accepte que ses champs autorisés. La route `/tables` n'a pas de chemin d'écriture hors guard pour les méthodes déclarées. Audit code des autres routers concernés n'a pas trouvé d'alias de mutation public. Résultat : **aucune escalade évidente dans le périmètre testé/audité**; les contrôles objet et IDOR métier hors de ces ressources ne sont pas revendiqués comme couverts.

## 15. CMS write réel

PostgreSQL local `egs_local`, sans mock : login admin/JWT → POST CMS avec section/clé uniques → GET par section/clé → SELECT SQL confirme le marqueur → suppression. Employé et gestionnaire réels refusés à 403; anonyme refusé à 401. Toutes les lignes de test et comptes/entités temporaires ont été supprimés. Vérification finale : utilisateurs test 0, CMS rows test 0, contact rows test 0.

## 16. Media

Les permissions privées de lecture Media sont désormais gestionnaire/admin; création, remplacement, update, delete, restore et usage sont admin; audit/purge admin. `pytest` Media passe dans la suite ciblée contre son stockage SQLite isolé. Pas d'appel Media à la base PostgreSQL pour cette validation car le constructeur du service exécute une vérification de schéma avec comportement DDL. Le succès avec authentification réelle demandé n'est donc pas vérifié. Aucune modification du contrat Media de Phase 3.2.

## 17. TypeScript baseline

La baseline brute est [TYPECHECK-BASELINE-PHASE3.3.txt](TYPECHECK-BASELINE-PHASE3.3.txt), 35 diagnostics. La commande demandée `npm run typecheck -- --pretty false` a été relancée : mêmes 35 diagnostics, mêmes fichiers/lignes/messages; aucune source TS n'a été modifiée en Phase 3.3. Les 2 lignes `npm notice` dans le wrapper ne sont pas des diagnostics; comparaison après retrait de ces lignes confirme une sortie identique. Erreurs classées préexistantes (MediaUploader 4, useFoncierState 24, whatsappService 6, Foncier.tsx 1); 0 nouvelle erreur.

## 18. Tests backend

Relance de vérification : `rtk proxy pytest -q tests/test_auth_api.py tests/test_v1_api.py tests/test_api_security.py tests/test_site_content_crud.py tests/test_media_api.py` : **19 passed**. L'appel direct via `rtk pytest` a affiché « No tests collected »; le proxy RTK a exécuté les tests attendus. `test_api_security.py` couvre la matrice centrale et les refus non-admin via dépendances; les preuves de route avec vraies identités sont rapportées séparément en sections 9–15. La validation Media réelle avec JWT/PostgreSQL demeure manquante.

## 19. Compileall

`python -m compileall -q app` depuis `backend/` : **PASS**.

## 20. Build

`npm run build` : **PASS**. Deux avertissements Vite connus sur imports dynamiques `foncierAudit.ts` et `foncierOffline.ts`; aucune erreur de build.

## 21. Fichiers modifiés

Modifications applicatives de cette correction :

- `backend/app/core/authorization.py` (nouveau guard central)
- `backend/app/api/deps/__init__.py` (dépendance guard central)
- `backend/app/api/v1/clients/router.py`
- `backend/app/api/v1/media/router.py`
- `backend/app/api/v1/page_layouts/router.py`
- `backend/app/api/v1/site/router.py`
- `backend/app/api/v1/site_content/router.py`
- `backend/app/api/v1/tables/router.py`
- `backend/tests/test_api_security.py`

Rapports et preuves Phase 3.3 : `SITE-VITRINE-RBAC-MATRIX.md`, ce rapport, `backend/PHASE3.3-ACCESS-AFTER.txt`, et la sortie de comparaison TypeScript [TYPECHECK-RESULT-PHASE3.3.txt](TYPECHECK-RESULT-PHASE3.3.txt). Les autres fichiers déjà modifiés/non suivis dans le status Git sont hérités des phases antérieures ou du travail Foncier et n'ont pas été réécrits.

## 22. Fichiers volontairement non modifiés

- PageBuilder et composants/structure des pages publiques.
- Alembic, migrations, schéma DB et données persistantes de production.
- Contrat Media de Phase 3.2 et ACL village Foncier.
- Sources TypeScript : cette phase n'a modifié aucun fichier TS.

Les appels HTTP test ont utilisé uniquement la base locale, sans migration/DDL; seules les lignes identifiables de formulaire et CMS ont été écrites puis nettoyées.

## 23. Risques restants

1. La lecture gestionnaire repose sur une allowlist de tables; aucune portée ligne par client, village ou utilisateur n'est ajoutée par ce travail. L'ACL spécifique Foncier doit continuer à protéger ses routes spécialisées; l'exposition générique reste bornée par la politique de rôle mais n'est pas un contrôle d'objet.
2. La politique employé est une mesure temporaire stricte; elle doit être validée avant réouverture d'accès privé.
3. GET Site Content reste entièrement public selon le contrat existant et ne distingue pas drafts/publié.
4. Media réel PostgreSQL n'a pas été exercé dans cette phase afin d'éviter le chemin de vérification de schéma du service.
5. La demande publique de lot crée des enregistrements CRM/tâche; validation de champs présente, mais limitation anti-abus (rate limit/captcha) non établie dans cet audit.
6. 35 erreurs TypeScript préexistantes demeurent; baseline stable mais typecheck non vert.
7. Drift Alembic/025–028 reste ouvert hors périmètre.

## 24. Blockers

- Validation métier finale des accès employés et de l'allowlist de lecture gestionnaire avant toute évolution Phase 4.
- Réconciliation Alembic dans la phase dédiée, sans `stamp head` ni correction DB ad hoc.
- Les 35 erreurs TypeScript doivent être traitées séparément si le typecheck vert devient critère de livraison; aucune n'est nouvelle à Phase 3.3.
- Exécuter les cas Media requis avec JWT réel et backend PostgreSQL sûr sans modifier le schéma/la DB, ou conserver explicitement la phase en NO-GO si cette preuve n'est pas réalisable.

## 25. Verdict final

**NO-GO — sortie de Phase 3.3 non démontrée. Phase 4 non commencée et non autorisée par ce rapport.** Les contrôles centraux, plusieurs refus réels, succès des lectures autorisées, CMS admin réel, conservation des lectures/formulaires publics, suite ciblée, compileall, build et stabilité TypeScript sont documentés. La validation Media autorisée avec JWT réel sur PostgreSQL manque; le test isolé SQLite avec identité surchargée ne la remplace pas. Les validations métier employé, TypeScript vert et Alembic restent également ouvertes.

```text
========================================
PHASE 3.3 — RESULTAT
========================================

RBAC SERVEUR : PARTIEL (routes principales protégées; succès Media JWT réel non vérifié)
CMS WRITE RÉEL : PASS
MEDIA : PARTIEL (contrat SQLite PASS; parcours JWT/PostgreSQL non testé)
ESCALADE : PASS (périmètre routes/méthodes testé et audité)
TYPESCRIPT : BASELINE STABLE — 35 diagnostics préexistants
BACKEND TESTS : PASS — 19 passed
COMPILEALL : PASS
BUILD : PASS

ALEMBIC : NON TRAITÉ — PHASE DÉDIÉE
PAGE BUILDER : NON TRAITÉ

VERDICT : NO-GO

BLOCKERS :
- succès Media autorisé avec JWT réel et backend PostgreSQL non démontré;
- validation métier de la politique employé/gestionnaire;
- drift Alembic ouvert;
- typecheck reste rouge avec 35 erreurs préexistantes.

NEXT STEP :
- compléter la preuve Media autorisée sans mutation de schéma/DB;
- valider séparément RBAC et TypeScript;
- ouvrir la phase dédiée de réconciliation Alembic;
- ne pas démarrer Phase 4 avant ces validations.
```
