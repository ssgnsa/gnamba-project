# POLITIQUE RBAC MÉTIER PROPOSÉE

**Statut : PROPOSITION À VALIDER — aucune règle nouvelle n'est implémentée par ce document.**

Cette proposition distingue l'état du code, les preuves des phases précédentes et les règles métier qui attendent une décision explicite. Une autorisation technique observée ne vaut pas approbation métier.

## 1. Principes

1. Refuser par défaut une action privée qui n'est pas attribuée explicitement à un rôle.
2. Garder les routes publiques limitées aux données publiées et aux formulaires dont les champs sont validés côté serveur.
3. Appliquer l'autorisation au serveur. La visibilité de modules dans l'interface React n'est pas une frontière de sécurité.
4. Exposer chaque ressource par une route métier étroite lorsqu'elle existe; ne pas donner à un rôle accès à une table générique au seul motif qu'un écran la consomme.
5. Valider séparément le rôle, l'action, la ressource et, si nécessaire, la portée des lignes. L'allowlist actuelle ne filtre pas les lignes par client, employé ou village.
6. Ne considérer « admin écrit, gestionnaire lit, employé limité » que comme le mapping technique temporaire décrit en Phase 3.3. La matrice phase 3.3 la décrit comme approuvée pendant cette phase, mais Phase 3.3.1 indique que l'approbation métier finale et l'allowlist complète restent à confirmer. Elle ne confirme donc pas toutes les permissions ci-dessous.

## 2. Employé

### Lectures

**PROPOSITION À VALIDER :** aucune lecture privée du Site Vitrine ni de Media par défaut. Les contenus publiés et les ressources publiques validées restent accessibles selon les routes publiques.

**CONFIRMÉ PAR UN TEST :** le compte employé de test reçoit `403` sur la lecture Media privée et sur les opérations privées d'escalade vérifiées en Phase 3.3.1. Ce test prouve le comportement serveur de ces routes, pas le besoin métier d'un employé.

Les écrans EGS existants lisent des profils, messages, présence, visites et activités. Leurs besoins métier réels et les lignes visibles à chaque employé sont **INCONNUS**; le code d'écran seul ne justifie pas une permission générale.

### Créations

**PROPOSITION À VALIDER :** aucune création CMS, Page Layout ou Media par défaut. Le formulaire public de contact est une capacité publique distincte, pas une permission employé.

### Modifications

**PROPOSITION À VALIDER :** aucune modification privée de contenu, de mise en page ou de métadonnées Media par défaut. Une éventuelle capacité opérationnelle doit être justifiée par ressource et portée.

### Suppressions

**PROPOSITION À VALIDER :** aucune suppression privée par défaut.

### Publication

**PROPOSITION À VALIDER :** aucun droit de publication par défaut.

## 3. Gestionnaire

### Lectures

Le code actuel autorise une lecture authentifiée sur 34 tables génériques, plus les modules `clients`, `site_vitrine` et `media`; la preuve Media réelle confirme notamment GET Media `200`. **CONFIRMÉ PAR LE CODE / CONFIRMÉ PAR UN TEST**, mais **pas validé comme matrice métier complète**.

**PROPOSITION À VALIDER :** autoriser uniquement les ressources et les champs nécessaires à une mission métier confirmée. En attente de revue, les données d'identité, CNI, leads/contact, profils, paramètres, audit, présence et historiques restent non approuvés pour une lecture gestionnaire. Aucun accès général aux lignes ne doit être inféré d'un accès à l'écran.

### Créations

**PROPOSITION À VALIDER :** aucune création privée supplémentaire, notamment CMS, Layout, Media ou `/tables`, tant qu'un responsable métier ne l'a pas demandée explicitement.

### Modifications

**PROPOSITION À VALIDER :** aucune modification privée supplémentaire par défaut.

### Suppressions

**PROPOSITION À VALIDER :** aucune suppression par défaut.

### Publication

**PROPOSITION À VALIDER :** publication CMS/Layout/Vitrine réservée à l'admin en attendant une décision explicite. Le test de publication d'un layout par gestionnaire renvoie `403`; cela établit le comportement actuel, non la décision métier.

## 4. Administrateur

Le rôle technique `admin` est autorisé par le guard central pour toutes les actions exposées sur les routes qui l'utilisent. Un compte admin réel a réussi l'upload Media et la lecture de l'objet et de son audit. **CONFIRMÉ PAR LE CODE** pour les routes gardées; **CONFIRMÉ PAR UN TEST** pour ce parcours Media et pour des parcours CMS documentés en Phase 3.3.

