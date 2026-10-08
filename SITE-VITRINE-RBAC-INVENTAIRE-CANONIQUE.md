# EGS — Inventaire canonique des ressources RBAC

**Phase 3.3.5 — inventaire technique en lecture seule.** État du working tree observé le 2026-09-28. Les ID sont documentaires et n’expriment ni priorité ni permission.

## Périmètre

Le registre courant de /api/v1/tables a 39 définitions et 37 noms distincts. Cette matrice fusionne l’alias physique taches → tasks, et ne compte qu’une fois les déclarations répétées de lead_campaigns et lead_interactions. Elle ajoute foncier_villages, dans les anciens inventaires 34/38 et à HEAD, mais absent du registre courant; sa route foncière dédiée existe.

« Table DB » est la cible configurée dans TABLES, pas une preuve d’existence physique en base. Une route dédiée ne présume pas d’équivalence fonctionnelle avec toutes les opérations génériques. Les scopes et données décrivent les éléments techniques repérés, sans décision d’accès.

## Matrice canonique

| ID | Ressource canonique | Nom /tables | Alias | Table DB | Catégorie | Route dédiée | Scope technique | Données sensibles | Source |
| -- | ------------------- | ----------- | ----- | -------- | --------- | ------------ | --------------- | ----------------- | ------ |
| RBAC-RES-001 | Tasks | tasks | taches, même table | tasks | Opérations | /api/v1/tasks | employee_id, project_id; scope demandeur non établi | affectation, descriptions, échéances | tables/router.py; tasks/router.py; migration 009 |
| RBAC-RES-002 | Properties | properties | — | properties | Immobilier | /api/v1/immobilier/properties | created_by; aucun scope générique établi | propriétaire, adresse, valeur/loyer | migration 007; models/property.py |
| RBAC-RES-003 | Lease contracts | lease_contracts | — | lease_contracts | Immobilier | /api/v1/immobilier/contracts | created_by; aucun scope générique établi | parties, contrat, conditions financières | migration 007; models/property.py |
| RBAC-RES-004 | Rent payments | rent_payments | — | rent_payments | Immobilier/finance | /api/v1/immobilier/payments | relations contrat/propriété/locataire; scope utilisateur non établi | montant, dates, mode, référence | migration 007; models/property.py |
| RBAC-RES-005 | Documents | documents | — | documents | Documents | Non trouvée | created_by; scope non établi | URL/type et contenu de fichier | migration 011 |
| RBAC-RES-006 | Contact messages | contact_messages | — | contact_messages | Formulaire/site | Création via /api/v1/tables/contact_messages | assigne_a au schéma historique; scope non établi | nom, email, téléphone, message | migration 012; tables/router.py |
| RBAC-RES-007 | Page layouts | page_layouts | — | page_layouts | Site/Page Builder | /api/v1/page-layouts | auteur/mise à jour; scope non établi | brouillons et configuration du site | migration 012; page_layouts/router.py |
| RBAC-RES-008 | Site realisations | site_realisations | — | site_realisations | Site/vitrine | /api/v1/site/realisations | created_by/updated_by; filtre auteur non établi | notes et contenu éditorial | migration 012; site/router.py |
| RBAC-RES-009 | Vitrine lots | vitrine_lots | — | vitrine_lots | Vitrine foncière | /api/v1/site/vitrine-lots | auteur; scope foncier de la route non établi | localisation, prix, contact, notes | migrations 012/027; site/router.py |
| RBAC-RES-010 | Messages direction | messages_direction | — | messages_direction | Communication interne | Non trouvée | aucun scope ligne identifié | messages, auteur/destinataires | migration 009; models/hr.py |
| RBAC-RES-011 | Employes presence | employes_presence | — | employes_presence | RH/présence | Non trouvée | employee_id; filtre par demandeur non établi | employé, horaires de pointage | migration 009; models/hr.py |
| RBAC-RES-012 | Visites en cours | visites_en_cours | — | visites_en_cours | Visites | Non trouvée | agent_id, visiteur_id; scope non établi | visiteur, agent, objet, lieu | migration 013; models/visits.py |
| RBAC-RES-013 | Activites journal | activites_journal | — | activites_journal | Journal opérationnel | Dashboard existe, équivalence non établie | agent_id; scope non établi | participants, résultats, notes | migration 013; models/visits.py |
| RBAC-RES-014 | Stats journalieres | stats_journalieres | — | stats_journalieres | Agrégats | /api/v1/dashboard/stats, équivalence non confirmée | agrégats par date; scope organisation non identifié | statistiques d’activité/présence | migration 013; dashboard/router.py |
| RBAC-RES-015 | Site content | site_content | — | site_content | CMS | /api/v1/site-content | scope ligne non identifié | contenu/brouillons, valeurs CMS | migration 012; site_content/router.py |
| RBAC-RES-016 | Visiteurs | visiteurs | — | visiteurs | Visites/personnes | Non trouvée | scope demandeur non identifié | identité, coordonnées, CNI selon migration | migration 013; models/visits.py |
| RBAC-RES-017 | Visites du jour | visites_du_jour | — | visites_du_jour | Visites | Non trouvée | agent_accueil_id, visiteur_id; scope non établi | visiteur, résultat, notes | migration 013; models/visits.py |
| RBAC-RES-018 | Lead campaigns | lead_campaigns | déclaration répétée dans TABLES | lead_campaigns | CRM/campagnes | /api/v1/leads/campaigns | scope ligne non confirmé | campagne, budget, données commerciales | migration 008; leads/campaign_routes.py |
| RBAC-RES-019 | Lead interactions | lead_interactions | déclaration répétée dans TABLES | lead_interactions | CRM/historique | CRUD dédié non confirmé | lien lead; scope demandeur non établi | historique et données prospect | migration 008; models/leads.py |
| RBAC-RES-020 | Foncier villages | —, absent du registre actuel | ancien nom /tables | foncier_villages | Foncier | /api/v1/foncier/villages | user_village_access/check_access sur certaines opérations, pas universellement confirmé | localisation foncière, auteurs/responsables | migration 006; models/foncier.py; foncier/router.py |
| RBAC-RES-021 | Parties | parties | — | parties | Identités | /api/v1/entities existe; équivalence non confirmée | created_by; pas de scope générique | identité, coordonnées, CNI | migration 005; models/party.py |
| RBAC-RES-022 | Party roles | party_roles | — | party_roles | Relations de parties | /api/v1/tenants existe; équivalence non confirmée | lien partie; scope non établi | identité et relation de rôle | migration 008; models/leads.py |
| RBAC-RES-023 | Party lead details | party_lead_details | — | party_lead_details | CRM/identité | Équivalence non confirmée | liens lead/partie; scope non établi | données personnelles de prospection | migration 008; models/leads.py |
| RBAC-RES-024 | Leads | leads | — | leads | CRM/prospects | /api/v1/leads | assigne_a; assigned_to en metadata; filtre facultatif, non imposé | nom, téléphone, email, notes, affectation | migration 008; leads/router.py |
| RBAC-RES-025 | Lead captures | lead_captures | — | lead_captures | CRM/capture | /api/v1/site/lead-capture pour collecte publique; /api/v1/leads/capture admin-only | scope non confirmé | coordonnées, consentement, provenance | migration 008; site/router.py; leads/router.py |
| RBAC-RES-026 | Media files | media_files | — | media_files | Media/fichiers | /api/v1/media | created_by; scope non établi | fichiers/URL, hash, métadonnées; nature variable | migration 011; media/router.py |
| RBAC-RES-027 | Media versions | media_versions | — | media_versions | Media/versions | /api/v1/media/{id}/versions | relation média; scope utilisateur non identifié | fichier/version, hash, métadonnées | migration 011; media/router.py |
| RBAC-RES-028 | Media usage | media_usage | — | media_usage | Media/références | /api/v1/media/usage | relation média/ressource; scope général non établi | références et liens de contenu | migration 011; media/router.py |
| RBAC-RES-029 | Media audit logs | media_audit_logs | — | media_audit_logs | Audit média | /api/v1/media/audit | acteur; scope organisation non établi | acteur, événement, IP/user-agent selon schéma | migration 011; media/router.py |
| RBAC-RES-030 | App settings | app_settings | — | app_settings | Configuration | /api/v1/settings | scope non identifié | valeurs de configuration pouvant inclure secrets | migration 014; settings/router.py |
| RBAC-RES-031 | User profiles | user_profiles | — | user_profiles | Profils/administration | /api/v1/users existe; équivalence profil non confirmée | lien utilisateur; scope non établi | informations personnelles et rôle/profil | migration 014; models/settings.py |
| RBAC-RES-032 | Visites terrain | visites_terrain | — | visites_terrain | Terrain/visites | RPC visites terrain; CRUD métier non confirmé | visited_by, lot_id | lien agent/lot et date | migration b350fd2b; rpc/router.py |
| RBAC-RES-033 | Ventes foncieres | ventes_foncieres | — | ventes_foncieres | Foncier/transaction | Aucune route dédiée confirmée | lot_id seulement dans migration consultée | lien lot/date; aucun montant/personne dans cette définition migratoire | migration b350fd2b; tables/router.py |
| RBAC-RES-034 | Campagnes marketing | campagnes_marketing | — | campagnes_marketing | Marketing | Non trouvée; distinct de lead_campaigns | scope non confirmé | budget, cible, contenu | tables/router.py; existence DB non confirmée |
| RBAC-RES-035 | Visites | visites | — | visites | Commercial/visites | Non confirmée | scope non confirmé | coordonnées/détails selon config générique | tables/router.py; existence DB non confirmée |
| RBAC-RES-036 | Opportunites | opportunites | — | opportunites | Commercial | /api/v1/site/vitrine-lot-inquiries crée une opportunité; CRUD complet non établi | scope demandeur non confirmé | budget/montant, description et lien client | site/router.py; tables/router.py |
| RBAC-RES-037 | Social posts | social_posts | — | social_posts | Marketing/publication | Non trouvée | auteur/organisation non confirmés | contenu brouillon/calendrier | tables/router.py; existence DB non confirmée |

## Interprétation

- tasks et taches sont deux noms API vers la même table tasks. Aucun arbitrage de suppression n’est fait.
- lead_campaigns et lead_interactions sont des clés répétées dans un dictionnaire Python; la dernière déclaration remplace la précédente.
- visites_du_jour est une table créée par op.create_table en migration 013 et possède un modèle SQLAlchemy; aucun indice de vue n’a été trouvé.
- Les noms marqués existence DB non confirmée sont des cibles configurées, pas des tables dont la présence en base est affirmée.
- Les catégories et données sensibles ne déterminent aucun droit.

Sources principales: backend/app/api/v1/tables/router.py; backend/app/core/authorization.py; backend/app/api/v1/__init__.py; modèles hr, property, party, leads, visits, media, settings, public_site et foncier; migrations 005–014 et 027. Voir SITE-VITRINE-RBAC-INVENTAIRE-RECONCILIATION.md.

**Décision métier : non traitée.**
