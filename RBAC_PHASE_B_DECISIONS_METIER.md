# GNAMBA / EGS — Phase B
# Fiche de validation des décisions métier RBAC

**À remplir par le responsable métier.**  
Cette fiche recueille les décisions; elle ne modifie aucun rôle ni droit.

## Registre de statut officiel — Phase B.1

- **DECISION-001 = VALIDÉ** : `admin` → Administrateur, `gestionnaire` → Gestionnaire, `employe` → Agent, `guest` → Utilisateur standard.
- **DECISION-004 = VALIDÉ sur le principe** : les responsabilités Direction/Responsable, Comptabilité/Finance, Commercial et Immobilier/Foncier sont des scopes/attributs cumulables, sans nouveaux rôles RBAC à ce stade. Leurs modalités d'attribution restent à préciser.
- **DECISION-003 = EN ATTENTE** de définition du périmètre technique Agent/Gestionnaire par table/module.
- **DECISION-006 = VALIDÉ sur le principe** : DEFAULT est la base; les exceptions et autorisations restent à déterminer par table/action. Aucune permission de suppression physique n'est déduite.

Les détails encore UNKNOWN ne contredisent pas ces validations de principe et ne peuvent pas être implémentés comme permissions.

## Comment répondre

- Cochez OUI, NON ou EXCEPTION pour chaque question.
- Pour EXCEPTION, décrivez les rôles, tables, actions, périmètres et conditions concernés.
- Laissez UNKNOWN lorsqu'aucune décision n'est prise.
- DEFAULT signifie que le gabarit RBAC Phase 3.4 verrouillé s'applique sans écart.
- Une réponse n'est considérée validée qu'après choix explicite et identification du responsable/date.

**Rappel du gabarit par défaut** : Administrateur accès complet selon les actions présentes; Direction/Responsable lecture, export et actions d'arbitrage/validation, sans saisie brute; Gestionnaire création, modification conditionnelle et archivage seulement si explicitement permis par la table, sans restauration ni export; Agent création et modification de ses propres saisies non validées, sans suppression/archivage/restauration, export seulement par exception; Finance, Commercial et Immobilier/Foncier aucun droit par défaut sans exception; utilisateur standard lecture seule sur son périmètre seulement si prévue. Les exceptions du gabarit doivent être nommées par table/action. Le gabarit ne détermine pas la correspondance entre rôle métier et rôle technique.

---

## DECISION-001 — Correspondance des rôles

| Rôle technique | Correspondance métier proposée | Décision | Commentaire |
|---|---|---|---|
| admin | Administrateur | OUI — VALIDÉ | mapping métier confirmé |
| gestionnaire | Gestionnaire | OUI — VALIDÉ | mapping métier confirmé |
| employe | Agent | OUI — VALIDÉ | mapping métier confirmé |
| guest | Utilisateur standard | OUI — VALIDÉ | mapping métier confirmé |

Q1. admin correspond-il au rôle métier Administrateur ?  
Décision : [x] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN  
EXCEPTION / commentaire :

Q2. gestionnaire correspond-il au rôle métier Gestionnaire ?  
Décision : [x] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN  
EXCEPTION / commentaire :

Q3. employe correspond-il au rôle métier Agent ?  
Décision : [x] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN  
EXCEPTION / commentaire :

Q4. guest correspond-il au rôle métier Utilisateur standard ?  
Décision : [x] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN  
EXCEPTION / commentaire :

Un NON ou une EXCEPTION ne crée pas automatiquement un nouveau rôle technique. Décrire le sens attendu :

---

## DECISION-004 — Rôles métier absents du modèle actuel — VALIDÉ SUR LE PRINCIPE

Principe validé : pas de nouveau rôle RBAC pour ces responsabilités; scopes/attributs cumulables. Existence organisationnelle, attribution et cumul concret restent à préciser.

Compléter une fiche pour chaque rôle. La correspondance avec un rôle technique existant n'est pas obligatoire.

