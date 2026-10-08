# RBAC EGS — MATRICE DE DÉCISION

**État : document prêt à la validation du responsable métier. Aucune décision métier inconnue n'est présumée.** Les valeurs des matrices sont limitées à `ALLOW`, `DENY`, `CONDITIONAL`, `UNKNOWN`. `CONDITIONAL` signifie que le droit est circonscrit par la précision qui suit le tableau.

## Rôles

Rôles serveur définis dans `backend/app/models/user.py` : `guest`, `employe`, `gestionnaire`, `admin`. La décision de permission courante lit `users.role`; `access_level` est un autre champ mais il ne pilote pas le guard décrit ici. `guest` désigne un compte authentifié de ce rôle. Une requête anonyme sans rôle n'est pas équivalente à un compte `guest`.

## Principes

- Le code actuel est un fait technique, pas une approbation automatique de la permission métier.
- N'accorder aucun droit privé du seul fait qu'une personne possède un JWT ou le titre de gestionnaire.
- Préserver les contrats publics existants seulement pour les ressources publiées et les formulaires contrôlés côté serveur.
- Préférer une API métier dédiée à l'accès générique; confirmer que cette API existe réellement dans le backend et appliquer son propre guard.
- Limiter l'accès sensible au besoin, aux champs requis et aux lignes pertinentes. L'allowlist `/tables` actuelle ne filtre pas la portée des lignes.
- Exiger une décision humaine explicite pour tout `UNKNOWN` avant implémentation.

## Guest

**Faits techniques.** Un compte `guest` n'a aucune permission privée dans `has_permission`. Il peut consulter sans JWT les routes publiques : contenu CMS existant, layouts publiés, liste filtrée/projetée de lots et réalisations, assets de marque, et envoyer les formulaires publics validés. Avec un JWT guest, le GET générique `/tables` est privé et refusé, même pour les deux tables publiquement lisibles anonymement.

**Métier/décision :** les contrats publics existants sont `CONDITIONAL` à leur portée publique documentée; tout droit privé est `UNKNOWN`, à confirmer par le responsable métier.

## Employé

**Technique :** le guard refuse l'accès privé à l'employé. Les tests JWT réels Phase 3.3.1 confirment Media GET/upload refusés et plusieurs refus d'escalade CMS/layout/Media/tables. L'employé sans JWT garde l'accès aux mêmes routes publiques qu'un visiteur; avec un JWT employé, les routes génériques privées sont refusées.

**Métier/décision :** `UNKNOWN` pour les lectures privées, clients, autres tables, créations, modifications, suppressions et publication. Proposition à soumettre : refuser tout accès privé par défaut et n'ajouter que les capacités opérationnelles nommées et bornées par le responsable. Aucun besoin métier d'accès par ligne n'est démontré par le code d'écran.

## Gestionnaire

**Technique :** lecture seule des modules `clients`, `site_vitrine`, `media`, et GET de 34 tables de `MANAGER_READ_TABLES`. Le gestionnaire n'obtient pas les 4 autres GET génériques ni les mutations. Les tests réels confirment entre autres Clients GET, `/tables/tasks` GET, Layout list GET, Media GET; refusent Media upload, Layout publication, suppression générique et `/tables/app_settings`.

**Métier/décision :** `UNKNOWN` table par table et action par action. Proposition à soumettre : confirmer la lecture privée minimale par ressource et portée; refuser création, modification, suppression et publication en l'absence de décision affirmative. Le nom du rôle ne constitue pas une justification.

## Administrateur

**Technique :** le guard central retourne `ALLOW` à `admin` pour les actions protégées; `/tables` donne CRUD aux 38 noms enregistrés. Des tests réels prouvent certaines opérations Admin, notamment CMS et le parcours Media upload/audit.

**Métier/décision :** capacité d'administration `UNKNOWN` par ressource lorsqu'il s'agit de données sensibles ou d'accès générique. Proposition : conserver les tâches administratives nécessaires par API métier et allowlist explicite, auditée; ne pas accorder un accès absolu à toute table ni contourner les schémas/contrôles dédiés. Le responsable doit confirmer quelles tables sensibles sont requises.

## CMS

L'API `GET /api/v1/site-content...` est actuellement publique et ne distingue pas les brouillons du contenu publié. Les routes POST/PATCH/DELETE ont un guard `site_vitrine`, donc Admin autorisé, gestionnaire/employé refusés. Aucun publish action distincte n'existe sur cette route. Tout changement public/privé du contenu CMS est une décision métier à confirmer.

## Media

