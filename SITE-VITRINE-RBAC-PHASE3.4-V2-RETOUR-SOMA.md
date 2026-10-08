# GNAMBA / EGS

# FICHE DE DÉCISION MÉTIER RBAC — PHASE 3.4

## VERSION 2 — CORRIGÉE ET DURCIE, À SIGNER PAR L'AUTORITÉ MÉTIER

**Statut :** EN ATTENTE DE VALIDATION MÉTIER
**Copie de travail :** réponses SOMA consignées le 2026-09-28; non signée, aucune décision globale validée. La pièce jointe originale est inchangée.
**Autorité métier :** SOMA
**Mode :** VALIDATION MÉTIER UNIQUEMENT
**Code / DB / migration :** AUCUNE MODIFICATION AUTORISÉE
**Page Builder :** NON TRAITÉ
**Objet :** validation de la politique métier RBAC EGS avant implémentation technique

---

## AVERTISSEMENT DE VALIDATION

Cette fiche est la **source de décision métier** de l'implémentation RBAC Phase 3.4.

Tant que la validation finale (section 17) n'est pas signée :

* aucune permission métier, ACL ou rôle ne doit être implémenté ou modifié ;
* aucune migration ne doit être créée ou exécutée ;
* aucune table ni donnée ne doit être modifiée ;
* aucune proposition ne doit être transformée en règle technique ;
* aucun comportement actuellement observable dans l'application ne doit être considéré comme une autorisation métier.

**Toutes les décisions ci-dessous sont des PROPOSITIONS.** Elles ne deviennent des décisions qu'après cochage explicite dans la section 17. Toute décision non explicitement validée reste ouverte.

---

# 1. PRINCIPES DIRECTEURS

1. **Refus par défaut.** Toute capacité non explicitement autorisée est interdite. Un compte sans rôle n'a aucun accès.
2. **Moindre privilège.** Chaque rôle ne dispose que des droits nécessaires à sa fonction.
3. **Contrôle serveur obligatoire.** La sécurité ne dépend jamais du frontend.
4. **Autorisation au niveau de l'objet (anti-IDOR).** Chaque accès à une ligne vérifie que l'utilisateur a le droit d'accéder à *cette* ligne, pas seulement à la ressource en général.
5. **Liste blanche de champs modifiables (anti mass-assignment).** Pour chaque UPDATE, seuls les champs explicitement autorisés sont modifiables. Les champs de propriété, d'affectation, de rôle, de statut de publication et d'identité ne sont jamais modifiables via un payload libre.
6. **Protection des données sensibles.** CNI, identités sensibles, IP, user-agent, secrets et informations techniques sensibles sont masqués par défaut, chiffrés au repos lorsque applicable, et servis via des URL signées à courte durée pour les fichiers.
7. **Audit immuable.** Les journaux d'audit sont produits par le système et ne peuvent être modifiés ou supprimés par un utilisateur, y compris un Administrateur (compte applicatif en INSERT seul, copie hors serveur ; voir section 13).
8. **Pas de suppression physique des données métier.** Archivage ou désactivation avec motif. Les paiements se corrigent par écriture inverse/avoir. Les obligations légales de suppression ou d'anonymisation relèvent d'une procédure distincte validée par l'Admin.
9. **Séparation écriture / publication.** Le droit de créer ou modifier ne donne pas le droit de publier. Modifier un contenu déjà publié le repasse en brouillon et nécessite une nouvelle publication.
10. **Pas d'auto-élévation.** Aucun utilisateur ne peut modifier son propre rôle ou ses propres permissions.
11. **Authentification renforcée pour les actions sensibles (step-up).** Réauthentification requise pour : consultation de CNI, changement de rôle, modification de configuration/secrets, création d'un compte Admin.
12. **Effet immédiat.** Un changement de rôle, d'affectation ou de désactivation de compte prend effet immédiatement (sessions et jetons révoqués).
13. **Extinction progressive de `/tables`.** L'API générique est remplacée par des routes métier contrôlées.
14. **Formulaires publics durcis.** Validation stricte, limitation de débit, anti-abus, écriture seule.
15. **Limitation de l'extraction massive.** Pagination obligatoire, taille de page maximale, limitation de débit sur les routes authentifiées.
16. **EXPORT interdit par défaut.** Aucune décision d'export n'est prise dans cette fiche : **EXPORT = NON pour tous les rôles**. Tout besoin d'export fera l'objet d'une décision distincte (périmètre, champs, volume, journalisation).
17. **Journalisation des refus et alertes.** Les refus d'accès répétés, changements de rôle, consultations de CNI, exports éventuels et usages du compte de secours génèrent des alertes.
18. **Protection des données personnelles.** Respect de la loi ivoirienne n° 2013-450 ; vérifier les obligations de déclaration/autorisation auprès de l'ARTCI. Minimisation : ne collecter et exposer que le nécessaire.

---

# 2. LÉGENDE

| Valeur        | Signification                                                   |
| ------------- | --------------------------------------------------------------- |
| **OUI**       | Autorisé                                                        |
| **NON**       | Interdit                                                        |
| **EXCEPTION** | Autorisé uniquement dans les conditions explicitement indiquées |
| **UNKNOWN**   | Décision non validée ; ne doit pas être implémentée (refus)     |