**PROPOSITION À VALIDER :** conserver l'administration des ressources nécessaires au fonctionnement EGS, avec authentification, contrôles métier de payload, audit pour les opérations sensibles et routes dédiées. Cette proposition ne crée pas de nouveaux endpoints ni de capacités au-delà de celles déjà exposées. « Admin toutes actions » ne s'étend pas à une route non gardée sans preuve de son contrat.

## 5. Media

| Action | Employé | Gestionnaire | Admin | État de décision |
|---|---|---|---|---|
| Lecture privée | DENY proposé | ALLOW technique, à confirmer | ALLOW technique | Employé/gestionnaire : proposition; tests JWT réels cohérents; besoin métier à confirmer |
| Upload | DENY proposé | DENY technique | ALLOW technique | Test réel : anonyme 401, employé/gestionnaire 403, admin 200 |
| Remplacement | DENY proposé | DENY technique | ALLOW technique | Guard code; pas de besoin métier distinct documenté |
| Modification / restauration / usage | DENY proposé | DENY technique | ALLOW technique | Guards code, cartographie métier finale inconnue |
| Suppression / purge | DENY proposé | DENY technique | ALLOW technique | Refus d'escalade testé; règle métier à confirmer |
| Lecture / écriture audit | DENY proposé | DENY technique | ALLOW technique | Lecture audit admin réellement vérifiée; guard code pour les autres actions |

Le formulaire de preuve Media a validé le parcours upload, persistance PostgreSQL, journal d'audit serveur et cleanup. Ce résultat ne valide pas toutes les opérations Media ni l'accès général des gestionnaires aux listes complètes.

## 6. CMS

La lecture de contenu public est exposée par `GET /api/v1/site-content...`. La gestion CMS serveur utilise des guards `site_vitrine` pour créer, modifier et supprimer; l'interface d'administration a aussi des opérations directes sur `/tables/site_realisations` et `/tables/vitrine_lots`.

**PROPOSITION À VALIDER :** contenu publié lisible publiquement; lecture privée des brouillons et toute écriture CMS réservées à l'admin par défaut. Maintenir le formulaire public de contact via son contrat restreint. La lecture/écriture privée gestionnaire observée sur les tables Vitrine demeure soumise à validation.

## 7. Page Layout

Le code autorise publiquement la lecture d'un layout publié; la liste complète/brouillons et les mutations passent par des guards. Le test réel confirme refus gestionnaire pour publication. La route de lecture détail filtre `is_published` pour les visiteurs sans permission de lecture brouillon.

**PROPOSITION À VALIDER :** lecture publique des seuls layouts publiés; lecture des brouillons, écriture, suppression et toute action de publication réservées à l'admin par défaut. Tout droit délégué doit être spécifiquement approuvé.

## 8. Publication

**PROPOSITION À VALIDER :** publier/dépublier un contenu, lot, réalisation ou layout est distinct d'éditer son brouillon et reste une action admin par défaut. Pour toute délégation, le décideur doit nommer les rôles, ressources et workflow d'approbation concernés. Le rôle gestionnaire ne reçoit actuellement pas l'action `publish` via le guard central.

## 9. `/tables`

Le routeur expose 38 noms et `GET`, `POST`, `PATCH`, `DELETE`; aucun `PUT` n'est déclaré. Comportement actuel :

- Anonyme : GET de `site_realisations` et `vitrine_lots` uniquement, avec filtre de publication et projection limitée; POST `contact_messages` uniquement avec les champs `nom,email,telephone,sujet,message`, email/message requis et longueurs limitées.
- Employé et autre rôle non-admin : aucune permission privée générale; POST public restreint `contact_messages` reste une exception sans rôle.
- Gestionnaire : GET des 34 tables nommées à la section 10; aucun POST/PATCH/DELETE.
- Admin : les quatre méthodes sur les 38 noms exposés, sous réserve des validations propres à la route.
- Table inconnue : 404. Le contrôle de rôle est global au nom de table et n'ajoute pas de filtre de portée par ligne.

**Usages existants établis par recherche de code :**

- `SiteEditor.tsx` charge et modifie les réalisations/lots et lit/met à jour les messages via `/tables`. C'est un flux d'administration légitime à préserver. Des routes métier existent déjà pour les opérations de réalisation et lot (`/api/v1/site/...`); aucun endpoint dédié de gestion des messages n'a été repéré dans les routes examinées.
- Les composants publics appellent `/tables/vitrine_lots`, `/tables/site_realisations` et POST `/tables/contact_messages`. Les routes métier de lecture publique réalisation/lot existent, ainsi qu'une route d'enquête sur lot; le formulaire contact générique reste sur `/tables`.
- Les adaptateurs `src/data/client.ts` et `src/data/tableClient.ts` redirigent certaines tables vers `/media`, `/site-content`, `/api/v1/page-layouts`, `/leads`, etc., mais plusieurs noms retombent sur `/tables/{nom}`. Les appels `.from()` ne sont donc pas tous des appels `/tables` : il faut suivre la table de routage propre à l'adaptateur et à son import.
- Des usages EGS génériques existent aussi pour tâches, immobiliers, visites, employés, leads, Social et Media. Ils ne constituent pas tous des usages Site Vitrine et ne permettent pas d'accorder automatiquement ces tables aux rôles non-admin.

