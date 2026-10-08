# EGS — Réconciliation de l’inventaire RBAC

**Phase 3.3.5 — lecture seule.** Faits du working tree observé le 2026-09-28. Cette analyse ne valide aucun droit.

## 1. Comptages et provenance

| Comptage | Source | Résultat vérifié |
| -------- | ------ | ---------------- |
| 34 | Listes dans SITE-VITRINE-PHASE3.3.2-RBAC-DECISION.md et SITE-VITRINE-RBAC-DECISION-FINALE.md | 34 noms historiques explicites. Les documents excluent activites_journal, media_audit_logs, app_settings et user_profiles du groupe 38. Documents non suivis par Git, historique du code ancien non corroboré. |
| 38 | PHASE3.3.3-RBAC-REVIEW, PHASE3.3.2-RBAC-DECISION, POLITIQUE-PROPOSEE, DECISION-FINALE, RBAC_PHASE_A2_CARTOGRAPHIE; git HEAD e0861ee7 (registre inchangé depuis fc283cce) | Confirmé: 40 clés définies dans TABLES, 38 noms uniques à HEAD. |
| 37 actuel | AST du registre de travail | Confirmé: 39 définitions, 37 noms distincts; lead_campaigns et lead_interactions répétés. |

L’allowlist MANAGER_READ_TABLES actuelle compte **32** valeurs, pas 34. Elle omet vitrine_lots et foncier_villages. Le 34 est le nombre d’une liste documentaire antérieure, non celui du code courant.

**Liste documentaire 34 :** tasks, taches, properties, lease_contracts, rent_payments, documents, contact_messages, page_layouts, site_realisations, vitrine_lots, messages_direction, employes_presence, visites_en_cours, stats_journalieres, site_content, visiteurs, visites_du_jour, lead_campaigns, lead_interactions, foncier_villages, parties, party_roles, party_lead_details, leads, lead_captures, media_files, media_versions, media_usage, visites_terrain, ventes_foncieres, campagnes_marketing, visites, opportunites, social_posts.

**Liste confirmée 38 à HEAD :** tasks, taches, properties, lease_contracts, rent_payments, documents, contact_messages, page_layouts, site_realisations, vitrine_lots, messages_direction, employes_presence, visites_en_cours, activites_journal, stats_journalieres, site_content, visiteurs, visites_du_jour, lead_campaigns, lead_interactions, foncier_villages, parties, party_roles, party_lead_details, leads, lead_captures, media_files, media_versions, media_usage, media_audit_logs, app_settings, user_profiles, visites_terrain, ventes_foncieres, campagnes_marketing, visites, opportunites, social_posts.

**Liste actuelle 37 :** tasks, taches, properties, lease_contracts, rent_payments, documents, contact_messages, page_layouts, site_realisations, vitrine_lots, messages_direction, employes_presence, visites_en_cours, activites_journal, stats_journalieres, site_content, visiteurs, visites_du_jour, lead_campaigns, lead_interactions, parties, party_roles, party_lead_details, leads, lead_captures, media_files, media_versions, media_usage, media_audit_logs, app_settings, user_profiles, visites_terrain, ventes_foncieres, campagnes_marketing, visites, opportunites, social_posts.

L’écart 38 → 37 est foncier_villages, retiré du registre dans le diff local contre HEAD. Le 34 documentaire correspond aux 38 moins les quatre entrées nommées ci-dessus. Aucune liste n’est appliquée comme permission.

## 2. Inventaire source, entrée par entrée