| Rôle | Existe dans l'organisation ? OUI/NON/UNKNOWN | Doit-il être distinct dans l'ERP ? OUI/NON/EXCEPTION/UNKNOWN | Peut-il être cumulé ? OUI/NON/UNKNOWN | Avec quel rôle ? | EXCEPTION / commentaire |
|---|---|---|---|---|---|
| Direction / Responsable | UNKNOWN | NON — principe validé | OUI — principe validé | Modalités à définir | |
| Comptabilité / Finance | UNKNOWN | NON — principe validé | OUI — principe validé | Modalités à définir | |
| Commercial | UNKNOWN | NON — principe validé | OUI — principe validé | Modalités à définir | |
| Immobilier / Foncier | UNKNOWN | NON — principe validé | OUI — principe validé | Modalités à définir | |

Pour une réponse EXCEPTION, décrire :

---

## DECISION-003 — Périmètre Agent / Gestionnaire — EN ATTENTE

Le périmètre technique reste à définir par module/table; les valeurs UNKNOWN ci-dessous sont conservées.

Ne pas appliquer la même règle automatiquement aux différentes tables. Choix possibles :  
A — créateur · B — propriétaire · C — utilisateur affecté · D — équipe · E — organisation · F — autre · G — aucune restriction de ligne.  
Si aucune règle n'est déterminée, inscrire UNKNOWN. Si la règle varie par table, préciser les tables.

| Module / table(s) | Périmètre Agent (A-G / UNKNOWN) | Périmètre Gestionnaire (A-G / UNKNOWN) | Champ ou relation de référence | Conditions / EXCEPTION |
|---|---|---|---|---|
| Clients / entités | UNKNOWN | UNKNOWN | | |
| Tâches / projets | UNKNOWN | UNKNOWN | | |
| Leads / campagnes | UNKNOWN | UNKNOWN | | |
| Immobilier / locataires / paiements | UNKNOWN | UNKNOWN | | |
| Foncier / villages / lots / attestations | UNKNOWN | UNKNOWN | | |
| Messages / visiteurs / visites | UNKNOWN | UNKNOWN | | |
| Médias / documents | UNKNOWN | UNKNOWN | | |
| Paramètres / utilisateurs / audit | UNKNOWN | UNKNOWN | | |
| Autres tables (nommer) | UNKNOWN | UNKNOWN | | |

Pour chacune de ces deux questions, indiquez le choix par module/table; ne cochez pas un choix global si les règles diffèrent :

- Pour les données de chaque module, comment déterminer le périmètre de l'Agent ?
- Pour les données de chaque module, comment déterminer le périmètre du Gestionnaire ?

EXCEPTION / autre règle :

---

## DECISION-006 — Suppression physique, archivage, restauration — PRINCIPE VALIDÉ

DEFAULT est accepté comme principe; toute exception et toute autorisation sont à définir par table/action. Cette validation n'autorise pas un DELETE physique.

Pour chaque ligne, répondre au niveau métier. Le mécanisme actuel n'impose pas votre décision. DEFAULT suit le gabarit verrouillé; les opérations exactes par table doivent être explicites.

| Table(s) | Suppression physique OUI/NON/EXCEPTION/UNKNOWN | Archivage OUI/NON/EXCEPTION/UNKNOWN | Restauration OUI/NON/EXCEPTION/UNKNOWN | Rôle(s) autorisés | Audit obligatoire OUI/NON/UNKNOWN | Conditions / conservation |
|---|---|---|---|---|---|---|
| Toutes les tables sans exception nommée | DEFAULT | UNKNOWN — l'archivage est une exception par table | DEFAULT | Selon gabarit | UNKNOWN | |
| Exception — nommer chaque table et action | UNKNOWN | UNKNOWN | UNKNOWN | | UNKNOWN | |
| Exception — nommer chaque table et action | UNKNOWN | UNKNOWN | UNKNOWN | | UNKNOWN | |
| Exception — nommer chaque table et action | UNKNOWN | UNKNOWN | UNKNOWN | | UNKNOWN | |

Tables où des routes de cycle de vie distinct existent déjà : foncier lots (archive/restore); propriétés, contrats et paiements immobiliers (delete/restore); médias (delete logique/restore/purge); entités/employés (suppression soft et restore pour entités); finance (annulation puis suppression définitive possible). Ces faits décrivent le système, pas votre choix métier.

---

