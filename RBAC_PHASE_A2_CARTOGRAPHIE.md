# RBAC Phase A.2 — cartographie exhaustive, lecture seule

Date: 2026-09-24. Branche observée: audit/fix-schema-site.

## A. Résumé exécutif

Le dictionnaire TABLES a 40 entrées source et 38 noms distincts: lead_campaigns et lead_interactions sont répétés. Le routeur générique donne le même CRUD pour toutes les entrées, sauf exceptions publiques. Policy actuelle: admin passe toutes actions connues, gestionnaire lit 34 tables, employe/guest n'ont pas d'accès privé. Ces rôles techniques ne sont pas assimilés aux rôles métier.

- Tables conformes métier démontrées: 0; UNKNOWN: 38; aucune permission métier inférée.
- Écarts techniques certains: CRUD générique non différencié par table; lecture gestionnaire sans scope/pagination; DELETE physique; plusieurs routeurs métier n'ont pas de garde auth visible; aucun export API général.
- Scope générique par propriétaire, créateur, assigné, état: absent. ACL UserVillageAccess limitée à des chemins fonciers.
- Audit: Media, Settings, Auth, Foncier ont des mécanismes ciblés; GenericTableRepository n'a pas d'audit.
- Tests existants recensés plus bas, aucun lancé. Aucune migration/base/API appelée.

Références: [matrice des écarts](RBAC_PHASE_A2_GAP_MATRIX.md), [mappings UNKNOWN](RBAC_ROLE_MAPPING_UNKNOWN.md).

## B. Cartographie des 38 tables

Schéma de colonnes et défauts défini dans backend/app/api/v1/tables/router.py; repository générique exécute SQL direct. tasks et taches pointent vers la même table physique tasks. « Aucun homonyme ORM établi » est résultat du scan statique backend/app/models.

