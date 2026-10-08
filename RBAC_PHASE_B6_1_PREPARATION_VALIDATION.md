# RBAC B.6.1 — Préparation validation métier

> Support préparatoire fondé uniquement sur `RBAC_PHASE_B6_VALIDATION_METIER.md`. Les statuts `UNKNOWN` restent ouverts. Ce document ne vaut ni arbitrage, ni approbation, ni autorisation d’implémenter.

## 1. État de B.6

- Identifiants de décision/question uniques dans l’Annexe A : **202** (202 lignes, aucun doublon).
- Décisions déjà validées annoncées : **19 entrées** (détail en §3; ce ne sont pas 19 IDs B6).
- Entrées de registre encore `UNKNOWN` : **188**.
- Bloquantes B.7 listées : **158 IDs**.
- Conditionnelles : **30 IDs** (11 cycle de vie + 19 audit).
- Entrées B6 du registre déjà verrouillées : **14** (11 défauts d’export, 2 défauts Foncier et 1 principe média).

### Vérification des totaux et écarts

Les totaux du document source se réconcilient si l’on distingue les unités : `158 bloquantes + 30 conditionnelles = 188 UNKNOWN`; `188 UNKNOWN + 14 entrées B6 verrouillées = 202 IDs`. Les **19 décisions validées** sont le regroupement décrit en section 3 du source (4 mappings + 1 principe DECISION-004 + 14 principes généraux), pas le nombre d’IDs de l’Annexe A déjà validés. Le registre contient 14 IDs verrouillés.

## 2. Objectif de la validation métier

Faire compléter le registre unique de l’Annexe A du document source par les responsables métier : réponse, conditions et périmètre, décideur, date, référence du compte rendu et état de revue. Toute réponse partielle reste `UNKNOWN`; seule une validation métier explicite, attribuée et référencée peut clore une question. Les choix inscrits dans le source sont des choix à soumettre, pas des décisions.

Pour chaque ligne indexée au §4, ouvrir la section indiquée dans le source pour lire la question complète, son contexte et ses choix. Reporter la décision dans le registre source; les cases de validation restent vierges.

## 3. Décisions déjà validées

Liste vérifiée dans la section 3 du document source. Elles ne sont pas à revoter dans cette séance; leurs modalités et exceptions UNKNOWN demeurent arbitrables dans les IDs B6 concernés.

| Réf. | Décision déjà validée |
|---|---|
| DECISION-001 (1/4) | `admin` = Administrateur |
| DECISION-001 (2/4) | `gestionnaire` = Gestionnaire |
| DECISION-001 (3/4) | `employe` = Agent |
| DECISION-001 (4/4) | `guest` = Utilisateur standard |
| DECISION-004 | Direction/Responsable, Comptabilité/Finance, Commercial et Immobilier/Foncier ne sont pas de nouveaux rôles RBAC; fonctions/scopes/attributs cumulables en principe. Leur attribution et effets restent à décider. |
| Principe général 1/14 | Le backend est l’autorité de sécurité; la visibilité frontend ne protège pas une opération. |
| Principe général 2/14 | Une autorisation combine au minimum rôle, action et périmètre lorsqu’un périmètre s’applique. |
| Principe général 3/14 | `created_by` ne vaut pas automatiquement propriété métier. |
| Principe général 4/14 | Les ACL existantes sont respectées; `UserVillageAccess` n’est pas remplacé par un second mécanisme géographique. |
| Principe général 5/14 | Le scope Foncier s’appuie sur `UserVillageAccess`. |
| Principe général 6/14 | Les documents suivent le périmètre de leur parent métier. |
| Principe général 7/14 | Les médias suivent le périmètre de leur parent métier; `uploaded_by` est une trace. |
| Principe général 8/14 | L’Utilisateur standard est limité à son propre profil; l’Administrateur peut dépasser cette limite selon B.4.1, sans champs sensibles définis. |
| Principe général 9/14 | La suppression physique n’est pas la règle par défaut. |
| Principe général 10/14 | L’archivage est privilégié lorsqu’une notion métier d’archivage existe. |
| Principe général 11/14 | La restauration est réservée à l’Administrateur par défaut. |
| Principe général 12/14 | Les exports sont restrictifs par défaut; aucune exception n’est implicite. |
| Principe général 13/14 | Les inconnues restent `UNKNOWN`. |
| Principe général 14/14 | Une hypothèse ou proposition technique n’est jamais une décision métier. |

## 4. Décisions restant à arbitrer