Actions : **READ · CREATE · UPDATE · DELETE · PUBLISH · UNPUBLISH · EXPORT · SCOPE**

> `DELETE` désigne par défaut un archivage / soft-delete. Une suppression physique doit être autorisée par une règle distincte. `EXPORT` : voir principe 16.
>
> **« Clients »** désigne les parties portant le rôle client (`parties` / `party_roles`) ; correspondance à vérifier (section 13).

---

# 3. DÉCISION 001 — ACCÈS PUBLIC

**Décision proposée : EXCEPTION**

## Lecture publique

Autorisée uniquement pour les données explicitement publiées : contenus CMS, pages, layouts publiés, `vitrine_lots`, `site_realisations`, médias explicitement publics.

**Conditions :**

* statut = publié uniquement ;
* exposition par **vues ou routes publiques dédiées avec liste blanche de champs** (jamais `SELECT *`, jamais l'objet interne brut) ;
* rôle base de données dédié à l'API publique, en **lecture seule sur ces vues uniquement** ;
* aucun listing de répertoire de médias ; les médias publics ne sont servis que s'ils sont marqués publics.

**Champs exposés :** titre, description publique, images publiques, superficie, localisation générale (village), prix public si publié, slug, dates de publication.

**Interdits :** brouillons, contenus archivés, identifiants internes inutiles, propriétaires et parties, références cadastrales internes, statuts de négociation, notes internes, auteurs internes, chemins serveur, hash internes, IP, métadonnées techniques privées.

## Formulaires publics

**CREATE : EXCEPTION** — création d'une demande ou d'un lead uniquement. Aucun READ, UPDATE, DELETE ni relecture d'un enregistrement existant.

**Conditions :**

* validation stricte côté serveur (types, longueurs, formats) et échappement des entrées ;
* limitation de débit par IP **et** protection anti-bot (CAPTCHA ou équivalent, au minimum deux mesures combinées avec un piège anti-bot type honeypot) ;
* taille maximale des champs ; **aucun envoi de fichier** via les formulaires publics ;
* information et consentement explicite pour les données personnelles ;
* réponse générique, sans identifiants internes et sans indication permettant de deviner l'existence d'un enregistrement ;
* durée de conservation à définir (voir points ouverts, section 16).

**Décision proposée :** EXCEPTION

---

# 4. DÉCISION 002 — EMPLOYÉ / LECTURE PRIVÉE

**READ privé : EXCEPTION.** L'employé n'a aucun accès général aux données privées de l'ERP.

| Ressource              | READ      | Périmètre                       | Restrictions |
| ---------------------- | --------- | ------------------------------- | ------------ |
| Clients                | EXCEPTION | Affectés / créés par lui        | Champs : nom, téléphone, email, statut, historique d'interactions. CNI et pièces masquées |
| CMS                    | NON       | —                               | Pas de gestion du site |
| Media                  | EXCEPTION | Médias liés à ses tâches        | Lecture du fichier lié uniquement ; aucun listing de la bibliothèque |
| Immobilier             | EXCEPTION | Affectés                        | Sans données financières ni identité du propriétaire |
| Foncier                | EXCEPTION | Affectés / périmètre autorisé   | Lecture seule ; sans identités ni CNI |
| Leads                  | EXCEPTION | Affectés / créés par lui        | — |
| Projets                | EXCEPTION | Affectés / son équipe           | — |
| Tâches                 | EXCEPTION | Ses tâches / tâches affectées   | — |
| Présence               | EXCEPTION | Sa propre présence uniquement   | — |
| Messages de contact    | NON       | —                               | — |
| Messages direction     | NON       | —                               | — |
| User profiles          | EXCEPTION | Son propre profil uniquement    | Via route profil ; aucun champ de rôle modifiable |
| App settings           | NON       | —                               | — |
| Audits                 | NON       | —                               | — |
| Finance / contrats / paiements | NON | —                             | — |
| Agrégats (`/tables`)   | NON       | —                               | — |

## Scope

* Créés par l'employé : **OUI**
* Affectés à l'employé : **OUI**
* Affectés à son équipe : **OUI, limité à Projets et Tâches uniquement**
* Propriétaire : **NON**
* Organisation : **NON**
* Toutes les lignes : **NON**

**Règles :**

* la **perte d'affectation** (ou le départ de l'employé) supprime l'accès immédiatement ;
* si le périmètre n'est pas identifiable de façon fiable, **l'accès reste refusé** ; aucune permission n'est simulée à partir d'un champ qui ne garantit pas le périmètre métier.

**Décision proposée :** EXCEPTION

---

# 5. DÉCISION 003 — EMPLOYÉ / ÉCRITURE ET PUBLICATION

L'employé : ne publie jamais, ne supprime jamais, n'écrit jamais via `/tables`, ne gère ni CMS, ni layouts, ni vitrine, ni médias.

