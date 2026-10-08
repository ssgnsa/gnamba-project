# RBAC PHASE B.6 — VALIDATION MÉTIER

**Fiche de validation destinée à la Direction et aux responsables métier**  
**Statut : à remplir, contrôler et valider avant le modèle cible B.7**  
**Phase strictement documentaire — READ-ONLY — aucune implémentation**

## 1. Objet

Obtenir les décisions métier nécessaires avant de concevoir le modèle RBAC cible et son plan de migration : identité, responsabilités, hiérarchie, périmètres, relations parentales, accès Foncier, cycle de vie, partage public, exports et audit.

Ce document distingue explicitement :

- les décisions déjà validées et non soumises à nouveau au vote;
- les questions ouvertes, initialisées à `UNKNOWN`;
- les options de conception, étiquetées `PROPOSITION TECHNIQUE — NON VALIDÉE`;
- les faits techniques issus des cartographies, qui ne constituent pas des décisions métier.

## 2. Périmètre

Référentiels consultés : `RBAC_PHASE_A2_CARTOGRAPHIE.md`, `RBAC_PHASE_A2_GAP_MATRIX.md`, `RBAC_ROLE_MAPPING_UNKNOWN.md`, `RBAC_PHASE_B_DECISIONS_METIER.md`, `RBAC_PHASE_B_VALIDATION_A_REMPLIR.md`, `RBAC_PHASE_B2_SCOPE_CARTOGRAPHIE.md`, `RBAC_PHASE_B4_DECISION_003_A_VALIDER.md`, `RBAC_PHASE_B4.2_TECHNICAL_VERIFICATION.md`, `RBAC_PHASE_B5_CADRAGE_TECHNIQUE.md`. Aucun document B.4.1 distinct n'a été repéré; le registre officiel Phase B.1 fait foi pour les décisions générales.

Les constats techniques utiles, à considérer comme contexte et non comme votes :

- Il n'existe pas de relation Agent→Gestionnaire active démontrée. La migration historique `009` contenait `employees.superieur_id`, mais ce lien est absent du modèle courant et du runtime B.4.2.
- Le lien d'identité Agent–Employee–Task n'est pas cohérent entre migrations historiques, modèle courant et runtime.
- L'affectation des leads existe sous des représentations incompatibles (`assigne_a`, `assigned_to` metadata/texte); la résolution vers le principal courant n'est pas établie.
- `UserVillageAccess` est l'ACL géographique reconnue; la clé User/runtime n'est pas structurellement alignée, le runtime examiné contient 0 affectation et la couverture des routes est partielle. Aucun mécanisme initial fiable d'amorçage n'a été trouvé.
- Documents et médias n'ont pas de lien parent qui garantisse l'héritage de scope end-to-end. `uploaded_by` est une trace, pas une règle d'accès.
- Le statut public des parcours sans garde locale n'est pas établi par la cartographie.

**Mode de réponse commun :** pour chaque identifiant B6, choisir l'option demandée, inscrire les conditions et nommer le décideur. `UNKNOWN` signifie qu'aucun droit ni lien ne sera déduit. Pour une réponse `CONDITIONNELLE`, préciser la condition vérifiable. Pour une exception, préciser rôle/fonction, table/module, action, périmètre, état, durée et audit.

### Mode d'emploi de la fiche

1. Les sections 5 à 21 présentent les questions et les options métier. Le **registre de l'Annexe A est l'unique registre de réponse faisant foi**; reporter chaque choix dans la ligne portant le même ID.
2. Ne pas modifier les règles prévalidées de la section 3. Pour les champs d'exception, indiquer `AUCUNE — DEFAULT` si le défaut validé s'applique, ou décrire l'exception complète.
3. Pour chaque réponse, remplir conditions/périmètre, responsable de la décision, date, référence de compte rendu et état de revue. Une réponse partielle demeure `UNKNOWN`.
4. États de revue autorisés : `À REMPLIR`, `COMPLET — À CONTRÔLER`, `CONTRADICTOIRE — ARBITRAGE REQUIS`, `VALIDÉ MÉTIER`, `REPORTÉ`. Seul `VALIDÉ MÉTIER` accompagné d'un responsable, d'une date et d'une référence peut être utilisé comme décision.
5. Aucun répondant ne doit résoudre une incohérence par déduction. Inscrire les IDs en conflit au registre des contradictions, obtenir un arbitrage métier écrit, puis corriger les lignes concernées en conservant la référence.

### Contrôle préalable à B.7

B.7 ne commence qu'après contrôle du registre complet :

- chaque ID a une réponse ou reste explicitement `UNKNOWN`/`REPORTÉ` avec responsable et motif;
- chaque `CONDITIONNEL` comporte une condition observable, un responsable et une date d'effet/expiration si pertinente;
- chaque `EXCEPTION` nomme les rôles/fonctions, objets, actions, lignes/champs, états, durée et audit concernés;
- les principes DEFAULT restent appliqués lorsqu'aucune exception n'a été validée;
- les contradictions croisées listées en Annexe B sont marquées résolues par une décision métier référencée, ou restent bloquantes;
- les totaux UNKNOWN/bloquants sont recalculés après validation; le décompte de la présente version est le décompte initial, avant réponses.

## 3. Règles déjà validées

Ces règles sont acquises. Ne pas les réouvrir dans les sections questionnaire; les questions restantes portent sur leurs modalités d'application et exceptions.

### DECISION-001 — mapping validé

| Rôle technique | Libellé métier validé |
|---|---|
| `admin` | Administrateur |
| `gestionnaire` | Gestionnaire |
| `employe` | Agent |
| `guest` | Utilisateur standard |

L'ancien `RBAC_ROLE_MAPPING_UNKNOWN.md` décrit l'état historique A.2 et indique lui-même qu'il est supersédé par la validation Phase B.1.

### DECISION-004 — principe validé

Direction/Responsable, Comptabilité/Finance, Commercial et Immobilier/Foncier ne deviennent pas de nouveaux rôles RBAC. Ce sont des fonctions/scopes/attributs cumulables en principe. Leur existence dans l'organisation, leur attribution, leur cumul concret et leurs droits d'action restent à décider.

### Principes généraux validés

1. Le backend est l'autorité de sécurité; la visibilité frontend n'est pas une protection.
2. Une autorisation combine au minimum rôle, action et périmètre lorsqu'un périmètre s'applique.
3. `created_by` n'établit pas automatiquement la propriété métier.
4. Les ACL existantes doivent être respectées; aucun deuxième mécanisme géographique ne remplace `UserVillageAccess`.
5. Le scope Foncier s'appuie sur `UserVillageAccess`.
6. Les documents suivent le périmètre de leur parent métier.
7. Les médias suivent le périmètre de leur parent métier; `uploaded_by` reste une information de traçabilité.
8. L'utilisateur standard est limité à son propre profil. B.4.1 autorise l'Administrateur à dépasser cette limite, sans décider quels champs sensibles sont visibles.
9. La suppression physique n'est pas la règle métier par défaut.
10. L'archivage est privilégié lorsqu'il existe une notion métier d'archivage.
11. La restauration est réservée à l'Administrateur par défaut.
12. Les exports sont restrictifs par défaut; aucune exception n'est implicite.
13. Les inconnues restent `UNKNOWN`.
14. Une hypothèse ou proposition technique ne devient jamais une décision métier.

Pour le compte rendu terminal, le décompte est regroupé en **19 décisions déjà validées comptées comme entrées** : les 4 correspondances de DECISION-001, le principe DECISION-004 et les 14 principes généraux listés ci-dessus.

## 4. Décisions encore UNKNOWN

Les réponses ci-dessous n'existent pas encore sous une forme métier validée ou restent explicitement en attente dans les documents sources :

- les trois périmètres Gestionnaire Tasks, Leads et profils d'équipe;
- la cardinalité et le cycle de vie des relations utilisateur/employé, affectations, hiérarchie et parents document/media;
- la gouvernance, le bootstrap, la cumulativité et les opérations permises par niveau `UserVillageAccess`;
- les exceptions de table/action aux principes de cycle de vie, d'export et de lecture publique;
- les champs et actes métier autorisés pour profils, données publiées, audits, délégations, départs et transferts.

Aucun de ces sujets n'est prérempli par supposition. Les principes déjà validés de la section 3 demeurent en vigueur même si une modalité ci-dessous reste inconnue.

## 5. Questionnaire identité

### B6-ID-01 — Compte EGS obligatoire pour tout Agent

**Question métier :** tout Agent doit-il obligatoirement disposer d'un compte EGS ?  
**Choix :** [ ] OUI  [ ] NON  [ ] CONDITIONNEL  [x] UNKNOWN  [ ] Autre : __________  
Condition / exceptions : ____________________  **Décision : UNKNOWN**  
**Impact :** accès aux tâches, leads, profils, audit et offboarding.

### B6-ID-02 — Utilisateur sans fiche Employé

Un utilisateur EGS peut-il exister sans fiche Employé ?  
[ ] OUI  [ ] NON  [ ] CONDITIONNEL  [x] UNKNOWN — cas concernés : __________  
Précisions : ____________________  **Décision : UNKNOWN**  
**Impact :** cardinalité User–Employee et utilisateurs non-Agent.

### B6-ID-03 — Fiche Employé sans compte

Une fiche Employé peut-elle exister sans compte utilisateur ?  
[ ] OUI  [ ] NON  [ ] CONDITIONNEL  [x] UNKNOWN — cas concernés : __________  
Précisions : ____________________  **Décision : UNKNOWN**  
**Impact :** dossiers RH, authentification et tâches affectables.

### B6-ID-04 — Nombre de comptes par Agent

Un Agent peut-il avoir plusieurs comptes ?  
[ ] 0..1  [ ] exactement 1  [ ] plusieurs  [ ] autre : ______  [x] UNKNOWN  
Comptes nominatifs/partagés; justification : ____________________  **Décision : UNKNOWN**  
**Impact :** unicité, audit nominatif, désactivation et résolution User↔Employee.

### B6-ID-05 — Nombre de fiches Employé par compte

Un compte utilisateur peut-il être lié à plusieurs fiches Employé ?  
[ ] NON  [ ] OUI  [ ] CONDITIONNEL  [x] UNKNOWN  [ ] autre : ______  
Cas métier : ____________________  **Décision : UNKNOWN**  
**Impact :** jointure User→Employee et scope des tâches.

