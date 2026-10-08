# PHASE 3.3.2 — DÉCISION RBAC

## 1. État initial

Phase 3.3.1 a établi le parcours Media réel (JWT, API, PostgreSQL, audit serveur et cleanup). L'employé et le gestionnaire ont été partiellement validés techniquement; l'approbation métier finale et la revue de l'allowlist `/tables` restaient ouvertes. TypeScript gardait 35 erreurs préexistantes; les tests backend ciblés/build/compile étaient PASS selon les artefacts précédents. Alembic et Page Builder restent non traités.

Baseline demandée relue : branche `audit/fix-schema-site`, HEAD `634938c8`. `git diff --check` était propre avant les documents de cette phase. Le workspace comportait déjà de nombreuses modifications applicatives et pièces d'audit des phases antérieures; elles sont préexistantes et n'ont pas été écrasées.

## 2. Rôles réellement présents

| Rôle | Source | Utilisation serveur observée |
|---|---|---|
| `admin` | `RoleEnum`, `users.role` | Guard central autorise toutes les actions exposées sur les routes protégées |
| `gestionnaire` | `RoleEnum`, `users.role` | Lecture privée de modules et 34 tables génériques explicitement listées; écritures refusées par le guard central |
| `employe` | `RoleEnum`, `users.role` | Aucune permission privée attribuée par le guard central |
| `guest` | `RoleEnum`, `users.role` | Aucune permission privée attribuée par le guard central |

`access_level` est un champ distinct, mais l'autorisation serveur examinée lit `role`. Une ACL `UserVillageAccess` est propre à certaines routes Foncier. L'interface React possède aussi `hasAccess`/`ACCESS_LEVEL_MODULES`; ce contrôle d'interface ne remplace pas l'autorisation serveur. Les artefacts de lecture locale précédente rapportaient 1 admin, 2 employés, aucun gestionnaire avant le compte temporaire utilisé puis supprimé pour les tests. Aucun compte temporaire n'a été recréé en Phase 3.3.2.

## 3. Permissions actuellement observées

- `backend/app/core/authorization.py`: admin tout; gestionnaire lecture seule sur `clients`, `site_vitrine`, `media` et `MANAGER_READ_TABLES`; employé, guest et rôle inconnu sans accès privé.
- CMS `site_content`: routes publiques de lecture; mutations derrière permissions `site_vitrine`.
- Layout: lecture détail publié publique; lecture de listes/brouillons et mutations protégées; publication gestionnaire refusée par test JWT réel.
- Media: anonyme 401; employé GET/upload 403; gestionnaire GET 200/upload 403; admin upload/GET/audit 200 dans la preuve Phase 3.3.1.
- `/tables`: détail opérationnel ci-dessous. Les statuts sont ceux du code actuel, non la politique métier définitive.

**Conflit documentaire conservé :** Phase 3.3 et sa matrice disent qu'un responsable a validé le mapping temporaire « admin écrit, gestionnaire lit, employés limités jusqu'à validation ». Phase 3.3.1 indique toutefois que l'approbation métier finale, en particulier pour l'employé et chaque table de l'allowlist, manque. Cette approbation temporaire ne suffit pas à confirmer les permissions par ressource et action. Les règles non précises restent donc **PROPOSITION À VALIDER** ou **INCONNU**.

## 4. Ressources sensibles

`parties` expose notamment numéro/date/lieu CNI, naissance, adresse, profession, employeur et coordonnées. `leads`, `lead_captures`, `party_roles`, `party_lead_details`, `contact_messages`, visites, présence employés et paiements peuvent contenir des données personnelles, de contact, de localisation ou financières. `media_files`, versions et usages révèlent des métadonnées et références privées. `app_settings`, `user_profiles` et `media_audit_logs` sont exclues de l'allowlist gestionnaire actuelle. La lecture gestionnaire générique n'a pas de portée ligne.

## 5. Usages de `/tables`

Le routeur backend définit **38 tables effectives** (les définitions répétées des clés `lead_campaigns` et `lead_interactions` en Python remplacent les premières définitions sans ajouter de nouveaux noms). Il déclare GET, POST, PATCH et DELETE, sans PUT.

Usages frontend observés :

- `src/pages/admin/SiteEditor.tsx` utilise directement `/tables/site_realisations`, `/tables/vitrine_lots` et `/tables/contact_messages` pour liste et CRUD/admin. Des endpoints métier Site existent déjà pour les réalisations/lots; aucune route de gestion des messages de contact n'a été repérée dans le code parcouru.
- Les composants publics utilisent `/tables/vitrine_lots` et `/tables/site_realisations` pour les listes publiées et `/tables/contact_messages` pour le formulaire. `PublicPageLayoutRenderer` applique des filtres de publication côté requête, mais le filtrage de sécurité effectif est celui du serveur. Des endpoints métier de lecture publique des deux ressources et d'enquête lot existent; le POST contact garde son contrat public dédié dans la route générique.
- `src/data/client.ts` et `src/data/tableClient.ts` sont des adaptateurs différents. Certaines tables dirigent vers des endpoints spécialisés (`/media`, `/site-content`, `/api/v1/page-layouts`, `/leads`, etc.); les noms non mappés retombent sur `/tables/{table}`. Leurs dépôts sont utilisés dans CMS, leads, tâches, visiteurs, employés, immobilier, social, Media et autres modules. Les appels `.from()` n'ont pas été assimilés en bloc à `/tables`.
- `src/api/client.ts` conserve également une API de documents `/tables/documents`. Le service de rapports appelle directement les tables `activites_journal` et `stats_journalieres`.