Les 188 lignes ci-dessous sont `UNKNOWN` dans l’Annexe A. La colonne « Sujet » reprend l’intitulé court du registre; l’ID renvoie à la question complète, aux options et aux impacts dans la section indiquée du source. « Choix disponibles » signifie uniquement ceux explicitement inscrits dans le source. Là où aucun choix n’y est indiqué, la fiche de préparation le signale `MISSING` sans en proposer. La dépendance de chaque question n’est pas individualisée dans le source; les contrôles croisés documentés sont récapitulés au §7.

### ID — Identité / accès au compte

Source : document B.6, §5. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-ID-01` | Compte EGS obligatoire pour tout Agent | Voir la question complète au §5; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-ID-02` | Utilisateur sans fiche Employé | Voir la question complète au §5; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-ID-03` | Fiche Employé sans compte | Voir la question complète au §5; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-ID-04` | Nombre de comptes par Agent | Voir la question complète au §5; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-ID-05` | Nombre de fiches Employé par compte | Voir la question complète au §5; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-ID-06` | Identité métier commune `Entity` | Voir la question complète au §5; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-ID-07` | Départ d'un Employé | Voir la question complète au §5; aucun choix résumé dans le registre. | `UNKNOWN` |

### MGR — Périmètre organisationnel / séparation des responsabilités

Source : document B.6, §6. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-MGR-01` | Nombre de Gestionnaires par Agent | Voir la question complète au §6; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MGR-02` | Nature du rattachement | Voir la question complète au §6; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MGR-03` | Plusieurs Agents | Voir la question complète au §6; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MGR-04` | Changement de Gestionnaire | Voir la question complète au §6; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MGR-05` | Historique | Voir la question complète au §6; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MGR-06` | Délégation | Voir la question complète au §6; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MGR-07` | Périmètre identique par module | Voir la question complète au §6; aucun choix résumé dans le registre. | `UNKNOWN` |

### TASK — Création / modification / affectation / workflow / reporting

Source : document B.6, §7. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-TASK-01` | Qui peut créer une tâche ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-02` | Une tâche peut-elle avoir un seul Agent responsable ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-03` | Peut-elle avoir plusieurs participants ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-04` | Existe-t-il un responsable principal distinct des participants ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-05` | Une tâche peut-elle exister avant affectation ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-06` | Qui voit une tâche non assignée ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-07` | Qui peut modifier une tâche et dans quels états ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-08` | Qui peut affecter/réaffecter, vers quels Agents et avec quel motif ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-09` | Qui peut clôturer une tâche ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-10` | Qui peut rouvrir une tâche clôturée ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-11` | Qui peut archiver ou demander une suppression exceptionnelle ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-12` | Qui peut exporter les tâches et quel périmètre/champs ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-TASK-13` | Que devient une tâche lors du départ de son responsable ? | Voir la question complète au §7; aucun choix résumé dans le registre. | `UNKNOWN` |

### LEAD — Création / modification / affectation / workflow / données sensibles

Source : document B.6, §8. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-LEAD-01` | Un lead appartient-il à un seul Agent ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-02` | Plusieurs Agents/responsables peuvent-ils partager un lead ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-03` | Existe-t-il un responsable principal ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-04` | Le lead peut-il être transféré ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-05` | Qui peut transférer/réaffecter un lead ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-06` | Faut-il conserver l'historique des affectations ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-07` | Que devient le lead quand l'Agent quitte l'organisation ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-08` | Un Gestionnaire peut-il réaffecter les leads de son périmètre ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-09` | La réaffectation exige-t-elle motif et audit ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-10` | Un lead peut-il rester sans responsable ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-11` | Un lead peut-il être partagé entre équipes ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-12` | Le responsable doit-il obligatoirement avoir un compte EGS ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-LEAD-13` | Une Entity sans compte peut-elle être responsable métier ou propriétaire de lead ? | Voir la question complète au §8; aucun choix résumé dans le registre. | `UNKNOWN` |

### FON — Accès géographique / administration / actions / workflow

