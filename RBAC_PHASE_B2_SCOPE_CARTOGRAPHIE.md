# GNAMBA / EGS — Phase B.2
# Cartographie read-only des scopes et équipes

Date d'observation : 2026-09-24. Sources lues : modèles, migrations, services, routeurs et frontend. La vérification runtime de Phase B.3 est consignée dans `RBAC_PHASE_B3_RUNTIME_READONLY.md`.

## A. Résumé exécutif

- Équipes : PARTIELLEMENT. Des champs texte service/département existent, mais aucune équipe normalisée avec membres et gestionnaire n'est démontrée.
- Relation Agent → équipe → Gestionnaire : N'EXISTE PAS dans les modèles/API consultés.
- L'utilisateur porte rôle, access_level, poste et department; Employee porte service/poste. Ces valeurs ne sont pas des scopes d'autorisation.
- Aucun scope générique par utilisateur n'est présent dans les permissions centrales ou les claims du token.
- Une ACL UserVillageAccess lie un utilisateur et un village avec un niveau d'accès; quelques routes Foncier l'utilisent. Elle ne couvre pas tous les parcours.
- Les mappings de rôles sont inscrits comme DECISION-001 VALIDÉ dans les référentiels officiels Phase B.1; DECISION-004 est validé sur le principe. Aucun rôle ni scope n'a été ajouté au code.
- Le DELETE générique couvre 38 noms de table uniques et exécute un DELETE SQL physique après authentification et permission.
- Des deleted_at existent dans plusieurs modèles/migrations et des routes dédiées offrent soft-delete/restore; d'autres routes hard-delete. Les écarts du schéma runtime sont détaillés dans le rapport B.3.
- Les tables d'audit/sécurité, statistiques et visites sont recensées en section E. Aucune politique de rétention n'a été établie.

## B. Équipes

**État : PARTIELLEMENT.** Les preuves indiquent des étiquettes de service/département, pas une structure d'équipe.

| Question | Constat factuel |
|---|---|
| Une table ou un modèle Team existe-t-il ? | Aucun modèle/table d'équipe ou membership repéré dans les fichiers examinés. |
| Comment User est-il rattaché à une équipe ? | Aucun team_id ou membership. User.department est une chaîne; Employee.service est une chaîne. |
| Comment le Gestionnaire est-il rattaché à l'équipe ? | Aucun manager_id, supervisor_id, reports_to ou lien hiérarchique repéré. |
| Agent → équipe → Gestionnaire existe-t-il ? | NON dans le schéma et les services examinés. |
| Les équipes servent-elles aux autorisations backend ? | Aucune policy consultée ne filtre selon department/service. La policy centrale regarde rôle/module/action; l'ACL Foncier regarde certains accès village. |
| Le frontend utilise-t-il ces valeurs ? | Department est affiché/modifié dans l'écran de gestion des utilisateurs. Le menu utilise role/access_level; aucun scope d'équipe serveur n'en découle. |
| Existe-t-il un élément apparenté ? | Messages de direction peuvent contenir cibles de services; cela cible des communications et ne démontre pas une appartenance ni une autorisation d'accès. |

Sources : backend/app/models/user.py (department, poste), backend/app/models/hr.py (Employee.service, poste), backend/app/models/entity.py (metadata descriptive), écrans Utilisateurs et Sidebar. User et Employee sont liés à Entity comme identité unifiée, sans relation de supervision.

## C. Scope personnel actuel

### Données utilisateur

Le modèle users expose id, email, full_name, role, access_level, poste, department, phone, is_active et entity_id. Employee expose service/poste et des données RH, puis entity_id. Entity possède identité, created_by/updated_by et metadata JSON; un nom de champ de metadata ne constitue pas à lui seul une règle d'accès.

UserProfile est relié à users par user_id. Il contient préférences d'interface, langue, fuseau horaire, disposition du tableau de bord et données de connexion; aucune policy consultée n'utilise preferences comme scope.

### Autorisations et claims

Les mappings admin → Administrateur, gestionnaire → Gestionnaire, employe → Agent et guest → Utilisateur standard sont validés dans le registre Phase B.1 (DECISION-001). DECISION-004 valide sur le principe l'absence de nouveaux rôles RBAC pour Direction, Finance, Commercial et Immobilier/Foncier; ces responsabilités sont des scopes/attributs cumulables. Leurs modalités techniques d'attribution restent en attente et aucun scope n'a été ajouté au code.