`GET /api/v1/media/brand-assets` est public. La bibliothèque, détail, versions et usages demandent `media/read_private`; le guard autorise actuellement gestionnaire et admin. Upload, remplacement, mise à jour, suppression, restauration, gestion d'usage, audit et purge sont réservés à Admin par le guard. Les preuves JWT réelles couvrent lecture Media (employé 403, gestionnaire/admin 200), upload (anonyme 401, employé/gestionnaire 403, admin 200), upload persistant, audit et quelques refus d'escalade. Elles ne prouvent pas toute action Media.

## Page Layout

Lecture détail d'un layout publié publique; la liste et les brouillons requièrent `read_draft`, accordé à gestionnaire/admin. POST upsert et PATCH publication sont techniquement Admin-only. Le GET public rend le layout publié, pas la liste.

## Publication

Publication de Layout a une action dédiée, techniquement Admin-only. Publication CMS générique n'existe pas en tant qu'action séparée; les réalisations/lots portent des champs de publication que l'admin peut modifier via CRUD Site. Décision métier de publication pour chaque type de ressource : `UNKNOWN`.

## Vitrine

Les listes publiques `/api/v1/site/realisations` et `/api/v1/site/vitrine-lots` filtrent `publier_vitrine` / `publier_sur_vitrine`; leurs projections diffèrent des détails privés. Détails et mutations privées sont gardés par `site_vitrine`; la lecture est actuellement ouverte au gestionnaire, mutations réservées à l'admin. `/tables` rend aussi une projection filtrée à l'anonyme pour les deux listes; les requêtes authentifiées suivent plutôt l'allowlist et renvoient au gestionnaire des lignes privées également.

## Clients

`/api/v1/clients` est la route dédiée actuelle : GET/list/detail/search autorisés gestionnaire/admin; create/update/delete/activate Admin-only. Les données exposées comprennent contacts et adresse; les champs CNI existent dans le payload de mise à jour. Aucune lecture publique. Nécessité métier de chaque droit et limites des champs : `UNKNOWN`.

## Messages

Les messages de contact sont soumis par le public à `/api/v1/tables/contact_messages` avec cinq champs admis (`nom,email,telephone,sujet,message`), email et message requis et limites de taille. GET de la table est privé et le gestionnaire le lit techniquement; mutations génériques privées sont Admin-only (le POST non-admin reste le seul formulaire public borné). `SiteEditor.tsx` lit et met à jour le statut via `/tables`; aucun endpoint backend dédié de gestion des messages n'a été trouvé dans les routeurs montés examinés. La délégation d'accès aux messages est `UNKNOWN`.

## `/tables`

Le routeur (`/api/v1/tables`) expose 38 noms, GET/POST/PATCH/DELETE (pas de PUT). État technique : anonyme GET seulement `site_realisations` et `vitrine_lots`, avec filtre de publication et projection limitée; POST `contact_messages` est une exception strictement validée. Gestionnaire GET 34 noms; Admin CRUD des 38. Tous les noms sont codés dans `TABLES`; ce registre est une allowlist technique de noms, mais l'autorisation Admin porte actuellement sur les 38, sans allowlist métier séparée.

Le GET public sur `site_realisations`/`vitrine_lots` et le POST public `contact_messages` forment les seules exceptions de rôle retenues dans la proposition. Les appels non publics passent par une permission privée. Proposition : utiliser en priorité les routes métier vérifiées; garder une allowlist générique aussi petite que le besoin supporté. L'allowlist Admin définitive est `UNKNOWN` jusqu'à l'inventaire/approbation de chaque table utilisée. La Phase 3.3.2 proposait temporairement des opérations privées génériques Admin-only en attente, mais ce n'est pas la liste finale approuvée.

### Matrice technique, métier et décision par ressource/action

La colonne Technique décrit l'API métier dédiée et `/tables`, selon la portée spécifiée. Métier = règle prouvée dans les sources approuvées; `UNKNOWN` signifie que le responsable doit décider. Décision = proposition de base; `UNKNOWN` demeure bloquant. Les rôles visés sont les rôles authentifiés, sauf que les droits publics sont signalés comme tels.