### B6-ID-06 — Identité métier commune `Entity`

L'identité personne commune aux modules doit-elle être portée par `Entity` ?  
[ ] OUI  [ ] NON  [ ] CONDITIONNEL  [x] UNKNOWN  [ ] autre : ______  
Préciser comptes/dossiers qui partageraient la même identité : ____________________  **Décision : UNKNOWN**

**Implications à arbitrer, sans présumer la réponse :** une Entity commune peut unifier les coordonnées et l'historique quand une personne change de fonction ou intervient dans plusieurs modules. Elle ne constitue pas à elle seule un principal d'authentification. Il faut fixer les cardinalités, les règles de fusion/dédoublonnage, les identités pouvant être liées et la conservation d'historique.  
**Impact :** modèle User–Employee–Lead, changements de fonction et audit des accès.

### B6-ID-07 — Départ d'un Employé

Que devient l'accès et le dossier lors du départ ?  
[ ] compte désactivé à la date effective  [ ] autre : ______  [x] UNKNOWN  
Accès immédiatement révoqués ? [ ] OUI [ ] NON [ ] CONDITIONNEL [x] UNKNOWN  
Tâches : [ ] conservées [ ] réaffectation obligatoire [ ] autre [x] UNKNOWN  
Leads : [ ] conservés [ ] réaffectation obligatoire [ ] autre [x] UNKNOWN  
Documents/médias : [ ] conservés selon parent [ ] autre [x] UNKNOWN  
Historique / date d'effet / décideur : ____________________  **Décision : UNKNOWN**  
**Impact :** identité, affectations, propriété métier, rétention et audit.

## 6. Questionnaire hiérarchie

### B6-MGR-01 — Nombre de Gestionnaires par Agent

**Question métier :** un Agent peut-il avoir plusieurs Gestionnaires ?  
**Choix :** [ ] un seul  [ ] plusieurs  [ ] un principal + suppléants  [ ] aucun  [ ] autre : ______  [x] UNKNOWN  
Règle : ____________________  **Décision : UNKNOWN**  **Impact :** périmètres Tasks, Leads, profils et documents.

### B6-MGR-02 — Nature du rattachement

[ ] permanent  [ ] temporaire  [ ] lié au service  [ ] lié à une fonction  [ ] lié à une mission  [ ] autre : _____  [x] UNKNOWN  
Date d'effet/fin et condition : ____________________  **Décision : UNKNOWN**  **Impact :** historique et calcul du scope.

### B6-MGR-03 — Plusieurs Agents

Un Gestionnaire peut-il superviser plusieurs Agents ? [ ] OUI [ ] NON [ ] CONDITIONNEL [x] UNKNOWN  
Maximum / conditions : ____________________  **Décision : UNKNOWN**  **Impact :** cardinalité de la relation.

### B6-MGR-04 — Changement de Gestionnaire

Un Agent peut-il changer de Gestionnaire ? [ ] OUI [ ] NON [ ] CONDITIONNEL [x] UNKNOWN  
Qui valide et à partir de quelle date ? ____________________  **Décision : UNKNOWN**  **Impact :** accès courant vs passé.

### B6-MGR-05 — Historique

Faut-il conserver l'historique des rattachements et périodes ? [ ] OUI [ ] NON [ ] CONDITIONNEL [x] UNKNOWN  
Durée, accès à l'historique et audit : ____________________  **Décision : UNKNOWN**  **Impact :** période de responsabilité et preuve d'accès.

### B6-MGR-06 — Délégation

Une délégation temporaire est-elle admise ? [ ] OUI [ ] NON [ ] CONDITIONNEL [x] UNKNOWN  
Si oui, compléter : qui délègue ______; à qui ______; durée/date d'expiration ______; actions transférées ______; actions exclues ______; révocation ______; audit/motif ______.  **Décision : UNKNOWN**  **Impact :** privilèges, durée et traçabilité.

### B6-MGR-07 — Périmètre identique par module

Le lien Gestionnaire→Agent doit-il produire le même périmètre pour Tasks, Leads, profils, Documents et Media ?  
[ ] OUI, mêmes personnes et mêmes périodes  [ ] NON, règles par module  [ ] CONDITIONNEL  [x] UNKNOWN  
Décrire divergences : ____________________  **Décision : UNKNOWN**  **Impact :** scopes distincts par domaine.

## 7. Questionnaire tâches

DECISION-003 confirme le besoin métier d'un scope Agent Tasks affectées à l'Agent, mais l'affectation/authentification n'est pas techniquement fiable. Le scope Gestionnaire Tasks reste `UNKNOWN-01`. Les actions précises ci-dessous ne sont pas déduites de cette confirmation de périmètre.

| ID | Question à trancher | Choix / champs de réponse | Décision | Impact |
|---|---|---|---|---|
| B6-TASK-01 | Qui peut créer une tâche ? | Administrateur / Gestionnaire / Agent / fonction explicite / condition / autre : ___ | UNKNOWN | création et audit |
| B6-TASK-02 | Une tâche peut-elle avoir un seul Agent responsable ? | OUI / NON / CONDITIONNEL; règle : ___ | UNKNOWN | cardinalité d'affectation |
| B6-TASK-03 | Peut-elle avoir plusieurs participants ? | NON / OUI / CONDITIONNEL; participants vs responsables : ___ | UNKNOWN | visibilité et responsabilité |
| B6-TASK-04 | Existe-t-il un responsable principal distinct des participants ? | OUI / NON / CONDITIONNEL; critère : ___ | UNKNOWN | affectation et transfert |
| B6-TASK-05 | Une tâche peut-elle exister avant affectation ? | OUI / NON / CONDITIONNEL; qui la voit : ___ | UNKNOWN | objets non assignés |
| B6-TASK-06 | Qui voit une tâche non assignée ? | choix par rôle/fonction; scope : ___ | UNKNOWN | pas d'accès global implicite |
| B6-TASK-07 | Qui peut modifier une tâche et dans quels états ? | rôles/fonctions + états avant/après : ___ | UNKNOWN | modification et état métier |
| B6-TASK-08 | Qui peut affecter/réaffecter, vers quels Agents et avec quel motif ? | rôle/fonction; source/destination permises : ___ | UNKNOWN | transfert et audit |
| B6-TASK-09 | Qui peut clôturer une tâche ? | rôle/fonction; condition; validation finale : ___ | UNKNOWN | transition d'état |
| B6-TASK-10 | Qui peut rouvrir une tâche clôturée ? | rôle/fonction; motif; fenêtre de temps : ___ | UNKNOWN | réouverture et historique |
| B6-TASK-11 | Qui peut archiver ou demander une suppression exceptionnelle ? | rôle/fonction; conservation; hard delete si exception : ___ | UNKNOWN | DECISION-006 et audit |
| B6-TASK-12 | Qui peut exporter les tâches et quel périmètre/champs ? | rôle/fonction; format; scope; audit : ___ | UNKNOWN | export restrictif par défaut |
| B6-TASK-13 | Que devient une tâche lors du départ de son responsable ? | conserver / réaffecter / autre; qui et délai : ___ | UNKNOWN | continuité et historique |

Pour UNKNOWN-01 — Gestionnaire → tâches, choisir le périmètre : [ ] A ses propres tâches [ ] B tâches des Agents directement rattachés [ ] C tâches du service [ ] D tout son périmètre fonctionnel [ ] E autre : ______ [ ] F aucune tâche d'autrui [x] UNKNOWN. Répondre séparément pour consultation, création, modification, affectation/réaffectation, clôture/réouverture, archivage/suppression et export. Conditions/états : ____________________.

## 8. Questionnaire leads

DECISION-003 confirme le scope métier « leads affectés à l'Agent »; le lien technique courant reste incohérent. Le périmètre Gestionnaire commercial est `UNKNOWN-02`.

| ID | Question à trancher | Choix / champ métier | Décision | Impact |
|---|---|---|---|---|
| B6-LEAD-01 | Un lead appartient-il à un seul Agent ? | OUI / NON / CONDITIONNEL; cas : ___ | UNKNOWN | cardinalité |
| B6-LEAD-02 | Plusieurs Agents/responsables peuvent-ils partager un lead ? | NON / OUI; règles de visibilité : ___ | UNKNOWN | confidentialité commerciale |
| B6-LEAD-03 | Existe-t-il un responsable principal ? | OUI / NON / CONDITIONNEL; rôle : ___ | UNKNOWN | arbitrage de responsabilité |
| B6-LEAD-04 | Le lead peut-il être transféré ? | OUI / NON / CONDITIONNEL; cas : ___ | UNKNOWN | continuité |
| B6-LEAD-05 | Qui peut transférer/réaffecter un lead ? | rôle/fonction + périmètre de destination : ___ | UNKNOWN | action sensible |
| B6-LEAD-06 | Faut-il conserver l'historique des affectations ? | OUI / NON / durée et champs : ___ | UNKNOWN | audit et accès historique |
| B6-LEAD-07 | Que devient le lead quand l'Agent quitte l'organisation ? | réaffectation / file commune / autre; qui/délai : ___ | UNKNOWN | offboarding |
| B6-LEAD-08 | Un Gestionnaire peut-il réaffecter les leads de son périmètre ? | OUI / NON / CONDITIONNEL; limites : ___ | UNKNOWN | UNKNOWN-02 |
| B6-LEAD-09 | La réaffectation exige-t-elle motif et audit ? | OUI / NON / CONDITIONNEL; précision : ___ | UNKNOWN | traçabilité |
| B6-LEAD-10 | Un lead peut-il rester sans responsable ? | OUI / NON / CONDITIONNEL; qui le voit : ___ | UNKNOWN | leads non affectés |
| B6-LEAD-11 | Un lead peut-il être partagé entre équipes ? | OUI / NON / CONDITIONNEL; quelles équipes : ___ | UNKNOWN | scope commercial |
| B6-LEAD-12 | Le responsable doit-il obligatoirement avoir un compte EGS ? | OUI / NON / CONDITIONNEL; cas : ___ | UNKNOWN | lien vers principal authentifié |
| B6-LEAD-13 | Une Entity sans compte peut-elle être responsable métier ou propriétaire de lead ? | OUI / NON / CONDITIONNEL; distinction : ___ | UNKNOWN | identité vs utilisateur |