| Ressource                      | CREATE    | UPDATE    | DELETE | PUBLISH |
| ------------------------------ | --------: | --------: | -----: | ------: |
| CMS                            | NON       | NON       | NON    | NON |
| Page Layout                    | NON       | NON       | NON    | NON |
| Vitrine                        | NON       | NON       | NON    | NON |
| Media                          | NON       | NON       | NON    | NON |
| Clients                        | NON       | EXCEPTION | NON    | NON |
| Leads                          | EXCEPTION | EXCEPTION | NON    | NON |
| Interactions de leads          | EXCEPTION | EXCEPTION | NON    | NON |
| Tâches                         | NON       | EXCEPTION | NON    | NON |
| Visites terrain (comptes rendus) | EXCEPTION | EXCEPTION | NON  | NON |
| Présence                       | NON       | NON       | NON    | NON |
| `/tables`                      | NON       | NON       | NON    | NON |

*(La présence est produite par le mécanisme de pointage, pas par écriture libre.)*

**Conditions :**

* **Clients UPDATE** : clients affectés ; champs autorisés = coordonnées et notes de suivi ; aucune modification de CNI, d'identité, de propriétaire ou d'affectation ; journalisation.
* **Leads / interactions CREATE-UPDATE** : leads capturés sur le terrain, créés par lui ou affectés ; aucune modification de l'affectation ni du propriétaire ; aucune suppression ; doublons signalés au gestionnaire.
* **Tâches UPDATE** : tâches affectées ; champs autorisés = statut opérationnel, commentaires ; pas de réaffectation.
* **Visites terrain** : comptes rendus des visites dont il est responsable.
* Toute écriture applique la **liste blanche de champs** (principe 5).

**Décision proposée :** EXCEPTION

---

# 6. DÉCISION 004 — GESTIONNAIRE / LECTURE PRIVÉE

**READ privé : EXCEPTION.** Lecture métier plus large que l'employé, avec périmètre, masquage des données sensibles et exclusion des ressources réservées à l'Admin.

| Ressource                      | READ      | Scope                 | Restrictions |
| ------------------------------ | --------- | --------------------- | ------------ |
| Clients                        | OUI       | Organisation          | CNI masquée |
| Site Vitrine                   | OUI       | Organisation          | Brouillons autorisés |
| Media                          | OUI       | Organisation          | Confidentiel exclu (voir décision 008) |
| Layouts                        | OUI       | Organisation          | — |
| Immobilier                     | OUI       | Organisation          | Données bancaires éventuelles exclues |
| Contrats de bail               | EXCEPTION | Organisation          | Champs : référence, bien, statut, dates, nom des parties, montants et pièces jointes : **OUI** pour lecture Gestionnaire, scope Organisation, via route métier dédiée |
| Foncier                        | OUI       | Périmètre foncier     | Identités sensibles exclues |
| Leads                          | OUI       | Organisation          | IP/user-agent masqués |
| Messages de contact            | OUI       | Organisation          | Données personnelles : pas d'export |
| Documents                      | EXCEPTION | Organisation          | Documents classés non confidentiels uniquement |
| Finance                        | EXCEPTION | Organisation          | Agrégats/synthèses et détail des paiements : **OUI** pour lecture Gestionnaire, scope Organisation, via route métier dédiée |
| Projets                        | OUI       | Organisation          | — |
| Tâches / visites / campagnes / opportunités | OUI | Équipe / organisation | — |
| Présence                       | EXCEPTION | Équipe                | — |
| Messages direction             | NON       | —                     | Admin |
| User profiles                  | EXCEPTION | Son propre profil     | Via route profil |
| App settings                   | NON       | —                     | Admin |
| Visiteurs                      | NON       | —                     | Admin |
| Audits sensibles               | NON       | —                     | Admin |

**Décision proposée :** EXCEPTION

---

# 7. DÉCISION 005 — GESTIONNAIRE / `/tables`

`/tables` est une interface technique **transitoire**. Elle ne devient jamais l'interface métier principale.

**Règle :** lecture seule, aucune écriture, allowlist explicite, refus par défaut, retrait progressif au profit de routes métier.

## Matrice table par table

*« Retrait » = la table quitte `/tables` dès que sa route métier existe. Tant que la route n'existe pas, l'accès du gestionnaire est **refusé** sauf pour les deux tables de l'allowlist ; le besoin métier passe par la création de la route, jamais par un élargissement de `/tables`.*

