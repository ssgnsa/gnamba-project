# Spécification décisionnelle — Lot 2

> BROUILLON — NON VALIDÉ (Lot 1 non validé)

## Cadre

Ce document prépare les décisions du Lot 2; il ne les prend pas. Il reprend uniquement les constats de `docs/audit/LOT1-RAPPORT.md` et `docs/audit/LOT1-INVENTAIRE-FONCTIONNEL.md`. Toute cible non renseignée reste ouverte. Les mots « existant » et « PARTIEL » décrivent le dépôt observé et ne valent pas approbation métier.

Valeurs autorisées pour la décision d’un module : `GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?`. Aucune solution technique n’est spécifiée ici.

## 1. Modules à décider

### Clients
- Fonctions existantes : listes, détail, suggestion de recherche, création, mise à jour, suppression/désactivation déclarées sur les routes clients.
- État prouvé : **PARTIEL** — routes et permissions déclarées; page présente avec tests dédiés, mais parcours E2E non établi.
- Règles métier recensées : permissions backend distinctes lecture privée, création, mise à jour et suppression; état métier détaillé **NON ÉTABLI** dans les deux rapports.
- DB / code : permissions dans le code; contrainte métier DB propre aux clients **NON ÉTABLIE** dans l’inventaire demandé.
- Trous : portées de lignes/champs et fonctionnement bout en bout **NON ÉTABLIS**.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Immobilier
- Fonctions existantes : propriétés, transitions, vérification de localité, publication; contrats et paiements avec consultation, création/mise à jour/suppression/restauration déclarées.
- État prouvé : **PARTIEL** — routes Admin et règles PostgreSQL observées; workflow UI/API complet non établi.
- Règles métier recensées : type de bien canonique, transitions autorisées, référence annuelle, titre généré, état de localité, journal d’audit et refus journalisés.
- DB / code : les deux; tables de référence `immobilier_types_bien` (17 lignes) et `immobilier_statut_transitions` (18 lignes), FK depuis `properties`, fonctions et triggers de garde/audit; modèles et base divergent.
- Trous : preuve fonctionnelle de toutes les transitions et couverture complète du modèle par les règles SQL **NON ÉTABLIES**.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Foncier
- Fonctions existantes : villages, lotissements, îlots, lots, attestations, ACL villages, audit et routes Sync déclarées.
- État prouvé : **PARTIEL** — routes et tests de certaines tranches présents; 59 routes observées, plusieurs répondent 501 ou des valeurs vides/zéro.
- Règles métier recensées : hiérarchie village→lotissement→îlot→lot, références, détection de doublons, archivage/restauration de lots, statuts/types d’attestation, contrôle d’accès village.
- DB / code : les statuts/types sont couverts par des CHECK; transitions applicatives et ACL principalement dans le code; trigger métier Foncier **NON ÉTABLI** dans l’inventaire des six triggers.
- Trous : imports/exports CSV, update attestation, génération/téléchargement PDF, export audit et résolution de conflit renvoient 501; Sync répond aussi par des valeurs neutres dont le fonctionnement effectif est NON ÉTABLI.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

#### Attestations — décision consignée et propositions à valider

**DÉCISION DU COMMANDITAIRE (consignée) :** le chef de village valide les attestations en signant sur papier. Il n’a pas de compte ERP. Aucun rôle `chef_village` n’est demandé.

**PROPOSITION — à valider :** le chef de village serait une donnée rattachée au village (nom, contact, mandat), et non un utilisateur. Une attestation ne pourrait passer à « validée » que si un scan signé est joint. Les traces proposées sont : qui a saisi, qui a confirmé, date de confirmation et référence du scan. Cela ne modifie ni les CHECK observés ni les routes existantes; la règle de transition base/code reste à décider.