Source : document B.6, §9–10. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-FON-01` | Qui attribue le premier accès Foncier d'un utilisateur/village ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-02` | Qui peut attribuer un utilisateur à un village après bootstrap ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-03` | Qui peut révoquer un accès ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-04` | Qui peut modifier un niveau d'accès ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-05` | Un utilisateur peut-il avoir accès à plusieurs villages ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-06` | Les quatre niveaux sont-ils hiérarchiques/cumulatifs ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-07` | Quel est le détenteur métier responsable de chaque village et comment est-il désigné ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-GLOBAL-01` | Un utilisateur ayant accès à plusieurs villages ne voit-il que ces villages ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-GLOBAL-02` | Existe-t-il une fonction autorisée à accéder à tous les villages ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-GLOBAL-03` | Qui peut consulter des statistiques globales ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-GLOBAL-04` | Qui peut exporter des données de plusieurs villages ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-GLOBAL-05` | Qui peut lancer ou gérer une synchronisation globale ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-GLOBAL-06` | Qui peut gérer les ACL de tous les villages ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-GLOBAL-07` | Les opérations globales exigent-elles un rôle technique ou une permission fonctionnelle explicite ? | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-01` | Consulter les villages autorisés | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-02` | Consulter les lots | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-03` | Rechercher dans les données village | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-04` | Créer un lot | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-05` | Modifier un lot | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-06` | Archiver un lot | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-07` | Restaurer un lot | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-08` | Créer une attestation | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-09` | Modifier une attestation | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-10` | Valider une attestation | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-11` | Rejeter une attestation | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-12` | Céder / enregistrer une cession | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-13` | Consulter l'historique d'un objet | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-14` | Gérer les propriétaires | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-15` | Gérer les occupants | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-16` | Consulter les statistiques du village | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-17` | Exporter des données Foncier | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-18` | Synchroniser des données | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-FON-MAT-19` | Gérer l'ACL User–Village | Voir la question complète au §9–10; aucun choix résumé dans le registre. | `UNKNOWN` |

### DOC — Documents / fichiers

Source : document B.6, §11. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-DOC-01` | Tout document doit-il appartenir à un projet/dossier métier ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-02` | Un document sans parent est-il permis ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-03` | Un document peut-il appartenir à plusieurs parents ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-04` | Quels types de parent sont autorisés ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-05` | Un document peut-il être rendu public ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-06` | Qui peut publier un document ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-07` | Qui peut dépublier ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-08` | Qui peut archiver ou supprimer un document ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-09` | Qui peut consulter/télécharger ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-10` | Qui peut exporter un document ou une liste de documents ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-11` | Un partage temporaire est-il nécessaire ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-12` | Faut-il tracer les consultations/téléchargements ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-DOC-13` | Une exception au principe d'héritage du parent est-elle nécessaire ? | Voir la question complète au §11; aucun choix résumé dans le registre. | `UNKNOWN` |

### MEDIA — Documents / fichiers / workflow

Source : document B.6, §12. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-MEDIA-01` | Tout média métier doit-il avoir un parent ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-02` | Quels parents sont autorisés ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-03` | Un média peut-il être attaché à plusieurs objets ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-04` | Un média peut-il être public ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-05` | Qui peut le publier et le dépublier ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-06` | Qui peut supprimer ou archiver un média ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-07` | Qui peut remplacer un média ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-08` | Qui peut télécharger un média privé ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-09` | Les droits suivent-ils le parent lors d'un déplacement ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-10` | Quels médias système sans parent sont admis ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-12` | L'historique des remplacements doit-il être conservé ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-MEDIA-13` | Faut-il tracer téléchargements, export ou génération de miniature ? | Voir la question complète au §12; aucun choix résumé dans le registre. | `UNKNOWN` |

### PROFILE — Consultation / modification / données sensibles / reporting

Source : document B.6, §13. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-PROFILE-01` | Quels utilisateurs disposent d'un profil et peut-il être facultatif ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PROFILE-02` | Quels champs l'utilisateur peut-il consulter/modifier lui-même ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PROFILE-03` | Quelles données ne sont pas modifiables par l'utilisateur ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PROFILE-04` | Quelles données peuvent être consultées par un Administrateur au-delà de son propre profil ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PROFILE-05` | Que peut consulter un Gestionnaire sur l'Agent de son équipe ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PROFILE-06` | Un Gestionnaire peut-il modifier le profil d'un Agent ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PROFILE-07` | Qui peut consulter les données RH du profil/dossier ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PROFILE-08` | Quelles données sont sensibles et masquées à certains acteurs ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PROFILE-09` | Qui peut exporter des profils ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PROFILE-10` | Que peut consulter Direction / Responsable ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PROFILE-11` | Faut-il tracer consultation, modification et export de profils ? | Voir la question complète au §13; aucun choix résumé dans le registre. | `UNKNOWN` |

### SCOPE — Administration / périmètre organisationnel

