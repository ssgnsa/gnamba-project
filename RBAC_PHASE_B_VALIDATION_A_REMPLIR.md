# GNAMBA / EGS — Phase B.1
# Fiche de validation métier RBAC — à remplir

Cette fiche s’adresse au responsable métier. Elle ne demande aucune lecture de code.

**Choix à inscrire :** OUI / NON / EXCEPTION / UNKNOWN.  
Pour une EXCEPTION, nommer le rôle, la table ou le module, l’action, le périmètre et les conditions. UNKNOWN signifie qu’aucun droit ne sera déduit de la réponse.

## Règles déjà verrouillées — pas soumises au vote

1. Le gabarit standard Phase 3.4 est DEFAULT pour les 38 tables. Toute dérogation doit être explicitement validée.
2. L’export est restrictif par défaut. Aucune ouverture supplémentaire n’est implicite.

Aucune de ces deux règles ne présume de la correspondance entre les rôles techniques et métiers.

## Statut officiel des décisions déjà arbitrées

- **DECISION-001 = VALIDÉ** : `admin` → Administrateur, `gestionnaire` → Gestionnaire, `employe` → Agent, `guest` → Utilisateur standard.
- **DECISION-004 = VALIDÉ sur le principe** : Direction/Responsable, Comptabilité/Finance, Commercial et Immobilier/Foncier ne créent pas de nouveaux rôles RBAC à ce stade; ce sont des responsabilités/scopes cumulables. Les modalités d'attribution et les réponses factuelles sur leur existence organisationnelle restent à documenter.
- **DECISION-003 = EN ATTENTE** de définition du périmètre technique Agent/Gestionnaire, module par module; fiche dédiée : `RBAC_PHASE_B4_DECISION_003_A_VALIDER.md`.
- **DECISION-006 = VALIDÉ sur le principe** : le gabarit DEFAULT s'applique; toute exception de suppression physique, archivage ou restauration doit être définie par table/action. Les permissions précises restent UNKNOWN.

Ces statuts ne valident aucune permission d'accès, aucun scope technique et aucune exception par table.

---

## DECISION-001 — Mapping des rôles

### Q1
admin correspond-il au rôle métier Administrateur ?  
Décision : [x] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN  
Si EXCEPTION, correspondance : ______________________________

### Q2
gestionnaire correspond-il au rôle métier Gestionnaire ?  
Décision : [x] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN  
Si EXCEPTION, correspondance : ______________________________

### Q3
employe correspond-il au rôle métier Agent ?  
Décision : [x] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN  
Si EXCEPTION, correspondance : ______________________________

### Q4
guest correspond-il au rôle métier Utilisateur standard ?  
Décision : [x] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN  
Si EXCEPTION, correspondance : ______________________________

---

## DECISION-004 — Rôles absents — VALIDÉ SUR LE PRINCIPE

Principe validé : ces responsabilités ne deviennent pas de nouveaux rôles RBAC; elles peuvent se cumuler comme scopes/attributs. Les réponses sur l'existence organisationnelle et les modalités d'attribution restent UNKNOWN. Ne suggérer aucune correspondance avec les rôles techniques.

| Rôle | Existe dans l'organisation ? | Doit exister comme rôle distinct dans l'ERP ? | Peut être cumulé avec un autre rôle ? | Si oui, avec lequel ? |
|---|---|---|---|---|
| Direction / Responsable | UNKNOWN | NON — principe validé | OUI — cumulable comme scope/attribut | Attribution à définir |
| Comptabilité / Finance | UNKNOWN | NON — principe validé | OUI — cumulable comme scope/attribut | Attribution à définir |
| Commercial | UNKNOWN | NON — principe validé | OUI — cumulable comme scope/attribut | Attribution à définir |
| Immobilier / Foncier | UNKNOWN | NON — principe validé | OUI — cumulable comme scope/attribut | Attribution à définir |

---

## DECISION-003 — Périmètre Agent / Gestionnaire — EN ATTENTE

Le choix du périmètre technique reste à définir par table/module; aucun filtre de ligne n'est validé par le présent statut.