| Action proposée | Rôles proposés | Condition proposée | Statut |
|---|---|---|---|
| Préparer / soumettre une attestation | `admin`, `gestionnaire`, `secretaire`, `agent@village` | Préparer ou soumettre le dossier | PROPOSITION, À VALIDER |
| Téléverser le scan signé | `admin`, `gestionnaire`, `secretaire`, `agent@village` | Scan de la signature papier du chef de village | PROPOSITION, À VALIDER |
| Confirmer la validation | `admin`, `gestionnaire` | Scan signé joint | PROPOSITION, À VALIDER |
| Révoquer une attestation | `admin`, `gestionnaire` | Motif et traces à préciser | PROPOSITION, À VALIDER |

`agent@village` est le libellé de périmètre proposé par le commanditaire; son mapping à un rôle ou scope technique est **NON ÉTABLI**. La route `sign` existante représente une signature électronique déclarée : **À DÉCIDER**, probablement abandonnée au profit du circuit papier; aucune suppression ni changement n’est autorisé par cette proposition.

#### Décisions fonctionnelles ciblées du commanditaire

Ces choix portent sur les fonctions Foncier nommées ci-dessous. Ils ne tranchent pas la décision générale du module Foncier, la conception DB, ni les autres lignes ouvertes.

| Fonction | Décision / cible consignée |
|---|---|
| Hiérarchie village / lotissement / îlot / lot (CRUD) | **GARDER** |
| Attestations : préparer, soumettre, joindre un scan, valider, révoquer | **GARDER** |
| Validation d’une attestation | Pas de validation sans scan signé joint |
| Route de signature électronique `sign` | **SUPPRIMER** — circuit papier; aucune suppression de code effectuée dans cette passe |
| Vérification publique `verify/{reference}` | **GARDER** |
| Accès par village | **GARDER**; refonte en rôle avec périmètre, détails à décider |
| Audit / timeline | **GARDER** |
| Export audit PDF/CSV | **À GARDER** |
| Import/export CSV des lots (actuellement 501) | **À GARDER** |
| Génération/téléchargement PDF d’attestation (actuellement 501) | **GARDER ET FINIR** |
| Sync hors ligne (stubs actuels) | **À GARDER** |