| Ressource | Action | Tech guest | Tech employé | Tech gestionnaire | Tech admin | Métier guest | Métier employé | Métier gestionnaire | Métier admin | Décision proposée (guest / employé / gestionnaire / admin) |
|---|---|---|---|---|---|---|---|---|---|---|
| CMS | READ contenu | ALLOW | ALLOW | ALLOW | ALLOW | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL / CONDITIONAL / CONDITIONAL / CONDITIONAL |
| CMS | CREATE | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| CMS | UPDATE | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| CMS | DELETE | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| CMS | PUBLISH | DENY | DENY | DENY | DENY | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / UNKNOWN |
| Media | READ bibliothèque privée (assets marque publics à part) | DENY | DENY | ALLOW | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / UNKNOWN / CONDITIONAL |
| Media | UPLOAD | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| Media | UPDATE / REPLACE / RESTORE / USAGE | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| Media | DELETE / PURGE / AUDIT | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| Layout | READ publié | ALLOW public | ALLOW public | ALLOW | ALLOW | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL / CONDITIONAL / CONDITIONAL / CONDITIONAL |
| Layout | READ brouillon/liste | DENY | DENY | ALLOW | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / UNKNOWN / CONDITIONAL |
| Layout | UPDATE | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| Layout | PUBLISH | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| Vitrine lots | READ publié | ALLOW public | ALLOW public | ALLOW | ALLOW | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL / CONDITIONAL / CONDITIONAL / CONDITIONAL |
| Vitrine lots | WRITE | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| Réalisations | READ publié | ALLOW public | ALLOW public | ALLOW | ALLOW | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL | CONDITIONAL / CONDITIONAL / CONDITIONAL / CONDITIONAL |
| Réalisations | WRITE | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| Messages | READ contact | DENY | DENY | ALLOW | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / UNKNOWN / CONDITIONAL |
| Messages | UPDATE statut | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| Clients | READ privé | DENY | DENY | ALLOW | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / UNKNOWN / CONDITIONAL |
| Clients | WRITE | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |
| `/tables` | READ | DENY | DENY | CONDITIONAL | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / UNKNOWN / CONDITIONAL |
| `/tables` | WRITE | CONDITIONAL | CONDITIONAL | CONDITIONAL | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | CONDITIONAL / CONDITIONAL / CONDITIONAL / CONDITIONAL |
| `/tables` | DELETE | DENY | DENY | DENY | ALLOW | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DENY / DENY / DENY / CONDITIONAL |

Pour les actions publiques, `ALLOW` signifie que le rôle peut consommer le contrat public sans permission privée; `CONDITIONAL` signifie seulement contenu publié/projeté ou payload de formulaire borné. Un compte authentifié `guest` n'est pas l'anonyme : il échoue à l'autorisation de GET `/tables`. Gestionnaire ne lit que les 34 entrées et toutes les lignes de ces tables, sans scope ligne. POST `/tables` est `CONDITIONAL` pour les rôles non-admin uniquement pour `contact_messages` avec le payload public borné; aucune autre mutation non-admin. Une requête anonyme sans rôle peut GET les deux noms publiés/projetés et POST le formulaire, comme précisé hors matrice des rôles.

Les cellules métier sont volontairement `UNKNOWN` quand les documents ne prouvent pas la règle métier. `CONDITIONAL` signale le contrat public existant mais n'affirme pas qu'un décideur métier a formellement validé sa pérennité.

## Allowlist

### État actuel

Les 38 noms inscrits dans `backend/app/api/v1/tables/router.py` sont actuellement accessibles à Admin. Les 34 GET gestionnaire sont : `tasks`, `taches`, `properties`, `lease_contracts`, `rent_payments`, `documents`, `contact_messages`, `page_layouts`, `site_realisations`, `vitrine_lots`, `messages_direction`, `employes_presence`, `visites_en_cours`, `stats_journalieres`, `site_content`, `visiteurs`, `visites_du_jour`, `lead_campaigns`, `lead_interactions`, `foncier_villages`, `parties`, `party_roles`, `party_lead_details`, `leads`, `lead_captures`, `media_files`, `media_versions`, `media_usage`, `visites_terrain`, `ventes_foncieres`, `campagnes_marketing`, `visites`, `opportunites`, `social_posts`. Les quatre refusées au GET gestionnaire : `activites_journal`, `app_settings`, `media_audit_logs`, `user_profiles`.

### Allowlist proposée à la validation

- Public GET : `site_realisations`, `vitrine_lots` uniquement, avec projection/filtre côté route. Préférer `/api/v1/site/realisations` et `/api/v1/site/vitrine-lots` pour ces listes.
- Public POST : `contact_messages` uniquement avec le contrat de champs/tailles actuel; aucun GET public de messages.
- Authenticated non-admin : aucune table privée avant approbation table/action/portée. Un rôle gestionnaire ne devrait pas lire automatiquement les 34 entrées actuelles.
- Admin : pas d'accès absolu implicite. Préserver le registre comme borne technique; valider l'allowlist privée Admin table par table. Quand un endpoint dédié existe, le privilégier et proposer de bloquer l'alias générique après migration des consommateurs. Les tables `app_settings`, `user_profiles`, `media_audit_logs` sont candidates à `INTERDIT` sur l'API générique en faveur des routes dédiées (`/api/v1/settings`, `/api/v1/users...`, `/api/v1/media/audit`), sous réserve de vérifier et migrer les consommateurs. Ne pas présenter ces candidates comme déjà retirées du code.