Ces usages indiquent des flux à préserver et des candidats aux routes dédiées; ils ne prouvent pas que le rôle gestionnaire ou employé doit obtenir les droits actuels.

## 6. Allowlist proposée

État actuel de l'allowlist gestionnaire (34) : `tasks`, `taches`, `properties`, `lease_contracts`, `rent_payments`, `documents`, `contact_messages`, `page_layouts`, `site_realisations`, `vitrine_lots`, `messages_direction`, `employes_presence`, `visites_en_cours`, `stats_journalieres`, `site_content`, `visiteurs`, `visites_du_jour`, `lead_campaigns`, `lead_interactions`, `foncier_villages`, `parties`, `party_roles`, `party_lead_details`, `leads`, `lead_captures`, `media_files`, `media_versions`, `media_usage`, `visites_terrain`, `ventes_foncieres`, `campagnes_marketing`, `visites`, `opportunites`, `social_posts`.

Les quatre tables exclues sont `activites_journal`, `app_settings`, `media_audit_logs` et `user_profiles`. L'exclusion est un fait du code; son approbation métier n'a pas été documentée.

**Allowlist proposée :** à ce stade, approuver seulement GET public de `site_realisations` et `vitrine_lots` (filtrage/projection serveur) et POST public borné de `contact_messages`. Pour tout autre accès générique privé, proposer admin seulement en attente d'une décision table/action/portée. Ce n'est pas une affirmation qu'aucun autre rôle n'a besoin des données : le rapport liste les écrans concernés, plusieurs routes métier déjà disponibles et le besoin de confirmer les impacts avant l'implémentation. Valider séparément les usages de SiteEditor et le formulaire contact.

## 7. Politique Employé proposée

**À VALIDER.** Pas d'accès privé au Site Vitrine par défaut; pas d'écriture CMS, publication, suppression Media ni accès aux tables sensibles sans justification précise. Les lectures/écritures des fonctions EGS existantes (messages, présence, visites, profil et activités) sont à décider par ressource et portée. Les tests disponibles démontrent des refus techniques Media et d'escalade, non l'absence de besoin métier.

## 8. Politique Gestionnaire proposée

**À VALIDER.** Ne retenir que des lectures privées explicitement approuvées par table et portée. Ne pas inclure implicitement les données CNI, prospects, contacts, présence ou finances. Pas d'écriture, suppression, upload ou publication sans décision explicite. La matrice temporaire existante et les tests réussis ne remplacent pas la revue de chaque ressource.

## 9. Politique Admin

Le rôle `admin` dispose techniquement de toutes les actions exposées sur les routes protégées. L'upload Media et les parcours documentés CMS prouvent certaines capacités. **Proposition :** conserver les tâches d'administration nécessaires dans les limites des endpoints existants et de leurs validations; ne pas étendre cette règle à une route non gardée ou ajouter de capacité sans preuve. L'approbation de gouvernance admin reste à confirmer, même si le mécanisme technique est confirmé.

## 10. Règles confirmées

- **CONFIRMÉ PAR LE CODE :** valeurs `admin`, `gestionnaire`, `employe`, `guest`; décision serveur fondée sur le rôle `role`; matrice technique générale ci-dessus.
- **CONFIRMÉ PAR LE CODE :** 38 noms de table; 34 lectures gestionnaire; quatre exclusions; admin CRUD générique; méthodes HTTP et exceptions publiques listées.
- **CONFIRMÉ PAR UN TEST :** accès Media réel par rôles et audit upload; refus d'upload/publication/suppression testés pour les rôles non-admin dans le périmètre consigné.
- **CONFIRMÉ PAR UNE RÈGLE MÉTIER EXISTANTE (portée limitée) :** le rapport Phase 3.3 consigne l'approbation temporaire d'un mapping admin/gestionnaire/employé. Cette trace ne confirme pas la matrice détaillée des 34 tables ni la décision finale en Phase 3.3.1.
- **INCONNU :** règle métier signée/actuelle par action et ressource, portées de données privées, approbation de l'allowlist table par table.

## 11. Règles proposées

La politique complète, avec matrice par action/ressource, classifications et dépendances d'écran, est dans [SITE-VITRINE-RBAC-POLITIQUE-PROPOSEE.md](SITE-VITRINE-RBAC-POLITIQUE-PROPOSEE.md). Elle propose le moindre privilège comme base de validation, sans modifier les permissions en place.

Matrice synthétique (statut actuel issu du code/test; décision métier séparée) :