### Finances
- Fonctions existantes : création, lecture, mise à jour et suppression déclarées; parcours authentifié de test conditionnel.
- État prouvé : **PARTIEL** — routes présentes et règle DB active; parcours finance authentifié skippé sans fixture TOTP isolée.
- Règles métier recensées : direction encaissement/décaissement, montant positif, date, devise, taux et montant XOF; les opérations historiques `INCONNU` sont verrouillées tant qu’elles ne sont pas justifiées.
- DB / code : les deux; `trg_finances_contract_guard`, CHECK `ck_finance_type_operation_v2`, `ck_finance_montant_positive_v2`, `ck_finance_devise_v2`; code du trigger enregistré dans la migration 031.
- Trous : preuve d’exécution complète du flux financier et règles métier des corrections/suppressions **NON ÉTABLIES**.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Leads
- Fonctions existantes : CRUD, capture, suggestion, campagnes, traitement/statistiques/preview et règles d’automatisation déclarés.
- État prouvé : **PARTIEL** — routes admin, conversion vers Entity et scoring codés; workflows fonctionnels complets non établis.
- Règles métier recensées : mapping de statut `nouveau` vers l’état Entity `pending`, calcul/recalcul du score, suppression logique; capture publique via les routes vitrine distincte.
- DB / code : score et conversion côté code; CHECK DB correspondant aux statuts/scoring **NON ÉTABLI** dans l’inventaire.
- Trous : preuve de persistance et de cycle de vie complet des leads/campagnes **NON ÉTABLIE**.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Médias / documents
- Fonctions existantes : assets de marque publics; bibliothèque, usage, audit, upload, remplacement, mise à jour, suppression logique, restauration, purge et versions Media déclarés.
- État prouvé : Media **PARTIEL**; page et routes présentes, mais parcours E2E complet non établi. Documents : page déclarée, route métier dédiée **NON ÉTABLIE**; usage générique est recensé.
- Règles métier recensées : permissions par action Media, normalisation de catégorie/tags, suivi d’usage, suppression logique/restauration/purge.
- DB / code : Media combine code et champs DB de version/tombstone/hash; CHECK historique du type de stockage recensé; triggers Media dédiés **NON ÉTABLIS**. Règles Documents métier **NON ÉTABLIES**.
- Trous : contrat API Documents dédié, périmètre de ses données et preuve des parcours Media complets **NON ÉTABLIS**.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Site vitrine
- Fonctions existantes : lectures publiques de contenus/lists/layouts publiés, formulaires vitrine; CRUD privé de réalisations/lots, contenu CMS et publication de layouts déclarés.
- État prouvé : **PARTIEL** — mappings et routes présents; distinction brouillon/publié incomplète pour le contenu CMS; fonctionnement E2E non établi.
- Règles métier recensées : filtrage/projection de réalisations et lots publiés; permissions `site_vitrine` pour actions privées; Layout a lecture brouillon, création et publication distinctes.
- DB / code : permissions et filtres dans le code; règles DB de publication autres que les différences de schéma **NON ÉTABLIES** par les deux rapports.
- Trous : champs réellement publics, cycle CMS publié/brouillon et approbation métier des permissions **NON ÉTABLIS**.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Auth / utilisateurs
- Fonctions existantes : login, refresh/logout, MFA verify, reset mot de passe, changement de mot de passe; CRUD utilisateur avec contrôle manuel admin+MFA.
- État prouvé : **PARTIEL** — endpoints et règles serveur codés; preuve de toutes les branches MFA/reset en production non établie.
- Règles métier recensées : hash/validation mot de passe, TOTP lorsque configuré, reset token/expiration, révocation de sessions et limites de tentative; `require_admin_user` refuse Admin non vérifié MFA.
- DB / code : règles de flux dans le code et tables Auth en base; trigger/CHECK Auth métier **NON ÉTABLI** dans les deux rapports.
- Trous : décision sur comptes/rôles/niveaux d’accès et fonctionnement de chaque flux **NON ÉTABLIS**. Les agrégats montrent `role`: admin 1, employe 2, gestionnaire 1; `access_level`: admin 2, employe 1, gestionnaire 1. Leur correspondance reste **NON ÉTABLIE**.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Projets / tâches
- Fonctions existantes : routes de lecture, création, mise à jour et suppression déclarées; tâches ont deux routes de lecture list/detail.
- État prouvé : **PARTIEL** — pages/routes mappées et guards Admin; preuve de workflow de projet/tâche bout en bout **NON ÉTABLIE**.
- Règles métier recensées : permissions `require_admin_user`; règles de statut/affectation ou périmètre métier **NON ÉTABLIES** par les deux rapports.
- DB / code : code de route; règles CHECK/triggers dédiées **NON ÉTABLIES** dans les inventaires concernés.
- Trous : nécessité des rôles, états et portées de lignes **NON ÉTABLIE**.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Fournitures / fournisseurs
- Fonctions existantes : routes produits CRUD; routes fournisseurs CRUD et suggestions déclarées.
- État prouvé : **PARTIEL** — routes Admin; preuve fonctionnelle complète du flux de fournitures/fournisseurs non établie.
- Règles métier recensées : garde de référence produit en base; autres règles de stock/achat **NON ÉTABLIES** par les deux rapports.
- DB / code : trigger `trg_products_contract_reference` dans la base et guard produit côté serveur; règle de stock **NON ÉTABLIE**.
- Trous : processus métier fournitures/stock non décrit dans les rapports sources.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Employés
- Fonctions existantes : création, lecture, mise à jour, suppression et recherche suggérée déclarées.
- État prouvé : **PARTIEL** — routes protégées `require_admin_user`; page mappée; workflow bout en bout non établi.
- Règles métier recensées : accès Admin côté route; règles de scope Employé/Gestionnaire restent inconnues dans DECISION-003.
- DB / code : règle d’accès dans le code; règle de scope ligne confirmée en DB **NON ÉTABLIE**.
- Trous : périmètre d’accès aux fiches et responsabilités métier ouvertes.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Registre
- Fonctions existantes : page RegistreVisiteur; références aux tables `visiteurs`, `visites`, `visites_terrain`, `visites_du_jour` et `visites_en_cours` via chemins génériques/RPC recensés.
- État prouvé : **PARTIEL** — page et certaines références runtime existent; endpoint métier dédié complet et parcours visiteur E2E **NON ÉTABLIS**.
- Règles métier recensées : seules les règles génériques de permission et formulaires publics relevées; cycle d’accueil métier détaillé **NON ÉTABLI**.
- DB / code : accès générique contrôlé par ressource; fonctions dédiées de registre dans les deux rapports **NON ÉTABLIES**.
- Trous : mapping des routes frontend vers les tables et usages réels **NON ÉTABLIS**.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