## /tables — classement détaillé et routes concurrentes

Catégorie = classement proposé pour gouverner l'exposition générique. `PUBLIC` ne signifie que la lecture publique filtrée lorsqu'indiqué. Les permissions `/tables` actuelles sont en colonnes explicites. Un chemin frontend dans `src/data/client.ts` n'est un endpoint backend confirmé que si le routeur correspondant est monté et la route trouvée.

| Table | Catégorie | READ public actuel | READ auth actuel | WRITE / DELETE actuels | Rôles techniques actuels | API métier backend repérée à privilégier | Justification / décision ouverte |
|---|---|---:|---|---|---|---|---|
| `tasks` | METIER | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/tasks` | Route spécialisée présente; valider scope gestionnaire |
| `taches` | METIER | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/tasks` (alias / même table) | Garder un alias seulement si nécessaire; éviter doublon |
| `properties` | METIER | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/immobilier/properties` | Route spécialisée présente |
| `lease_contracts` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/immobilier/contracts` | Contrats locatifs; scope/champs à valider |
| `rent_payments` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/immobilier/payments` | Données financières; limiter scope |
| `documents` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/documents`; route backend correspondante non trouvée dans les routeurs montés examinés | Contenu peut être confidentiel; valider avant allowlist |
| `contact_messages` | SENSIBLE | GET DENY; POST public borné | Admin + gestionnaire | Admin; POST borné ouvert à tout appelant | `admin` CRUD, `gestionnaire` GET, tous POST borné | Aucun endpoint dédié de gestion messages trouvé; formulaire actuel `/api/v1/tables/contact_messages` | Données personnelles; séparer collecte publique et boîte de réception privée |
| `page_layouts` | ADMIN | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/page-layouts` | Route dédiée avec brouillons/publication; préférer au CRUD générique |
| `site_realisations` | PUBLIC | GET publié filtré/projeté | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/site/realisations` (+ id, mutations) | Route dédiée existe; public ne doit voir que projection publiée |
| `vitrine_lots` | PUBLIC | GET publié filtré/projeté | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/site/vitrine-lots` (+ id, mutations, inquiry) | Route dédiée existe; l'API métier est à privilégier |
| `messages_direction` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/messages`; route backend équivalente non trouvée dans les routeurs montés examinés | Messages internes; ne pas déduire la délégation |
| `employes_presence` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/employees/presence`; opération dédiée non trouvée dans routeur employees examiné | Présence/localisation; accès très ciblé à valider |
| `visites_en_cours` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/visites/en-cours`; route backend montée non trouvée | Données client et visite; valider scope |
| `activites_journal` | ADMIN | DENY | Admin seulement | Admin | `admin` | Frontend `/activites`; route backend montée non trouvée | Journal non inclus dans allowlist gestionnaire; Admin générique à confirmer |
| `stats_journalieres` | METIER | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/dashboard/stats` existe, sans contrat confirmé équivalent à la table | Confirmer le besoin et l'équivalence des données |
| `site_content` | ADMIN | GET public via `/api/v1/site-content` (hors tables) | Admin + gestionnaire sur `/tables` | Admin | `admin`, `gestionnaire` read | `/api/v1/site-content` | GET dédié public; mutations dédiées Admin-only; endpoint ne distingue pas draft/published |
| `visiteurs` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/visiteurs`; route backend montée équivalente non trouvée | Identité/contact de visiteurs; valider scope |
| `visites_du_jour` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/visites/jour`; route backend montée équivalente non trouvée | Client/téléphone/visite; scope à valider |
| `lead_campaigns` | METIER | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/leads/campaigns` | Endpoint présent mais ses routes campagne sont admin-only |
| `lead_interactions` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/leads/interactions`; route de CRUD interaction non trouvée dans leads routeur examiné | Historique de prospect/personnel; validation nécessaire |
| `foncier_villages` | METIER | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/foncier/villages` | Route foncier dédiée; ACL/guards objet à vérifier avant remplacement |
| `parties` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/tables/parties` seulement dans adaptateur; API Entity n'est pas démontrée équivalente | CNI et données d'identité; recommandation stricte, scope manquant |
| `party_roles` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/parties/roles`; route backend équivalente non trouvée dans les routeurs montés examinés | Liens personne/contrat; validation nécessaire |
| `party_lead_details` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/parties/lead-details`; route backend équivalente non trouvée | Liens personnes/prospects; validation nécessaire |
| `leads` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/leads` | Routes existent, capture publique séparée; CRUD lead admin-only |
| `lead_captures` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/leads/capture` pour collecte; lecture/CRUD capture équivalent non établi | Consentement/contact; séparer collecte et lecture privée |
| `media_files` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/media` | API dédiée et permissions Media; préférer à `/tables` |
| `media_versions` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/media/{id}/versions` | Route dédiée version repérée; confirmer mêmes opérations |
| `media_usage` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | `/api/v1/media/usage` | Route dédiée; appliquer sa permission Media |
| `media_audit_logs` | INTERDIT | DENY | Admin seulement | Admin | `admin` | `/api/v1/media/audit` | Candidate à interdire via tables et servir par audit dédié; validation admin requise |
| `app_settings` | INTERDIT | DENY | Admin seulement | Admin | `admin` | `/api/v1/settings` | Candidate à interdire via tables; routes Settings séparées existent |
| `user_profiles` | INTERDIT | DENY | Admin seulement | Admin | `admin` | Frontend `/users/profiles`; route backend exacte de profils non vérifiée | PII/auth; candidate au refus générique, vérifier route cible |
| `visites_terrain` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/visites/terrain`; route backend montée équivalente non trouvée | Prospects/notes; scope à valider |
| `ventes_foncieres` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/foncier/ventes`; route dédiée équivalente non confirmée dans inventaire | Donnée transactionnelle; valider avant manager |
| `campagnes_marketing` | METIER | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/campagnes`; route backend montée équivalente non trouvée; `/api/v1/leads/campaigns` couvre `lead_campaigns` | Ne pas assimiler deux tables distinctes |
| `visites` | SENSIBLE | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/visites`; route backend montée équivalente non trouvée | Visiteurs/clients; besoin de périmètre |
| `opportunites` | METIER | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/opportunites`; route backend montée équivalente non trouvée | Fonction UI existante; route réelle à vérifier |
| `social_posts` | ADMIN | DENY | Admin + gestionnaire | Admin | `admin`, `gestionnaire` read | Frontend `/social/posts`; route backend montée équivalente non trouvée | Contenu de publication; droits d'édition/publish à décider |