Pour UNKNOWN-02 — Gestionnaire → leads, choisir : [ ] A ses propres leads [ ] B leads des Agents directement rattachés [ ] C leads du service [ ] D périmètre commercial explicitement attribué [ ] E autre : ______ [ ] F aucun accès aux leads d'autrui [x] UNKNOWN. Actions séparées : consulter ___; créer ___; modifier ___; affecter/réaffecter ___; convertir ___; clôturer ___; archiver ___; exporter ___. Préciser condition/état : ____________________.

## 9. Questionnaire Foncier

Le principe d'architecture est acquis : `UserVillageAccess` demeure le mécanisme ACL géographique; aucun deuxième scope géographique ne doit le remplacer. La base runtime consultée présentait 0 ACL et un désalignement des types d'identifiants; le mécanisme applicatif d'octroi exige déjà un accès `gestionnaire` pour pouvoir accorder un accès. La cause technique observée est l'absence de bootstrap/seed repéré et un parcours d'octroi circulaire; la raison opérationnelle historique du zéro reste UNKNOWN.

| ID | Décision métier | Choix à inscrire | Statut initial | Impact |
|---|---|---|---|---|
| B6-FON-01 | Qui attribue le premier accès Foncier d'un utilisateur/village ? | Administrateur / Gestionnaire Foncier explicitement attribué / Direction / autre : ___ | UNKNOWN | résoudre le bootstrap sans auto-attribution implicite |
| B6-FON-02 | Qui peut attribuer un utilisateur à un village après bootstrap ? | fonctions permises; villages accessibles pour gérer : ___ | UNKNOWN | gouvernance ACL |
| B6-FON-03 | Qui peut révoquer un accès ? | fonctions permises; effet immédiat/différé : ___ | UNKNOWN | révocation et audit |
| B6-FON-04 | Qui peut modifier un niveau d'accès ? | fonctions permises; changements autorisés : ___ | UNKNOWN | élévation de droits |
| B6-FON-05 | Un utilisateur peut-il avoir accès à plusieurs villages ? | NON / OUI / CONDITIONNEL; limite et règles : ___ | UNKNOWN | cardinalité géographique |
| B6-FON-06 | Les quatre niveaux sont-ils hiérarchiques/cumulatifs ? | A hiérarchiques/cumulatifs / B indépendants / C exclusifs / D autre : ___ | UNKNOWN | ne pas reprendre l'ordre technique comme règle métier |
| B6-FON-07 | Quel est le détenteur métier responsable de chaque village et comment est-il désigné ? | fonction, procédure, date d'effet : ___ | UNKNOWN | attribution initiale, gestion et audit |

### Accès multi-village et opérations globales

| ID | Question métier | Réponse / conditions | Statut |
|---|---|---|---|
| B6-FON-GLOBAL-01 | Un utilisateur ayant accès à plusieurs villages ne voit-il que ces villages ? | OUI / NON / CONDITIONNEL; exceptions : ___ | UNKNOWN |
| B6-FON-GLOBAL-02 | Existe-t-il une fonction autorisée à accéder à tous les villages ? | OUI / NON / CONDITIONNEL; qui, actions et motif : ___ | UNKNOWN |
| B6-FON-GLOBAL-03 | Qui peut consulter des statistiques globales ? | rôle/fonction; données; champs agrégés; audit : ___ | UNKNOWN |
| B6-FON-GLOBAL-04 | Qui peut exporter des données de plusieurs villages ? | rôle/fonction; scope; champs; format; audit : ___ | UNKNOWN |
| B6-FON-GLOBAL-05 | Qui peut lancer ou gérer une synchronisation globale ? | rôle/fonction; village(s); approbation et audit : ___ | UNKNOWN |
| B6-FON-GLOBAL-06 | Qui peut gérer les ACL de tous les villages ? | rôle/fonction; attribution initiale, approbation, audit : ___ | UNKNOWN |
| B6-FON-GLOBAL-07 | Les opérations globales exigent-elles un rôle technique ou une permission fonctionnelle explicite ? | rôle / scope explicitement attribué / autre : ___; cumul : ___ | UNKNOWN |

Précisions obligatoires pour toute réponse : l'identité du compte ciblé; les comptes inactifs; la date de prise d'effet; la fin/révocation; les doublons; les attributions historiques; le motif; la personne qui approuve; la trace consultable; la correction d'une mauvaise attribution. Aucune ligne d'ACL ne sera créée par ce questionnaire.

## 10. Matrice niveaux Foncier

Pour chacune des actions, choisir `OUI / NON / CONDITIONNEL / UNKNOWN` séparément pour chaque niveau. Une décision OUI porte uniquement sur un village auquel le principal a accès selon `UserVillageAccess`; elle ne donne pas d'accès à d'autres villages. Les actions génériques de suppression/récupération ne dérogent pas au principe DEFAULT validé sans exception explicite.

| ID / action | lecteur | agent | validateur | gestionnaire | Conditions / observations métier |
|---|---|---|---|---|---|
| B6-FON-MAT-01 — Consulter les villages autorisés | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-FON-MAT-02 — Consulter les lots | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-FON-MAT-03 — Rechercher dans les données village | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-FON-MAT-04 — Créer un lot | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-FON-MAT-05 — Modifier un lot | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-FON-MAT-06 — Archiver un lot | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Motif, état préalable, audit |
| B6-FON-MAT-07 — Restaurer un lot | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DEFAULT restaurateur Admin; exception éventuelle à décrire |
| B6-FON-MAT-08 — Créer une attestation | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-FON-MAT-09 — Modifier une attestation | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | États concernés |
| B6-FON-MAT-10 — Valider une attestation | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | séparation saisie/validation |
| B6-FON-MAT-11 — Rejeter une attestation | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Motif et état suivant |
| B6-FON-MAT-12 — Céder / enregistrer une cession | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Vérifier le nom et l'étape métier de l'action existante |
| B6-FON-MAT-13 — Consulter l'historique d'un objet | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-FON-MAT-14 — Gérer les propriétaires | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Données accessibles et changements audités |
| B6-FON-MAT-15 — Gérer les occupants | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Données accessibles et changements audités |
| B6-FON-MAT-16 — Consulter les statistiques du village | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Distinguer un village autorisé des stats globales |
| B6-FON-MAT-17 — Exporter des données Foncier | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Champs, nombre de villages, format, audit; DEFAULT restrictif |
| B6-FON-MAT-18 — Synchroniser des données | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Sync d'un village ou globale; opération potentiellement destructive |
| B6-FON-MAT-19 — Gérer l'ACL User–Village | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Le bootstrap initial est une décision distincte |
| B6-FON-MAT-20 — Supprimer physiquement | NON par défaut | NON par défaut | NON par défaut | NON par défaut | Toute exception doit nommer rôle, objet, condition et audit |
| B6-FON-MAT-21 — Récupérer / restaurer | Admin par défaut | Admin par défaut | Admin par défaut | Admin par défaut | Ces valeurs reprennent le principe validé; exception explicite à renseigner |

**Décision de cumul à confirmer par B6-FON-06 :** le code compare actuellement les niveaux en ordre croissant; ce comportement technique n'est pas la décision métier. Si les niveaux sont indépendants, préciser la permission requise par chaque action plutôt que d'hériter mécaniquement des niveaux inférieurs.

## 11. Questionnaire documents

La règle générale parent métier → périmètre du parent est validée. Cette section tranche les cas de rattachement, de publication et les éventuelles exceptions; elle ne demande pas si uploader/créateur devient propriétaire.

| ID | Question métier | Réponse / précision | Statut | Impact |
|---|---|---|---|---|
| B6-DOC-01 | Tout document doit-il appartenir à un projet/dossier métier ? | OUI / NON / CONDITIONNEL; catégories : ___ | UNKNOWN | rattachement obligatoire |
| B6-DOC-02 | Un document sans parent est-il permis ? | NON / OUI / CONDITIONNEL; qui le voit : ___ | UNKNOWN | aucun scope implicite |
| B6-DOC-03 | Un document peut-il appartenir à plusieurs parents ? | NON / OUI / CONDITIONNEL; règle d'accès si scopes différents : ___ | UNKNOWN | intersection/union à décider |
| B6-DOC-04 | Quels types de parent sont autorisés ? | Projet / dossier / employé / client / contrat / lot / attestation / autre : ___ | UNKNOWN | intégrité métier |
| B6-DOC-05 | Un document peut-il être rendu public ? | NON par défaut / OUI / CONDITIONNEL; champs : ___ | UNKNOWN | publication et confidentialité |
| B6-DOC-06 | Qui peut publier un document ? | fonction/rôle, parent et état : ___ | UNKNOWN | acte de publication |
| B6-DOC-07 | Qui peut dépublier ? | fonction/rôle, condition, effet cache/URL : ___ | UNKNOWN | retrait d'exposition |
| B6-DOC-08 | Qui peut archiver ou supprimer un document ? | rôle/fonction; hard delete par exception seulement : ___ | UNKNOWN | cycle de vie |
| B6-DOC-09 | Qui peut consulter/télécharger ? | suivre le parent / exceptions nominatives/temporelles : ___ | UNKNOWN | droits effectifs du parent |
| B6-DOC-10 | Qui peut exporter un document ou une liste de documents ? | rôle, champs, périmètre et audit : ___ | UNKNOWN | export restrictif par défaut |
| B6-DOC-11 | Un partage temporaire est-il nécessaire ? | NON / OUI / CONDITIONNEL; créateur, destinataire, expiration, révocation : ___ | UNKNOWN | liens temporaires |
| B6-DOC-12 | Faut-il tracer les consultations/téléchargements ? | OUI / NON / CONDITIONNEL; champs/durée : ___ | UNKNOWN | confidentialité et audit |
| B6-DOC-13 | Une exception au principe d'héritage du parent est-elle nécessaire ? | NON / OUI / CONDITIONNEL; module, action, rôle, périmètre : ___ | UNKNOWN | exception documentée; aucune modification du principe général |

## 12. Questionnaire médias

La règle générale média → parent métier est validée; `uploaded_by` reste une donnée de trace. Décider les types de parents, les exceptions publiques et le traitement des fichiers sans attachement.