### Paramètres
- Fonctions existantes : liste et détail privés, catégories, whitelist, audit; paramètres publics/frontend; mise à jour Admin avec step-up; suppression déclarée mais refusée.
- État prouvé : **PARTIEL** — routes définies, paramètres secrets masqués dans certaines réponses; preuve de parcours complet non établie.
- Règles métier recensées : guard Admin; step-up pour l’écriture; suppression physique refusée; valeurs sensibles masquées selon nom de clé.
- DB / code : règles dans le code; règles DB spécifiques **NON ÉTABLIES** par les deux rapports.
- Trous : exposition exacte des configurations publiques et approbation des paramètres **NON ÉTABLIES**.
- **DÉCISION : GARDER / MODIFIER / SUPPRIMER / AJOUTER = ?**

## 2. RBAC — état actuel et cible à décider

Les colonnes « Backend actuel » et « Frontend actuel » décrivent deux plans différents. L’affichage frontend n’accorde pas un droit serveur. Les nombres DB sont globaux; aucune permission par module n’est stockée/établie par les deux rapports. `CIBLE` reste vide.

| Module | Rôle backend | Actions / accès backend actuels | Visibilité frontend actuelle | Comptes DB globaux (`role` / `access_level`) | CIBLE |
|---|---|---|---|---|---|
| Clients | admin | Routes client permises si MFA vérifiée; actions lecture/création/mise à jour/suppression selon permission route. | visible | role 1 / access_level 2 | |
| Clients | gestionnaire | `clients/*` refusé par la politique centralisée actuelle. | visible | role 1 / access_level 1 | |
| Clients | employe | Accès privé refusé par la politique centralisée. | non visible | role 2 / access_level 1 | |
| Clients | guest | Accès privé refusé; compte guest non observé en DB. | NON ÉTABLI; page publique distincte | role 0 observé / access_level 0 observé | |
| Immobilier | admin | Propriétés, contrats, paiements: routes `require_admin_user`; actions déclarées par route. | visible | role 1 / access_level 2 | |
| Immobilier | gestionnaire | Routes dédiées protégées Admin; permission privée centralisée refuse les non-admin. | visible | role 1 / access_level 1 | |
| Immobilier | employe | Accès privé refusé. | non visible | role 2 / access_level 1 | |
| Immobilier | guest | Accès privé refusé; routes publiques vitrine distinctes. | NON ÉTABLI | role 0 observé / access_level 0 observé | |
| Foncier | admin | 59 routes avec garde `foncier/read`; décision des handlers et ACL objet selon route. | visible | role 1 / access_level 2 | |
| Foncier | gestionnaire | Permission centrale `foncier/read` refusée aux non-admin. | visible | role 1 / access_level 1 | |
| Foncier | employe | Permission centrale privée refusée. | non visible | role 2 / access_level 1 | |
| Foncier | guest | Permission privée refusée; visiteur public distinct. | NON ÉTABLI | role 0 observé / access_level 0 observé | |
| Finances | admin | Routes Admin; garde DB de contrat financier active. | visible | role 1 / access_level 2 | |
| Finances | gestionnaire | `require_admin_user` refuse. | visible | role 1 / access_level 1 | |
| Finances | employe | `require_admin_user` refuse. | non visible | role 2 / access_level 1 | |
| Finances | guest | Aucune route privée; guest DB non observé. | NON ÉTABLI | role 0 observé / access_level 0 observé | |
| Leads | admin | CRUD/campagnes/automations protégés Admin; capture publique séparée sur Site. | visible (`admin: *`) | role 1 / access_level 2 | |
| Leads | gestionnaire | Routes protégées Admin; accès privé refusé. | non visible | role 1 / access_level 1 | |
| Leads | employe | Accès privé refusé. | non visible | role 2 / access_level 1 | |
| Leads | guest | Capture publique contrôlée séparée; accès privé refusé. | NON ÉTABLI | role 0 observé / access_level 0 observé | |
| Médias / documents | admin | Media permissions par action; Documents dédié NON ÉTABLI. | médias et documents visibles | role 1 / access_level 2 | |
| Médias / documents | gestionnaire | `media/*` privé refusé par le guard central; Documents via route générique selon ressource. | médias et documents visibles | role 1 / access_level 1 | |
| Médias / documents | employe | `media/*` privé refusé; Documents selon garde de ressource. | médias et documents visibles | role 2 / access_level 1 | |
| Médias / documents | guest | Assets de marque/publics distincts; bibliothèque privée refusée. | NON ÉTABLI | role 0 observé / access_level 0 observé | |
| Site vitrine | admin | CMS/layouts/Site protégés par Admin ou permission `site_vitrine`; certaines lectures publiques. | Site editor admin-only; pages publiques déclarées | role 1 / access_level 2 | |
| Site vitrine | gestionnaire | Permissions privées `site_vitrine` refusées par la politique centrale; lectures publiques restent indépendantes du rôle. | site editor non visible | role 1 / access_level 1 | |
| Site vitrine | employe | Permissions privées refusées; lecture publique indépendante du rôle. | site editor non visible | role 2 / access_level 1 | |
| Site vitrine | guest | Contrats publics/forms publics seulement selon handlers; étendue métier ouverte. | mappings publics; compte guest non représenté par UserRole TS | role 0 observé / access_level 0 observé | |
| Auth / utilisateurs | admin | Gestion utilisateurs exige rôle Admin + MFA; parcours Auth individuels selon handler. | utilisateurs admin-only | role 1 / access_level 2 | |
| Auth / utilisateurs | gestionnaire | Gestion utilisateurs refusée; Auth utilisateur selon session propre. | utilisateurs admin-only | role 1 / access_level 1 | |
| Auth / utilisateurs | employe | Gestion utilisateurs refusée; Auth utilisateur selon session propre. | utilisateurs admin-only | role 2 / access_level 1 | |
| Auth / utilisateurs | guest | Login/reset public; compte guest absent des agrégats observés. | mapping UI guest NON ÉTABLI | role 0 observé / access_level 0 observé | |
| Projets / tâches | admin | CRUD routes `require_admin_user`. | projets/tâches visibles | role 1 / access_level 2 | |
| Projets / tâches | gestionnaire | Routes dédiées protégées Admin; `/tables` ne permet que lecture `stats_journalieres`. | projets/tâches visibles | role 1 / access_level 1 | |
| Projets / tâches | employe | Routes dédiées protégées Admin; accès générique privé refusé. | projets/tâches visibles | role 2 / access_level 1 | |
| Projets / tâches | guest | Accès privé refusé. | NON ÉTABLI | role 0 observé / access_level 0 observé | |
| Fournitures / fournisseurs | admin | Produits et fournisseurs protégés Admin; garde de référence Produit en DB. | visibles | role 1 / access_level 2 | |
| Fournitures / fournisseurs | gestionnaire | Routes Admin-only; lecture générique sauf ressource autorisée refusée. | visibles | role 1 / access_level 1 | |
| Fournitures / fournisseurs | employe | Routes Admin-only; accès générique privé refusé. | non visibles | role 2 / access_level 1 | |
| Fournitures / fournisseurs | guest | Accès privé refusé. | NON ÉTABLI | role 0 observé / access_level 0 observé | |
| Employés | admin | CRUD et recherche protégés Admin. | visible | role 1 / access_level 2 | |
| Employés | gestionnaire | Routes `require_admin_user` refusées. | visible | role 1 / access_level 1 | |
| Employés | employe | Routes `require_admin_user` refusées. | non visible | role 2 / access_level 1 | |
| Employés | guest | Accès privé refusé. | NON ÉTABLI | role 0 observé / access_level 0 observé | |
| Registre | admin | Via `erp_table`, seule lecture de `stats_journalieres` autorisée si MFA vérifiée; autres ressources/actions génériques refusées. Pas d’API métier globale du registre confirmée. | visible | role 1 / access_level 2 | |
| Registre | gestionnaire | Seule permission générique `stats_journalieres/read`; accès aux tables visiteurs/visites refusé. | visible | role 1 / access_level 1 | |
| Registre | employe | Accès générique privé refusé. | visible | role 2 / access_level 1 | |
| Registre | guest | Privé refusé; routes publiques seulement si déclarées. | NON ÉTABLI | role 0 observé / access_level 0 observé | |
| Paramètres | admin | Routes privées Admin; écriture requiert step-up; suppression retourne 403. | visible | role 1 / access_level 2 | |
| Paramètres | gestionnaire | Routes privées Admin-only refusées; endpoints publics/frontend séparés. | visible | role 1 / access_level 1 | |
| Paramètres | employe | Routes privées Admin-only refusées. | non visible | role 2 / access_level 1 | |
| Paramètres | guest | Seules sorties explicitement publiques; permission privée refusée. | NON ÉTABLI | role 0 observé / access_level 0 observé | |

