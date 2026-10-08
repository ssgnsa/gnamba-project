# Phase 3.1 — État Git et attribution des modifications

Audit réalisé le 2026-09-23, sans réécriture de l'index ni des références Git.

## Baseline

- Branche : `audit/fix-schema-site`
- HEAD : `634938c8 Fix local API CORS and Vite proxy routing`
- Tracking : `origin/audit/fix-schema-site` au même commit.
- `git status --short` : 24 fichiers suivis modifiés, quatre fichiers non suivis.
- `git diff --stat` : 24 fichiers, 1 126 insertions, 343 suppressions.
- `git diff --check` : aucun problème d'espacement.
- L'historique local/refs affiche les branches listées par Git et les 30 commits récents; aucune source de migration 025–028 n'y est reliée.

Pendant l'audit, un état ultérieur du workspace a aussi montré `src/lib/dbClient.service.ts` modifié et `src/lib/dbClient.service.test.ts` non suivi, absents du baseline capturé ci-dessus (mtime environ 2026-09-23 19:22 UTC). Leur diff concerne une normalisation de réponse paginée Foncier et deux tests Vitest. Ils ne correspondent pas aux 18 fichiers Phase 3 décrits ci-dessous; aucun changement n'y a été apporté et leur auteur/intention ne peut être établi par Git.

À cette observation ultérieure, `git diff --stat` affiche 25 fichiers suivis (1 142 insertions, 344 suppressions) et `git status --short` affiche sept fichiers non suivis, dont les deux rapports Phase 3.1 créés pour cette mission. Ces chiffres ne remplacent pas le baseline initial.

Les 18 éléments ci-dessous sont les modifications de Phase 3 par rapport à HEAD. Seize sont des fichiers suivis modifiés et deux sont de nouveaux fichiers non suivis. Les huit autres modifications suivies étaient déjà présentes avant la Phase 3 et ne lui sont pas attribuées : `.codex/context/server-context.json`, `backend/app/core/config.py`, `backend/tests/test_config.py`, `src/hooks/useAttestations.ts`, `src/hooks/useFoncierState.ts`, `src/pages/Foncier.test.tsx`, `src/pages/Foncier.tsx`, `src/utils/print.ts`. Les documents non suivis `AUDIT_FONCIER_INTERACTIONS_REPORT.md` et `SITE-VITRINE-CONTRATS.md` préexistaient aussi. Aucun de ces éléments n'a été annulé ou modifié pendant l'audit Phase 3.1.

## Modifications Phase 3 — fichier par fichier

Priorités : **P0** exposition de données/action large; **P1** sécurité/intégrité de données; **P2** compatibilité/testabilité; **P3** documentaire.