| ID | Question métier | Réponse / précision | Statut | Impact |
|---|---|---|---|---|
| B6-MEDIA-01 | Tout média métier doit-il avoir un parent ? | OUI / NON / CONDITIONNEL; exceptions : ___ | UNKNOWN | attachement obligatoire ou asset système |
| B6-MEDIA-02 | Quels parents sont autorisés ? | Projet / dossier / lot / attestation / client / employé / CMS / autre : ___ | UNKNOWN | catalogue relationnel |
| B6-MEDIA-03 | Un média peut-il être attaché à plusieurs objets ? | NON / OUI / CONDITIONNEL; règle si scopes différents : ___ | UNKNOWN | partage et fuite inter-dossier |
| B6-MEDIA-04 | Un média peut-il être public ? | NON par défaut / OUI / CONDITIONNEL; catégories/champs : ___ | UNKNOWN | séparation privé/public |
| B6-MEDIA-05 | Qui peut le publier et le dépublier ? | fonction/rôle; validation, condition, audit : ___ | UNKNOWN | publication |
| B6-MEDIA-06 | Qui peut supprimer ou archiver un média ? | rôle/fonction; soft/hard, motif et rétention : ___ | UNKNOWN | cycle de vie |
| B6-MEDIA-07 | Qui peut remplacer un média ? | rôle/fonction; états/version conservée : ___ | UNKNOWN | intégrité des références |
| B6-MEDIA-08 | Qui peut télécharger un média privé ? | suivre parent / exceptions, format/rendition : ___ | UNKNOWN | livraison effective du binaire |
| B6-MEDIA-09 | Les droits suivent-ils le parent lors d'un déplacement ? | Principe général validé; confirmer transition, ancien/nouveau parent et accès concurrent : ___ | UNKNOWN | transfert de scope |
| B6-MEDIA-10 | Quels médias système sans parent sont admis ? | brand assets / CMS / autre; visibilité et validation : ___ | UNKNOWN | exception de rattachement |
| B6-MEDIA-11 | `uploaded_by` reste-t-il uniquement une trace ? | Principe validé OUI; décrire autres usages de traçabilité si besoin : ___ | VALIDÉ — trace, pas scope | aucune propriété déduite |
| B6-MEDIA-12 | L'historique des remplacements doit-il être conservé ? | OUI / NON / CONDITIONNEL; durée, accès et audit : ___ | UNKNOWN | versions/rétention |
| B6-MEDIA-13 | Faut-il tracer téléchargements, export ou génération de miniature ? | événements, champs, durée : ___ | UNKNOWN | audit |

## 13. Questionnaire profils

**Validé :** l'Utilisateur standard est limité à son propre profil; l'Administrateur peut dépasser cette limite selon le principe B.4.1. `UNKNOWN-03` porte sur les profils d'équipe du Gestionnaire. Cette section ne réouvre pas le scope own-profile.

| ID | Question métier | Réponse / précision | Statut | Impact |
|---|---|---|---|---|
| B6-PROFILE-01 | Quels utilisateurs disposent d'un profil et peut-il être facultatif ? | tout compte / catégories / autre : ___ | UNKNOWN | cardinalité UserProfile |
| B6-PROFILE-02 | Quels champs l'utilisateur peut-il consulter/modifier lui-même ? | thème, langue, fuseau, notifications, préférences, avatar, autres : ___ | UNKNOWN | self-service |
| B6-PROFILE-03 | Quelles données ne sont pas modifiables par l'utilisateur ? | liste des champs et responsable de changement : ___ | UNKNOWN | intégrité compte/RH |
| B6-PROFILE-04 | Quelles données peuvent être consultées par un Administrateur au-delà de son propre profil ? | tous les champs / liste blanche / données exclues : ___ | UNKNOWN | portée de l'exception Admin |
| B6-PROFILE-05 | Que peut consulter un Gestionnaire sur l'Agent de son équipe ? | own only / équipe / service / scope attribué / autre : ___ | UNKNOWN | `UNKNOWN-03` |
| B6-PROFILE-06 | Un Gestionnaire peut-il modifier le profil d'un Agent ? | NON / OUI / CONDITIONNEL; champs et motif : ___ | UNKNOWN | action distincte de consulter |
| B6-PROFILE-07 | Qui peut consulter les données RH du profil/dossier ? | rôle/fonction, champs et périmètre : ___ | UNKNOWN | salaire et informations RH |
| B6-PROFILE-08 | Quelles données sont sensibles et masquées à certains acteurs ? | champs/acteurs; exceptions légales : ___ | UNKNOWN | contrôle au champ |
| B6-PROFILE-09 | Qui peut exporter des profils ? | rôle/fonction, champs, périmètre et audit : ___ | UNKNOWN | export restrictif |
| B6-PROFILE-10 | Que peut consulter Direction / Responsable ? | fonction attribuée, champs, population, motif : ___ | UNKNOWN | ne pas assimiler automatiquement à Admin |
| B6-PROFILE-11 | Faut-il tracer consultation, modification et export de profils ? | événement/champs/durée : ___ | UNKNOWN | audit données personnelles |

Pour UNKNOWN-03 — Gestionnaire → profils : [ ] A son propre profil [ ] B profils des Agents directement rattachés [ ] C profils du service [ ] D profils de son périmètre fonctionnel [ ] E autre : ______ [x] UNKNOWN. Pour le périmètre retenu, préciser séparément consultation, modification, données RH, données sensibles et export.

## 14. Questionnaire scopes

Les rôles techniques validés ne changent pas quand une fonction ou un scope change. Les intitulés de service, poste, department et `created_by` ne sont pas une preuve de scope.

| ID | Question métier | Choix / précision | Statut | Impact |
|---|---|---|---|---|
| B6-SCOPE-01 | Un compte peut-il cumuler plusieurs fonctions/scopes fonctionnels ? | NON / OUI / CONDITIONNEL; combinaison : ___ | UNKNOWN | cumul des responsabilités |
| B6-SCOPE-02 | Un Agent peut-il recevoir la fonction Commercial ? | OUI / NON / CONDITIONNEL; attribution : ___ | UNKNOWN | accès leads/actions commerciales |
| B6-SCOPE-03 | Un Gestionnaire peut-il recevoir la fonction Foncier ? | OUI / NON / CONDITIONNEL; villages/niveaux : ___ | UNKNOWN | rôle vs ACL village |
| B6-SCOPE-04 | Une fonction métier change-t-elle automatiquement des droits ? | NON (attribution explicite) / OUI, préciser / CONDITIONNEL / UNKNOWN | UNKNOWN | principe role/action/scope |
| B6-SCOPE-05 | Une attribution explicite de scope est-elle nécessaire ? | OUI / NON / CONDITIONNEL; approbateur : ___ | UNKNOWN | source d'autorité |
| B6-SCOPE-06 | Un utilisateur peut-il changer de scope sans changer de rôle technique ? | OUI / NON / CONDITIONNEL; effet : ___ | UNKNOWN | séparation rôle/scope |
| B6-SCOPE-07 | Faut-il historiser attribution, modification et retrait de scope ? | OUI / NON / durée, motif, accès : ___ | UNKNOWN | audit et calcul temporel |
| B6-SCOPE-08 | Direction/Finance/Commercial/Immobilier-Foncier existent-ils et qui attribue ces fonctions ? | Pour chacune : OUI/NON/CONDITIONNEL/UNKNOWN; attributeur et durée : ___ | UNKNOWN | modalités DECISION-004, sans rôle technique nouveau |

Distinguer dans chaque réponse : **rôle technique** (catégorie d'accès générale), **fonction** (responsabilité cumulable), **scope** (population/données), **ownership métier** (responsable de l'objet), **hiérarchie** (lien Gestionnaire–Agent) et **scope géographique** (`UserVillageAccess`). Une réponse sur l'un n'entraîne pas les autres.

## 15. Questionnaire exports

Le défaut restrictif est déjà validé. Sans exception métier explicite, aucune ouverture d'export n'est autorisée. Remplir chaque ligne uniquement pour décider d'une exception éventuelle; laisser `NON / DEFAULT RESTRICTIF` signifie qu'il n'y a pas d'exception.

| ID | Module | Qui peut exporter ? | Données/champs | Périmètre (personne/projet/village/organisation) | Formats autorisés | Audit | Exception autorisée ? |
|---|---|---|---|---|---|---|---|
| B6-EXP-01 | Finance | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |
| B6-EXP-02 | Commercial / Leads | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |
| B6-EXP-03 | Immobilier | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |
| B6-EXP-04 | Foncier | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |
| B6-EXP-05 | Clients / parties | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |
| B6-EXP-06 | Projets | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |
| B6-EXP-07 | Documents | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |
| B6-EXP-08 | Médias | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |
| B6-EXP-09 | RH | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |
| B6-EXP-10 | Tâches | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |
| B6-EXP-11 | Profils | | | | | UNKNOWN | NON par défaut / OUI / UNKNOWN |

Pour toute exception OUI : rôle/fonction exact ______; endpoint ou rapport ______; champs autorisés ______; filtre de scope ______; format(s) CSV/XLSX/PDF/JSON/autre ______; volume/max ______; motif/utilisation ______; audit acteur/date/objet/critères ______. La possibilité technique d'imprimer/générer un fichier ne constitue pas une autorisation.

## 16. Questionnaire suppression / archivage / restauration

**Principes validés :** suppression physique NON par défaut; privilégier l'archivage lorsque le métier le prévoit; restauration Admin par défaut. Cette grille demande les exceptions et le cycle propre à l'objet. Par défaut non répondu : hard delete interdit, restauration Admin, sans transformer une UNKNOWN en permission.

| ID | Objet | Exception de suppression physique ? (défaut NON) | Archivage requis/possible ? | Restauration / rôle (défaut Admin) | Qui archive ? | Qui restaure ? | Qui purge définitivement ? | Rétention, audit, motif, conditions |
|---|---|---|---|---|---|---|---|---|
| B6-DEL-01 | Utilisateur / compte | NON par défaut / OUI exception / UNKNOWN | | | | | | |
| B6-DEL-02 | Employé | NON par défaut / OUI exception / UNKNOWN | | | | | | |
| B6-DEL-03 | Tâche | NON par défaut / OUI exception / UNKNOWN | | | | | | |
| B6-DEL-04 | Lead | NON par défaut / OUI exception / UNKNOWN | | | | | | |
| B6-DEL-05 | Projet | NON par défaut / OUI exception / UNKNOWN | | | | | | |
| B6-DEL-06 | Document | NON par défaut / OUI exception / UNKNOWN | | | | | | |
| B6-DEL-07 | Média | NON par défaut / OUI exception / UNKNOWN | | | | | | |
| B6-DEL-08 | Lot Foncier | NON par défaut / OUI exception / UNKNOWN | | | | | | |
| B6-DEL-09 | Attestation | NON par défaut / OUI exception / UNKNOWN | | | | | | |
| B6-DEL-10 | Client / partie | NON par défaut / OUI exception / UNKNOWN | | | | | | |
| B6-DEL-11 | Profil utilisateur | NON par défaut / OUI exception / UNKNOWN | | | | | | |