Constat DB global issu des rapports : les colonnes `role` et `access_level` ont chacune 4 comptes mais des distributions différentes; aucune correspondance individuelle n’est établie. Aucun droit DB par module n’est documenté dans les deux rapports. Les valeurs de cible de toutes les lignes restent à renseigner par le commanditaire.

### Niveaux de visibilité frontend observés

Ce second tableau décrit uniquement la visibilité UI; il ne constitue pas une permission serveur. Les comptes `access_level` sont des agrégats globaux, sans correspondance individuelle avec `role`.

| Niveau UI | Modules visibles dans le frontend actuel | Comptes `access_level` observés | CIBLE |
|---|---|---:|---|
| `admin` | Tous (`*`) | 2 | |
| `gerant` | dashboard, clients, projets, immobilier, foncier, catalogue-lots, fournitures, finances, employes, fournisseurs, documents, taches, statistiques, parametres, media, registre | 0 observé | |
| `secretaire` | dashboard, clients, documents, fournisseurs, fournitures, taches, media, registre, immobilier, foncier, catalogue-lots | 0 observé | |
| `ouvrier` | dashboard, projets, taches, documents, media, registre | 0 observé | |
| `visiteur` | dashboard, registre | 0 observé | |
| `gestionnaire` | dashboard, clients, projets, immobilier, foncier, catalogue-lots, fournitures, finances, employes, fournisseurs, documents, taches, statistiques, parametres, media, registre | 1 | |
| `employe` | dashboard, projets, taches, documents, media, registre | 1 | |
| `guest` | Niveau absent de `ACCESS_LEVEL_MODULES`; comportement UI spécifique non établi par les rapports | 0 observé | |