| # | Nom | Doublon | Cible DB configurée | Alias | Route dédiée connue |
| -: | --- | ------- | ------------------- | ----- | -------------------- |
| 1 | tasks | Non | tasks | Non | /api/v1/tasks |
| 2 | taches | Non | tasks | Oui, tasks | /api/v1/tasks |
| 3 | properties | Non | properties | Non | /api/v1/immobilier/properties |
| 4 | lease_contracts | Non | lease_contracts | Non | /api/v1/immobilier/contracts |
| 5 | rent_payments | Non | rent_payments | Non | /api/v1/immobilier/payments |
| 6 | documents | Non | documents | Non | Non trouvée |
| 7 | contact_messages | Non | contact_messages | Non | Création formulaire générique |
| 8 | page_layouts | Non | page_layouts | Non | /api/v1/page-layouts |
| 9 | site_realisations | Non | site_realisations | Non | /api/v1/site/realisations |
| 10 | vitrine_lots | Non | vitrine_lots | Non | /api/v1/site/vitrine-lots |
| 11 | messages_direction | Non | messages_direction | Non | Non trouvée |
| 12 | employes_presence | Non | employes_presence | Non | Non trouvée |
| 13 | visites_en_cours | Non | visites_en_cours | Non | Non trouvée |
| 14 | activites_journal | Non | activites_journal | Non | Dashboard, équivalence non établie |
| 15 | stats_journalieres | Non | stats_journalieres | Non | /api/v1/dashboard/stats, équivalence non confirmée |
| 16 | site_content | Non | site_content | Non | /api/v1/site-content |
| 17 | visiteurs | Non | visiteurs | Non | Non trouvée |
| 18 | visites_du_jour | Non | visites_du_jour | Non | Non trouvée |
| 19 | lead_campaigns | Oui | lead_campaigns | Non | /api/v1/leads/campaigns |
| 20 | lead_interactions | Oui | lead_interactions | Non | CRUD non confirmé |
| 21 | parties | Non | parties | Non | /api/v1/entities, équivalence non confirmée |
| 22 | party_roles | Non | party_roles | Non | /api/v1/tenants, équivalence non confirmée |
| 23 | party_lead_details | Non | party_lead_details | Non | Non confirmée |
| 24 | leads | Non | leads | Non | /api/v1/leads |
| 25 | lead_campaigns | Oui, même clé | lead_campaigns | Non | /api/v1/leads/campaigns |
| 26 | lead_captures | Non | lead_captures | Non | /api/v1/site/lead-capture, collecte publique; /api/v1/leads/capture admin-only |
| 27 | lead_interactions | Oui, même clé | lead_interactions | Non | CRUD non confirmé |
| 28 | media_files | Non | media_files | Non | /api/v1/media |
| 29 | media_versions | Non | media_versions | Non | /api/v1/media/{id}/versions |
| 30 | media_usage | Non | media_usage | Non | /api/v1/media/usage |
| 31 | media_audit_logs | Non | media_audit_logs | Non | /api/v1/media/audit |
| 32 | app_settings | Non | app_settings | Non | /api/v1/settings |
| 33 | user_profiles | Non | user_profiles | Non | /api/v1/users, équivalence non confirmée |
| 34 | visites_terrain | Non | visites_terrain | Non | Non trouvée |
| 35 | ventes_foncieres | Non | ventes_foncieres | Non | RPC générique la lit; migration la crée |
| 36 | campagnes_marketing | Non | campagnes_marketing | Non | Non trouvée; distinct de lead_campaigns |
| 37 | visites | Non | visites | Non | Équivalence non confirmée |
| 38 | opportunites | Non | opportunites | Non | /api/v1/site/vitrine-lot-inquiries crée une opportunité |
| 39 | social_posts | Non | social_posts | Non | Non trouvée |

Les cibles DB sont les valeurs du registre et ne prouvent pas la présence en base. Voir SITE-VITRINE-RBAC-INVENTAIRE-CANONIQUE.md pour l’ID, la catégorie, les scopes et les données sensibles.

## 3. Alias, doublons et visites_du_jour

- tasks et taches appellent GenericTableRepository sur tasks. Le modèle Task et migration 009 décrivent tasks; aucun modèle/table taches trouvé. /api/v1/tasks opère sur tasks. Alias de nom démontré; aucune suppression décidée.
- lead_campaigns et lead_interactions sont des clés répétées dans un dictionnaire Python. La deuxième déclaration remplace la première; elles ne créent pas de ressources supplémentaires.
- visites_du_jour est créée par op.create_table dans la migration 013 et a un modèle SQLAlchemy VisiteDuJour. C’est une table selon les sources consultées, pas une vue.
- Les handlers /api/v1/tasks inspectés n’ont pas de dépendance utilisateur ni de permission visible.

## 4. Routes dédiées: garde/auth et validation