Source : document B.6, §14. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-SCOPE-01` | Un compte peut-il cumuler plusieurs fonctions/scopes fonctionnels ? | Voir la question complète au §14; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-SCOPE-02` | Un Agent peut-il recevoir la fonction Commercial ? | Voir la question complète au §14; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-SCOPE-03` | Un Gestionnaire peut-il recevoir la fonction Foncier ? | Voir la question complète au §14; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-SCOPE-04` | Une fonction métier change-t-elle automatiquement des droits ? | Voir la question complète au §14; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-SCOPE-05` | Une attribution explicite de scope est-elle nécessaire ? | Voir la question complète au §14; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-SCOPE-06` | Un utilisateur peut-il changer de scope sans changer de rôle technique ? | Voir la question complète au §14; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-SCOPE-07` | Faut-il historiser attribution, modification et retrait de scope ? | Voir la question complète au §14; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-SCOPE-08` | Direction/Finance/Commercial/Immobilier-Foncier existent-ils et qui attribue ces fonctions ? | Voir la question complète au §14; aucun choix résumé dans le registre. | `UNKNOWN` |

### PUB — Consultation / documents / fichiers / exception métier

Source : document B.6, §17. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-PUB-01` | Consultation de village | Voir la question complète au §17; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PUB-02` | Vérification attestation par référence | Voir la question complète au §17; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PUB-03` | Noms / listes de villages | Voir la question complète au §17; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PUB-04` | Médias, assets marque inclus | Voir la question complète au §17; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PUB-05` | Documents | Voir la question complète au §17; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PUB-06` | Fiches publiques (lots, réalisations, biens) | Voir la question complète au §17; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PUB-07` | Contenus CMS et layouts publiés | Voir la question complète au §17; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PUB-08` | Contrats/pages de présentation | Voir la question complète au §17; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-PUB-09` | Formulaires publics (contact, capture lead, intérêt lot) | Voir la question complète au §17; aucun choix résumé dans le registre. | `UNKNOWN` |

### OWN — Périmètre organisationnel / séparation des responsabilités

Source : document B.6, §20. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-OWN-01` | Tâche | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-OWN-02` | Lead | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-OWN-03` | Projet | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-OWN-04` | Document | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-OWN-05` | Média | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-OWN-06` | Lot | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-OWN-07` | Attestation | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |

### EDGE — Cas limite / workflow

Source : document B.6, §21. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-EDGE-01` | Agent sans Gestionnaire | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-02` | Gestionnaire sans Agent | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-03` | Agent avec plusieurs scopes/fonctions | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-04` | Agent autorisé sur plusieurs villages | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-05` | Gestionnaire supervisant plusieurs services | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-06` | Lead transféré | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-07` | Tâche réaffectée | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-08` | Document déplacé vers un autre parent | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-09` | Média déplacé vers un autre parent | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-10` | Projet archivé | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-11` | Utilisateur désactivé | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-12` | Village archivé/supprimé | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-13` | Agent devient Gestionnaire | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-EDGE-14` | Gestionnaire redevient Agent | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |

### OFF — Identité / accès au compte / workflow

Source : document B.6, §19. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-OFF-01` | Départ définitif de l'organisation | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-OFF-02` | Changement de service | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-OFF-03` | Changement de poste | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-OFF-04` | Devient Gestionnaire | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-OFF-05` | Cesse d'être Gestionnaire | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-OFF-06` | Changement de village | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-OFF-07` | Perte d'un scope fonctionnel | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-OFF-08` | Attribution d'un nouveau scope | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-OFF-09` | Absence temporaire planifiée | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-OFF-10` | Suspension/inactivation du compte | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |
| `B6-OFF-11` | Remplacement temporaire d'une personne absente | Voir la question complète au §19; aucun choix résumé dans le registre. | `UNKNOWN` |

### DEL — Suppression, archivage, restauration

Source : document B.6, §16. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-DEL-01` | Utilisateur / compte | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-DEL-02` | Employé | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-DEL-03` | Tâche | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-DEL-04` | Lead | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-DEL-05` | Projet | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-DEL-06` | Document | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-DEL-07` | Média | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-DEL-08` | Lot Foncier | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-DEL-09` | Attestation | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-DEL-10` | Client / partie | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |
| `B6-DEL-11` | Profil utilisateur | Réponse ouverte / champs à préciser; options fermées : MISSING. | `UNKNOWN` |

### AUD — Audit / traçabilité

Source : document B.6, §18. Catégorie indiquée seulement au niveau que permet le libellé; chaque sous-question reste dans sa section source.

| ID | Sujet du registre | Choix / champ explicitement présent dans le source | Statut |
|---|---|---|---|
| `B6-AUD-01` | Connexion / échec / déconnexion sensible | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-02` | Changement de rôle | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-03` | Attribution, changement ou retrait de scope | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-04` | Attribution User–Village | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-05` | Révocation User–Village | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-06` | Modification du niveau Foncier | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-07` | Affectation d'une tâche | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-08` | Réaffectation d'une tâche | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-09` | Affectation d'un lead | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-10` | Réaffectation/transfert d'un lead | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-11` | Validation métier | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-12` | Rejet métier | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-13` | Archivage | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-14` | Restauration | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-15` | Export | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-16` | Téléchargement d'un document | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-17` | Téléchargement d'un média | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-18` | Publication | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |
| `B6-AUD-19` | Dépublication | OUI / NON / CONDITIONNEL / UNKNOWN; champs à préciser au §18. | `UNKNOWN` |