## 3. Règles DB à arbitrer

Chaque ligne décrit uniquement la règle observée dans le rapport DB. La réponse reste vide jusqu’à arbitrage.

### Triggers (6)

| Table | Trigger / règle actuelle | Décision |
|---|---|---|
| finances | `trg_finances_contract_guard` — direction, montant, date, devise et taux/conversion | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| products | `trg_products_contract_reference` — garde de référence produit | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| properties | `trg_immobilier_property_guard` — garde d’insertion, modification et suppression | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| properties | `trg_immobilier_property_audit` — journal des créations/modifications | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| properties_audit | `trg_properties_audit_immutable` — interdit modification/suppression du journal | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| properties_audit | `trg_properties_audit_no_truncate` — interdit TRUNCATE du journal | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |

### Contraintes CHECK (18)

| Table | Contrainte/règle actuelle | Décision |
|---|---|---|
| entities | `ck_entity_status` — statut autorisé | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| entities | `ck_entity_type` — type d’entité autorisé | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| finance_exchange_rates | devise au format trois lettres | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| finance_exchange_rates | taux strictement positif | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| finance_exchange_rates | source non vide | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| finances | `ck_finance_devise_v2` — devise autorisée | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| finances | `ck_finance_montant_positive_v2` — montant positif | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| finances | `ck_finance_type_operation_v2` — direction autorisée | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| foncier_attestations | `foncier_attestations_statut_check` — statut autorisé | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| foncier_attestations | `foncier_attestations_type_check` — type autorisé | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| foncier_lots | `foncier_lots_statut_check` — statut autorisé | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| immobilier_reference_counters | compteur entre 0 et 9999 | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| immobilier_statut_transitions | état source différent de l’état cible | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| properties | `ck_property_localite_contract_v2` — cohérence de localité | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| properties | `ck_property_localite_statut_v2` — statut localité autorisé | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| properties | `ck_property_statut_v2` — statut de propriété autorisé | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| ref_counters | valeur de compteur strictement positive | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |
| user_village_access | niveau d’accès village autorisé | REPRODUIRE / ABANDONNER / À DÉCIDER = ? |