Toutes les validations métier restent **non traitées**. « Confirmé » signifie route trouvée/montée, pas équivalence avec le CRUD générique.

| Ressource | Route | Auth observée | Permission observée | Validation métier (non traitée; limite technique observée) | Confirmé |
| --------- | ----- | ------------- | ------------------ | -------------------------- | --------- |
| tasks/taches | /api/v1/tasks | Aucune dépendance utilisateur visible | Aucune permission centrale visible | Schémas Pydantic; employee_id filtre facultatif | Oui |
| properties | /api/v1/immobilier/properties | Pas de dépendance utilisateur visible | Aucune centrale visible | Schémas dédiés; équivalence de champs non confirmée | Oui |
| lease_contracts | /api/v1/immobilier/contracts | Pas de dépendance utilisateur visible | Aucune centrale visible | Schémas et cycle dédiés | Oui |
| rent_payments | /api/v1/immobilier/payments | Pas de dépendance utilisateur visible | Aucune centrale visible | Schémas et opérations dédiés | Oui |
| documents | Aucune trouvée | — | — | Media non assimilé à documents | Non |
| contact_messages | POST générique /api/v1/tables/contact_messages | POST public; GET guardé | erp_table/read sur GET; champs/tailles bornés au POST | Pas de gestion dédiée trouvée | Partiel |
| page_layouts | /api/v1/page-layouts | Dépendance permission | site_vitrine par action | Schémas et publication spécifiques | Oui |
| site_realisations | /api/v1/site/realisations | Permission privée; lecture publique filtrée | site_vitrine | Projection publique et payload dédiés | Oui |
| vitrine_lots | /api/v1/site/vitrine-lots | Permission privée; lecture publique filtrée | site_vitrine | Projection publique et validations dédiées | Oui |
| messages_direction | Aucune trouvée | — | — | Aucune équivalence backend | Non |
| employes_presence | Aucune trouvée | — | — | Route dédiée non établie | Non |
| visites_en_cours | Aucune trouvée | — | — | Dashboard n’établit pas équivalence | Non |
| activites_journal | /api/v1/dashboard | JWT get_current_user | Auth seulement | Données de dashboard non démontrées équivalentes | Partiel |
| stats_journalieres | /api/v1/dashboard/stats | JWT get_current_user | Auth seulement | Contrat de sortie non démontré identique à la table | Partiel |
| site_content | /api/v1/site-content | GET sans garde visible; écritures permissionnées | site_vitrine sur écritures | GET ne sépare pas partout publié/brouillon | Oui |
| visiteurs | Aucune trouvée | — | — | Aucune équivalence backend | Non |
| visites_du_jour | Aucune trouvée | — | — | Table confirmée, route dédiée absente des routeurs consultés | Non |
| lead_campaigns | /api/v1/leads/campaigns | require_admin_user au routeur | Admin-only selon code | Distinct de campagnes_marketing | Oui |
| lead_interactions | CRUD dédié non confirmé | — | — | Ne pas inférer de la route leads | Non/UNKNOWN |
| foncier_villages historique | /api/v1/foncier/villages | Garde foncier/read | Permission foncier; ACL village sur certaines opérations | Route dédiée, équivalence /tables non présumée | Oui |
| parties | /api/v1/entities existe | Dépendances variables selon handlers | Mapping à parties non confirmé | Contrat Entity distinct | Partiel |
| party_roles | /api/v1/tenants existe | Pas de dépendance utilisateur visible dans les handlers inspectés | Aucune centrale visible | Équivalence à party_roles non établie | Partiel |
| party_lead_details | Aucune équivalente trouvée | — | — | Lien de modèle seulement | Non |
| leads | /api/v1/leads | require_admin_user sur CRUD | Admin-only selon code | assigned_to facultatif, pas scope forcé | Oui |
| lead_captures | /api/v1/site/lead-capture | Capture publique | Lecture dédiée non démontrée; /api/v1/leads/capture est admin-only | Collecte et lecture sont des contrats distincts | Partiel |
| media_files | /api/v1/media | require_permission | media/read_private ou create selon action | Schémas media dédiés | Oui |
| media_versions | /api/v1/media/{id}/versions | require_permission | Permission media par action | Route version dédiée | Oui |
| media_usage | /api/v1/media/usage | require_permission | Permission media par action | Route usage dédiée | Oui |
| media_audit_logs | /api/v1/media/audit | require_permission | read_audit/write_audit | Route audit dédiée | Oui |
| app_settings | /api/v1/settings | GET sans garde visible; écriture authentifiée | _check_admin sur upsert/delete | whitelist/service/audit | Oui |
| user_profiles | /api/v1/users existe | Contrôle dans handlers users | Équivalence profil non démontrée | Resource User ≠ preuve UserProfile | Partiel |
| visites_terrain | RPC visites terrain; CRUD dédié non confirmé | Auth selon l’action RPC | Permission/équivalence non confirmée | Migration b350 crée la table avec visited_by/lot_id | Partiel |
| ventes_foncieres | RPC générique la lit | Auth selon l’action RPC | Permission/équivalence non confirmée | Migration b350 crée la table avec lot_id/date | Partiel |
| campagnes_marketing | Aucune équivalente trouvée | — | — | lead_campaigns est une cible distincte | Non |
| visites | Équivalence non confirmée | — | — | Ne pas assimiler à visites_du_jour | Non |
| opportunites | /api/v1/site/vitrine-lot-inquiries | Capture publique | Permission métier distincte non visible | Crée un suivi CRM via repository générique; pas CRUD équivalent | Partiel |
| social_posts | Aucune trouvée | — | — | Non confirmée | Non |