La cartographie a trouvé les champs/relations ci-dessous. Leur présence technique ne décide pas quel périmètre le métier souhaite. Pour chaque colonne, inscrire un choix : A créateur · B propriétaire · C utilisateur affecté · D équipe · E organisation · F autre · G aucune restriction · UNKNOWN.

| Table/module | Champs actuellement disponibles | Règle technique observable en A.2 | Décision Agent | Décision Gestionnaire |
|---|---|---|---|---|
| tasks / taches | employee_id, project_id | Le filtre par employé/projet dépend des paramètres d’appel; aucun scope générique imposé. taches alias de tasks. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| documents | project_id | Lien projet disponible; aucun contrôle owner/projet générique observé. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| contact_messages | assigne_a | Champ d’assignation existe; le GET manager générique renvoie toute la table. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| site_realisations | chef_projet_id; created_by/updated_by dans route dédiée | Identifiants présents; pas de scope sur GET générique manager. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| vitrine_lots | created_by, updated_by | Champs présents dans mapping; aucun contrôle propriété générique. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| messages_direction | destinataire_id, expediteur_id | Relations émetteur/destinataire; GET générique sans filtre de personne. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| employes_presence | employee_id | Lien employé; GET générique sans limite par employé. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| activites_journal | employee_id | Lien employé; manager exclu de GET générique, admin accès policy. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| parties | created_by, updated_by | Champs présents; pas de scope par créateur établi. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| leads | assigned_to | Champ d’affectation; certaines recherches acceptent un filtre, caractère obligatoire selon identité non établi. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| media_files | uploaded_by | Champ uploader; policy manager read renvoie ressources sans restriction par uploader. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| user_profiles | user_id | Identifiant utilisateur; table exclue du GET manager; scope propre profil non établi. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |
| foncier_villages (routes dédiées) | UserVillageAccess(user_id, village_id), usages ACL ciblés | ACL village existe pour certaines opérations; ne couvre pas nécessairement toutes routes et n’est pas le guard générique. | UNKNOWN — choix A–G | UNKNOWN — choix A–G |

Si vous choisissez F, préciser la règle et les tables concernées :

---

## DECISION-006 — Suppression physique, archivage, restauration — PRINCIPE VALIDÉ

Le principe DEFAULT est accepté; les exceptions et autorisations restent à décider par table/action. Le statut ne vaut pas autorisation de DELETE physique.

Toutes les 38 tables sont exposées à un DELETE générique. La cartographie confirme que cette route exécute une suppression SQL physique. Le système dispose en plus de quelques actions dédiées d’archivage/restauration; elles sont listées après le tableau. Répondre par table pour les trois opérations. DEFAULT ne rend pas un DELETE physique équivalent à l’archivage.

| Table | DELETE physique via route générique identifié | Autoriser DELETE physique ? | Archivage autorisé ? | Restauration autorisée ? | Rôles autorisés | Audit obligatoire ? | Conditions |
|---|---|---|---|---|---|---|---|
| tasks | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| taches | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| properties | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| lease_contracts | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| rent_payments | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| documents | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| contact_messages | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| page_layouts | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| site_realisations | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| vitrine_lots | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| messages_direction | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| employes_presence | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| visites_en_cours | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| activites_journal | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| stats_journalieres | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| site_content | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| visiteurs | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| visites_du_jour | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| lead_campaigns | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| lead_interactions | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| foncier_villages | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| parties | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| party_roles | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| party_lead_details | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| leads | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| lead_captures | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| media_files | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| media_versions | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| media_usage | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| media_audit_logs | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| app_settings | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| user_profiles | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| visites_terrain | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| ventes_foncieres | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| campagnes_marketing | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| visites | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| opportunites | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |
| social_posts | Oui, via DELETE générique (SQL physique) | N/A pour route générique | N/A pour route générique | UNKNOWN | UNKNOWN | UNKNOWN |


Routes dédiées ayant un cycle de vie distinct relevé en A.2 :