Les catégories `INTERDIT` ci-dessus sont des **candidates proposées sur l'API générique**, pas une interdiction métier confirmée ni un état actuel. Les autres catégories peuvent aussi devenir interdites dans `/tables` si une route spécialisée est décidée comme seule entrée. Toute candidate doit être validée et les consommateurs migrés avant retrait.

## Tables interdites

L'état du code actuel ne marque aucune table `INTERDIT`: les 38 sont enregistrées, et Admin a accès générique. La proposition classe `media_audit_logs`, `app_settings`, `user_profiles` candidates à refuser sur `/tables` en faveur de routes spécialisées ou à confirmer. Les ressources personnelles `parties`, leads, messages et visites restent `SENSIBLE`, leur refus d'accès manager est une proposition à valider, pas une interdiction métier existante.

## Points encore à valider

1. Matrice Employé : autoriser une lecture privée du Site Vitrine, des clients, Media ou fonctions opérationnelles ? Si oui, quelles ressources, champs et lignes ?
2. Matrice Gestionnaire : confirmer les lectures privées et leur portée, notamment les 34 tables; toute exception d'écriture doit nommer ressource et action.
3. Publication et Media : quels rôles peuvent modifier/publier CMS, layouts, lots/réalisations, uploader/remplacer/supprimer/restaurer Media et lire l'audit ?
4. `/tables` : approuver l'accès public limité proposé, la réduction d'accès non-admin à aucune lecture privée par défaut, et l'allowlist Admin table par table; approuver les candidates `INTERDIT` après revue des consommateurs ?
5. Sensibles : l'Admin et/ou le Gestionnaire peuvent-ils accéder à CNI, profils, audit, contacts, prospects, visites, présence et paiements; avec quel besoin et quelle portée ?
6. Routes doublons : quelles routes métier listées doivent devenir les seules routes prises en charge, et quelle décision prendre pour celles dont le chemin frontend n'a pas de route backend montée confirmée ?
7. Politique publique : confirmer que lecture des contenus publiés et soumission bornée des formulaires contact/enquête lot doivent être maintenues.

Ces points sont **À VALIDER PAR LE RESPONSABLE MÉTIER**; ce document ne tranche pas à sa place.