## DECISION-007 — Actions métier présentes dans le système

Pour chaque action retenue, préciser l'autorité métier, la condition, l'état avant/après, le périmètre et l'audit. N'ajoutez pas d'action qui n'existe pas déjà dans le système.

Fiche à dupliquer pour chaque action :

- Action :
- Table/module :
- Qui peut l'exécuter ? :
- Condition préalable :
- État avant :
- État après :
- Périmètre / dossier concerné :
- Audit obligatoire : [ ] OUI  [ ] NON  [ ] UNKNOWN
- Rôle responsable :
- Validation finale nécessaire : [ ] OUI  [ ] NON  [ ] UNKNOWN
- Décision générale : [ ] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN
- EXCEPTION / commentaire :

Actions relevées dans la cartographie A.2 :

| Action constatée | Module / route connue | Décision | Conditions, état, rôle, audit à préciser |
|---|---|---|---|
| Soumettre une attestation | Foncier, attestation brouillon vers soumis | UNKNOWN | |
| Valider une attestation | Foncier, soumis vers valide | UNKNOWN | |
| Archiver le scan d'attestation | Foncier, valide vers archive | UNKNOWN | |
| Révoquer une attestation | Foncier | UNKNOWN | |
| Archiver / restaurer un lot | Foncier | UNKNOWN | |
| Terminer un contrat | Immobilier, contrat de bail | UNKNOWN | |
| Publier un layout | Site vitrine / page layout | UNKNOWN | |
| Modifier l'état de publication d'une réalisation ou d'un lot | Site vitrine, champs de publication | UNKNOWN | |
| Remplacer / restaurer / purger un média | Media | UNKNOWN | |
| Annuler une opération financière; suppression définitive d'une opération déjà annulée | Finance | UNKNOWN | |
| Traiter une campagne / activer ou désactiver une règle d'automatisation | Leads / campagnes / automatisations | UNKNOWN | |
| Affecter un lead via le champ assigned_to | Leads | UNKNOWN | Confirmer si c'est une action métier distincte et qui peut le faire |
| Autre action déjà présente (nommer route) | | UNKNOWN | |

La cartographie n'a pas établi de route métier dédiée pour toutes les actions génériques possibles. « Rejeter », « clôturer », « approuver » ou « confirmer » ne sont pas présumés présents lorsqu'aucune route/action correspondante n'a été identifiée.

---

## DECISION-005 — Export

Principe déjà verrouillé : export restrictif par défaut. Une table sans exception explicite reste NON. Répondre uniquement aux mécanismes relevés; ajouter les exceptions nécessaires.

| Table/module | Mécanisme / format détecté | Export autorisé OUI/NON/EXCEPTION/UNKNOWN | Rôles autorisés | Périmètre | Audit obligatoire OUI/NON/UNKNOWN |
|---|---|---|---|---|---|
| Foncier — journal d'audit | CSV généré dans le navigateur | UNKNOWN | | | UNKNOWN |
| Foncier — attestations / documents | impression HTML/PDF côté navigateur | UNKNOWN | | | UNKNOWN |
| Finance | rapport / impression côté frontend | UNKNOWN | | | UNKNOWN |
| Dashboard — rapport | rapport généré depuis l'API report | UNKNOWN | | | UNKNOWN |
| Immobilier — paiements | rapports / impression frontend | UNKNOWN | | | UNKNOWN |
| Documents | impression navigateur | UNKNOWN | | | UNKNOWN |
| Autre mécanisme (nommer) | | UNKNOWN | | | UNKNOWN |

Format : [ ] CSV  [ ] XLSX  [ ] PDF  [ ] JSON  [ ] autre :  
EXCEPTION table/module/rôle/périmètre :

---

## DECISION-008 — CMS et contenu public

Définir le cycle métier proposé. Le fait qu'un contenu soit publiable ne signifie pas qu'il est publié. Pour le contenu public, distinguer strictement brouillon, validé et publié.

| Étape | Qui peut agir ? | Condition / état avant-après | Audit obligatoire OUI/NON/UNKNOWN |
|---|---|---|---|
| Créer un brouillon | | | UNKNOWN |
| Modifier un brouillon | | | UNKNOWN |
| Valider un contenu | | | UNKNOWN |
| Publier | | | UNKNOWN |
| Dépublier | | | UNKNOWN |
| Supprimer | | | UNKNOWN |