Pour chaque choix, indiquer objet/table précis, rôle/fonction, action, condition préalable, état métier, durée de conservation, effet sur les descendants (documents/media/relations), restauration autorisée, auteur du motif et événement auditable. Annuler/terminer/révoquer n'est pas automatiquement supprimer.

## 17. Questionnaire public / privé

Ne pas interpréter une route sans guard local comme une route publique. Pour chaque fonction ci-dessous, choisir le contrat métier : public sans authentification, authentifié, rôle/fonction spécifique ou `UNKNOWN`; les champs visibles, masqués, tokens et expirations doivent être nommés.

| ID / fonction | Public sans auth | Authentifié | Rôle/fonction | UNKNOWN | Données visibles/masquées, conditions, token/expiration |
|---|---|---|---|---|---|
| B6-PUB-01 — Consultation de village | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-PUB-02 — Vérification attestation par référence | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-PUB-03 — Noms / listes de villages | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-PUB-04 — Médias, assets marque inclus | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-PUB-05 — Documents | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-PUB-06 — Fiches publiques (lots, réalisations, biens) | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-PUB-07 — Contenus CMS et layouts publiés | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-PUB-08 — Contrats/pages de présentation | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| B6-PUB-09 — Formulaires publics (contact, capture lead, intérêt lot) | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |

Pour chaque ligne, renseigner : public [ ] OUI [ ] NON [ ] EXCEPTION [x] UNKNOWN; opérations lecture/écriture séparées; champs autorisés ______; champs personnels/sensibles masqués ______; token public requis et durée ______; limitation/anti-abus ______; audit ______. Séparer les projections publiques du modèle interne.

## 18. Questionnaire audit

Décider pour chacun des événements : audit obligatoire, acteur et identifiant, date/heure, ancienne/nouvelle valeur, motif, objet et périmètre concernés, durée de conservation et qui peut lire le journal. Réponses permises : `OUI / NON / CONDITIONNEL / UNKNOWN`.

| ID | Événement à soumettre | Audit OUI/NON/CONDITIONNEL/UNKNOWN | Champs/motif/rétention/lecteurs |
|---|---|---|---|
| B6-AUD-01 | Connexion / échec / déconnexion sensible | UNKNOWN | |
| B6-AUD-02 | Changement de rôle | UNKNOWN | |
| B6-AUD-03 | Attribution, changement ou retrait de scope | UNKNOWN | |
| B6-AUD-04 | Attribution User–Village | UNKNOWN | |
| B6-AUD-05 | Révocation User–Village | UNKNOWN | |
| B6-AUD-06 | Modification du niveau Foncier | UNKNOWN | |
| B6-AUD-07 | Affectation d'une tâche | UNKNOWN | |
| B6-AUD-08 | Réaffectation d'une tâche | UNKNOWN | |
| B6-AUD-09 | Affectation d'un lead | UNKNOWN | |
| B6-AUD-10 | Réaffectation/transfert d'un lead | UNKNOWN | |
| B6-AUD-11 | Validation métier | UNKNOWN | |
| B6-AUD-12 | Rejet métier | UNKNOWN | |
| B6-AUD-13 | Archivage | UNKNOWN | |
| B6-AUD-14 | Restauration | UNKNOWN | |
| B6-AUD-15 | Export | UNKNOWN | |
| B6-AUD-16 | Téléchargement d'un document | UNKNOWN | |
| B6-AUD-17 | Téléchargement d'un média | UNKNOWN | |
| B6-AUD-18 | Publication | UNKNOWN | |
| B6-AUD-19 | Dépublication | UNKNOWN | |

Pour toute valeur OUI/CONDITIONNELLE : préciser champs d'avant/après, justification, résultat de l'action, acteur effectif (y compris délégation), date/heure, identifiant d'objet, scope, durée de conservation et accès à l'audit. Ne pas enregistrer dans un journal des secrets ou contenus de document sans nécessité validée.

## 19. Départ / changement de poste / absence

B6-ID-07 couvre le départ. Les situations ci-dessous fixent les changements d'état d'accès, leurs délais et la continuité des dossiers.

| ID | Situation | Accès immédiat / différé / conservé ? | Réaffectation/délégation ? | Historique/date d'effet/expiration | Décision |
|---|---|---|---|---|---|
| B6-OFF-01 | Départ définitif de l'organisation | | | | UNKNOWN |
| B6-OFF-02 | Changement de service | | | | UNKNOWN |
| B6-OFF-03 | Changement de poste | | | | UNKNOWN |
| B6-OFF-04 | Devient Gestionnaire | | | | UNKNOWN |
| B6-OFF-05 | Cesse d'être Gestionnaire | | | | UNKNOWN |
| B6-OFF-06 | Changement de village | | | | UNKNOWN |
| B6-OFF-07 | Perte d'un scope fonctionnel | | | | UNKNOWN |
| B6-OFF-08 | Attribution d'un nouveau scope | | | | UNKNOWN |
| B6-OFF-09 | Absence temporaire planifiée | | | | UNKNOWN |
| B6-OFF-10 | Suspension/inactivation du compte | | | | UNKNOWN |
| B6-OFF-11 | Remplacement temporaire d'une personne absente | | | | UNKNOWN |

Pour chaque situation : qui décide ______; date effective ______; accès supprimés immédiatement OUI/NON/CONDITIONNEL/UNKNOWN; objets à réaffecter ______; délégation et date d'expiration ______; trace requise ______.

## 20. Ownership

Ne jamais assimiler le créateur au propriétaire. Pour chaque objet, distinguer créateur technique, propriétaire métier, responsable opérationnel, personnes qui consultent/modifient/transfèrent. Le scope du créateur est une question à décider, pas une règle par défaut.

| ID / objet | Propriétaire métier : qui/quelle relation ? | Responsable opérationnel | Créateur technique | Qui consulte/modifie/transfère ? | Décision |
|---|---|---|---|---|---|
| B6-OWN-01 — Tâche | | | | | UNKNOWN |
| B6-OWN-02 — Lead | | | | | UNKNOWN |
| B6-OWN-03 — Projet | | | | | UNKNOWN |
| B6-OWN-04 — Document | Parent hérité (principe validé); définir responsable et exceptions | | | | UNKNOWN |
| B6-OWN-05 — Média | Parent hérité; uploaded_by trace seule (principes validés) | | | | UNKNOWN |
| B6-OWN-06 — Lot | | | | | UNKNOWN |
| B6-OWN-07 — Attestation | | | | | UNKNOWN |

Préciser si ownership est individuel, collectif, lié à un dossier, transférable, limité dans le temps, et différent du scope de consultation. Toute personne responsable n'obtient pas automatiquement toutes les actions.

## 21. Cas limites

| ID | Situation ambiguë | Décision métier attendue | Décision |
|---|---|---|---|
| B6-EDGE-01 | Agent sans Gestionnaire | actions permises; affectation de secours; objets non supervisés | UNKNOWN |
| B6-EDGE-02 | Gestionnaire sans Agent | peut-il travailler sur ses propres objets et sous quel scope ? | UNKNOWN |
| B6-EDGE-03 | Agent avec plusieurs scopes/fonctions | union, intersection ou règles par module ? | UNKNOWN |
| B6-EDGE-04 | Agent autorisé sur plusieurs villages | mêmes niveaux partout ou niveaux distincts par village ? | UNKNOWN |
| B6-EDGE-05 | Gestionnaire supervisant plusieurs services | source d'autorité et périmètre exact ? | UNKNOWN |
| B6-EDGE-06 | Lead transféré | accès de l'ancien Agent : retiré, historique seul ou maintenu ? | UNKNOWN |
| B6-EDGE-07 | Tâche réaffectée | ancien responsable : historique seul ou accès complet ? | UNKNOWN |
| B6-EDGE-08 | Document déplacé vers un autre parent | à quelle date le scope change-t-il et qui garde l'ancien accès ? | UNKNOWN |
| B6-EDGE-09 | Média déplacé vers un autre parent | règle identique au document ? liens multiples ? invalidation URL ? | UNKNOWN |
| B6-EDGE-10 | Projet archivé | devenir des documents/médias, consultation et restauration ? | UNKNOWN |
| B6-EDGE-11 | Utilisateur désactivé | objets, délégations, ACL village et historique ? | UNKNOWN |
| B6-EDGE-12 | Village archivé/supprimé | devenir des ACL, objets liés et historique ? | UNKNOWN |
| B6-EDGE-13 | Agent devient Gestionnaire | anciens scopes conservés/cumulés/révoqués ? | UNKNOWN |
| B6-EDGE-14 | Gestionnaire redevient Agent | anciens périmètres et délégations retirés ou historisés ? | UNKNOWN |

## 22. Décisions bloquantes pour B.7

B.7 ne peut pas figer le modèle cible ni le plan de rapprochement/migration tant que ces décisions structurantes restent UNKNOWN :

| Groupe / ID | Décision requise avant B.7 | Pourquoi bloquant | Statut |
|---|---|---|---|
| B6-ID-01…07 | Obligations et cardinalités User–Employee–Entity | choisir la relation authentifiée et migrer sans associer les mauvaises personnes | UNKNOWN |
| B6-MGR-01…07 | Cardinalité, durée, délégation et périmètre Gestionnaire | décider auto-FK vs rattachement multiple/temporel et éviter un scope global implicite | UNKNOWN |
| B6-TASK-01…13 | Affectation, actions et devenir des tâches | construire l'affectation et le scope Agent/Gestionnaire | UNKNOWN |
| B6-LEAD-01…13 | Responsables, transferts, partage et historique des leads | choisir la représentation canonique et l'accès commercial | UNKNOWN |
| B6-FON-01…07; B6-FON-MAT-01…19; B6-FON-GLOBAL-01…07 | Bootstrap, attribution, niveaux, actions locales et globales | éviter ACL orpheline, blocage d'amorçage et accès inter-villages implicite | UNKNOWN |
| B6-DOC-01…13 | Parents permis, orphelins, multi-parent et exceptions | concevoir les liens/intégrité et règle d'accès au téléchargement | UNKNOWN |
| B6-MEDIA-01…10; B6-MEDIA-12…13 | Types d'attachement, médias publics/système, liens multiples | concevoir livraison du binaire selon le parent et les exceptions publiques | UNKNOWN |
| B6-PROFILE-01…11 | Champs self/admin/Gestionnaire et données RH/sensibles | définir scope, whitelist au champ et frontières de confidentialité | UNKNOWN |
| B6-SCOPE-01…08 | Cumul, attribution et historique des fonctions/scopes | séparer fonction, rôle, hiérarchie et géographie | UNKNOWN |
| B6-PUB-01…09 | Contrat public/auth/role par fonction et champs visibles | éviter de construire des projections publiques par défaut depuis les routes internes | UNKNOWN |
| B6-OWN-01…07; B6-EDGE-01…14; B6-OFF-01…11 | Ownership, transferts, états et événements de vie | définir les transitions de scope, délégations et conservation | UNKNOWN |