| Table | Modèle/mapping | Repository/schema | Endpoints | Autorisation réelle | Scope | Delete/archive/restore | Audit | Frontend |
|---|---|---|---|---|---|---|---|---|
| tasks | Task (physical tasks; taches alias) | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/tasks | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Taches, Dashboard, AccueilEmploye |
| taches | Task (physical tasks; alias) | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/taches | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Generic consumer search; exact component UNKNOWN |
| properties | Property | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/properties | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore; dedicated DELETE/restore lifecycle also present | No generic audit; specialized audit varies | Immobilier, Dashboard |
| lease_contracts | LeaseContract | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/lease_contracts | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore; dedicated DELETE/restore lifecycle also present | No generic audit; specialized audit varies | Immobilier contracts |
| rent_payments | RentPayment | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/rent_payments | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore; dedicated DELETE/restore lifecycle also present | No generic audit; specialized audit varies | Immobilier, Dashboard, PaymentReportsTab |
| documents | No homonymous ORM class established; config in tables router | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/documents | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Documents/document components |
| contact_messages | ContactMessage | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/contact_messages | Public POST strict 5-field form; private GET manager/admin; mutations admin | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | SiteEditor, PublicContact |
| page_layouts | PageLayout | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/page_layouts | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | SiteEditor, PageBuilder |
| site_realisations | SiteRealisation | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/site_realisations | Anonymous GET published projection; manager GET; admin policy CRUD | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | SiteEditor/public site |
| vitrine_lots | VitrineLot | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/vitrine_lots | Anonymous GET published projection; manager GET; admin policy CRUD | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | CatalogueLots/public site |
| messages_direction | MessageDirection | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/messages_direction | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | AccueilEmploye |
| employes_presence | EmployeePresence | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/employes_presence | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | AccueilEmploye |
| visites_en_cours | VisiteEnCours | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/visites_en_cours | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | AccueilEmploye |
| activites_journal | ActiviteJournal | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/activites_journal | Manager GET denied (excluded); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | AccueilEmploye |
| stats_journalieres | StatsJournalieres | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/stats_journalieres | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Dashboard/dashboardStats |
| site_content | SiteContent | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/site_content | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | SiteEditor/public site |
| visiteurs | Visiteur | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/visiteurs | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | RegistreVisiteur |
| visites_du_jour | VisiteDuJour | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/visites_du_jour | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | RegistreVisiteur |
| lead_campaigns | LeadCampaign | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/lead_campaigns | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Leads/bot-engine |
| lead_interactions | LeadInteraction | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/lead_interactions | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Leads/bot-engine |
| foncier_villages | FoncierVillage | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/foncier_villages | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore; dedicated service soft only if deleted_at; village restore not found | No generic audit; specialized audit varies | Foncier |
| parties | Party | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/parties | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Immobilier tenants |
| party_roles | PartyRole | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/party_roles | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Generic consumer search; exact component UNKNOWN |
| party_lead_details | PartyLeadDetail | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/party_lead_details | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Generic consumer search; exact component UNKNOWN |
| leads | Lead | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/leads | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Leads/LeadPipeline |
| lead_captures | LeadCapture | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/lead_captures | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | public lead capture |
| media_files | MediaFile | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/media_files | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Dedicated soft DELETE, restore and physical purge; generic DELETE remains physical | No generic audit; specialized audit varies | Media/media components |
| media_versions | MediaVersion | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/media_versions | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | mediaUtils/Media detail |
| media_usage | MediaUsage | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/media_usage | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | mediaUtils/Media components |
| media_audit_logs | MediaAuditLog | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/media_audit_logs | Manager GET denied (excluded); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | media audit UI/repository |
| app_settings | AppSettings | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/app_settings | Manager GET denied (excluded); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Parametres/SettingsContext |
| user_profiles | UserProfile | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/user_profiles | Manager GET denied (excluded); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Utilisateurs/AccueilEmploye |
| visites_terrain | No homonymous ORM class established; config in tables router | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/visites_terrain | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Generic consumer search; exact component UNKNOWN |
| ventes_foncieres | No homonymous ORM class established; config in tables router | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/ventes_foncieres | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Generic consumer search; exact component UNKNOWN |
| campagnes_marketing | No homonymous ORM class established; config in tables router | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/campagnes_marketing | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Generic consumer search; exact component UNKNOWN |
| visites | No homonymous ORM class established; config in tables router | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/visites | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Generic consumer search; exact component UNKNOWN |
| opportunites | No homonymous ORM class established; config in tables router | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/opportunites | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | Generic consumer search; exact component UNKNOWN |
| social_posts | No homonymous ORM class established; config in tables router | GenericTableRepository; fields/defaults configured in TABLES | GET/POST/PATCH/DELETE /api/v1/tables/social_posts | Manager GET allowed (34 allowlist); admin policy allows CRUD; employee/guest private deny | No generic row scope or pagination | Generic DELETE calls repository SQL DELETE physical; no generic archive/restore | No generic audit; specialized audit varies | social.repository/social-publish |

### Politique générique

GET privé: guard erp_table/read. Admin passe; gestionnaire passe sur 34 noms; autres rôles refusés. Public: GET seulement site_realisations et vitrine_lots, filtrés publiés et projetés. POST public uniquement contact_messages avec nom,email,telephone,sujet,message; email/message requis et longueurs bornées. PATCH et DELETE requièrent auth puis guard; policy admin-only. GET lit toutes lignes sans pagination. GenericTableRepository.delete effectue SQL DELETE. Pas d'endpoint générique archive/restore/export/validation/approbation.

## C. Routes métier dédiées hors /tables

Lecture statique des routeurs v1. get_current_user signifie authentifié, pas rôle métier.