RoleEnum et AccessLevelEnum ne contiennent que admin, gestionnaire, employe et guest. Le token contient role, access_level, poste et department; aucun tableau de scopes fonctionnels n'a été repéré. Le guard central consulte le rôle et module/action, pas department/poste. La liste ACCESS_LEVEL_MODULES/hasAccess du frontend ne contrôle que la visibilité de modules dans l'interface.

### Mécanisme d'accès individualisé limité au Foncier

La table user_village_access contient user_id, village_id et access_level parmi lecteur, agent, validateur, gestionnaire. Elle a une contrainte unique par couple utilisateur-village. Migration 006, modèle UserVillageAccess, repository et service permettent l'attribution et la vérification de ce niveau. Quelques routes Foncier appellent check_access pour des opérations ciblées; beaucoup d'autres chemins n'ont pas ce contrôle. Ce n'est pas un scope transversal des autres modules.

Réponses factuelles :
- Périmètre général d'un Agent : NON démontré. employee_id, agent_id, assigned_to et similaires sont présents sur certains objets, mais aucune règle universelle ne compare le champ à l'utilisateur courant.
- Périmètre général d'un Gestionnaire : NON démontré. Pas de relation équipe/manager/dossier responsable générique.
- Accès par village : OUI, partiellement, sur certains endpoints via user_village_access.
- Filtres envoyés par le frontend : ils ne constituent pas une autorisation de ligne backend.

## D. Scopes fonctionnels

| Scope | Structure technique existante | Attribut utilisateur existant | Déduction possible ? | UNKNOWN ? |
|---|---|---|---|---|
| direction | Aucun scope ou permission Direction trouvé | poste, department descriptifs | NON pour autoriser des données | OUI |
| finance | Module/API et tables financières, sans ACL utilisateur | Aucun attribut Finance/permission utilisateur trouvé | NON | OUI |
| commercial | Clients/leads; assigned_to sur certaines données | Affectataire de lead ponctuel, parfois metadata | NON de façon générale; ce champ ne fonde pas une ACL globale | OUI |
| immobilier_foncier | UserVillageAccess par village; objets immobiliers ont propriétaires/parties | Niveau d'accès village; owner/created_by sur certains objets | OUI uniquement pour les vérifications village qui appellent l'ACL; NON globalement | OUI pour le périmètre général |

Le nom d'un module, service ou département n'établit pas un scope.

## E. Tables d'audit, sécurité, statistiques et visites

L'archivage métier et la rétention technique sont des politiques distinctes. Aucun délai de rétention ni décision de purge n'a été trouvé; les choix métier restent UNKNOWN.

| Table | Nature | Archivage métier pertinent ? | Rétention/purge technique plus appropriée ? | Justification |
|---|---|---|---|---|
| audit_logs | Table d'audit déclarée par migration 002; définition réapparaît dans un artefact de migration ultérieur | UNKNOWN | À décider | État actif inconnu; pas de modèle courant identifié |
| activity_logs | Journal d'audit avec acteur, rôle, action, anciennes/nouvelles valeurs, requête/appareil | UNKNOWN | À décider | Modèle ActivityLog et migrations; trace d'événements |
| foncier_audit | Audit Foncier: lot/action/anciennes-nouvelles valeurs/acteur/date | UNKNOWN | À décider | Migration et écritures de certains chemins RPC |
| media_audit_logs | Actions media, utilisateur et date | UNKNOWN | À décider | Modèle MediaAuditLog |
| settings_audit | Changements de paramètres, clé, valeurs avant/après, acteur/action | UNKNOWN | À décider | Migration installe un trigger d'audit |
| auth_audit_logs | Événements d'authentification, utilisateur, action, IP, agent, date | UNKNOWN | À décider | Modèle et migration d'audit auth |
| auth_login_failures | Tentatives login échouées, email/IP/date | UNKNOWN | À décider | Trace sécurité; durée inconnue |
| auth_sessions | Sessions/refresh, appareil/IP, révocation/compromission | UNKNOWN | À décider | État session et sécurité |
| activites_journal | Activités opérationnelles planifiées par employé, dates, statut/priorité | UNKNOWN | UNKNOWN | Modèle décrit des activités, pas un audit immuable |
| stats_journalieres | Agrégats/statistiques quotidiennes | UNKNOWN | À décider | Conservation statistique non spécifiée |
| visiteurs | Registre visiteurs et coordonnées/statut | UNKNOWN | À décider | Données métier/personnelles |
| visites_du_jour | Visites, date, client/lot, agent, statut | UNKNOWN | À décider | Enregistrement opérationnel |
| visites_en_cours | Visite en cours, dates, agent, lot, notes | UNKNOWN | À décider | État opérationnel |
| visites_terrain | Table générique de visites terrain | UNKNOWN | UNKNOWN | Modèle ORM détaillé non établi |
| visites | Nom générique référencé par consommateurs | UNKNOWN | UNKNOWN | Table/modèle runtime et nature exacte à confirmer |