| Table | READ gestionnaire | Scope / restrictions | `/tables` |
| ----- | ----------------- | -------------------- | --------- |
| `tasks` | OUI | Équipe / organisation | Retrait |
| `taches` | OUI | Idem `tasks` (règle la plus restrictive tant que non clarifié) | Retrait |
| `properties` | OUI | Organisation | Retrait |
| `lease_contracts` | EXCEPTION | Détail D004 via route métier dédiée | Interdit |
| `rent_payments` | EXCEPTION | Détail D004 via route métier dédiée | Interdit |
| `documents` | EXCEPTION | Non confidentiels (classification requise) | Retrait |
| `contact_messages` | OUI | Organisation ; données personnelles | Retrait |
| `page_layouts` | OUI | Organisation | Retrait |
| `site_realisations` | OUI | Organisation | Retrait |
| `vitrine_lots` | OUI | Organisation | Retrait |
| `messages_direction` | NON | — | Interdit |
| `employes_presence` | EXCEPTION | Équipe | Retrait |
| `visites_en_cours` | OUI | Équipe | Retrait |
| `activites_journal` | NON | — | Interdit |
| `stats_journalieres` | OUI | Agrégats sans donnée personnelle | **Allowlist** |
| `site_content` | OUI | Organisation | Retrait |
| `visiteurs` | NON | — | Interdit |
| `visites_du_jour` | OUI | Agrégats sans donnée personnelle | **Allowlist** (sous réserve de vérification) |
| `lead_campaigns` | OUI | Organisation | Retrait |
| `lead_interactions` | OUI | Organisation | Retrait |
| `foncier_villages` | OUI | Périmètre foncier | Retrait |
| `parties` | EXCEPTION | Champs non sensibles ; CNI masquée | Interdit |
| `party_roles` | EXCEPTION | Rôle uniquement | Interdit |
| `party_lead_details` | EXCEPTION | Affectés / organisation ; sans données sensibles | Interdit |
| `leads` | OUI | Organisation | Retrait |
| `lead_captures` | EXCEPTION | Champs techniques (IP, user-agent) masqués | Interdit |
| `media_files` | OUI | Organisation ; non confidentiels | Retrait |
| `media_versions` | OUI | Organisation | Retrait |
| `media_usage` | OUI | Organisation | Retrait |
| `media_audit_logs` | EXCEPTION | Route d'audit dédiée (décision 008) | Interdit |
| `app_settings` | NON | — | Interdit |
| `user_profiles` | NON | Son profil propre via route profil | Interdit |
| `visites_terrain` | OUI | Affectées / équipe | Retrait |
| `ventes_foncieres` | NON | Admin uniquement, via route métier dédiée | Interdit |
| `campagnes_marketing` | OUI | Organisation | Retrait |
| `visites` | OUI | Équipe | Retrait |
| `opportunites` | OUI | Organisation | Retrait |
| `social_posts` | OUI | Organisation | Retrait |

> La fiche source annonçait **34 tables** ; le tableau en liste **38**. La liste réelle exposée doit être vérifiée (section 13). En cas d'écart, toute table non listée ici est **refusée**.

## Routes métier privilégiées

* `tasks` / `taches` → `/api/v1/tasks`
* `properties` → `/api/v1/immobilier/properties`
* `lease_contracts` → `/api/v1/immobilier/contracts`
* `rent_payments` → `/api/v1/immobilier/payments`
* `page_layouts` → `/api/v1/page-layouts`
* `leads` → `/api/v1/leads`
* `lead_campaigns` → `/api/v1/leads/campaigns`
* `foncier_villages` → `/api/v1/foncier/villages`
* `media_files` → `/api/v1/media`
* `media_usage` → `/api/v1/media/usage`
* `media_audit_logs` → route d'audit dédiée
* `app_settings` → `/api/v1/settings` (Admin)
* `user_profiles` → route profil

Les routes encore inexistantes doivent être créées **avant** le retrait correspondant de `/tables`.

## Point particulier `tasks` / `taches`

Ces deux noms peuvent désigner un doublon ou deux objets distincts : **vérification technique requise**. Tant qu'elle n'est pas faite, la règle la plus restrictive s'applique aux deux. Aucune suppression ni migration dans cette phase sans décision technique distincte.

**Décision proposée :** EXCEPTION

---

# 8. DÉCISION 006 — GESTIONNAIRE / ÉCRITURE

Écriture opérationnelle, sans suppression physique et sans écriture générique via `/tables`.

| Ressource                  | CREATE    | UPDATE    | DELETE    |
| -------------------------- | --------: | --------: | --------: |
| Clients                    | OUI       | OUI       | NON |
| CMS                        | OUI       | OUI       | EXCEPTION |
| Page Layout                | EXCEPTION | EXCEPTION | NON |
| Vitrine                    | OUI       | OUI       | EXCEPTION |
| Media                      | OUI       | OUI       | EXCEPTION |
| Immobilier                 | OUI       | OUI       | NON |
| Foncier                    | EXCEPTION | EXCEPTION | NON |
| Leads / interactions       | OUI       | OUI       | NON |
| Tâches                     | OUI       | OUI       | EXCEPTION |
| Visites / visites terrain  | OUI       | OUI       | EXCEPTION |
| Campagnes / opportunités / social posts | OUI | OUI  | EXCEPTION |
| Documents                  | EXCEPTION | EXCEPTION | NON |
| `/tables`                  | NON       | NON       | NON |

**Conditions :**

* **Clients UPDATE** : coordonnées et données commerciales ; **aucune modification des champs d'identité ni de CNI** (réservée à l'Admin) ; liste blanche de champs.
* **CMS / Vitrine DELETE** : archivage sur contenu **non publié**, soft-delete, motif enregistré.
* **Page Layout CREATE / UPDATE** : brouillon uniquement ; aucun droit de publication ; Page Builder non traité dans cette phase.
* **Media CREATE (upload)** : liste blanche de types, taille maximale, vérification du type réel du fichier, nom généré côté serveur, aucun fichier exécutable, SVG et documents actifs filtrés ou refusés, suppression des métadonnées sensibles des images (EXIF/GPS) avant exposition publique, analyse antivirus si disponible ; classification confidentialité obligatoire.
* **Media DELETE** : uniquement les fichiers qu'il a téléversés, sans usage actif (`media_usage` = 0), soft-delete, motif obligatoire.
* **Foncier CREATE / UPDATE** : périmètre foncier autorisé ; historique conservé (versionnement) ; aucune modification d'identité ou de CNI ; journalisation obligatoire ; changements de statut de vente réservés à l'Admin.
* **Tâches / visites / campagnes / opportunités / social posts DELETE** : uniquement les éléments créés par lui ; soft-delete.
* **Documents CREATE / UPDATE** : documents non confidentiels uniquement ; classification obligatoire.
* **Immobilier UPDATE** : modification d'un bien publié = retour en brouillon de sa fiche publique (principe 9).