### Contrôle des informations de préparation

| Élément attendu | Résultat de l’audit |
|---|---|
| ID | Présent pour chaque question ouverte (188/188). |
| Question métier | Sujet présent dans le registre pour 188/188; formulations complètes dans les sections source citées ci-dessus. |
| Contexte fonctionnel | Présent au niveau des sections et parfois des lignes. Pour une lecture isolée, le lien au contexte parent est requis; contexte autonome par ligne : `MISSING`. |
| Décision attendue | Le sujet et les champs du registre permettent d’identifier le thème à arbitrer; aucune réponse métier n’est fournie. |
| Choix possibles | Disponibles dans plusieurs tableaux/questions source, mais pas sous forme normalisée dans l’Annexe A. Pour B6-DEL et B6-EDGE, aucun jeu fermé de choix n’est indiqué : `MISSING` (réponse libre prévue). Pour les autres IDs, consulter la section source; ne pas compléter par inférence. |
| Dépendance | Le source donne des contrôles croisés par groupes (§Annexe A) mais pas une dépendance directionnelle par ID : `MISSING` au niveau individuel, sauf les dépendances et conditions explicitement résumées au §7 ci-dessous. |
| Impact si non décidé | Indiqué explicitement pour les questions de plusieurs tableaux, mais non systématiquement pour AUD, DEL, EDGE, OFF et OWN : `MISSING` au niveau des entrées sans colonne « Impact » ou conséquence individualisée. Conséquences groupées du source conservées au §5 et §7. |
| Statut | `UNKNOWN` dans les 188 lignes du registre. |

**MISSING transversaux pour les 19 décisions validées :** la section 3 affirme leur validation mais ne fournit pas, pour chacune des 19 entrées de décision, le décideur nominatif/fonction ayant validé, la date et la référence de validation. Ces éléments de preuve sont à joindre au registre de validation ou au compte rendu; le présent document ne les reconstitue pas.

## 5. Bloquantes B.7

Le document source désigne ces 158 IDs comme bloquants pour figer le modèle cible et le plan de rapprochement/migration. Les IDs sont regroupés ci-dessous sans ajouter de priorité subjective.

| Groupe source | IDs bloquants | Décision attendue / motif documenté |
|---|---|---|
| Identité | B6-ID-01…07 | Obligations et cardinalités User–Employee–Entity; choisir la relation authentifiée et éviter d’associer les mauvaises personnes. |
| Hiérarchie | B6-MGR-01…07 | Cardinalité, durée, délégation et périmètre Gestionnaire; construire le scope sans accès global implicite. |
| Tâches | B6-TASK-01…13 | Affectation, actions et devenir des tâches; construire les scopes Agent/Gestionnaire. |
| Leads | B6-LEAD-01…13 | Responsables, transferts, partage et historique; choisir la représentation canonique et l’accès commercial. |
| Foncier | B6-FON-01…07; B6-FON-MAT-01…19; B6-FON-GLOBAL-01…07 | Bootstrap, attribution, niveaux, actions locales/globales; éviter ACL orpheline ou accès inter-villages implicite. |
| Documents | B6-DOC-01…13 | Parents permis, orphelins, multi-parent et exceptions; concevoir liens/intégrité et accès au téléchargement. |
| Médias | B6-MEDIA-01…10; B6-MEDIA-12…13 | Attachements, médias publics/système et liens multiples; livraison du binaire selon le parent et exceptions. |
| Profils | B6-PROFILE-01…11 | Champs self/admin/Gestionnaire et données RH/sensibles; définir portée et confidentialité. |
| Fonctions/scopes | B6-SCOPE-01…08 | Cumul, attribution et historique; séparer fonction, rôle, hiérarchie et géographie. |
| Public/privé | B6-PUB-01…09 | Contrat public/auth/rôle et champs visibles; définir les projections à exposer. |
| Ownership, cas limites et changements de situation | B6-OWN-01…07; B6-EDGE-01…14; B6-OFF-01…11 | Définir ownership, transferts, états et événements de vie pour calculer les scopes. |

**Total : 158 IDs**, exactement selon le développement des plages de la section 22 source.

## 6. Décisions conditionnelles