auth_sessions, auth_login_failures, settings_audit, activity_logs, foncier_audit et audit_logs ne font pas tous partie des 38 noms du registre générique. Aucune purge n'a été exécutée ou proposée comme décision.

## F. DELETE / ARCHIVE / RESTORE

### DELETE générique

- Route : DELETE /api/v1/tables/{table}/{row_id}, handler delete_row dans backend/app/api/v1/tables/router.py.
- TABLES a 40 entrées textuelles mais 38 noms uniques; tasks/taches sont des alias et lead_campaigns/lead_interactions sont répétés.
- Le handler exige get_current_user, puis enforce_permission(erp_table, delete, resource=table). Selon la policy code actuelle et les mappings explicitement fournis par le brief, admin/Administrateur passe; gestionnaire, employe et guest ne passent pas la permission delete.
- GenericTableRepository.delete exécute DELETE FROM <table> WHERE id=:id puis commit. C'est physique, sans test deleted_at, condition d'état ni événement d'audit dans ce repository.
- Cette route s'applique aux 38 noms, même lorsqu'une route métier dédiée a un cycle soft-delete/restore.

### Champs deleted_at et actions dédiées trouvés

| Tables / ressources | Champ ou lifecycle constaté |
|---|---|
| properties, lease_contracts, rent_payments | deleted_at/deleted_by dans modèles/migrations; DELETE dédié soft par défaut, soft=false permet hard delete; POST restore présent |
| media_files | deleted_at/deleted_by; API dédiée soft delete, restore et purge physique distincte |
| leads | deleted_at/deleted_by dans modèle; DELETE dédié admin; comportement précis du repository/service à vérifier |
| entities | deleted_at/deleted_by; DELETE dédié soft par défaut, soft=false hard delete; POST restore |
| foncier_lots | deleted_at/deleted_by/deleted_reason; archive et restore dédiées |
| foncier_attestations | deleted_at déclaré; scan change statut vers archive; restore général non établi |
| documents, employees, tasks, finances | deleted_at déclaré par migrations; alignement modèles/routes variable. Route Tasks exécute DELETE SQL physique. |
| foncier_villages | modèle consulté sans deleted_at; migration générée contient opérations d'ajout/suppression du champ selon l'emplacement. Schéma effectif UNKNOWN. |
| autres tables | aucun deleted_at/archived_at/is_deleted/is_archived établi au scan; route générique supprime physiquement |

Aucun champ conventionnel archived_at, is_deleted ou is_archived n'a été trouvé dans les modèles consultés. Une colonne de migration ne prouve pas sa présence sur la base déployée; celle-ci n'a pas été consultée.

### Routes dédiées constatées