**Interdits explicites (Admin uniquement) :** contrats de bail (écriture), paiements, `ventes_foncieres`, `user_profiles` (hors profil propre), `app_settings`, journaux d'audit.

**Décision proposée :** EXCEPTION

---

# 9. DÉCISION 007 — GESTIONNAIRE / PUBLICATION

| Ressource   | PUBLISH   | UNPUBLISH | Condition |
| ----------- | --------: | --------: | --------- |
| CMS         | EXCEPTION | OUI       | Contenu au statut « prêt à publier » ; relecture des champs publics ; audit |
| Page Layout | NON       | EXCEPTION | Publication réservée à l'Admin. Dépublication limitée au retour à la **version publiée précédente** en cas d'incident |
| Vitrine     | EXCEPTION | OUI       | Lot complet (photos, description, prix validé) ; aucune donnée interne exposée ; audit |

**Règles :**

* toute publication / dépublication produit un événement d'audit : utilisateur, action, ressource, version, date/heure ;
* la dépublication doit pouvoir être exécutée rapidement en cas d'incident ;
* une liste de contrôle avant publication (champs obligatoires, absence de donnée interne, médias publics) est appliquée côté serveur ;
* modifier un contenu publié le repasse en brouillon ; la version publiée reste en ligne jusqu'à nouvelle publication.

**Décision proposée :** EXCEPTION

---

# 10. DÉCISION 008 — GESTIONNAIRE / MEDIA ET AUDIT

## Bibliothèque Media

**READ : EXCEPTION**

* **Autorisé :** images, vidéos, documents commerciaux non confidentiels, brochures, plans publics.
* **Scope :** organisation.
* **Métadonnées visibles :** nom, type, taille, texte alternatif, versions, usages.
* **Exclus :** CNI, contrats, pièces foncières confidentielles, chemins serveur, hash internes, IP, données techniques de l'uploader.
* **Condition :** chaque média porte une classification (`public` / `interne` / `confidentiel`) ; sans classification, le média est traité comme confidentiel (refus).

## Audit Media

**READ : EXCEPTION** — via route d'audit dédiée uniquement (jamais via `/tables`).

* **Événements :** upload, modification, suppression, remplacement de version.
* **Périmètre :** organisation, lecture seule.
* **Champs visibles :** date, action, fichier concerné, utilisateur.
* **Champs masqués :** IP, user-agent, payloads, identifiants techniques.

Les audits d'authentification, de configuration et de données sensibles restent réservés à l'Admin.

**Décision proposée :** EXCEPTION

---

# 11. DÉCISION 009 — ADMIN / DONNÉES SENSIBLES

L'Admin dispose des droits les plus larges, mais son accès **n'est pas illimité** : données sensibles protégées, masquées par défaut, journalisées, soumises aux règles d'intégrité et de conservation.

| Ressource                         | READ      | CREATE    | UPDATE    | DELETE    |
| --------------------------------- | --------: | --------: | --------: | --------: |
| Identités / `parties`             | OUI       | OUI       | OUI       | EXCEPTION |
| CNI / données sensibles           | EXCEPTION | OUI       | EXCEPTION | NON |
| Profils utilisateurs              | OUI       | OUI       | EXCEPTION | EXCEPTION |
| Audits                            | OUI       | NON       | NON       | NON |
| Messages direction                | OUI       | OUI       | EXCEPTION | EXCEPTION |
| Messages de contact               | OUI       | NON       | NON       | EXCEPTION |
| Prospects / Leads                 | OUI       | OUI       | OUI       | EXCEPTION |
| Visites                           | OUI       | OUI       | OUI       | EXCEPTION |
| Présence                          | OUI       | NON       | EXCEPTION | NON |
| Paiements                         | OUI       | OUI       | EXCEPTION | NON |
| Contrats                          | OUI       | OUI       | EXCEPTION | NON |
| Foncier / ventes foncières        | OUI       | OUI       | OUI       | EXCEPTION |
| Immobilier                        | OUI       | OUI       | OUI       | EXCEPTION |
| CMS / Vitrine / Page Layout / Media | OUI     | OUI       | OUI       | EXCEPTION |
| Documents                         | OUI       | OUI       | OUI       | EXCEPTION |
| Configuration                     | EXCEPTION | EXCEPTION | EXCEPTION | NON |

## Publication (Admin)

| Ressource               | PUBLISH | UNPUBLISH |
| ----------------------- | ------: | --------: |
| CMS                     | OUI     | OUI |
| Page Layout             | OUI     | OUI |
| Vitrine                 | OUI     | OUI |

Chaque publication est auditée (utilisateur, action, ressource, version, date/heure).

## Conditions