| Table/module | Action(s) actuellement présente(s) | Suppression physique | Archivage | Restauration | Rôles autorisés | Audit obligatoire | Condition |
|---|---|---|---|---|---|---|---|
| Foncier — lots | POST archive et POST restore | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Motif d’archive actuellement reçu |
| Immobilier — propriétés | DELETE et POST restore | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| Immobilier — contrats | DELETE, POST restore, terminate | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Terminer est distinct de supprimer |
| Immobilier — paiements de loyer | DELETE et POST restore | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| Media — fichiers | DELETE logique, POST restore, DELETE purge physique | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | DELETE logique et purge sont distincts |
| Entités / employés | Suppression soft; restore dédié aux entités | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |
| Finance | annuler; supprimer définitivement une opération déjà annulée | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Distinguer annulation et hard delete |
| Autre route/table | | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | |

Si les droits diffèrent par rôle, écrire chaque rôle et la table concernée dans Rôles autorisés. Sinon inscrire DEFAULT lorsqu'il suit strictement le gabarit.

---

## DECISION-007 — Actions métier trouvées

Ne répondre que pour les actions réellement présentes. Rôle, condition, état avant/après, audit et validation finale sont à décider.

| Module | Action | Rôle autorisé | Condition | État avant | État après | Validation finale OUI/NON | Audit OUI/NON | Décision |
|---|---|---|---|---|---|---|---|---|
| Foncier — attestations | Soumettre (brouillon → soumis) | UNKNOWN | UNKNOWN | brouillon | soumis | UNKNOWN | UNKNOWN | UNKNOWN |
| Foncier — attestations | Valider (soumis → valide) | UNKNOWN | UNKNOWN | soumis | valide | UNKNOWN | UNKNOWN | UNKNOWN |
| Foncier — attestations | Archiver le scan (valide → archive) | UNKNOWN | UNKNOWN | valide | archive | UNKNOWN | UNKNOWN | UNKNOWN |
| Foncier — attestations | Révoquer | UNKNOWN | UNKNOWN | UNKNOWN | révoqué | UNKNOWN | UNKNOWN | UNKNOWN |
| Foncier — lots | Archiver | UNKNOWN | Motif demandé par route | actif | archivé | UNKNOWN | UNKNOWN | UNKNOWN |
| Foncier — lots | Restaurer | UNKNOWN | UNKNOWN | archivé | actif | UNKNOWN | UNKNOWN | UNKNOWN |
| Immobilier — contrat | Terminer | UNKNOWN | UNKNOWN | actif | terminé | UNKNOWN | UNKNOWN | UNKNOWN |
| Site Vitrine — layouts | Publier | UNKNOWN | UNKNOWN | brouillon | publié | UNKNOWN | UNKNOWN | UNKNOWN |
| Site Vitrine — réalisation/lot | Changer les champs de publication | UNKNOWN | UNKNOWN | UNKNOWN | publié/non publié | UNKNOWN | UNKNOWN | UNKNOWN |
| Media | Remplacer | UNKNOWN | UNKNOWN | actif | remplacé/nouvelle version | UNKNOWN | UNKNOWN | UNKNOWN |
| Media | Restaurer | UNKNOWN | UNKNOWN | supprimé logiquement | actif | UNKNOWN | UNKNOWN | UNKNOWN |
| Media | Purger physiquement | UNKNOWN | UNKNOWN | supprimé logiquement | purgé | UNKNOWN | UNKNOWN | UNKNOWN |
| Finance | Annuler une opération | UNKNOWN | UNKNOWN | non annulée | annulée | UNKNOWN | UNKNOWN | UNKNOWN |
| Finance | Supprimer définitivement une opération déjà annulée | UNKNOWN | Déjà annulée | annulée | supprimée | UNKNOWN | UNKNOWN | UNKNOWN |
| Leads/campagnes | Traiter une campagne | UNKNOWN | UNKNOWN | à traiter | traité | UNKNOWN | UNKNOWN | UNKNOWN |
| Leads/automatisations | Activer/désactiver une règle | UNKNOWN | UNKNOWN | état actuel | état basculé | UNKNOWN | UNKNOWN | UNKNOWN |
| Leads | Affecter via assigned_to | UNKNOWN | UNKNOWN | UNKNOWN | utilisateur affecté | UNKNOWN | UNKNOWN | UNKNOWN — confirmer si action métier distincte |
| Autre action déjà existante (préciser route) | | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

Ne pas ajouter une action qui n'est pas déjà implémentée.

---

## DECISION-005 — Exceptions potentielles à l'export