**PROPOSITION À VALIDER :** établir l'allowlist après attribution métier table par table. En régime conservateur, les appels privés génériques ne sont autorisés qu'à l'admin jusqu'à cette validation; les fonctions publiques documentées restent disponibles seulement sur les ressources/projections publiques et l'écriture publique contact strictement bornée. Remplacer progressivement les usages publics de liste par les routes métier déjà disponibles. Cette position est fondée sur l'inventaire ci-dessus, et non sur l'idée que `/tables` peut être fermé sans impact.

## 10. Tables autorisées

La table décrit l'état technique actuel des GET, puis la proposition conservatrice. `Publique` désigne seulement le GET public filtré/projeté; `manager GET` signifie lecture sans portée par ligne. Toutes les 38 tables acceptent techniquement POST/PATCH/DELETE pour admin. Les noms en gras ne sont pas employés ici; classification et proposition restent à valider.

| Table | Lecture publique | Lecture gestionnaire actuelle | Écriture actuelle | Classification de données / proposition |
|---|---:|---:|---|---|
| `tasks` | Non | Oui | Admin | Métier; manager à confirmer |
| `taches` | Non | Oui | Admin | Métier; manager à confirmer |
| `properties` | Non | Oui | Admin | Métier/financier; manager à confirmer |
| `lease_contracts` | Non | Oui | Admin | Contrats; manager à confirmer |
| `rent_payments` | Non | Oui | Admin | Financier/personnel; manager à confirmer |
| `documents` | Non | Oui | Admin | Peut contenir pièces privées; accès à confirmer |
| `contact_messages` | Non | Oui | Public création bornée; admin CRUD | Données personnelles; lecture manager à confirmer |
| `page_layouts` | Non via tables | Oui | Admin | Contenu/brouillons; manager à confirmer |
| `site_realisations` | Oui, publiées/projetées | Oui | Admin | Public publié; privé à confirmer |
| `vitrine_lots` | Oui, publiés/projetés | Oui | Admin | Public publié; privé à confirmer |
| `messages_direction` | Non | Oui | Admin | Communications/personnes; manager à confirmer |
| `employes_presence` | Non | Oui | Admin | Présence/localisation; accès manager à confirmer |
| `visites_en_cours` | Non | Oui | Admin | Clients/visites; accès manager à confirmer |
| `activites_journal` | Non | Non | Admin | Journal métier; manager refusé actuellement |
| `stats_journalieres` | Non | Oui | Admin | Statistiques internes; manager à confirmer |
| `site_content` | Non via tables | Oui | Admin | CMS privé; manager à confirmer |
| `visiteurs` | Non | Oui | Admin | Identifiants/contact; manager à confirmer |
| `visites_du_jour` | Non | Oui | Admin | Clients/visites; manager à confirmer |
| `lead_campaigns` | Non | Oui | Admin | Campagne/budget; manager à confirmer |
| `lead_interactions` | Non | Oui | Admin | Historique de prospects; manager à confirmer |
| `foncier_villages` | Non | Oui | Admin | Métier foncier; manager à confirmer |
| `parties` | Non | Oui | Admin | **Sensible : CNI, naissance, coordonnées**; ne pas autoriser manager avant validation explicite |
| `party_roles` | Non | Oui | Admin | Liens de personnes; accès à confirmer |
| `party_lead_details` | Non | Oui | Admin | Liens prospects/personnes; accès à confirmer |
| `leads` | Non | Oui | Admin | **Données personnelles/prospects**; accès à confirmer |
| `lead_captures` | Non | Oui | Admin | **Contact/consentement prospect**; accès à confirmer |
| `media_files` | Non | Oui | Admin | Métadonnées média privées; manager GET actuel n'est pas une permission d'upload |
| `media_versions` | Non | Oui | Admin | Historique média; accès à confirmer |
| `media_usage` | Non | Oui | Admin | Références d'usage; accès à confirmer |
| `media_audit_logs` | Non | Non | Admin | Audit; manager refusé actuellement |
| `app_settings` | Non | Non | Admin | Configuration; manager refusé actuellement |
| `user_profiles` | Non | Non | Admin | Préférences/activité de compte; manager refusé actuellement |
| `visites_terrain` | Non | Oui | Admin | Prospects et notes; accès à confirmer |
| `ventes_foncieres` | Non | Oui | Admin | Transactions; accès à confirmer |
| `campagnes_marketing` | Non | Oui | Admin | Budget/campagne; accès à confirmer |
| `visites` | Non | Oui | Admin | Client/contact; accès à confirmer |
| `opportunites` | Non | Oui | Admin | Métier/prospects; accès à confirmer |
| `social_posts` | Non | Oui | Admin | Contenu de publication; gestionnaire à confirmer |