## 23. Décisions non bloquantes

Le défaut déjà validé peut rester en vigueur sans exception :

- Aucun export supplémentaire n'est ouvert si aucune exception n'est validée. Les précisions des lignes B6-EXP-01…11 deviennent bloquantes pour B.7 uniquement si une exception d'export est demandée; sinon le résultat reste DEFAULT restrictif.
- Suppression physique interdite par défaut, archivage privilégié lorsqu'il existe, restauration Admin par défaut. Les B6-DEL-01…11 deviennent bloquantes pour toute exception ou action de cycle de vie qui doit être explicitement attribuée; sans exception, préserver le défaut.
- Pour une action d'audit sans exigence de dérogation, la politique générale d'audit peut être cadrée ultérieurement; B6-AUD-01…19 sont bloquantes pour les opérations sensibles/publication/export que le métier décide d'exposer ou d'autoriser.
- Les formats techniques, limites de taille et durées de rétention détaillées peuvent être décidés après validation du besoin et du périmètre; ils ne doivent jamais élargir les accès déjà restrictifs.

Aucune question étiquetée « non bloquante » ne renverse une règle déjà validée. Toute exception explicitement souhaitée doit être décidée avant de la concevoir.

## 24. Journal des UNKNOWN

Chaque question numérotée ci-dessous est initialisée `UNKNOWN`; le questionnaire ne contient aucune réponse métier ajoutée par l'auteur du document.

| Préfixe / plage | Sujet | Statut initial | Notes |
|---|---|---|---|
| B6-ID-01…07 | Compte, Employé, Entity, départ | UNKNOWN | relation et cardinalité |
| B6-MGR-01…07 | Hiérarchie/délégation/périmètres | UNKNOWN | trois scopes Gestionnaire inclus |
| B6-TASK-01…13 | Cycle tâches et UNKNOWN-01 | UNKNOWN | DECISION-003 scope Agent n'implique pas les actions |
| B6-LEAD-01…13 | Affectation et UNKNOWN-02 | UNKNOWN | Agent scope décidé; mapping technique absent |
| B6-FON-01…07 | Gouvernance UserVillageAccess | UNKNOWN | principe ACL déjà validé |
| B6-FON-MAT-01…19 | Actions × 4 niveaux | UNKNOWN | B6-FON-MAT-20/21 reprennent les principes suppression/restauration déjà validés |
| B6-FON-GLOBAL-01…07 | Multi-village et opérations globales | UNKNOWN | aucun accès organisationnel implicite |
| B6-DOC-01…13 | Parent, partage, publication, trace | UNKNOWN | héritage général du parent validé |
| B6-MEDIA-01…10; B6-MEDIA-12…13 | Attachement/publication/téléchargement | UNKNOWN | B6-MEDIA-11 valide uploaded_by comme trace seule |
| B6-PROFILE-01…11 | Champs et accès tiers | UNKNOWN | propre profil standard validé; UNKNOWN-03 conservé |
| B6-SCOPE-01…08 | Cumul et attribution | UNKNOWN | pas de nouveaux rôles techniques |
| B6-EXP-01…11 | Exceptions d'export | NON / DEFAULT restrictif si aucune exception | principe validé; champs d'exception vierges |
| B6-DEL-01…11 | Exceptions par objet | NON hard delete par défaut; restore Admin par défaut | principes validés; détails métier à remplir |
| B6-PUB-01…09 | Public/privé | UNKNOWN | aucun endpoint non gardé déclaré public ici |
| B6-AUD-01…19 | Événements à tracer | UNKNOWN | politiques par événement à valider |
| B6-OFF-01…11 | Départ/absence/changement | UNKNOWN | règles d'effet et expiration |
| B6-OWN-01…07 | Propriété métier par objet | UNKNOWN | créateur ≠ propriétaire validé |
| B6-EDGE-01…14 | Cas limites | UNKNOWN | résolution nécessaire avant scope effectif |

Les trois UNKNOWN hérités sont explicitement : `UNKNOWN-01` Gestionnaire→Tasks, `UNKNOWN-02` Gestionnaire commercial→Leads, `UNKNOWN-03` Gestionnaire→profils d'équipe.

## 25. Synthèse à signer/valider

**Procédure de validation :** la Direction ou le responsable métier complète les choix, supprime les options incompatibles, précise chaque condition/exception, puis signe/référence une version datée. Une case vierge ou `UNKNOWN` n'accorde aucun droit. Les validations de la section 3 restent valides et n'ont pas besoin d'être cochées à nouveau.

| Élément | À compléter |
|---|---|
| Responsable métier / Direction | |
| Fonction | |
| Périmètre de validation | |
| Date | |
| Référence de décision / compte rendu | |
| Questions ou exceptions reportées | |
| Validation explicite du questionnaire complété | [ ] OUI  [ ] NON |

### Matrice finale des décisions

| ID | Sujet | Décision requise | Bloquant B.7 ? | Statut |
|---|---|---|---|---|
| B6-ID-* | Identité | Oui | Oui | UNKNOWN |
| B6-MGR-* | Hiérarchie/délégation | Oui | Oui | UNKNOWN |
| B6-TASK-* | Tâches | Oui | Oui | UNKNOWN |
| B6-LEAD-* | Leads | Oui | Oui | UNKNOWN |
| B6-FON-* | Foncier/UserVillageAccess | Oui | Oui | UNKNOWN |
| B6-DOC-* | Documents | Oui | Oui | UNKNOWN |
| B6-MEDIA-* | Médias | Oui | Oui | UNKNOWN |
| B6-PROFILE-* | Profils | Oui | Oui | UNKNOWN |
| B6-SCOPE-* | Fonctions/scopes | Oui | Oui | UNKNOWN |
| B6-EXP-* | Exports | Oui pour toute exception | Selon sujet; défaut fermé validé | NON / DEFAULT restrictif |
| B6-DEL-* | Suppression/archive/restore | Oui pour toute exception ou action explicite | Selon sujet; principes par défaut validés | NON / DEFAULT |
| B6-PUB-* | Public/privé | Oui | Oui pour tout parcours à exposer | UNKNOWN |
| B6-AUD-* | Audit | Oui | Selon action et exposition | UNKNOWN |
| B6-OFF-* | Départ/changement/absence | Oui | Oui | UNKNOWN |
| B6-OWN-* | Ownership | Oui | Oui | UNKNOWN |
| B6-EDGE-* | Cas limites | Oui | Oui | UNKNOWN |

**Questions numérotées :** 202 identifiants de décision/question à compter dans ce document; chaque statut ouvert est initialisé `UNKNOWN`, sauf les principes par défaut déjà validés explicitement annotés.  
**Décisions groupées déjà validées :** 19 entrées (4 correspondances DECISION-001, le principe DECISION-004, 14 principes généraux).  
**UNKNOWN conservées :** 188 entrées de décision/questions restent à renseigner; les 14 entrées restantes portent un mapping, un principe ou un DEFAULT déjà validé.  
**Décisions bloquantes pour B.7 :** 158; 30 questions de cycle de vie/audit sont conditionnelles au périmètre ou à une exception.  
**UNKNOWN hérités Gestionnaire :** 3 — Tasks, Leads, profils d'équipe.  
**Implémentation et modèle cible :** non autorisés par ce questionnaire. B.7 commence uniquement après validation métier explicite des décisions bloquantes.



## Annexe A — Registre unique des décisions à remplir

Ce registre est la **source de vérité des réponses**. Les intitulés complets, choix et impacts figurent à la section principale portant chaque ID. Une réponse inscrite ailleurs doit être reportée ici; en cas de différence, l'ID est `CONTRADICTOIRE — ARBITRAGE REQUIS` jusqu'à décision formelle.

Valeurs initiales : les sujets sans décision restent `UNKNOWN`; le mapping DECISION-001, le principe DECISION-004 et les DEFAULT déjà validés ne sont pas remis en question. Les valeurs déjà verrouillées sont signalées comme telles et ne doivent pas être remplacées par UNKNOWN.

### B6-AUD

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-AUD-01 | Connexion / échec / déconnexion sensible | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-02 | Changement de rôle | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-03 | Attribution, changement ou retrait de scope | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-04 | Attribution User–Village | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-05 | Révocation User–Village | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-06 | Modification du niveau Foncier | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-07 | Affectation d'une tâche | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-08 | Réaffectation d'une tâche | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-09 | Affectation d'un lead | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-10 | Réaffectation/transfert d'un lead | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-11 | Validation métier | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-12 | Rejet métier | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-13 | Archivage | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-14 | Restauration | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-15 | Export | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-16 | Téléchargement d'un document | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-17 | Téléchargement d'un média | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-18 | Publication | UNKNOWN | | | | | À REMPLIR |
| B6-AUD-19 | Dépublication | UNKNOWN | | | | | À REMPLIR |

### B6-DEL

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-DEL-01 | Utilisateur / compte | UNKNOWN | | | | | À REMPLIR |
| B6-DEL-02 | Employé | UNKNOWN | | | | | À REMPLIR |
| B6-DEL-03 | Tâche | UNKNOWN | | | | | À REMPLIR |
| B6-DEL-04 | Lead | UNKNOWN | | | | | À REMPLIR |
| B6-DEL-05 | Projet | UNKNOWN | | | | | À REMPLIR |
| B6-DEL-06 | Document | UNKNOWN | | | | | À REMPLIR |
| B6-DEL-07 | Média | UNKNOWN | | | | | À REMPLIR |
| B6-DEL-08 | Lot Foncier | UNKNOWN | | | | | À REMPLIR |
| B6-DEL-09 | Attestation | UNKNOWN | | | | | À REMPLIR |
| B6-DEL-10 | Client / partie | UNKNOWN | | | | | À REMPLIR |
| B6-DEL-11 | Profil utilisateur | UNKNOWN | | | | | À REMPLIR |

