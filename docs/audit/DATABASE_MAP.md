# EGS — Cartographie PostgreSQL

**Capture :** 2026-10-07, base `egs_local` dans le cluster PostgreSQL 16  
**Statut :** inventaire de métadonnées seulement; aucune ligne métier lue.

## Source de vérité observée

- API FastAPI live connectée à PostgreSQL local.
- Base applicative observée : `egs_local` (environ 12.9 MB).
- Cluster : cinq bases connectables, environ 55.8 MB cumulés. Les noms
  incluent la base applicative, test, staging, restauration et l'administration
  PostgreSQL; l'usage, propriétaire et rétention de chaque base doivent être
  approuvés.
- Rôle de connexion de l'application : `postgres`, rôle superutilisateur.
- Révision live : `029_auth_password_lifecycle`.
- Modèle courant de l'image API : Alembic ne connaît que
  `028_normalize_vitrine_lots_types`; `alembic current` échoue donc sur la
  base live. Le checkout de travail a une seule tête Alembic
  `032_immobilier_v2_contract`.

## Comptage des objets

| Objet | Compte |
| --- | ---: |
| Tables `public` | 69 |
| Vues `public` | 0 |
| Triggers `public` | 0 |
| Fonctions/procédures stockées `public` | 18 |
| Versions de migration suivies | 34 fichiers |
| Tables avec RLS activée | 4 |
| Politiques `public` | 0 |

## Tables live (noms seulement)

| Domaine | Tables |
| --- | --- |
| Authentification | `users`, `user_profiles`, `auth_sessions`, `auth_audit_logs`, `auth_login_failures`, `auth_password_reset_tokens`, `auth_rate_limit_events` |
| Entités / parties / audit | `entities`, `parties`, `party_lead_details`, `party_roles`, `activity_logs`, `activites_journal` |
| CRM / marketing | `leads`, `lead_campaigns`, `lead_interactions`, `lead_captures`, `campagnes_marketing`, `opportunites` |
| Foncier | `foncier_villages`, `foncier_lotissements`, `foncier_ilots`, `foncier_lots`, `foncier_lots_old`, `foncier_villages_old`, `foncier_attestations`, `foncier_attestation_temoins`, `foncier_audit`, `foncier_audit_old`, `foncier_items`, `foncier_items_old`, `user_village_access`, `vitrine_lots`, `ventes_foncieres` |
| Immobilier | `properties`, `lease_contracts`, `rent_payments`, `immobilier_items` |
| Finances / achats | `finances`, `products`, `suppliers` |
| RH / travail | `employees`, `employes_presence`, `tasks`, `messages_direction` |
| Médias / documents | `documents`, `media_files`, `media_taxonomy`, `media_versions`, `media_usage`, `media_audit_logs` |
| Site/CMS | `app_settings`, `app_settings_old`, `app_settings_test`, `page_layouts`, `page_layouts_backup_20260827`, `page_layouts_canonical_20260827`, `site_content`, `site_realisations`, `social_posts`, `contact_messages` |
| Projets / visites / statistiques | `projects`, `visiteurs`, `visites`, `visites_du_jour`, `visites_en_cours`, `visites_terrain`, `stats_journalieres` |
| Infrastructure de schéma | `alembic_version` |

## Comptages de lignes sélectionnés

Comptages SQL uniquement; aucune valeur de colonne n'a été sélectionnée.

| Table | Lignes |
| --- | ---: |
| `users` | 4 |
| `properties` | 27 |
| `parties` | 1 |
| `media_files` | 34 |
| `documents` | 0 |
| `foncier_attestations` | 0 |
| `foncier_lots` | 0 |
| `leads` | 0 |

La table `documents` vide ne prouve pas que la GED ne contient aucun fichier :
122 fichiers existent sous `backend/storage` et 34 métadonnées média sont
enregistrées. Le classement de leur sensibilité n'a pas été effectué. Les
comptages de comptes/propriétés démontrent qu'il y a déjà des enregistrements
métier; ne pas les considérer comme données de test sans validation.

## Concordance modèles/migrations

- Les modèles SQLAlchemy définissent des tables applicatives dans 13 modules.
- Les migrations Alembic comportent 34 fichiers suivis et une seule tête
  dans le checkout (`032_immobilier_v2_contract`).
- La DB live est deux versions antérieure à cette tête de travail et l'image
  de production ne contient même pas la révision actuellement enregistrée.
- Plusieurs tables `*_old`, `*_backup_*` et `*_test` sont présentes : ce sont
  des candidats d'investigation, pas des suppressions approuvées.
- L'ancien rapport de schéma indiquant 19 tables/55 attendues date d'une
  collecte précédente et ne correspond pas à l'inventaire live (69 tables).

## Recommandations avant migration

1. Identifier les bases de données non-production, propriétaires, usages et
   politique de conservation.
2. Inventorier les contraintes/FK/index et réconcilier chaque modèle avec la
   tête Alembic attendue, sur staging restauré.
3. Préparer un rôle applicatif non-superutilisateur et un rôle de migration
   contrôlé; analyser l'impact sur migrations et fonctions.
4. Vérifier les politiques d'accès au niveau API et au niveau PostgreSQL;
   zéro politique est actuellement déclarée.
5. Sauvegarder puis éprouver une restauration avant toute migration ou purge.

**Non exécuté :** dump, restauration, migration, modification ou suppression
d'objets PostgreSQL.