| Fichier | Modification et raison | Route/module | Risque / test associé | Indispensable ? |
|---|---|---|---|---|
| `backend/app/api/deps/__init__.py` | Ajout de `require_admin_user` autour de l'auth EGS existante. | API, dépendance partagée | P1; les tests de routes substituent parfois `get_current_user`, pas un vrai JWT. | Oui pour le garde admin choisi |
| `backend/app/api/v1/tables/router.py` | Auth sur routes génériques; exceptions publiques pour listes publiées et formulaire message; admin pour une allowlist de tables; projection publique. | `/tables/*` | **P0 résiduel** : toutes les tables hors allowlist restent accessibles à tout utilisateur authentifié en lecture/écriture; `test_api_security.py` ne teste qu'une table propriétés anonyme. | Protection anonyme oui; permission complète non aboutie |
| `backend/app/api/v1/site_content/router.py` | Admin sur POST/PATCH/DELETE; GET publics maintenus. | `/site-content/*` | P1; lecture publique testée avec session simulée. L'écriture admin testée avec `FakeSession`, donc le commit observé ne prouve pas un insert PostgreSQL/SQLite réussi. | Oui |
| `backend/app/api/v1/page_layouts/router.py` | Liste admin; GET unitaire public limité aux layouts publiés; écriture/publication admin. | `/page-layouts/*` | P1; test de refus seulement sur liste et POST; les layouts publiés ne sont pas testés sur DB représentative. | Oui, sous réserve du contrat public |
| `backend/app/api/v1/site/router.py` | Listes publiques filtrées/projetées; détail complet et écritures admin; ajout de `POST /vitrine-lot-inquiries` pour préserver le formulaire lot. | `/site/realisations/*`, `/site/vitrine-lots/*` | P1; endpoint nouveau qui crée des traces CRM n'est pas couvert par un test succès E2E ni par limitation de débit. | Filtrage/auth oui; nouvel endpoint à revoir avant déploiement |
| `backend/app/api/v1/media/router.py` | Auth sur gestion média; rôle admin sur audit et purge; assets de marque publics. | `/media/*` | P1; tests média admin passent sauf POST audit qui appelle une méthode absente. Plusieurs mutations restent « tout utilisateur connecté », sans permission/module. | Auth oui; permission fine non |
| `backend/app/api/v1/clients/router.py` | Authentification sur CRUD/recherche clients. | `/clients/*` | P1; authentification seule, aucun rôle/action/module. Représentant anonyme couvert; autorisation gestionnaire/employé non couverte. | Fermeture anonyme oui; autorisation complète non |
| `backend/app/api/v1/leads/router.py` | Admin sur gestion Leads; capture web laissée publique. | `/leads/*` | P1; tests représentatifs, pas de couverture de chaque opération ni anti-abus de capture. | Oui, mais rôle trop large pour la gestion opérationnelle potentielle |
| `backend/app/api/v1/leads/automation_routes.py` | Dépendance admin au routeur. | `/leads/*automation*` | P1; refus gestionnaire testé via route campagne, pas chaque opération automation. | Oui |
| `backend/app/api/v1/leads/campaign_routes.py` | Dépendance admin à toutes les routes campagne. | `/leads/campaigns/*` | P1; refus gestionnaire sur GET list seulement. | Oui |
| `src/pages/public/PublicLots.tsx` | Remplacement d'écritures Client/Opportunity/Task génériques par le nouveau endpoint d'intérêt; capture Lead conservée. | Formulaire public lots | P1; changement du chemin métier sans test navigateur/API succès. | Adaptation requise si les anciennes écritures sont interdites |
| `src/pages/public/PublicHome.tsx` | Retrait de `statut` du payload de contact car la whitelist publique ne l'accepte plus; le serveur applique le défaut `nouveau`. | Formulaire public | P2; build seulement, pas de test d'envoi. | Oui pour garder le formulaire compatible |
| `src/pages/public/PublicContact.tsx` | Même retrait de `statut`. | Formulaire public | P2; build seulement, pas de test d'envoi. | Oui |
| `src/components/public/PublicPageLayoutRenderer.tsx` | Même retrait dans les formulaires de sections contact. | Formulaires Builder publics | P2; build seulement; aucun changement de structure Builder. | Oui pour compatibilité, contrat à tester |
| `backend/tests/test_api_security.py` | Tests d'anonymat et d'un rôle non-admin sur quelques routes. | Tests sécurité | P2; substitution de l'identité dans le test de rôle, couverture partielle des endpoints. | Oui, mais compléter avec auth réelle avant de qualifier le système |
| `backend/tests/test_site_content_crud.py` | Remplacement du scénario CRUD DB existant par tests de garde et succès admin avec `FakeSession`. | Tests CMS | **P1 suspicion** : cela peut masquer le précédent échec de schéma DB SQLite; succès d'effet DB n'est pas démontré. Garder l'échec de contrat visible. | Assertions d'accès oui; remplacer le test d'intégration non |
| `backend/tests/test_media_api.py` | Admin injecté aux parcours média; ajout assertions anonyme et rôle gestionnaire. | Tests Media | P1; le test d'audit reste un échec réel, pas un PASS simulé; les parcours fonctionnels sont DB de test. | Oui, avec séparation claire entre tests d'accès et intégration |
| `SITE-VITRINE-PHASE3-SECURITY-SCHEMA.md` | Rapport initial Phase 3. | Documentation | P3; sa conclusion « aucune trace de 027 » était incomplète : elle n'avait pas examiné les blobs Git orphelins ni le bytecode. Le rapport Phase 3.1 la supersède sur l'historique. | Oui comme archive, à lire avec son erratum Phase 3.1 |

## Points de confiance des validations Phase 3

- Les assertions `401/403` vérifient que certaines dépendances de route s'exécutent, mais les identités non-admin sont injectées; ce n'est pas un test complet JWT → AuthService → permission métier.
- Le « succès autorisé » CMS utilise une session fictive. Il prouve le passage du garde et l'appel à `commit`, pas que le schéma réel accepte l'écriture.
- Le test Media d'audit échoue car `MediaService.create_media_audit_log` n'existe pas. Cet échec n'a pas été converti en succès.
- Le nouveau endpoint d'intérêt vitrine et les formulaires concernés n'ont pas de test succès navigateur/API de bout en bout.
- Aucun test n'établit encore le RBAC par module/action côté API.

## Décision de revue

Les corrections Phase 3 ferment plusieurs chemins anonymes, mais ne rendent pas le RBAC complet. Les travaux sur `/tables`, `clients`, Media et l'écriture CMS doivent rester en revue jusqu'à définition serveur des permissions et tests sur une DB locale de test dont le schéma représente la DB visée. Aucun code n'a été modifié en Phase 3.1.