Ces 30 IDs sont conditionnels au périmètre ou à l’exception décrits dans le source. Tant que l’opération n’est pas souhaitée/exposée, le défaut déjà validé demeure; les détails deviennent nécessaires avant de concevoir une exception.

### Cycle de vie — 11 IDs

`B6-DEL-01…11` : suppression physique `NON` par défaut, archivage si le métier le prévoit, restauration Administrateur par défaut. Condition de réouverture : demander une exception de suppression, attribuer explicitement l’action de cycle de vie, ou devoir décider le devenir des descendants/relations. Pour toute exception, le source exige objet, rôle/fonction, action, condition/état, durée/rétention, motif, audit et traitement des descendants.

| ID | Objet | Condition exacte documentée |
|---|---|---|
| `B6-DEL-01` | Utilisateur / compte | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |
| `B6-DEL-02` | Employé | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |
| `B6-DEL-03` | Tâche | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |
| `B6-DEL-04` | Lead | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |
| `B6-DEL-05` | Projet | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |
| `B6-DEL-06` | Document | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |
| `B6-DEL-07` | Média | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |
| `B6-DEL-08` | Lot Foncier | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |
| `B6-DEL-09` | Attestation | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |
| `B6-DEL-10` | Client / partie | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |
| `B6-DEL-11` | Profil utilisateur | Bloquant si une exception à la suppression physique par défaut est demandée ou si une action de cycle de vie doit être explicitement attribuée. |

### Audit — 19 IDs

`B6-AUD-01…19` : politique d’audit par événement à trancher quand l’opération concernée est décidée comme exposée/autorisée, notamment pour opérations sensibles, publication et export. Le source permet OUI/NON/CONDITIONNEL/UNKNOWN et demande événements/champs, acteur, date, motif, objet/scope, rétention et lecteurs. Il précise qu’une politique générale sans exigence de dérogation peut être cadrée ultérieurement.

| ID | Événement | Condition exacte documentée |
|---|---|---|
| `B6-AUD-01` | Connexion / échec / déconnexion sensible | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-02` | Changement de rôle | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-03` | Attribution, changement ou retrait de scope | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-04` | Attribution User–Village | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-05` | Révocation User–Village | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-06` | Modification du niveau Foncier | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-07` | Affectation d'une tâche | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-08` | Réaffectation d'une tâche | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-09` | Affectation d'un lead | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-10` | Réaffectation/transfert d'un lead | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-11` | Validation métier | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-12` | Rejet métier | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-13` | Archivage | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-14` | Restauration | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-15` | Export | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-16` | Téléchargement d'un document | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-17` | Téléchargement d'un média | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-18` | Publication | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |
| `B6-AUD-19` | Dépublication | Conditionnée à l’exposition ou l’autorisation de l’opération; cadrage ultérieur possible si aucune exigence spécifique. |

**Total conditionnel : 30 IDs** (11 DEL + 19 AUD). Ils forment le complément des 158 bloqueurs au sein des 188 UNKNOWN.

## 7. Dépendances

Le source documente les contrôles croisés ci-dessous. Ils indiquent des décisions à vérifier ensemble, mais ne donnent pas toujours une flèche causale univoque. Aucune direction causale n’est ajoutée là où le texte ne la démontre pas.