| Ressource | Action observée | Sémantique du code | Contrôle/audit observé |
|---|---|---|---|
| Foncier lots | archive (motif) / restore | soft-delete; deleted_at/by/reason et version | JWT; rôle métier général non imposé par route; acteur conservé dans l'objet |
| Foncier villages | DELETE via service/repository | BaseRepository fait hard delete si le modèle n'a pas deleted_at; migrations divergentes | JWT; pas de restore village repéré |
| Foncier lotissements/îlots | DELETE via repository | modèles sans deleted_at observé, pas de restore; hard delete via repo | certaines routes sans JWT |
| Immobilier properties/contracts/payments | DELETE soft par défaut, soft=false hard, POST restore | archive logique et suppression physique sont deux branches | handlers inspectés sans garde auth/rôle; deleted_by souvent null ou TODO |
| Media | soft DELETE, restore, purge physique | actions séparées | guards distincts; audit Media présent |
| Entities | soft DELETE par défaut, hard si soft=false, restore | soft lifecycle et restauration | pas de garde auth visible sur router Entities |
| Employees | route delete appelle Entity soft delete | soft lifecycle | pas de garde auth visible sur router Employees |
| Clients | DELETE désactive le client | statut inactif, pas d'archive générique prouvée | permission centrale par action |
| Tasks | DELETE SQL physique | hard delete malgré deleted_at déclaré en migration | handler sans guard auth visible |
| Finance | DELETE met statut annule puis hard delete si déjà annulée | annulation et hard delete dans même endpoint | JWT seulement, pas de permission par rôle |
| Autres /tables | DELETE physique | aucun lifecycle spécifique dans repository générique | JWT + policy centrale; pas d'audit repository |

L'historique Alembic contient des divergences et certaines routes dédiées ne concordent pas avec le generic delete. Les faits du schéma runtime et de l'OpenAPI sont mis à jour dans le rapport B.3.

## G. Impacts sur les décisions métier

### DECISION-003

Statut : EN ATTENTE. La fiche de décision B.4 consigne les choix métier requis sans présumer de la proposition Agent/Gestionnaire : `RBAC_PHASE_B4_DECISION_003_A_VALIDER.md`.
- D (équipe) techniquement supporté : NON pour une équipe avec membres et gestionnaire.
- Alternative disponible : attributs texte service/department; affectations individuelles propres à certains objets; ACL par couple utilisateur-village.
- Élément manquant : appartenance d'équipe normalisée, relation Gestionnaire-responsable et filtres d'accès serveur par ligne.

### DECISION-004
- Scope porté par utilisateur techniquement supporté : NON pour Direction/Finance/Commercial et Immobilier/Foncier global.
- Mécanisme existant réutilisable : UserVillageAccess est une ACL locale au foncier, non un catalogue de scopes fonctionnels. role/access_level ne sont pas des scopes cumulables.
- Élément manquant : attribution des périmètres à l'utilisateur et leur application backend. Aucun nouveau rôle n'a été créé.

### DECISION-006
- Tables avec archive/restore dédié : foncier_lots; properties; lease_contracts; rent_payments; media_files; entities (restore). Scan d'attestation passe à l'état archive mais restore général non établi.
- Tables principalement techniques : audit_logs, activity_logs, foncier_audit, media_audit_logs, settings_audit, auth_audit_logs, auth_login_failures, auth_sessions. Archivage métier, rétention et purge restent UNKNOWN.
- La route générique fait une suppression physique pour les 38 noms et peut contourner les cycles d'archivage/restauration.

## H. UNKNOWN

1. Existence organisationnelle d'équipes au-delà des champs libres service/department.
2. Valeurs contrôlées ou libres, complétude et fiabilité des attributs service/department.
3. Gestionnaire responsable d'un Agent ou dossier; aucun lien hiérarchique trouvé.
4. Fiabilité et caractère obligatoire des champs employee_id, agent_id, assigned_to, assigne_a et created_by.
5. Couverture complète de UserVillageAccess : l'ACL n'est pas appelée par toutes les routes foncières.
6. Scopes personnels Direction, Finance, Commercial et Immobilier/Foncier généraux.
7. Schéma déployé, notamment deleted_at et les tables d'audit : désormais vérifié dans le rapport B.3.
8. Politique de rétention/purge des audits, sessions, login failures, visites et statistiques.
9. Statut runtime désormais vérifié en B.3 : `audit_logs` est absent; `visites` est présent.
10. Existence d'un audit fiable pour chaque hard delete, restore et archive.
11. Statuts officiels alignés en Phase B.1 : DECISION-001 VALIDÉ; DECISION-004 VALIDÉ sur le principe; DECISION-003 EN ATTENTE de définition du périmètre technique; DECISION-006 VALIDÉ sur le principe, exceptions/table à définir.

## Exécution

Lecture seule : aucun code, modèle, route, permission, migration, donnée ou configuration modifié. La vérification HTTP/OpenAPI et DB runtime est documentée dans le rapport B.3.

PHASE B.2 READ-ONLY : COMPLETE