### B6-DOC

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-DOC-01 | Tout document doit-il appartenir à un projet/dossier métier ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-02 | Un document sans parent est-il permis ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-03 | Un document peut-il appartenir à plusieurs parents ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-04 | Quels types de parent sont autorisés ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-05 | Un document peut-il être rendu public ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-06 | Qui peut publier un document ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-07 | Qui peut dépublier ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-08 | Qui peut archiver ou supprimer un document ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-09 | Qui peut consulter/télécharger ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-10 | Qui peut exporter un document ou une liste de documents ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-11 | Un partage temporaire est-il nécessaire ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-12 | Faut-il tracer les consultations/téléchargements ? | UNKNOWN | | | | | À REMPLIR |
| B6-DOC-13 | Une exception au principe d'héritage du parent est-elle nécessaire ? | UNKNOWN | | | | | À REMPLIR |

### B6-EDGE

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-EDGE-01 | Agent sans Gestionnaire | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-02 | Gestionnaire sans Agent | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-03 | Agent avec plusieurs scopes/fonctions | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-04 | Agent autorisé sur plusieurs villages | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-05 | Gestionnaire supervisant plusieurs services | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-06 | Lead transféré | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-07 | Tâche réaffectée | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-08 | Document déplacé vers un autre parent | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-09 | Média déplacé vers un autre parent | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-10 | Projet archivé | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-11 | Utilisateur désactivé | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-12 | Village archivé/supprimé | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-13 | Agent devient Gestionnaire | UNKNOWN | | | | | À REMPLIR |
| B6-EDGE-14 | Gestionnaire redevient Agent | UNKNOWN | | | | | À REMPLIR |

### B6-EXP

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-EXP-01 | Finance | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |
| B6-EXP-02 | Commercial / Leads | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |
| B6-EXP-03 | Immobilier | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |
| B6-EXP-04 | Foncier | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |
| B6-EXP-05 | Clients / parties | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |
| B6-EXP-06 | Projets | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |
| B6-EXP-07 | Documents | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |
| B6-EXP-08 | Médias | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |
| B6-EXP-09 | RH | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |
| B6-EXP-10 | Tâches | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |
| B6-EXP-11 | Profils | NON — DEFAULT restrictif en absence d’exception validée | | | | | VERROUILLÉ — DEFAULT |

### B6-FON

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-FON-01 | Qui attribue le premier accès Foncier d'un utilisateur/village ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-02 | Qui peut attribuer un utilisateur à un village après bootstrap ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-03 | Qui peut révoquer un accès ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-04 | Qui peut modifier un niveau d'accès ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-05 | Un utilisateur peut-il avoir accès à plusieurs villages ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-06 | Les quatre niveaux sont-ils hiérarchiques/cumulatifs ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-07 | Quel est le détenteur métier responsable de chaque village et comment est-il désigné ? | UNKNOWN | | | | | À REMPLIR |

### B6-FON-GLOBAL

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-FON-GLOBAL-01 | Un utilisateur ayant accès à plusieurs villages ne voit-il que ces villages ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-GLOBAL-02 | Existe-t-il une fonction autorisée à accéder à tous les villages ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-GLOBAL-03 | Qui peut consulter des statistiques globales ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-GLOBAL-04 | Qui peut exporter des données de plusieurs villages ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-GLOBAL-05 | Qui peut lancer ou gérer une synchronisation globale ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-GLOBAL-06 | Qui peut gérer les ACL de tous les villages ? | UNKNOWN | | | | | À REMPLIR |
| B6-FON-GLOBAL-07 | Les opérations globales exigent-elles un rôle technique ou une permission fonctionnelle explicite ? | UNKNOWN | | | | | À REMPLIR |

### B6-FON-MAT

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-FON-MAT-01 | Consulter les villages autorisés | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-02 | Consulter les lots | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-03 | Rechercher dans les données village | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-04 | Créer un lot | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-05 | Modifier un lot | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-06 | Archiver un lot | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-07 | Restaurer un lot | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-08 | Créer une attestation | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-09 | Modifier une attestation | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-10 | Valider une attestation | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-11 | Rejeter une attestation | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-12 | Céder / enregistrer une cession | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-13 | Consulter l'historique d'un objet | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-14 | Gérer les propriétaires | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-15 | Gérer les occupants | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-16 | Consulter les statistiques du village | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-17 | Exporter des données Foncier | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-18 | Synchroniser des données | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-19 | Gérer l'ACL User–Village | UNKNOWN | | | | | À REMPLIR |
| B6-FON-MAT-20 | Supprimer physiquement | NON — suppression physique interdite par défaut | | | | | VERROUILLÉ — DEFAULT |
| B6-FON-MAT-21 | Récupérer / restaurer | Administrateur — restauration par défaut | | | | | VERROUILLÉ — DEFAULT |

### B6-ID

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-ID-01 | Compte EGS obligatoire pour tout Agent | UNKNOWN | | | | | À REMPLIR |
| B6-ID-02 | Utilisateur sans fiche Employé | UNKNOWN | | | | | À REMPLIR |
| B6-ID-03 | Fiche Employé sans compte | UNKNOWN | | | | | À REMPLIR |
| B6-ID-04 | Nombre de comptes par Agent | UNKNOWN | | | | | À REMPLIR |
| B6-ID-05 | Nombre de fiches Employé par compte | UNKNOWN | | | | | À REMPLIR |
| B6-ID-06 | Identité métier commune `Entity` | UNKNOWN | | | | | À REMPLIR |
| B6-ID-07 | Départ d'un Employé | UNKNOWN | | | | | À REMPLIR |

### B6-LEAD

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-LEAD-01 | Un lead appartient-il à un seul Agent ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-02 | Plusieurs Agents/responsables peuvent-ils partager un lead ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-03 | Existe-t-il un responsable principal ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-04 | Le lead peut-il être transféré ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-05 | Qui peut transférer/réaffecter un lead ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-06 | Faut-il conserver l'historique des affectations ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-07 | Que devient le lead quand l'Agent quitte l'organisation ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-08 | Un Gestionnaire peut-il réaffecter les leads de son périmètre ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-09 | La réaffectation exige-t-elle motif et audit ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-10 | Un lead peut-il rester sans responsable ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-11 | Un lead peut-il être partagé entre équipes ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-12 | Le responsable doit-il obligatoirement avoir un compte EGS ? | UNKNOWN | | | | | À REMPLIR |
| B6-LEAD-13 | Une Entity sans compte peut-elle être responsable métier ou propriétaire de lead ? | UNKNOWN | | | | | À REMPLIR |

### B6-MEDIA

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-MEDIA-01 | Tout média métier doit-il avoir un parent ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-02 | Quels parents sont autorisés ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-03 | Un média peut-il être attaché à plusieurs objets ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-04 | Un média peut-il être public ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-05 | Qui peut le publier et le dépublier ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-06 | Qui peut supprimer ou archiver un média ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-07 | Qui peut remplacer un média ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-08 | Qui peut télécharger un média privé ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-09 | Les droits suivent-ils le parent lors d'un déplacement ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-10 | Quels médias système sans parent sont admis ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-11 | `uploaded_by` reste-t-il uniquement une trace ? | VALIDÉ — uploaded_by = traçabilité seule | | | | | VERROUILLÉ — principe validé |
| B6-MEDIA-12 | L'historique des remplacements doit-il être conservé ? | UNKNOWN | | | | | À REMPLIR |
| B6-MEDIA-13 | Faut-il tracer téléchargements, export ou génération de miniature ? | UNKNOWN | | | | | À REMPLIR |

### B6-MGR

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-MGR-01 | Nombre de Gestionnaires par Agent | UNKNOWN | | | | | À REMPLIR |
| B6-MGR-02 | Nature du rattachement | UNKNOWN | | | | | À REMPLIR |
| B6-MGR-03 | Plusieurs Agents | UNKNOWN | | | | | À REMPLIR |
| B6-MGR-04 | Changement de Gestionnaire | UNKNOWN | | | | | À REMPLIR |
| B6-MGR-05 | Historique | UNKNOWN | | | | | À REMPLIR |
| B6-MGR-06 | Délégation | UNKNOWN | | | | | À REMPLIR |
| B6-MGR-07 | Périmètre identique par module | UNKNOWN | | | | | À REMPLIR |

### B6-OFF

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-OFF-01 | Départ définitif de l'organisation | UNKNOWN | | | | | À REMPLIR |
| B6-OFF-02 | Changement de service | UNKNOWN | | | | | À REMPLIR |
| B6-OFF-03 | Changement de poste | UNKNOWN | | | | | À REMPLIR |
| B6-OFF-04 | Devient Gestionnaire | UNKNOWN | | | | | À REMPLIR |
| B6-OFF-05 | Cesse d'être Gestionnaire | UNKNOWN | | | | | À REMPLIR |
| B6-OFF-06 | Changement de village | UNKNOWN | | | | | À REMPLIR |
| B6-OFF-07 | Perte d'un scope fonctionnel | UNKNOWN | | | | | À REMPLIR |
| B6-OFF-08 | Attribution d'un nouveau scope | UNKNOWN | | | | | À REMPLIR |
| B6-OFF-09 | Absence temporaire planifiée | UNKNOWN | | | | | À REMPLIR |
| B6-OFF-10 | Suspension/inactivation du compte | UNKNOWN | | | | | À REMPLIR |
| B6-OFF-11 | Remplacement temporaire d'une personne absente | UNKNOWN | | | | | À REMPLIR |

### B6-OWN

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-OWN-01 | Tâche | UNKNOWN | | | | | À REMPLIR |
| B6-OWN-02 | Lead | UNKNOWN | | | | | À REMPLIR |
| B6-OWN-03 | Projet | UNKNOWN | | | | | À REMPLIR |
| B6-OWN-04 | Document | UNKNOWN | | | | | À REMPLIR |
| B6-OWN-05 | Média | UNKNOWN | | | | | À REMPLIR |
| B6-OWN-06 | Lot | UNKNOWN | | | | | À REMPLIR |
| B6-OWN-07 | Attestation | UNKNOWN | | | | | À REMPLIR |