| Source / groupe | Dépend de / à comparer avec | Pourquoi | Conséquence si non résolu |
|---|---|---|---|
| B6-ID-01…05 | B6-TASK-02…05 | Compte Agent, compte sans Employee, Employee sans compte et cardinalités doivent concorder avec l’affectation des tâches. | Relations User–Employee incertaines; scope des tâches non calculable. |
| B6-ID-04…06 | B6-LEAD-12…13 | Entity et liens User–Employee–Lead doivent définir une identité et un rapprochement approuvés. | Identité des responsables de lead incertaine. |
| B6-MGR-01…07 | B6-TASK-01…13; B6-LEAD-01…13; B6-PROFILE-05…06 | Le périmètre Gestionnaire doit être identique par module ou ses différences explicites. | Populations/actions Gestionnaire indéterminées. |
| B6-TASK-08…13; B6-LEAD-04…09 | B6-OFF-01…11; B6-EDGE-06…07 | Transferts, historique et offboarding touchent aux mêmes accès et dates d’effet. | Scope courant/historique et réaffectation non déterminés. |
| B6-FON-01…07; B6-FON-MAT-01…21; B6-FON-GLOBAL-01…07 | B6-EDGE-04…05; B6-SCOPE-03 | ACL, niveaux, multi-village, opérations globales et attribution de fonction Foncier doivent concorder. | Risque d’accès village implicite ou bootstrap non défini. |
| B6-DOC-01…13; B6-MEDIA-01…13 | B6-OWN-04…05; B6-EDGE-08…10 | Parent, ownership, multi-parent, déplacement et héritage déterminent ensemble le scope des fichiers. | Accès aux fichiers/descendants lors d’un déplacement ou parent absent indéterminé. |
| B6-SCOPE-01…08 | B6-MGR-07; B6-FON-GLOBAL-07 | Fonctions cumulables et opérations globales ne doivent pas induire de droits implicites. | Périmètre effectif d’une fonction inconnu. |
| B6-DEL-01…11 | B6-TASK-11; B6-FON-MAT-20…21 | Exceptions de suppression/restauration doivent respecter les défauts verrouillés et préciser l’objet. | Cycle de vie incohérent avec les défauts validés. |
| B6-EXP-01…11 | B6-FON-MAT-17; B6-FON-GLOBAL-04; B6-AUD-15 | Une exception d’export doit définir scope/champs et audit ensemble. | Aucun export exceptionnel à concevoir sans décision complète. |
| B6-PUB-01…09 | B6-DOC-05…07; B6-MEDIA-04…05; B6-AUD-18…19 | Contrats public/privé, publication, données/champs et audit doivent concorder. | Ne pas exposer un parcours/champ par défaut. |
| B6-PROFILE-01…11 | B6-MGR-07; B6-SCOPE-01…08 | Self-profile, Admin/Gestionnaire, sensibilité et scopes doivent rester cohérents. | Accès profil/champs sensible indéterminé. |
| DECISION-007; B6-FON-MAT-08…12 | B6-AUD-01…19 | Actions métier/workflow, séparation des tâches et audit sont un contrôle croisé source. | États, valideur et traçabilité à arbitrer ensemble. |

Le source ne documente pas d’autres dépendances directionnelles; pour les questions indépendantes des groupes ci-dessus : **AUCUNE DÉPENDANCE IDENTIFIÉE**. Aucun cycle dirigé n’est démontrable depuis cette matrice non directionnelle.

## 8. Contradictions / ambiguïtés

- **Contradiction de statut constatée dans le corpus : aucune réponse incompatible n’est inscrite dans le registre rempli**, lequel conserve 188 `UNKNOWN` et 14 valeurs verrouillées. Le journal source indique « aucune contradiction contrôlée à ce stade »; l’absence d’une contradiction consignée ne prouve pas que les arbitrages encore ouverts sont cohérents.
- **Ambiguïté de décompte levée :** 19 décisions validées désigne des entrées de décision (§3), tandis que les statuts par ID donnent 14 IDs B6 verrouillés. Ce n’est pas une contradiction métier, mais les unités doivent rester distinctes.
- **Dépendances :** la matrice source est un ensemble de contrôles croisés, pas un graphe dirigé. Elle ne permet pas d’affirmer une séquence causale entre tous les IDs, ni de vérifier une dépendance circulaire formelle.
- **Justification de validation :** les 19 décisions établies sont déclarées validées, mais leurs approbateurs, dates et références détaillés sont `MISSING` dans le document source.
- **Questionnaire vs registre :** le source dit que l’Annexe A fait foi et que le détail réside dans les sections principales. Une réponse maintenue uniquement dans un autre endroit serait à reporter; aucune contradiction de réponse n’est observée actuellement.

**Arbitrage métier requis :** aucun conflit actuel entre deux réponses métier n’est soumis par ce constat. Les décisions UNKNOWN restent à répondre sans arbitrage prérempli.

## 9. Informations manquantes

- Pour chacune des 19 entrées validées : approbateur/fonction, date et référence écrite permettant de vérifier la validation (voir §3).
- Pour les 188 UNKNOWN : relations de dépendance individualisées; le source ne fournit que les groupes de contrôle du §7.
- Pour chaque UNKNOWN : contexte autonome, options de réponse et impact si non décidé ne sont pas tous répétés dans le registre unique; consulter la question détaillée par ID au §4. Les choix libres de B6-DEL et B6-EDGE ne sont pas bornés (`MISSING`), conformément au format ouvert du questionnaire.
- Dans les lignes B6-AUD, B6-DEL, B6-EDGE, B6-OFF et B6-OWN, plusieurs entrées ne comportent pas de conséquence individuelle explicite dans l’Annexe A (`MISSING`); le contexte groupé est conservé au §5–7.
- Champs de réponse encore vides : conditions/périmètre, décideur, date, référence et état de revue pour tous les UNKNOWN. Ce sont des champs à remplir par les répondants, pas des décisions déduites ici.

## 10. Questions nécessitant un arbitrage métier