* **Identités / parties DELETE** : archivage avec motif ; interdit si des dépendances métier (contrat, paiement, vente) existent.
* **CNI** : chiffrées au repos ; **READ masquée par défaut**, affichage explicite avec justification, réauthentification (step-up) et journalisation ; fichiers servis via URL signée à courte durée. UPDATE = correction motivée avec conservation de la version précédente. DELETE interdit (anonymisation uniquement via procédure légale distincte).
* **Profils** : changements de rôle journalisés et alertés ; un utilisateur ne modifie jamais son propre rôle ; création d'un compte Admin avec step-up ; désactivation préférée à la suppression ; rôle par défaut à la création = aucun accès jusqu'à attribution explicite.
* **Audits** : écrits par le système ; aucun UPDATE ni DELETE ; la consultation des audits sensibles est elle-même journalisée.
* **Messages direction** : archivage avec motif ; contenu d'un message envoyé non réécrit sans règle spécifique.
* **Messages de contact** : créés uniquement par le formulaire public ; jamais créés ni modifiés manuellement ; archivage avec motif.
* **Présence** : provient du pointage ; corrections motivées et journalisées ; pas de création arbitraire.
* **Paiements** : correction par écriture inverse / avoir ; pas d'écrasement ni de suppression.
* **Contrats** : modification par avenant / versionnement ; pas de suppression physique.
* **Foncier / ventes / Immobilier / CMS / Documents DELETE** : archivage avec motif.
* **Configuration** : secrets (clés, mots de passe, jetons) jamais affichés en clair, jamais renvoyés par l'API ; modification sensible avec step-up et journalisation ; rotation possible.

## Sécurité du rôle Admin

* MFA obligatoire (application TOTP ou clé WebAuthn ; éviter le SMS) ;
* compte de secours (« break-glass ») conservé hors ligne, codes de récupération stockés hors serveur ;
* utilisation du compte de secours exceptionnelle et alertée ;
* aucun accès générique ne contourne les règles métier ;
* sessions Admin à durée limitée, révocables.

**Décision proposée :** EXCEPTION

---

# 12. DÉCISION 010 — ALLOWLIST `/tables`

`/tables` est une capacité technique transitoire destinée à disparaître au profit de routes métier contrôlées.

## Allowlist transitoire

| Table                | Rôles autorisés            | Mode        |
| -------------------- | -------------------------- | ----------- |
| `stats_journalieres` | Gestionnaire, Admin        | Lecture seule |
| `visites_du_jour`    | Gestionnaire, Admin        | Lecture seule |

* **Employé : NON. Public : NON.**
* Autorisation conditionnée à la **vérification que ces ressources ne contiennent aucune donnée personnelle** ; à défaut, elles sont retirées de l'allowlist.

## Interdiction générale

Aucune écriture via `/tables` pour aucun rôle. Toute ressource absente de l'allowlist est refusée.

## Ressources sensibles nommément interdites aux rôles non-Admin (liste non limitative)

`messages_direction`, `activites_journal`, `visiteurs`, `app_settings`, `user_profiles`, `media_audit_logs`, `ventes_foncieres`, `parties`, `party_roles`, `party_lead_details`, `lead_captures`, `lease_contracts`, `rent_payments`, `documents`, `contact_messages`, `employes_presence`.

L'Admin utilise des routes d'administration ou métier dédiées pour ces ressources ; `/tables` n'est jamais un moyen de contourner les contrôles métier.

## Règle générale `/tables`

* `[x]` supprimé progressivement au profit des routes métier
* `[ ]` reste une API générique contrôlée par allowlist
* `[ ]` réservé à l'Admin

## Cas `ventes_foncieres`

Réponse SOMA du 2026-09-28 : Gestionnaire **NON**; ressource réservée à l'Admin via route métier dédiée, jamais par `/tables`. Cette modification reste à formaliser/signature dans la section 17 avant implémentation.

**Décision proposée :** EXCEPTION

---

# 13. POINTS TECHNIQUES À VÉRIFIER (LECTURE SEULE, SANS DÉCISION IMPLICITE)