| Module | Routes/actions repérées | Garde observée | Ressource/constat |
|---|---|---|---|
| auth | login/me/refresh/logout/reset/change password/tokens | AuthService par action | users, sessions, audit auth |
| clients | list/detail/search/create/update/activate/delete | permission centrale par action; policy manager read/admin all | scope ligne non établi |
| dashboard | overview/stats/logs/report | JWT seulement | rapport sans guard rôle/export |
| employees | CRUD/search | aucun Depends auth visible | Entity employee, delete soft=True, champs salaire/contact |
| entities | list/search/resolve/detail/create/bulk/update/delete/restore/migrate | aucun Depends auth visible | PII; delete soft si deleted_at, restore séparé |
| finance | list/detail/create/update/delete | GET sans auth; create auth facultative; update/delete JWT seul | annulé soft puis hard-delete si déjà annulé |
| foncier | villages/lotissements/îlots/lots/attestations/validation/archive/restore/audit | nombreuses routes JWT seul, ACL locale village | scope et audit varient |
| immobilier | properties/contracts/payments CRUD/stats/restore/terminate | aucun guard rôle central visible | lifecycle DELETE/restore dédié |
| leads | CRUD/search/capture/campaign/process/preview/stats/automation | admin sur CRUD/campaign/automation; capture public | assigned_to filtrable; scope imposé non établi |
| media | assets/library/usage/upload/replace/update/delete/restore/purge/audit | permission centrale par action | soft delete, restore, purge distincts |
| notifications | send | JWT seul | action transversale |
| page_layouts | list drafts/published detail/upsert/publish | permission centrale | published_at/updated_by |
| products | list/create/update/delete | aucun Depends auth visible | hors 38 |
| projects | list/create/update/delete | aucun Depends auth visible | hors 38 |
| rpc | dispatch actions, foncier mutations/audit | user optionnel; dépend nom RPC | vérifier chaque action |
| settings | public/private/category/frontend/whitelist/audit/upsert/delete | writes JWT; reads/audit sans guard visible | service audite certains writes avec user id |
| site | réalisations/lots list/detail/create/update/delete | public filtered list; guards privé/mutations | publication par champs; delete à confirmer |
| site_content | GET/POST/PATCH/DELETE | GET public, writes permission | pas de distinction draft/published |
| suppliers | list/detail/create/update/delete | aucun Depends auth visible | hors 38 |
| tasks | CRUD/statuts | gardes variables; delete sans guard visible | alias générique aussi accessible |
| tenants | CRUD/party role | aucun Depends auth visible | parties/party_roles |
| users | comptes/profils | contrôle interne à détailler par handler | users/user_profiles |
| tables | generic CRUD | guard central et exceptions publiques | 38 noms |

Absence de Depends = absence observée dans routeur/handler; aucun audit middleware global complet n'a été effectué. Les aliases/RPC doivent être suivis jusqu'à l'action finale avant correction.

## D. Suppression, archive, restore

- /tables DELETE est physique confirmé par SQL DELETE.
- Finance DELETE: statut annule d'abord puis hard delete si déjà annulé; JWT seulement.
- Foncier lot a POST archive (raison/user) et POST restore distincts; d'autres objets fonciers DELETE passent repository soft seulement si deleted_at; restore village non trouvé.
- Immobilier properties/contracts/payments ont DELETE et restore dédiés; terminate de contrat est une autre action.
- Media distingue DELETE logique, restore et purge physique, avec guards distincts.
- Entity delete soft si deleted_at et restore dédié; Employee appelle soft=True.
- Sémantique des autres DELETE: UNKNOWN, pas d'inférence archive.

## E. Exports

| Module | Mécanisme | API/données | Garde | Phase 3.4 |
|---|---|---|---|---|
| tables | aucun endpoint CSV/XLSX repéré | GET générique | guard read | aucune exception export |
| finance | rapport/impression client | GET non protégé | aucun RBAC | source techniquement ouverte; droit métier UNKNOWN |
| dashboard | endpoint report + rendu client | JWT seulement | aucun rôle/export | Admin/Direction seulement par défaut |
| foncier audit | AuditModal génère CSV navigateur | données API Foncier | bouton canManage; permission export distincte non trouvée | exception UNKNOWN |
| attestations foncières | HTML print / document | APIs métiers | dépend endpoint source | génération/export UNKNOWN |
| immobilier | PaymentReportsTab, impression | payments/stats | pas de role guard central détecté | non par défaut |
| documents | DocumentForm et utils/print.ts | données APIs sources | dépend endpoints source | UNKNOWN |
| media | téléchargement fichier/brand asset | routes Media/public asset | guard Media ou public brand | pas export table |