| Ressource | Action | Employé | Gestionnaire | Admin | Source de décision |
|---|---|---|---|---|---|
| CMS | READ public publié | ALLOW public | ALLOW public | ALLOW | Routes publiques, code |
| CMS | READ privé/brouillon | DENY | ALLOW technique | ALLOW technique | Guard; besoin métier inconnu |
| CMS | CREATE / UPDATE | DENY technique | DENY technique | ALLOW technique | Guards; règle métier détaillée à valider |
| CMS | DELETE | DENY technique | DENY technique | ALLOW technique | Guards; règle métier à valider |
| CMS | PUBLISH | DENY | DENY testé | ALLOW technique | Guard et test de refus |
| Media | READ privé | DENY testé | ALLOW testé | ALLOW testé | Test JWT réel |
| Media | UPLOAD | DENY testé | DENY testé | ALLOW testé | Test JWT réel, PG et audit |
| Media | REPLACE / UPDATE / RESTORE / USAGE | DENY technique | DENY technique | ALLOW technique | Guards; règles métier à valider |
| Media | DELETE / PURGE / AUDIT | DENY testé/technique | DENY testé/technique | ALLOW technique | Test escalade + guards |
| Layout | READ publié | ALLOW public | ALLOW | ALLOW | Filtre route publique |
| Layout | READ brouillon | DENY technique | ALLOW technique | ALLOW technique | Guard; à valider métier |
| Layout | WRITE | DENY technique | DENY technique | ALLOW technique | Guards |
| Layout | PUBLISH | DENY testé | DENY testé | ALLOW technique | Test refus gestionnaire + guard |
| `/tables` | READ public | Deux tables seulement | Deux tables publiques + allowlist privée | Toutes les exposées | Route et test; métier incomplet |
| `/tables` | WRITE | POST contact borné sans rôle | DENY technique hors formulaire public | ALLOW sur 38 | Contrat backend; approbation métier à obtenir |
| `/tables` | DELETE | DENY testé/technique | DENY testé/technique | ALLOW sur 38 | Route/guard; besoin table par table à valider |

`ALLOW technique` décrit un résultat du code, pas une approbation métier. `DENY proposé` apparaît dans la politique détaillée; le tableau résume surtout le comportement actuel.

## 12. Décisions métier nécessaires

1. Signer la matrice rôle × ressource × action, et préciser `role` contre `access_level`.
2. Approuver ou réduire chacune des 34 entrées gestionnaire; décider de l'accès aux données sensibles et de la portée ligne.
3. Confirmer l'accès employé aux fonctions EGS qui utilisent `/tables` et définir la visibilité de leurs données.
4. Décider qui peut lire les brouillons, modifier/publiciser le contenu, publier, supprimer, uploader et remplacer les médias.
5. Confirmer les flux publics/admin de SiteEditor et le contrat du formulaire contact avant tout changement de route.
6. Convenir d'une allowlist finale et des routes précises à utiliser pour chaque table.

## 13. Risques

- Une lecture gestionnaire sur 34 tables sans portée ligne, incluant des champs sensibles dans `parties`, leads, messages, documents et présence.
- Un accès générique admin à toutes les écritures des tables exposées rend `/tables` plus large que des contrats métier dédiés.
- Les filtres envoyés par certains appels publics frontend n'accordent pas eux-mêmes la sécurité; seules les projections/filtres serveur comptent.
- Des routes et deux adaptateurs frontend distincts peuvent créer des impacts fonctionnels si l'allowlist change sans cartographier chaque import.
- La décision métier et la portée objet ne sont pas établies. Drift Alembic reste ouvert indépendamment de cette phase.

## 14. Modifications de code

**AUCUNE.** Phase 3.3.2 a créé uniquement les deux documents de proposition/rapport. Aucun test n'a été lancé et aucune écriture DB, migration, modification de route ou modification de Page Builder n'a été faite. Les changements app visibles dans `git status` sont antérieurs à cette phase.

## 15. Verdict

Les rôles et la policy technique sont identifiés; l'usage de `/tables` est cartographié au niveau des routes, adaptateurs et principaux consommateurs. Les décisions métier détaillées et l'allowlist ne sont pas intégralement confirmées.

**Verdict Phase 3.3.2 : `POLITIQUE À VALIDER`.**

**Verdict global : `NO-GO`**, car RBAC métier/allowlist restent ouverts et le drift Alembic n'est pas traité. Phase 4 reste interdite.

```text
========================================
PHASE 3.3.2 — RESULTAT
========================================

RÔLES RÉELS IDENTIFIÉS : PASS
POLITIQUE EMPLOYÉ : À VALIDER
POLITIQUE GESTIONNAIRE : À VALIDER
POLITIQUE ADMIN : À VALIDER
/TABLES USAGES : PASS
/TABLES ALLOWLIST : À VALIDER

CODE MODIFIÉ : NON
DB MODIFIÉE : NON
MIGRATIONS MODIFIÉES : NON
PAGE BUILDER MODIFIÉ : NON

VERDICT : POLITIQUE À VALIDER

PROCHAINE PHASE :
- validation métier
- puis implémentation RBAC minimale
- puis phase Alembic dédiée

PHASE 4 : INTERDITE
```