Les trois CHECK Finance sont signalés `NOT VALID` pour les anciennes lignes dans le rapport DB; ils s’appliquent aux nouvelles écritures selon ce rapport. La décision de les reproduire reste ouverte.

## 4. Tables présentes en DB, absentes de SQLAlchemy metadata

Toutes les décisions sont ouvertes. Les deux référentiels en gras contiennent actuellement 17 types et 18 transitions; **si conservés**, ils sont à reseeder. Cette mention ne constitue pas une décision de conservation.

| Table | Lignes observées | État/référence recensée | Décision |
|---|---:|---|---|
| `app_settings_old` | 2 | Aucune référence runtime/script détectée; mention documentaire | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `app_settings_test` | 2 | Aucune référence runtime/script détectée; mention documentaire | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `campagnes_marketing` | 0 | Allowlist runtime générique et références frontend; fonctionnement non prouvé | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `documents` | 0 | Route générique/vitrine; route Documents métier dédiée NON ÉTABLIE | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `finance_exchange_rates` | 0 | Lue par le garde-fou financier | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `foncier_audit` | 0 | Mentionnée dans un script SQL; script non exécuté | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `foncier_audit_old` | 0 | Aucune référence runtime/script trouvée; documentation seulement | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `foncier_items` | 0 | Alias frontend vers `/foncier`; accès à la table homonyme NON ÉTABLI | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `foncier_items_old` | 0 | Aucune référence runtime/script trouvée; documentation seulement | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `foncier_lots_old` | 0 | Aucune référence runtime/script trouvée; documentation seulement | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `foncier_villages_old` | 0 | Aucune référence runtime/script trouvée; documentation seulement | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `immobilier_reference_counters` | 0 | Compteur utilisé par la génération de références via fonction SQL | GARDER / SUPPRIMER / À DÉCIDER = ? |
| **`immobilier_statut_transitions`** | **18** | **Référentiel de transitions lu par le runtime; reseed à décider si conservé** | GARDER / SUPPRIMER / À DÉCIDER = ? |
| **`immobilier_types_bien`** | **17** | **Référentiel des types lié par FK et fonction SQL; reseed à décider si conservé** | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `opportunites` | 0 | Allowlist/runtime et frontend; parcours complet NON ÉTABLI | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `page_layouts_backup_20260827` | 38 | Aucune référence runtime/script trouvée; contenu non inspecté ici | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `page_layouts_canonical_20260827` | 1 | Aucune référence runtime/script trouvée; contenu non inspecté ici | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `properties_audit` | 0 | Journal métier et triggers d’immutabilité actifs | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `ref_counters` | 0 | Utilisée par les références Produits | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `social_posts` | 0 | Allowlist et références frontend; route spécialisée fonctionnelle NON ÉTABLIE | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `ventes_foncieres` | 0 | Références runtime RPC/tables et frontend | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `visites` | 0 | Références runtime; modèle fichier `visits.py` non enregistré dans metadata | GARDER / SUPPRIMER / À DÉCIDER = ? |
| `visites_terrain` | 0 | Références runtime RPC/tables et frontend | GARDER / SUPPRIMER / À DÉCIDER = ? |