DEFAULT restrictif est déjà validé. En l'absence de réponse OUI explicite, conserver NON / DEFAULT RESTRICTIF.

| Table/module | Type d'export identifié | Pourquoi une exception serait nécessaire ? | Rôle proposé (à remplir) | Périmètre | Audit | Autoriser cette exception ? |
|---|---|---|---|---|---|---|
| Foncier — journal d'audit | CSV côté navigateur | | | | UNKNOWN | UNKNOWN |
| Foncier — attestations/documents | Impression HTML/PDF côté navigateur | | | | UNKNOWN | UNKNOWN |
| Finance | Rapport/impression frontend | | | | UNKNOWN | UNKNOWN |
| Dashboard — rapport | Rapport retourné par endpoint authentifié | | | | UNKNOWN | UNKNOWN |
| Immobilier — paiements | Rapport/impression frontend | | | | UNKNOWN | UNKNOWN |
| Documents | Impression navigateur | | | | UNKNOWN | UNKNOWN |
| Autre export découvert | | | | | UNKNOWN | UNKNOWN |

Pour les autres tables/modules, aucune exception d'export n'a été validée.

---

## DECISION-008 — CMS / contenu public

Ne pas confondre contenu publiable et contenu actuellement publié. Répondre séparément pour CMS, layouts, réalisations et lots si les règles diffèrent.

| Groupe | Création brouillon — rôle | Modification brouillon — rôle | Validation — rôle | Publication — rôle | Dépublication — rôle | Suppression — rôle | Lecture publique | Lecture brouillon — rôle |
|---|---|---|---|---|---|---|---|---|
| CMS site_content | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Page layouts | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Réalisations | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Lots vitrine | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

- Le public peut-il rechercher du contenu publié ? [ ] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN
- Les contenus non publiés sont-ils strictement privés ? [ ] OUI  [ ] NON  [ ] EXCEPTION  [ ] UNKNOWN
- Audit obligatoire pour changement de publication ? [ ] OUI  [ ] NON  [ ] UNKNOWN
- Champs/contenus autorisés au public / exception :

États à employer : PUBLIC · BROUILLON · VALIDÉ · PUBLIÉ.

---

## DECISION-009 — Routes sans garde locale identifiée

Pour chaque groupe, choisir OUI/NON pour l'accès public. Une route listée ici n'est pas déclarée publique par ce document; A.2 n'a pas établi si un middleware global s'applique. Si NON, indiquer les rôles autorisés. Si OUI, indiquer les données publiables exactes.

| Route/groupe | Données exposées / fonction | Doit être public ? | Si OUI: données publiables | Si NON: rôles autorisés | Audit/conditions |
|---|---|---|---|---|---|
| GET/POST /api/v1/finance; GET /api/v1/finance/{finance_id} | Liste/détail/création d'opérations et montants; POST auth facultative dans handler | UNKNOWN | | | |
| CRUD /api/v1/employees; GET /search/suggest | Dossier employé, salaire et coordonnées | UNKNOWN | | | |
| /api/v1/entities: GET/list/detail/search/resolve/check-duplicate, POST/create/bulk/migrate, PATCH, DELETE, restore | Entités et données personnelles | UNKNOWN | | | |
| /api/v1/immobilier/properties, /contracts, /payments: CRUD/stats/restore/terminate | Biens, baux et paiements | UNKNOWN | | | |
| CRUD /api/v1/products | Produits/fournitures | UNKNOWN | | | |
| CRUD /api/v1/projects | Projets | UNKNOWN | | | |
| CRUD /api/v1/suppliers; GET /search/suggest | Fournisseurs et contacts | UNKNOWN | | | |
| GET/POST/PATCH/DELETE /api/v1/tasks | Tâches et affectations | UNKNOWN | | | |
| CRUD /api/v1/tenants; GET /search/suggest | Locataires et relations parties | UNKNOWN | | | |
| GET /api/v1/settings, /category/{category}, /audit, /{key} | Paramètres et journal | UNKNOWN | | | |
| /api/v1/foncier GET villages/lots/attestations/checks; POST /lots/export (retourne actuellement 501) | Données foncières et tentative d'export | UNKNOWN | | | |
| POST /api/v1/rpc/{name} (utilisateur optionnel) | Actions dispatchées, dont fonctions foncières | UNKNOWN | | | |

