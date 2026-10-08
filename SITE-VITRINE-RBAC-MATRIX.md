# Matrice RBAC serveur — Phase 3.3

État au 2026-09-23. Le responsable a validé le mapping temporaire : **admin écrit; gestionnaire lit; employé limité jusqu’à validation**. La décision est implémentée par `backend/app/core/authorization.py`; elle n'ajoute aucune table ni migration.

## Règles effectives

| Rôle | Ressources privées | Création / mise à jour / suppression / publication |
|---|---|---|
| `admin` | Toutes les routes privées protégées par le guard central | Autorisées |
| `gestionnaire` | Lecture Clients; lecture privée Site Vitrine; lecture Media; lecture d'une allowlist `/tables` | Refusées (403) |
| `employe` | Aucune lecture privée en attente de validation | Refusées (403) |
| anonyme | Seulement routes et projections explicitement publiques | Refusées sauf formulaires publics à payload limité |

Les routes Lead admin-only préexistantes et l'ACL objet Foncier restent en place. `guest` et rôles inconnus ne reçoivent aucun accès privé. Les routes publiques ne passent pas par le guard central.

## Site Vitrine et Media

| Ressource | Route / action | Public | Admin | Gestionnaire | Employé |
|---|---|---:|---:|---:|---:|
| Contenu CMS | GET `/api/v1/site-content[/{section}[/{key}]]` | Oui | Oui | Oui (contrat de lecture actuel) | Oui (contrat public actuel) |
| Contenu CMS | POST/PATCH/DELETE `/api/v1/site-content` | Non | Écriture | 403 | 403 |
| Layout | GET `/api/v1/page-layouts/{slug}` publié | Oui | Oui | Oui | Publié seulement |
| Layout | GET `/api/v1/page-layouts` (layouts privés/brouillons) | Non | Oui | Lecture | 401 |
| Layout | POST upsert / PATCH `/{slug}/publish` | Non | Écriture/publication | 403 | 403 |
| Réalisations | GET liste publique | Oui, filtrée/projetée | Oui | Oui | Oui, public seulement |
| Réalisations | GET détail privé | Non | Oui | Lecture | 403 |
| Réalisations | POST/PATCH/DELETE | Non | Écriture | 403 | 403 |
| Lots vitrine | GET liste publique | Oui | Oui | Oui | Oui, public seulement |
| Lots vitrine | GET détail privé | Non | Oui | Lecture | 403 |
| Lots vitrine | POST/PATCH/DELETE | Non | Écriture | 403 | 403 |
| Intérêt pour un lot | POST `/api/v1/site/vitrine-lot-inquiries` | Oui, validation de payload | Oui | Oui | Oui |
| Media | GET `/brand-assets` | Oui | Oui | Oui | Oui |
| Media privé | GET bibliothèque, détail, versions, usage | Non | Lecture | Lecture | 403 |
| Media | upload, replace, update, delete, restore, usage create/delete | Non | Écriture | 403 | 403 |
| Media audit/purge | GET/POST audit, DELETE purge | Non | Admin | 403 | 403 |

Le GET CMS existant ne modélise pas d'état publié/brouillon : son contenu et ses valeurs restent publics selon son contrat actuel. Le guard ne peut pas distinguer les drafts CMS tant que le modèle ne porte pas cet état.

## Clients

| Route | Action | Public | Admin | Gestionnaire | Employé |
|---|---|---:|---:|---:|---:|
| GET `/api/v1/clients`, `/{id}`, `/search/suggest` | Lire | Non | Oui | Oui | 403 |
| POST `/api/v1/clients` | Créer | Non | Oui | 403 | 403 |
| PATCH/DELETE `/{id}` | Modifier / désactiver | Non | Oui | 403 | 403 |
| POST `/{id}/activate` | Réactiver | Non | Oui | 403 | 403 |

## `/api/v1/tables` — allowlist de lecture gestionnaire

Le routeur n'expose que les noms dans `TABLES`; aucun `PUT` n'existe. Anonyme : seules les listes publiques réalisation/lot (projections filtrées) et POST contact strictement validé. Admin : opérations génériques sur les tables exposées. Gestionnaire : GET seulement pour les 34 ressources explicitement listées ci-dessous. Toute mutation générique gestionnaire/employé retourne 403.

`tasks`, `taches`, `properties`, `lease_contracts`, `rent_payments`, `documents`, `contact_messages`, `page_layouts`, `site_realisations`, `vitrine_lots`, `messages_direction`, `employes_presence`, `visites_en_cours`, `stats_journalieres`, `site_content`, `visiteurs`, `visites_du_jour`, `lead_campaigns`, `lead_interactions`, `foncier_villages`, `parties`, `party_roles`, `party_lead_details`, `leads`, `lead_captures`, `media_files`, `media_versions`, `media_usage`, `visites_terrain`, `ventes_foncieres`, `campagnes_marketing`, `visites`, `opportunites`, `social_posts`.

`activites_journal`, `media_audit_logs`, `app_settings` et `user_profiles` sont volontairement exclus de la lecture gestionnaire. Hors de cette allowlist et sans rôle admin, lecture générique 403; table inconnue 404. Le POST `contact_messages` reste public pour le formulaire : seuls `nom,email,telephone,sujet,message` sont acceptés, `email` et `message` requis, limites de longueur imposées. Un JWT non-admin ne peut pas utiliser le POST pour contourner la validation publique.

## Authentification et limites du modèle

Authentification réutilisée : `/auth/login` délivre JWT; `get_current_user` vérifie le token puis recharge l'utilisateur; `get_optional_current_user` est réservé aux routes publiques avec vue optionnelle. Le projet avait déjà rôles et `require_admin_user`, et une ACL locale `UserVillageAccess` pour certaines opérations Foncier, mais aucun guard transversal permission/module/action. Le guard central ajouté réutilise `get_current_user` et les rôles existants. `ACCESS_LEVEL_MODULES` reste un contrôle UI, pas une source d'autorité.

Le mapping admin/gestionnaire/employé est temporaire et explicite; il ne remplace pas l'ACL village Foncier pour les routes Foncier spécialisées. Toutes les autorisations objet hors ACL existante (notamment portée ligne/client) restent à concevoir au besoin métier.