Un export généré navigateur reste possible après que le serveur a remis les lignes.

## F. Périmètre et audit

La route générique ne contrôle aucun owner/creator/assignee/agence/organisation/état/clôture. Les filtres query du client ne sont pas contrôle d'accès. Leads possède assigned_to et un filtre, mais pas une contrainte utilisateur imposée démontrée. Foncier possède UserVillageAccess sur certains cas. Les colonnes created_by/updated_by n'imposent pas de scope par elles-mêmes.

Audit spécifique: Media, Settings, Auth, Foncier. Aucun audit GenericTableRepository. Couverture exacte par table/action ailleurs UNKNOWN.

## G. Frontend/backend

hasAccess/ACCESS_LEVEL_MODULES, canManage/isAdmin et role/access_level sont contrôles UX; backend central regarde users.role. Mapping UNKNOWN. Finance UI a conditions de rôle mais GET API accessible anonymement. Plusieurs pages Employés/Entités/Projets/Produits/Fournisseurs/Tâches/Immobilier utilisent CRUD alors que leurs APIs examinées n'ont pas de rôle guard visible. Foncier masque des actions selon canManage/validateur_village mais de nombreuses routes n'exigent qu'un JWT. Site/Media/Clients/Layout/CMS ont guards; bouton par bouton reste UNKNOWN jusqu'au mapping.

## H. Tests existants (non exécutés)

Backend: test_api_security.py, test_media_api.py, test_media_dedup_and_lifecycle.py, test_site_content_crud.py, test_v1_api.py, test_v1_compatibility_aliases.py, test_foncier_attestations_api.py, test_foncier_village_crud.py, test_business_modules.py, test_extended_modules.py, test_finance_api.py, test_auth_api.py, test_sqlalchemy_repository.py. Frontend: Foncier.test.tsx, Clients.test.ts, Fournisseurs.test.ts, api/client.test.ts et tests de domaine. Traces antérieures: backend/PHASE3.3-RBAC-LIVE-TESTS.txt, backend/PHASE3.3.1-MEDIA-LIVE-TESTS.txt. Leur présence ne garantit pas la couverture 38×action×rôle×scope.

## I. Décisions métier bloquantes

- DECISION-001: mapping des 4 rôles techniques vers les rôles métier.
- DECISION-002: lecture/écriture/action par table, champs exposés et exceptions.
- DECISION-003: scope Agent/Gestionnaire et source de vérité owner/creator/assignee/village/agence.
- DECISION-004: représentation et cumul éventuel Direction, Finance, Commercial, Immobilier/Foncier.
- DECISION-005: exceptions d'export par table; à défaut export restrictif.
- DECISION-006: hard delete/archive/restore par table et rôle.
- DECISION-007: rôle, permission, état, scope, audit pour valider/rejeter/clôturer/approuver/affecter/publier/confirmer.
- DECISION-008: contrat public et distinction publié/brouillon CMS.
- DECISION-009: politique des endpoints où aucun guard n'est visible.

## J. Risques vérifiables

Routes génériques peuvent contourner validation/lifecycle métier; manager GET renvoie lignes sans scope; generic DELETE physique; Finance GET anonyme et POST facultative-auth; plusieurs routes CRUD sans auth visible; JWT seul ne restreint pas rôle; exports client conservent les données reçues.

## K. Préservation

Seuls les trois rapports A.2 ont été créés. Aucun code, migration, donnée ou configuration modifiés. Aucun test, appel DB ou HTTP exécuté.

CODE MODIFIÉ : NON
MIGRATION : NON
DONNÉES MODIFIÉES : NON
CONFIGURATION MODIFIÉE : NON