Routes publiques ou formulaires dont le contrat est déjà implémenté mais dont le métier doit confirmer la portée exacte :

| Route | Publique ? OUI/NON/EXCEPTION/UNKNOWN | Champs / données autorisés |
|---|---|---|
| GET contenu CMS | UNKNOWN | |
| GET layout publié | UNKNOWN | |
| GET listes publiées lots/réalisations | UNKNOWN | |
| GET brand assets | UNKNOWN | |
| POST formulaire contact (payload borné) | UNKNOWN | |
| POST capture de lead | UNKNOWN | |
| POST demande d'intérêt pour lot | UNKNOWN | |

GET /api/v1/dashboard/report requiert un JWT selon A.2 mais n'a pas de permission de rôle/export distincte observée; décider les rôles autorisés dans DECISION-005. Ce n'est pas une route anonyme.

---

## DECISION-002 — Exceptions éventuelles aux 38 tables

Les 38 tables figurent dans la liste ci-dessous pour vérification de couverture. Le gabarit par défaut s'applique sans dérogation. Ajouter une ligne dans « Exceptions validées par le métier » seulement lorsqu'un écart est voulu. Ne pas recopier les droits par défaut.

- [ ] tasks — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] taches — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] properties — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] lease_contracts — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] rent_payments — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] documents — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] contact_messages — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] page_layouts — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] site_realisations — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] vitrine_lots — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] messages_direction — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] employes_presence — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] visites_en_cours — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] activites_journal — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] stats_journalieres — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] site_content — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] visiteurs — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] visites_du_jour — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] lead_campaigns — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] lead_interactions — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] foncier_villages — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] parties — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] party_roles — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] party_lead_details — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] leads — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] lead_captures — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] media_files — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] media_versions — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] media_usage — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] media_audit_logs — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] app_settings — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] user_profiles — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] visites_terrain — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] ventes_foncieres — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] campagnes_marketing — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] visites — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] opportunites — DEFAULT accepté; exception éventuelle à décrire ci-dessous.
- [ ] social_posts — DEFAULT accepté; exception éventuelle à décrire ci-dessous.

### Exceptions validées par le métier

| Table | Rôle métier | Action | Nouvelle décision OUI/NON/EXCEPTION | Condition | Périmètre | Audit obligatoire OUI/NON |
|---|---|---|---|---|---|---|
| | | | UNKNOWN | | | |
| | | | UNKNOWN | | | |
| | | | UNKNOWN | | | |
| | | | UNKNOWN | | | |
| | | | UNKNOWN | | | |

Si aucune exception n'est ajoutée, noter : « DEFAULT pour toutes les tables; aucune exception décidée ». Un UNKNOWN ne peut pas être implémenté comme permission.

---

## Résumé de validation

| Décision | État |
|---|---|
| DECISION-001 | VALIDÉ |
| DECISION-002 | À VALIDER |
| DECISION-003 | EN ATTENTE — périmètre technique à définir |
| DECISION-004 | VALIDÉ SUR LE PRINCIPE — détails à documenter |
| DECISION-005 | À VALIDER |
| DECISION-006 | VALIDÉ SUR LE PRINCIPE — exceptions/table à définir |
| DECISION-007 | À VALIDER |
| DECISION-008 | À VALIDER |
| DECISION-009 | À VALIDER |

UNKNOWN résiduels : les détails de périmètre, exceptions et modalités restent à valider; les quatre statuts ci-dessus font foi.  
TOTAL EXCEPTIONS : 0 confirmée; réponse métier requise pour chacune  
TOTAL TABLES AVEC EXCEPTION : 0 confirmée; 38 couverts par DEFAULT jusqu'à validation d'un écart  
TOTAL ROUTES PUBLIQUES À DÉCIDER : 12 groupes sans garde locale identifiée + 7 parcours publics/optionnels à confirmer

Responsable métier :  
Fonction :  
Date :  
Référence de validation :

Après remplissage, cette fiche doit être validée explicitement. Aucun changement de code ni démarrage Phase 3.4 n'est autorisé par la présente fiche.