Les questions à poser sont les libellés complets des 188 IDs de la section 4, dans le document source. Les responsables complètent notamment les décisions structurantes ci-dessous sans extrapoler les principes déjà validés :

- Quelle relation d’identité et quelles cardinalités relient compte EGS, fiche Employé, Agent, Entity et responsable d’objet ?
- Comment s’établissent la hiérarchie, la délégation et les périmètres du Gestionnaire par module ?
- Quelles actions et transitions autoriser sur tâches, leads, données Foncier, documents, médias et profils, pour quels acteurs, états et périmètres ?
- Comment se gouvernent les ACL User–Village, le bootstrap, les niveaux et les exceptions globales ?
- Quelles fonctions/scopes existent, qui les attribue et quelles dates/historiques s’appliquent ?
- Quelles projections publiques, opérations d’export et exigences d’audit sont approuvées ?
- Comment traiter ownership, transferts, départs, absences, désactivations et cas limites ?
- Souhaite-t-on une exception à l’un des défauts validés, et avec quelle portée, condition et trace ?

Le registre doit en outre nommer pour chaque réponse le responsable métier, la date, la référence de compte rendu, les conditions et l’état de revue.

## 11. Ordre de validation proposé

Ordre limité aux dépendances et contrôles croisés documentés; à l’intérieur d’un groupe, aucun ordre supplémentaire n’est établi par le source.

1. Identité et cardinalités (B6-ID), à rapprocher des responsabilités de tâches et leads.
2. Hiérarchie et périmètres Gestionnaire (B6-MGR), puis comparaison avec actions tâches, leads et profils.
3. Attributions, affectations, transferts, historiques et départs (B6-TASK, B6-LEAD, B6-OFF, B6-EDGE).
4. Fonctions/scopes et gouvernance User–Village (B6-SCOPE, B6-FON, B6-FON-MAT, B6-FON-GLOBAL), à vérifier contre les cas multi-village.
5. Parents, ownership, déplacement, héritage et publication de documents/médias (B6-DOC, B6-MEDIA, B6-OWN, B6-EDGE).
6. Profils et données sensibles (B6-PROFILE), comparés au scope Gestionnaire et aux fonctions/scopes.
7. Workflows et opérations retenues, puis contrôles conditionnels suppression/restauration, export et audit (B6-DEL, B6-EXP, B6-AUD); appliquer les défauts validés en l’absence d’exception.
8. Vérifier les contrôles croisés du §7 et consigner chaque issue dans le journal d’arbitrage de l’Annexe A.

Cet ordre n’accorde pas de priorité métier et ne résout aucune question par avance.

## 12. Critère de clôture B.6

B.6 peut être considérée validée uniquement lorsque, selon les critères factuels du document source :

- le registre unique complet est revu; chaque ID porte une réponse ou reste explicitement `UNKNOWN`/`REPORTÉ` avec responsable et motif;
- toute réponse `CONDITIONNELLE` comporte une condition observable, un responsable et une date d’effet/expiration si pertinente;
- chaque exception décrit rôles/fonctions, objet/module, action, périmètre, état, durée et audit;
- les principes/defaults validés restent appliqués lorsqu’aucune exception n’est validée;
- les contrôles croisés sont marqués cohérents avec références; aucune contradiction ouverte ne subsiste;
- les totaux sont recalculés depuis le registre; le responsable métier et la Direction valident explicitement une version datée et référencée.

La source précise qu’une question peut rester UNKNOWN/reportée avec motif au contrôle de complétude; les décisions explicitement listées comme bloquantes demeurent un **NO-GO B.7** tant qu’elles restent UNKNOWN.

## 13. Interdiction de passage automatique en B.7

B.7 ne commence qu’après validation métier explicite et distincte. Ce support ne valide aucune règle métier, ne transforme aucun UNKNOWN en décision et n’autorise ni implémentation, ni changement de rôle/ACL/permission/schéma/données. B.7 = **NOT STARTED**.

## Annexe — résultat du contrôle de cohérence du registre

- IDs uniques : 202; doublons : 0.
- Statuts `UNKNOWN` : 188.
- Entrées B6 verrouillées : B6-EXP-01…11, B6-FON-MAT-20…21, B6-MEDIA-11 (14 au total).
- Réponses incompatibles pour un même ID : aucune trouvée dans l’Annexe A.
- Dépendances circulaires explicites : aucune créée; matrice croisée non directionnelle.
- Références nécessaires à la compréhension des IDs : les sections 5–21 du document source et les contrôles croisés de son Annexe A; aucun autre document consulté.
- Source intégrale : `RBAC_PHASE_B6_VALIDATION_METIER.md`.
