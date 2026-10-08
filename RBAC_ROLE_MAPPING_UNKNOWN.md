# RBAC Phase A.2 — mapping des rôles UNKNOWN

> État historique à la clôture de A.2. Supersédé par la validation officielle Phase B.1 : DECISION-001 = VALIDÉ avec les mappings ci-dessous. Les constats techniques A.2 restent inchangés.

Aucun mapping n'est validé. Le guard serveur lit users.role; access_level ne pilote pas le guard central.

| Rôle technique actuel | Rôle métier proposé | Évidence | Décision |
|---|---|---|---|
| admin | Administrateur ? | RoleEnum admin; policy actuelle donne toutes actions connues | UNKNOWN; fait technique n'est pas mandat métier |
| gestionnaire | Gestionnaire ? | libellé identique; policy actuelle lecture de modules/34 tables | UNKNOWN; nom ne confirme pas matrice |
| employe | Agent ? | rôle employé; aucune décision employe=agent trouvée | UNKNOWN; ne pas assimiler |
| guest authentifié | Utilisateur standard ? | guest est JWT; anonyme public est autre cas | UNKNOWN; identités à distinguer |

## Rôles métier absents du modèle

| Rôle | Présent techniquement | Représentable actuellement | Mécanisme observé | Décision |
|---|---|---|---|---|
| Direction / Responsable | NON | NON comme rôle distinct | RoleEnum admin/gestionnaire/employe/guest | mapping ou attribution distincte |
| Comptabilité / Finance | NON | NON comme rôle distinct | module finance mais pas rôle comptable | rôle, tables, actions et scope |
| Commercial | NON | NON comme rôle distinct | modules Leads/Clients ne prouvent pas l'attribution | rôle et périmètre |
| Immobilier / Foncier | NON | NON comme rôle distinct | UserVillageAccess ciblé, pas rôle général | rôle et scopes |

## Décisions requises

1. Approuver ou refuser chaque mapping technique↔métier.
2. Décider si access_level est attribut métier validé ou visibilité UI; backend central l'ignore.
3. Définir cumul de rôles/responsabilités et lieu d'attribution/audit.
4. Distinguer guest authentifié et visiteur anonyme.
5. Décider si les quatre rôles métiers absents doivent être représentés avant RBAC.