Les routes spécifiques sont incluses dans backend/app/api/v1/__init__.py. La route générique GET/POST/PATCH/DELETE /api/v1/tables/{table} reste un contrat séparé.

## 5. Scopes techniques

| Scope | Présent schéma ? | Ressources | Implémenté ? | Preuve/limite |
| ----- | ---------------- | ---------- | ------------ | -------------- |
| created_by | Oui | parties, immobilier selon migrations, documents, média, site | Filtrage générique non établi | Migrations 005–012; champ seul ≠ scope |
| employee_id | Oui | tasks, employes_presence, finances | Pas de restriction dérivée du demandeur | Route tasks accepte un filtre facultatif |
| assigne_a | Oui | leads et objets opérationnels | Pas de scope générique obligatoire trouvé | Migrations 008/009/012 |
| assigned_to | Oui dans metadata/payload de leads | leads | Facultatif, pas imposé | leads/router.py |
| village_id | Oui | foncier, user_village_access | ACL sur certaines opérations, pas universelle démontrée | Migration 006; foncier/router.py |
| visited_by / lot_id | Oui | visites_terrain | Champs acteur/lot présents; filtrage non établi | migration b350fd2b |
| team_id | Non trouvé dans modèles/migrations examinés | — | Non établi | Recherche statique backend/app et migrations |
| organization_id | Non trouvé dans modèles/migrations examinés | — | Non établi | Même recherche |
| Propriétaire | Pas de mécanisme homogène | immobilier/foncier | Filtre générique absent | Relations différentes selon modèle |
| ACL foncière | Oui | user_village_access | check_access sur certaines voies | N’établit pas tous les endpoints |

## 6. Données sensibles

| Ressources | Données présentes | Type |
| ---------- | ---------------- | ---- |
| parties, visiteurs | identité, coordonnées, CNI (numero/date/lieu pour parties) | Identité/CNI |
| leads, lead_captures, lead_interactions, party_lead_details | coordonnées, consentement, notes, interactions | Personnel/prospection |
| contact_messages | nom, email, téléphone, sujet, message | Contact/correspondance |
| employes_presence, messages_direction, activites_journal | employé, horaires, messages, participants/notes | RH/interne |
| visites_en_cours, visites_du_jour, visites | visiteur/agent, lieu, résultats/notes selon ressource | Identité/visite |
| visites_terrain | visited_by, lot_id, created_at | Lien agent/lot | migration b350fd2b |
| properties, lease_contracts, rent_payments | parties, contrats, loyers, montants/paiements | Financier/contractuel |
| ventes_foncieres | lot_id, created_at dans la migration examinée | Lien foncier/date; aucun montant montré | migration b350fd2b |
| documents, media_files, media_versions, media_usage | fichiers, noms/URL, hash, metadata, liens | Documents/fichiers internes |
| media_audit_logs | acteur, IP, user-agent, metadata événement | Audit/identifiant technique |
| app_settings | valeurs de configuration pouvant inclure secrets | Configuration |
| user_profiles | profil/role associé à l’utilisateur | Identité/contrôle d’accès |
| site_realisations, vitrine_lots, site_content, page_layouts, social_posts | brouillons, notes, publication; lots: localisation/prix/contact | Interne/éditorial |
| lead_campaigns, campagnes_marketing, opportunites | budget, montant, cible, description | Commercial/financier |
| tasks | affectation, description, échéances | RH/interne |
| stats_journalieres | agrégats d’activité/présence | Opérationnel agrégé |
| foncier_villages | commune/région/localisation, auteurs | Foncier/interne |