## 5. Questions ouvertes du Lot 1

1. `DECISION-003` est encore EN ATTENTE : quel périmètre objet/lignes pour Agent (`employe`) et Gestionnaire, table par table, et quelles preuves d’approbation doivent faire foi ?
2. Confirmez-vous que les niveaux UI `gerant`, `secretaire`, `ouvrier`, `visiteur` sont des rôles métier voulus, ou des valeurs historiques d’`access_level` ? Où leur attribution est-elle gouvernée ?
3. La politique centrale `/tables` ne permet qu’une lecture de `stats_journalieres` au Gestionnaire/Admin; certains documents décrivent 34 lectures Gestionnaire et CRUD Admin. Quelle décision et quel artefact sont la référence, sachant que la matrice `SITE-VITRINE-RBAC-DECISION-FINALE.md` se dit elle-même « prête à validation » ?
4. `admin` doit-il rester bloqué sans `mfa_verified=True` pour les routes qui utilisent `require_admin_user`, et quelle règle métier définit les actions qui utilisent ce guard versus un `require_permission` module/action ?
5. Les GET `/api/v1/site-content`, `/api/v1/settings/frontend`, `/api/v1/site/properties` et `/api/v1/media/brand-assets` sont publics sans guard déclaratif : quels champs/données doivent être publiés ?
6. Quel contrat doit remplacer `/api/v1/documents` ou les endpoints UI `/documents`, `/messages`, `/users/profiles`, `/visites/*`, `/social/posts` quand aucun routeur dédié correspondant n’est monté ?
7. Les routes Foncier TODO qui renvoient 501 ou des valeurs vides/zéro sont-elles des fonctionnalités à conserver/finir, ou des routes de compatibilité à retirer ultérieurement ? Aucune décision n’est prise ici.
8. Quel comportement attendu pour la fonction DB `current_user_role()` et les limites antispam en mémoire en environnement multi-instance ?
9. Quel niveau de preuve utilisateur final est attendu pour qu’une page passe de PARTIEL à FONCTIONNEL PROUVÉ (test UI isolé, API intégrée, PostgreSQL, ou parcours E2E complet) ?
10. Le client généré Orval (227 appels fetch) doit-il être maintenu comme client HTTP local concurrent de `ApiClient`, ou régénéré/configuré pour partager son transport/authentification ?
11. Les tests financiers et intégrations PostgreSQL Foncier/Immobilier doivent-ils être exécutés dans un environnement de test isolé avec les fixtures TOTP/DB explicitement requises ?
12. Qui confirme l’enregistrement d’une attestation dans l’ERP : le gestionnaire seul, ou également un administrateur ? Cette question porte sur la confirmation ERP, distincte de la signature papier du chef de village.
13. Un `agent@village` peut-il être rattaché à plusieurs villages ?
14. Les secrétaires peuvent-elles traiter les paiements de loyers ?
15. Les agents peuvent-ils créer des lots fonciers ?
16. Quel est l’effectif réel à prendre en compte : 6 ou 8 ?
17. Les agents en village disposent-ils d’un accès Internet suffisant, ou ont-ils besoin d’un fonctionnement hors ligne ?
18. Quelles données existantes doivent être importées ?
19. Quel est le modèle papier officiel de l’attestation à reproduire ?

---

**Aucune cible n’est validée dans ce document. Le marqueur BROUILLON — NON VALIDÉ reste en place.**