1. disponibilité réelle des colonnes de scope (`assigned_to`, `created_by`, `team_id`, `organization_id`, village/périmètre foncier) ;
2. correspondance utilisateur ↔ équipe ↔ organisation ;
3. mécanisme d'identification des lignes affectées ;
4. **nombre réel de tables exposées par `/tables` (34 annoncées, 38 listées)** ;
5. relation `tasks` / `taches` (doublon ou objets distincts) ;
6. nature de `visites_du_jour` (vue ou table) et absence de donnée personnelle dans les deux tables de l'allowlist ;
7. correspondance « Clients » ↔ `parties` / `party_roles` ;
8. champs sensibles réellement présents (CNI, IP, user-agent, secrets) ;
9. présence d'une **classification de confidentialité** sur `media_files` et `documents` (sinon : traités comme confidentiels) ;
10. existence et portée effective de RLS PostgreSQL (défense en profondeur en plus de l'API) ;
11. routes métier disponibles et routes à créer ;
12. **audit immuable** : compte applicatif en INSERT seul sur les tables d'audit, copie des journaux hors serveur. Un accès root sur un serveur auto-hébergé reste techniquement capable de contourner : la copie externe et les alertes sont la compensation ;
13. mécanisme de masquage champ par champ et de liste blanche des champs modifiables ;
14. mécanisme de révocation immédiate des sessions/jetons lors d'un changement de rôle ou d'affectation ;
15. rôles base de données distincts (API publique, API applicative, administration) avec privilèges minimaux.

Une impossibilité technique à appliquer une règle métier ne doit **jamais** conduire à élargir automatiquement les permissions. Lorsque le scope nécessaire ne peut pas être garanti :

> **REFUS PAR DÉFAUT.**

---

# 14. RÈGLE D'IMPLÉMENTATION APRÈS SIGNATURE

1. **Sauvegarde complète de la base et restauration testée** avant toute modification ;
2. travailler sur un **environnement de test/staging** avant la production ;
3. écrire les tests RBAC **avant** les modifications fonctionnelles ;
4. tester la matrice rôle × ressource × action, **y compris les tests négatifs** (chaque refus attendu est testé) et les tests d'accès à l'objet d'un autre utilisateur (IDOR) ;
5. mettre `/tables` en refus par défaut avec allowlist ;
6. appliquer les scopes côté serveur (et RLS lorsque disponible) ;
7. appliquer le masquage des champs sensibles et la liste blanche des champs modifiables ;
8. rendre les audits immuables (INSERT seul + copie externe) ;
9. créer les routes métier manquantes, puis retirer progressivement les ressources de `/tables` ;
10. durcir les formulaires publics et les uploads ;
11. mettre en place pagination, limitation de débit et alertes ;
12. mettre en place le MFA Admin, le step-up et le compte de secours ;
13. déploiement par étapes avec **plan de retour arrière** ;
14. tests réels avec chaque rôle EGS (employé, gestionnaire, admin, public) ;
15. vérifier les régressions sur les modules existants ;
16. ne déclarer GO qu'après preuve fonctionnelle et de sécurité.

---

# 15. RÈGLE ABSOLUE POUR CLAUDE CODE

Avant validation : **AUCUNE IMPLÉMENTATION.**

Après validation, ce document est la **source métier de référence du RBAC Phase 3.4**. Claude Code doit :

* ne pas inventer de permission ;
* ne pas élargir une permission pour résoudre une difficulté technique ;
* ne pas transformer une capacité actuelle en droit métier ;
* ne pas supprimer une restriction sans nouvelle décision métier ;
* ne pas utiliser `/tables` pour contourner une route métier ;
* ne pas modifier le schéma uniquement pour rendre une permission possible sans validation technique séparée ;
* conserver les décisions `UNKNOWN` comme refus par défaut ;
* traiter `EXPORT` comme interdit pour tous les rôles.

Une décision n'est **VALIDÉE** que si : la réponse est explicite, le rôle, la ressource et l'action sont identifiés, le scope est précisé lorsqu'il existe, les exceptions sont écrites, et aucune permission n'est déduite du comportement technique actuel.

---

# 16. SYNTHÈSE POUR SIGNATURE

| Décision | Sujet                          | Proposition | Points clés |
| -------- | ------------------------------ | ----------- | ----------- |
| 001      | Accès public                   | EXCEPTION   | Publié uniquement, vues à liste blanche ; formulaires en écriture seule |
| 002      | Employé — lecture privée       | EXCEPTION   | Lignes affectées/créées ; équipe limitée à Projets/Tâches |
| 003      | Employé — écriture/publication | EXCEPTION   | Jamais DELETE ni PUBLISH ; champs en liste blanche |
| 004      | Gestionnaire — lecture privée  | EXCEPTION   | Organisation ; CNI masquée ; finance en agrégats |
| 005      | Gestionnaire — `/tables`       | EXCEPTION   | Matrice table par table ; lecture seule |
| 006      | Gestionnaire — écriture        | EXCEPTION   | Pas de suppression physique ; identités réservées à l'Admin |
| 007      | Gestionnaire — publication     | EXCEPTION   | Layout : Admin seul ; dépublication toujours possible |
| 008      | Gestionnaire — Media / audit   | EXCEPTION   | Classification requise ; audit média via route dédiée |
| 009      | Admin — données sensibles      | EXCEPTION   | Step-up, MFA, audits immuables, CNI chiffrées |
| 010      | Allowlist `/tables`            | EXCEPTION   | 2 tables agrégées, Gestionnaire/Admin, extinction progressive |

### Points restant explicitement ouverts

| Point                                                            | Statut                   |
| ---------------------------------------------------------------- | ------------------------ |
| `ventes_foncieres` — accès gestionnaire                          | Réponse SOMA : Admin uniquement; Gestionnaire NON, à formaliser §17 |
| Détail finance gestionnaire (paiements) au-delà des agrégats     | Réponse SOMA : OUI, lecture par route métier, scope Organisation; à formaliser §17 |
| Montants et pièces des contrats de bail — accès gestionnaire     | Réponse SOMA : OUI, lecture par route métier, scope Organisation; à formaliser §17 |
| EXPORT (tous rôles)                                              | Refus par défaut ; décision distincte si besoin |
| Durées de conservation (IP, user-agent, visiteurs, leads, messages) | À définir — décision distincte, ne bloque pas le RBAC |
| Correspondance `tasks` / `taches`                                | Vérification technique   |
| Scopes équipe / organisation / affectation                       | Vérification technique   |
| RLS PostgreSQL                                                   | Vérification technique   |
| Routes métier manquantes                                         | Vérification technique   |
| Nombre réel de tables (34 vs 38)                                 | Vérification technique   |

---

# 17. VALIDATION FINALE DE L'AUTORITÉ MÉTIER

*Ce bloc est le **seul** mécanisme de validation du document. Aucune décision n'est validée tant qu'elle n'est pas cochée ici.*

Je soussigné(e) : **SOMA** — Administrateur / responsable technique EGS

déclare avoir relu les décisions métier RBAC de la Phase 3.4 :

| Décision | Sujet                          | VALIDÉ | MODIFIÉ | REFUSÉ | Commentaire |
| -------- | ------------------------------ | :----: | :-----: | :----: | ----------- |
| 001      | Accès public                   | ☐ | ☐ | ☐ | |
| 002      | Employé — lecture privée       | ☐ | ☐ | ☐ | |
| 003      | Employé — écriture/publication | ☐ | ☐ | ☐ | |
| 004      | Gestionnaire — lecture privée  | ☐ | ☒ | ☐ | SOMA, 2026-09-28 : lecture Organisation des détails de paiement et des montants/pièces de bail via routes métier. Non signé globalement. |
| 005      | Gestionnaire — `/tables`       | ☐ | ☒ | ☐ | SOMA, 2026-09-28 : ventes_foncieres réservée à l’Admin; Gestionnaire NON. Accès Admin par route dédiée, pas /tables. Non signé globalement. |
| 006      | Gestionnaire — écriture        | ☐ | ☐ | ☐ | |
| 007      | Gestionnaire — publication     | ☐ | ☐ | ☐ | |
| 008      | Gestionnaire — Media / audit   | ☐ | ☐ | ☐ | |
| 009      | Admin — données sensibles      | ☐ | ☐ | ☐ | |
| 010      | Allowlist `/tables`            | ☐ | ☐ | ☐ | |

---

# 18. STATUT GLOBAL

Nombre de décisions validées : **0 / 10**

Nombre de décisions modifiées : **2 / 10**

Nombre de décisions refusées : **0 / 10**

Points `UNKNOWN` restant ouverts : **Aucun des trois points clarifiés ci-dessus; ils restent non validés jusqu’à formalisation/signature. Autres décisions métier et vérifications techniques encore ouvertes.**

### STATUT FINAL

☐ **READY FOR IMPLEMENTATION**

☒ **VALIDATION INCOMPLÈTE**

☐ **À REVOIR**

## AUTORITÉ MÉTIER

**Nom :** SOMA

**Fonction :** Administrateur / responsable technique EGS

**Date :** ____ / ____ / ______

**Signature / confirmation :**

---

## RÈGLE DE DÉMARRAGE DE L'IMPLÉMENTATION

**Claude Code ne peut commencer l'implémentation RBAC Phase 3.4 que si le statut final ci-dessus est explicitement `READY FOR IMPLEMENTATION`.**

Toute décision non validée ou `UNKNOWN` reste hors implémentation et conserve le **refus par défaut**.

---

## ANNEXE — RÉVISIONS DE LA VERSION 2

| Correction | Motif |
| ---------- | ----- |
| Allowlist `/tables` limitée à Gestionnaire et Admin | Contradiction avec la décision 002 (l'Employé n'a aucun accès aux agrégats) |
| Lignes « Autres » remplacées par des ressources nommées | Règle de validation : la ressource doit être identifiée |
| Droits de publication de l'Admin ajoutés (décision 009) | Non définis alors que la décision 007 les renvoyait à l'Admin |
| Matrice des tables rétablie dans la décision 005 | Le droit du Gestionnaire n'était plus explicite table par table |
| Contrats de bail, documents, messages de contact ajoutés à la décision 004 | Ressources non couvertes |
| Formulation `tasks` / `taches` rendue prudente | Hypothèse non vérifiée présentée comme un fait |
| Blocs « Validé par : SOMA » retirés des décisions | Risque de pré-validation ; un seul mécanisme (section 17) |
| EXPORT traité (refus par défaut) | Cité dans la légende, jamais décidé |
| Principes ajoutés : anti-IDOR, liste blanche de champs, step-up, révocation immédiate, anti-extraction, alertes | Bonnes pratiques de sécurité |
| Durcissements ajoutés : rôle DB public en lecture seule, upload sécurisé, classification média, CNI chiffrées + URL signées, audit INSERT seul + copie externe | Défense en profondeur |
| Plan d'implémentation : sauvegarde, staging, tests négatifs, retour arrière | Réduction du risque de déploiement |

---

## ANNEXE — RÉPONSES SOMA DU 2026-09-28 (COPIE DE TRAVAIL)

- Gestionnaire / ventes_foncieres : **NON**; Admin uniquement via route métier dédiée.
- Gestionnaire / détail des paiements : **OUI**, scope Organisation, lecture via route métier dédiée.
- Gestionnaire / montants et pièces de contrats de bail : **OUI**, scope Organisation, lecture via route métier dédiée.
- Ces accès au détail ne lèvent pas l’interdiction d’accès Gestionnaire à ces tables par /tables.
- Décisions 004 et 005 marquées MODIFIÉ; aucune n’est marquée VALIDÉ. La signature, la date finale et READY FOR IMPLEMENTATION restent vides/non cochés.