La présence d’un champ ne prouve pas son exposition ou son masquage sur chaque route.

## 7. RLS

Dépôt: scripts/fix-local-schema.sql active RLS et définit des policies de lecture pour app_settings, media_files, site_content et page_layouts. Pas de déclaration ENABLE ROW LEVEL SECURITY trouvée dans les migrations Alembic examinées.

Base locale: **RLS confirmé actif** sur ces quatre tables. Un SELECT en lecture seule du catalogue PostgreSQL a retourné relrowsecurity=true pour app_settings, media_files, page_layouts, site_content. Cette preuve ne porte que sur la base locale consultée et ne confirme pas le contenu exact des policies ni les environnements déployés. Aucun autre nom de table n’a été confirmé.

## 8. Comparaison canonique

| Différence | Classe | Constat |
| ---------- | ----- | ------- |
| foncier_villages présent en 34/38, absent du registre 37 | SUPPRESSION du registre générique | Diff local contre HEAD; route dédiée foncière existe. Pas suppression métier. |
| tasks/taches | ALIAS | Deux noms API, même cible physique; aucun retrait décidé. |
| lead_campaigns et lead_interactions répétées | DOUBLON | Clés répétées, pas ressources supplémentaires. |
| activites_journal/media_audit_logs/app_settings/user_profiles absents du 34, présents en 38/37 | SUPPRESSION de l’ancienne allowlist documentaire | Comparaison descriptive, pas politique actuelle. |
| vitrine_lots dans le 34, absent de MANAGER_READ_TABLES actuel | UNKNOWN historique | Écart documentaire/code. |
| foncier_villages servi par route dédiée | RESSOURCE MÉTIER / ROUTE SPÉCIALISÉE | Équivalence à /tables non présumée. |
| campagnes_marketing, visites, social_posts sans modèle/migration établi | UNKNOWN existence physique | Configurées dans TABLES; tables correspondantes non trouvées dans modèles/migrations consultés. |
| visites_terrain, ventes_foncieres | RESSOURCE DB déclarée par migration | Migration b350fd2b crée les tables; cela ne prouve pas leur présence actuelle en base. |
| opportunites | Ressource configurée et utilisée | vitrine-lot-inquiries l’écrit; aucun CRUD complet dédié établi. |

## 9. Git et statut

Avant l’analyse, git status --short montrait de nombreuses modifications applicatives et rapports non suivis préexistants, notamment tables/router.py et les documents RBAC consultés. Le registre git HEAD et son historique ont été lus uniquement. Les changements existants sont conservés; cette phase ajoute seulement les deux documents d’inventaire explicitement autorisés.

## 10. Synthèse

- TABLES: 39 définitions, 37 noms distincts.
- Répétitions: lead_campaigns, lead_interactions.
- Alias physique: taches → tasks.
- Comptages: 34 documentaire; 38 confirmé à HEAD; 37 confirmé au working tree.
- Ressources canoniques documentées: 37 (36 ressources courantes après fusion alias, plus foncier_villages historique/dédiée).
- Routes dédiées: inventoriées; couverture/équivalence partielle.
- Scopes: champs et ACL foncière recensés; scopes transversaux non établis.
- RLS: confirmé localement pour quatre tables.
- Décision métier: NON TRAITÉE.
