# GNAMBA / EGS — Phase B.4
# DECISION-003 — Validation du périmètre Agent / Gestionnaire

**Objet exclusif :** faire choisir au métier le périmètre de ligne des Agents et des Gestionnaires, pour les tables/modules où une relation exploitable existe.

**Statut : EN ATTENTE — fiche de validation, pas une décision.** La proposition de travail ci-dessous n'est pas validée. Aucun choix ni droit n'est précoché. Cette phase ne modifie ni le code, ni la base, ni la politique DELETE.

## Proposition soumise à discussion — NON VALIDÉE

> **Agent :** voir les objets explicitement affectés à l'Agent; ou, si la nature de la table le justifie et que le métier l'approuve, ceux qu'il a créés. Pas d'accès organisationnel global par défaut.
>
> **Gestionnaire :** voir les objets de son périmètre de gestion lorsqu'un lien fiable permet de le déterminer; sinon appliquer une règle choisie pour la table. Pas d'accès à toute l'organisation par défaut.

Cette proposition n'est inscrite dans aucune case de décision ci-dessous. Le métier peut la confirmer, la préciser ou la refuser.

## Choix à utiliser

Pour chaque table, choisir une règle **séparément** pour Agent et Gestionnaire (A–G ou UNKNOWN). Si une règle dépend d'un champ ou d'une relation, inscrire sa source et confirmer qu'elle relie effectivement l'objet à l'identité authentifiée.

| Code | Périmètre de ligne à décider |
|---|---|
| A | Affecté explicitement à l'utilisateur courant (nommer le champ/lien) |
| B | Créé par l'utilisateur courant (nommer le champ/lien; valider que le métier de cette table le justifie) |
| C | Propriété/rattachement à l'utilisateur courant (nommer la relation et comment l'identité est résolue) |
| D | Périmètre de gestion du Gestionnaire (nommer le lien fiable; cette option vise le Gestionnaire) |
| E | Toute l'organisation / toutes les lignes — **EXCEPTION** à nommer explicitement par table et rôle |
| F | Aucun accès pour ce rôle sur cette table |
| G | Autre règle (décrire le lien, le filtre et les conditions) |
| UNKNOWN | Pas de décision; aucun périmètre ne peut être déduit de la réponse |

Il n'existe pas de scope d'équipe normalisé recensé en B.2/B.3. L'option « équipe » n'est donc pas proposée comme mécanisme disponible. Tout choix qui dépendrait d'une équipe nécessiterait une décision et une conception distinctes; elle n'est pas incluse dans cette validation.

## Fiche à compléter par table/module

Les champs ci-dessous sont des indices observés, pas une preuve de fiabilité ni une autorisation. `tasks` est la table physique; `taches` est un alias constaté, pas une table runtime distincte. Les données runtime B.3 montrent que `leads` est vide et que `leads.assigned_to` ne permet pas d'observer une affectation existante.

| Table / module | Lien/champ repéré en B.2 (à confirmer) | Décision Agent (A–G / UNKNOWN) + champ | Décision Gestionnaire (A–G / UNKNOWN) + champ | Fiabilité du lien vers l'identité courante OUI/NON/UNKNOWN; conditions |
|---|---|---|---|---|
| Tâches (`tasks`, alias `taches`) | `employee_id`, `project_id` | UNKNOWN | UNKNOWN | UNKNOWN |
| Documents | `project_id` | UNKNOWN | UNKNOWN | UNKNOWN |
| Messages de contact (`contact_messages`) | `assigne_a` | UNKNOWN | UNKNOWN | UNKNOWN |
| Réalisations du site (`site_realisations`) | `chef_projet_id`, `created_by` / `updated_by` selon la route | UNKNOWN | UNKNOWN | UNKNOWN |
| Lots vitrine (`vitrine_lots`) | `created_by`, `updated_by` | UNKNOWN | UNKNOWN | UNKNOWN |
| Messages direction (`messages_direction`) | `destinataire_id`, `expediteur_id` | UNKNOWN | UNKNOWN | UNKNOWN |
| Présence employés (`employes_presence`) | `employee_id` | UNKNOWN | UNKNOWN | UNKNOWN |
| Journal d'activités (`activites_journal`) | `employee_id` | UNKNOWN | UNKNOWN | UNKNOWN |
| Parties | `created_by`, `updated_by` | UNKNOWN | UNKNOWN | UNKNOWN |
| Leads | `assigned_to` | UNKNOWN | UNKNOWN | UNKNOWN |
| Médias (`media_files`) | `uploaded_by` | UNKNOWN | UNKNOWN | UNKNOWN |
| Profils utilisateurs (`user_profiles`) | `user_id` | UNKNOWN | UNKNOWN | UNKNOWN |
| Villages / foncier (routes dédiées) | ACL existante `user_village_access(user_id, village_id)` sur certaines routes seulement | UNKNOWN | UNKNOWN | UNKNOWN |
| Autre table (nommer) | | UNKNOWN | UNKNOWN | UNKNOWN |

### Pour chaque règle retenue, préciser

- La table et le rôle concernés :
- Le choix A–G :
- Champ(s) et relation(s) servant au filtre :
- Comment le lien est-il vérifié avec l'utilisateur authentifié ? :
- Comportement si le lien est absent, nul, obsolète ou incohérent :
- Le choix vaut-il pour lecture, modification, ou les deux ? :
- États métier qui restreignent encore les lignes (brouillon, soumis, validé, archivé, etc.) :
- Exception et conditions, si E ou G :
- Validation métier du choix : [ ] OUI  [ ] NON  [ ] À REVOIR

Une ligne `UNKNOWN` demeure en attente. La présence d'un champ ou d'un filtre transmis par le frontend ne suffit pas à établir le scope serveur. L'accès global n'est pas une valeur de repli implicite.

## État de la décision

| Élément | État |
|---|---|
| DECISION-003 | EN ATTENTE — validation métier requise |
| Proposition Agent affecté/créateur | NON VALIDÉE |
| Proposition Gestionnaire périmètre de gestion | NON VALIDÉE |
| Règle organisationnelle globale implicite | AUCUNE |
| Modifications du code ou de la base | AUCUNE |
| Décision DECISION-002 (exceptions par table/action) | NON TRAITÉE dans B.4 |
| Décision DECISION-006 (delete/archivage/restauration) | NON TRAITÉE dans B.4 |

Responsable métier :  
Fonction :  
Date :  
Référence de validation :  

**La Phase B.4 ne valide aucune permission à elle seule. La matrice RBAC et toute implémentation restent bloquées jusqu'à la validation explicite des périmètres.**