- Le public peut-il consulter le contenu publié ? [ ] OUI [ ] NON [ ] EXCEPTION [ ] UNKNOWN
- Le public peut-il rechercher le contenu publié ? [ ] OUI [ ] NON [ ] EXCEPTION [ ] UNKNOWN
- Les contenus non publiés sont-ils strictement privés ? [ ] OUI [ ] NON [ ] EXCEPTION [ ] UNKNOWN
- Qui décide et trace le changement d'état public ? :

Parcours publics adjacents à considérer : layouts publiés; lots/réalisations publiés; assets de marque; formulaire de contact; capture de lead; demande d'intérêt pour un lot. Décrire les champs publics exacts et les rôles de gestion, si une exception est voulue :

---

## DECISION-009 — Routes sans garde d'authentification locale repérée

La Phase A.2 n'a pas prouvé qu'aucun middleware global ne s'applique. La question ci-dessous porte sur l'exposition métier attendue. Pour chaque famille, statuer sur les opérations séparément et décrire les données publiques permises. Ne pas demander de correction de code ici.

Fiche de réponse : Route(s) / action(s) ; fonction et données exposées ; doit-elle être publique ? [ ] OUI [ ] NON [ ] EXCEPTION [ ] UNKNOWN ; si publique, champs publics exacts ; si privée, rôle(s) ; audit/conditions ; commentaire.

| Route(s) observée(s) | Fonction / données concernées | Décision | Rôles si privée / champs si publique | Audit / conditions |
|---|---|---|---|---|
| GET/POST /api/v1/finance; GET /api/v1/finance/{finance_id} | opérations et montants financiers; POST crée une opération, authentification facultative dans handler | UNKNOWN | | |
| CRUD /api/v1/employees; GET search/suggest | dossiers employés, salaire et coordonnées | UNKNOWN | | |
| GET/POST/PATCH/DELETE /api/v1/entities; GET resolve/search/check-duplicate; POST bulk, restore, migrate/party | entités et données personnelles | UNKNOWN | | |
| /api/v1/immobilier/properties, /contracts, /payments (CRUD, stats, restore, terminate) | patrimoine, baux, paiements | UNKNOWN | | |
| CRUD /api/v1/products | produits/fournitures | UNKNOWN | | |
| CRUD /api/v1/projects | projets | UNKNOWN | | |
| CRUD /api/v1/suppliers; GET search/suggest | fournisseurs/contacts | UNKNOWN | | |
| GET/POST/PATCH/DELETE /api/v1/tasks | tâches et données d'affectation | UNKNOWN | | |
| CRUD /api/v1/tenants; GET search/suggest | locataires et relations parties | UNKNOWN | | |
| GET /api/v1/settings, /category/{category}, /audit, /{key} | paramètres/configuration et journal | UNKNOWN | | |
| /api/v1/foncier GET villages/lots/attestations et checks duplicate/exists; export-lots (actuellement 501) | données foncières, attestations, tentative export | UNKNOWN | | |
| POST /api/v1/rpc/{name} avec utilisateur optionnel | fonctions dispatchées, dont actions Foncier | UNKNOWN | | |

Route authentifiée mais sans permission de rôle distincte pour le rapport : GET /api/v1/dashboard/report. Ne pas la traiter comme anonyme; décider les rôles de rapport dans DECISION-005.

Ne pas confondre avec routes publiques explicitement conçues et gardées par leurs contrats actuels : lecture CMS, layout publié, listes publiques filtrées de lots/réalisations, brand assets, POST contact strict, capture lead et inquiry lot. Leur périmètre public exact reste à confirmer dans DECISION-008 ou ci-dessous :

| Route publique/optionnelle identifiée | Publique OUI/NON/EXCEPTION/UNKNOWN | Données/champs publics exacts / limites |
|---|---|---|
| GET contenu CMS | UNKNOWN | |
| GET layout publié | UNKNOWN | |
| GET listes lots/réalisations publiés | UNKNOWN | |
| GET assets de marque | UNKNOWN | |
| POST formulaire contact borné | UNKNOWN | |
| POST capture de lead | UNKNOWN | |
| POST demande d'intérêt pour un lot | UNKNOWN | |