**Table d'exception publique :** `contact_messages` accepte un POST sans rôle mais uniquement par le contrat de formulaire ci-dessus. Cela ne rend pas la lecture publique et ne permet pas à un JWT non-admin d'ajouter les champs internes.

## 11. Tables interdites

Il n'existe pas de catégorie `INTERDITE` codée dans le mapping `TABLES`: les 38 noms sont exposés à l'admin et 34 sont lisibles au gestionnaire. Au titre de la proposition conservatrice, ne pas approuver de lecture gestionnaire pour les quatre tables exclues (`activites_journal`, `app_settings`, `media_audit_logs`, `user_profiles`) ni pour les tables sensibles/possiblement personnelles tant que la revue métier n'est pas signée. Les catégories ci-dessous sont un classement de travail, pas un attribut du modèle de données actuel; les classes se recoupent.

- **PUBLIQUES (lecture filtrée seulement)** : `site_realisations`, `vitrine_lots`. `contact_messages` accepte une création publique bornée mais n'est pas lisible publiquement.
- **MÉTIER (lecture privée actuelle gestionnaire, selon allowlist)** : `tasks`, `taches`, `properties`, `lease_contracts`, `rent_payments`, `documents`, `messages_direction`, `employes_presence`, `visites_en_cours`, `stats_journalieres`, `visiteurs`, `visites_du_jour`, `lead_campaigns`, `lead_interactions`, `foncier_villages`, `visites_terrain`, `ventes_foncieres`, `campagnes_marketing`, `visites`, `opportunites`, `social_posts`.
- **ADMINISTRATIVES / contenu contrôlé** : `site_content`, `page_layouts`, `media_audit_logs`, `app_settings`, `user_profiles`; `activites_journal` est actuellement exclue de la lecture gestionnaire. « Administrative » décrit la prudence de classement proposée, pas un rôle ou un contrôle d'accès uniforme dans le schéma.
- **SENSIBLES ou potentiellement personnelles** : `contact_messages`, `documents`, `employes_presence`, `visites_en_cours`, `visiteurs`, `visites_du_jour`, `parties`, `party_roles`, `party_lead_details`, `leads`, `lead_captures`, `lead_interactions`, `media_files`, `media_versions`, `media_usage`, `visites_terrain`, `ventes_foncieres`, `rent_payments`. La présence d'une table ici appelle une revue de champs et de portée.
- **INTERDITES** : aucune table n'est déclarée interdite par le code actuel. Pour la proposition avant validation, toute lecture/écriture privée non expressément approuvée est à refuser; les exceptions publiques listées plus haut restent bornées.

Pour l'allowlist proposée, les seules capacités sans validation supplémentaire sont les deux lectures publiques filtrées et le POST contact strictement borné. Lecture privée, création, modification et suppression génériques sont proposées admin-only en attendant la validation par table; toute exception gestionnaire ou employé devra être approuvée et nommée. Cette proposition ne remplace pas les routes métier existantes.

## 12. Justification métier

Les routes publiques ont un besoin visible : présenter les biens et réalisations publiés, recueillir un message de contact ou une demande de renseignement sur un lot. L'éditeur `SiteEditor` prouve un besoin fonctionnel d'administration des lots/réalisations et des messages, mais ne prouve pas la délégation de ces tâches à un gestionnaire ou à un employé. Les appels d'écrans EGS démontrent des dépendances applicatives, non une règle métier d'accès de rôle.

## 13. Points nécessitant validation humaine

1. Confirmer par écrit les actions autorisées pour `employe`, `gestionnaire` et `admin`, y compris la distinction `role` / `access_level`.
2. Réviser individuellement les 34 tables lisibles par gestionnaire; confirmer champs et portée de ligne, notamment CNI, contacts, prospects, présence et finances.
3. Décider si un gestionnaire peut lire les brouillons CMS/layout, messages de contact et fichiers Media.
4. Décider qui peut créer, modifier, supprimer, remplacer, restaurer ou publier chaque classe de contenu.
5. Confirmer les usages publics et opérations admin à garder sur `/tables`, et ceux à déplacer vers routes métier dédiées.
6. Définir les journaux et contrôles de portée nécessaires aux décisions retenues.

**Aucune règle métier n'est réputée définitivement approuvée par le présent document. Verdict proposé : `POLITIQUE À VALIDER`.**