### B6-PROFILE

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-PROFILE-01 | Quels utilisateurs disposent d'un profil et peut-il être facultatif ? | UNKNOWN | | | | | À REMPLIR |
| B6-PROFILE-02 | Quels champs l'utilisateur peut-il consulter/modifier lui-même ? | UNKNOWN | | | | | À REMPLIR |
| B6-PROFILE-03 | Quelles données ne sont pas modifiables par l'utilisateur ? | UNKNOWN | | | | | À REMPLIR |
| B6-PROFILE-04 | Quelles données peuvent être consultées par un Administrateur au-delà de son propre profil ? | UNKNOWN | | | | | À REMPLIR |
| B6-PROFILE-05 | Que peut consulter un Gestionnaire sur l'Agent de son équipe ? | UNKNOWN | | | | | À REMPLIR |
| B6-PROFILE-06 | Un Gestionnaire peut-il modifier le profil d'un Agent ? | UNKNOWN | | | | | À REMPLIR |
| B6-PROFILE-07 | Qui peut consulter les données RH du profil/dossier ? | UNKNOWN | | | | | À REMPLIR |
| B6-PROFILE-08 | Quelles données sont sensibles et masquées à certains acteurs ? | UNKNOWN | | | | | À REMPLIR |
| B6-PROFILE-09 | Qui peut exporter des profils ? | UNKNOWN | | | | | À REMPLIR |
| B6-PROFILE-10 | Que peut consulter Direction / Responsable ? | UNKNOWN | | | | | À REMPLIR |
| B6-PROFILE-11 | Faut-il tracer consultation, modification et export de profils ? | UNKNOWN | | | | | À REMPLIR |

### B6-PUB

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-PUB-01 | Consultation de village | UNKNOWN | | | | | À REMPLIR |
| B6-PUB-02 | Vérification attestation par référence | UNKNOWN | | | | | À REMPLIR |
| B6-PUB-03 | Noms / listes de villages | UNKNOWN | | | | | À REMPLIR |
| B6-PUB-04 | Médias, assets marque inclus | UNKNOWN | | | | | À REMPLIR |
| B6-PUB-05 | Documents | UNKNOWN | | | | | À REMPLIR |
| B6-PUB-06 | Fiches publiques (lots, réalisations, biens) | UNKNOWN | | | | | À REMPLIR |
| B6-PUB-07 | Contenus CMS et layouts publiés | UNKNOWN | | | | | À REMPLIR |
| B6-PUB-08 | Contrats/pages de présentation | UNKNOWN | | | | | À REMPLIR |
| B6-PUB-09 | Formulaires publics (contact, capture lead, intérêt lot) | UNKNOWN | | | | | À REMPLIR |

### B6-SCOPE

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-SCOPE-01 | Un compte peut-il cumuler plusieurs fonctions/scopes fonctionnels ? | UNKNOWN | | | | | À REMPLIR |
| B6-SCOPE-02 | Un Agent peut-il recevoir la fonction Commercial ? | UNKNOWN | | | | | À REMPLIR |
| B6-SCOPE-03 | Un Gestionnaire peut-il recevoir la fonction Foncier ? | UNKNOWN | | | | | À REMPLIR |
| B6-SCOPE-04 | Une fonction métier change-t-elle automatiquement des droits ? | UNKNOWN | | | | | À REMPLIR |
| B6-SCOPE-05 | Une attribution explicite de scope est-elle nécessaire ? | UNKNOWN | | | | | À REMPLIR |
| B6-SCOPE-06 | Un utilisateur peut-il changer de scope sans changer de rôle technique ? | UNKNOWN | | | | | À REMPLIR |
| B6-SCOPE-07 | Faut-il historiser attribution, modification et retrait de scope ? | UNKNOWN | | | | | À REMPLIR |
| B6-SCOPE-08 | Direction/Finance/Commercial/Immobilier-Foncier existent-ils et qui attribue ces fonctions ? | UNKNOWN | | | | | À REMPLIR |

### B6-TASK

| ID | Sujet (détails dans la section correspondante) | Réponse métier | Conditions / périmètre / exception | Décideur / fonction | Date | Référence de validation | État de revue |
|---|---|---|---|---|---|---|---|
| B6-TASK-01 | Qui peut créer une tâche ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-02 | Une tâche peut-elle avoir un seul Agent responsable ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-03 | Peut-elle avoir plusieurs participants ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-04 | Existe-t-il un responsable principal distinct des participants ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-05 | Une tâche peut-elle exister avant affectation ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-06 | Qui voit une tâche non assignée ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-07 | Qui peut modifier une tâche et dans quels états ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-08 | Qui peut affecter/réaffecter, vers quels Agents et avec quel motif ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-09 | Qui peut clôturer une tâche ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-10 | Qui peut rouvrir une tâche clôturée ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-11 | Qui peut archiver ou demander une suppression exceptionnelle ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-12 | Qui peut exporter les tâches et quel périmètre/champs ? | UNKNOWN | | | | | À REMPLIR |
| B6-TASK-13 | Que devient une tâche lors du départ de son responsable ? | UNKNOWN | | | | | À REMPLIR |

### Journal des arbitrages / contradictions

| ID(s) concernés | Réponses incompatibles / contradiction constatée | Question à arbitrer par le métier | Décision écrite / autorité | Date / référence | Statut |
|---|---|---|---|---|---|
| | | | | | AUCUNE CONTRADICTION CONTRÔLÉE À CE STADE |
| | | | | | |
| | | | | | |

### Contrôles croisés obligatoires

| Contrôle | IDs à comparer | Condition de cohérence | Résultat / référence d’arbitrage |
|---|---|---|---|
| Compte Agent obligatoire vs compte sans Employee / Employee sans compte / cardinalités | B6-ID-01…05, B6-TASK-02…05 | Relations et cardinalités compatibles; exceptions nommées | UNKNOWN — à contrôler |
| Identité partagée Entity vs liens directs User–Employee–Lead | B6-ID-04…06, B6-LEAD-12…13 | Une source d’identité et une règle de rapprochement approuvées | UNKNOWN — à contrôler |
| Hiérarchie, nombre de responsables, périmètre par module et délégation | B6-MGR-01…07, B6-TASK-01…13, B6-LEAD-01…13, B6-PROFILE-05…06 | Les populations et actions Gestionnaire sont définies séparément ou leur égalité est explicitement validée | UNKNOWN — à contrôler |
| Transferts de tâches/leads et historique/offboarding | B6-TASK-08…13, B6-LEAD-04…09, B6-OFF-01…11, B6-EDGE-06…07 | Accès courant, accès historique, réaffectation et date d’effet cohérents | UNKNOWN — à contrôler |
| UserVillageAccess, multi-village, niveaux hiérarchiques/indépendants et opérations globales | B6-FON-01…07, B6-FON-MAT-01…21, B6-FON-GLOBAL-01…07, B6-EDGE-04…05, B6-SCOPE-03 | Aucun accès à un village hors ACL; bootstrap possible par autorité approuvée; aucune hiérarchie technique prise pour une décision | UNKNOWN — à contrôler |
| Projets/dossiers sans parent, multi-parent, déplacement et héritage Documents/Media | B6-DOC-01…13, B6-MEDIA-01…13, B6-OWN-04…05, B6-EDGE-08…10 | Aucune ouverture due à parent absent/incohérent; comportement du déplacement défini | UNKNOWN — à contrôler |
| Rôles, scopes fonctionnels cumulables et droits automatiques | B6-SCOPE-01…08, B6-MGR-07, B6-FON-GLOBAL-07 | Fonction n’ajoute pas un droit implicitement; attribution et période précises | UNKNOWN — à contrôler |
| Défauts de cycle de vie et exceptions physiques/restauration | B6-DEL-01…11, B6-TASK-11, B6-FON-MAT-20…21 | Hard delete reste NON par défaut; toute dérogation nomme objet/role/condition/audit; restauration Admin par défaut | UNKNOWN — à contrôler |
| Exports et portée multi-module | B6-EXP-01…11, B6-FON-MAT-17, B6-FON-GLOBAL-04, B6-AUD-15 | Aucun export permis sans exception explicite; exception limitée aux mêmes champs/scope et audit | UNKNOWN — à contrôler |
| Public/authentifié/rôle/champs/token et projections publiées | B6-PUB-01…09, B6-DOC-05…07, B6-MEDIA-04…05, B6-AUD-18…19 | Un même parcours n’est pas simultanément public et privé sans distinction d’opération/champs; route privée sans garde ne devient pas publique par défaut | UNKNOWN — à contrôler |
| Profil standard propre profil, accès Admin/Gestionnaire, champs sensibles | B6-PROFILE-01…11, B6-MGR-07, B6-SCOPE-01…08 | Scope self standard préservé; exceptions Admin/Gestionnaire limitées aux champs/fonctions approuvés | UNKNOWN — à contrôler |
| Actions métier / workflow / rôle de validation / audit | DECISION-007, B6-FON-MAT-08…12, B6-AUD-01…19 | État préalable/final, séparation des tâches, motif et audit concordent | UNKNOWN — à contrôler |

### Feuille de contrôle avant B.7

- [ ] Toutes les réponses pertinentes sont dans le registre unique; les réponses UNKNOWN/reportées sont explicites.
- [ ] Les 3 UNKNOWN Gestionnaire (Tasks, Leads, profils) ont une décision métier, ou B.7 reste NO-GO sur les scopes concernés.
- [ ] Toutes les exceptions ont une portée/action/condition/acteur/date et audit précisés.
- [ ] Les contrôles croisés ci-dessus sont marqués `COHÉRENT` avec références; aucun `CONTRADICTOIRE` ne reste ouvert.
- [ ] Les totaux de décisions validées, UNKNOWN, bloquantes et conditionnelles sont recalculés depuis le registre.
- [ ] Responsable métier et Direction ont validé explicitement la version du registre.
- [ ] Autorisation distincte de démarrer B.7 : [ ] OUI [ ] NON; référence : __________.

**Tant que toutes les conditions bloquantes ne sont pas satisfaites : B.7 = NO-GO.** Cette fiche n’autorise aucune implémentation, modification de schéma, écriture de données ou attribution ACL.