---

## DECISION-002 — Exceptions à la matrice des 38 tables

Base pour chaque table : DEFAULT = gabarit RBAC Phase 3.4. Ne recopiez pas les permissions par défaut. Remplir une ligne uniquement pour un écart métier voulu. Omettre les autres lignes signifie qu'aucune exception n'est décidée; l'UNKNOWN reste bloquant là où une permission n'est pas déterminée par le gabarit.

| Table | Base | Exception rôle/action | Décision OUI/NON/EXCEPTION/UNKNOWN | Périmètre / état | Conditions / audit |
|---|---|---|---|---|---|
| tasks | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| taches | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| properties | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| lease_contracts | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| rent_payments | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| documents | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| contact_messages | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| page_layouts | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| site_realisations | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| vitrine_lots | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| messages_direction | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| employes_presence | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| visites_en_cours | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| activites_journal | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| stats_journalieres | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| site_content | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| visiteurs | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| visites_du_jour | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| lead_campaigns | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| lead_interactions | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| foncier_villages | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| parties | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| party_roles | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| party_lead_details | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| leads | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| lead_captures | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| media_files | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| media_versions | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| media_usage | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| media_audit_logs | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| app_settings | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| user_profiles | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| visites_terrain | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| ventes_foncieres | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| campagnes_marketing | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| visites | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| opportunites | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| social_posts | DEFAULT | UNKNOWN — préciser seulement si exception | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

### Exceptions proposées par le responsable métier

| # | Table | Rôle métier | Action | OUI / NON / EXCEPTION / UNKNOWN | Périmètre / état | Audit / commentaire |
|---|---|---|---|---|---|---|
| 1 | | | | UNKNOWN | | |
| 2 | | | | UNKNOWN | | |
| 3 | | | | UNKNOWN | | |
| 4 | | | | UNKNOWN | | |
| 5 | | | | UNKNOWN | | |
| 6 | | | | UNKNOWN | | |
| 7 | | | | UNKNOWN | | |
| 8 | | | | UNKNOWN | | |

La Phase A.2 a établi que les 38 noms génériques comprennent notamment des tables de clients/parties, tâches, finance/immobilier, foncier, leads, visites, médias, paramètres et site vitrine. Cette liste n'affirme pas qu'une exception est nécessaire. Les routes métier dédiées doivent aussi suivre les décisions prises pour la ressource correspondante.

---

## Registre des décisions

### DÉCISIONS VALIDÉES

- DECISION-001 : VALIDÉ — quatre mappings techniques ↔ métiers tels qu'inscrits ci-dessus.
- DECISION-004 : VALIDÉ sur le principe — pas de nouveaux rôles RBAC; responsabilités/scopes cumulables. Modalités à préciser.
- DECISION-006 : VALIDÉ sur le principe — DEFAULT accepté; exceptions/table/action à définir.
- DECISION-005 : principe export restrictif par défaut déjà verrouillé; exceptions UNKNOWN.

### DÉCISIONS RESTANT À DÉFINIR

- DECISION-002 : toute dérogation au gabarit par table/action et validation du périmètre.
- DECISION-003 : périmètre technique Agent/Gestionnaire par module/table (EN ATTENTE).
- DECISION-004 : existence organisationnelle, attribution et règles concrètes de cumul.
- DECISION-005 : exceptions de format, rôle, scope et audit par export.
- DECISION-006 : exceptions de suppression, archivage et restauration; rôles et audit par table.
- DECISION-007 : rôles, conditions d'état, scope et audit des actions listées.
- DECISION-008 : autorité du cycle brouillon/validé/publié et portée publique.
- DECISION-009 : visibilité attendue des routes sans garde locale observée et éventuel middleware.

---

## Validation

Responsable métier :  
Fonction :  
Date :  
Référence de validation / commentaire :

**Cette fiche n'autorise aucune modification applicative. La Phase 3.4 ne commence qu'après validation explicite des décisions métier.**
