# PHASE 3.3.3 — RBAC REVIEW

## 1. Sources examinées

Documents lus intégralement :

- `SITE-VITRINE-RBAC-POLITIQUE-PROPOSEE.md`
- `SITE-VITRINE-PHASE3.3.2-RBAC-DECISION.md`
- `SITE-VITRINE-RBAC-METIER.md`
- `SITE-VITRINE-RBAC-MATRIX.md`
- `SITE-VITRINE-PHASE3.3.1-MEDIA-RBAC.md`
- `SITE-VITRINE-PHASE3.3-RBAC.md`
- `backend/PHASE3.3.1-MEDIA-LIVE-TESTS.txt`
- `backend/PHASE3.3-RBAC-LIVE-TESTS.txt`
- `SITE-VITRINE-PHASE3.3.1-BASELINE.txt`

Code vérifié en lecture : `RoleEnum`, `authorization.py`, dépendances auth, routeurs Clients, Media, Site, CMS, Layouts, `/tables`, routeur principal monté (`backend/app/api/v1/__init__.py`) et adaptateurs `src/data/client.ts`, `src/data/tableClient.ts`. Recherche effectuée des consommateurs `/tables` et `.from()` pertinents.

Baseline de travail : branche `audit/fix-schema-site`, HEAD `634938c8`; le `git status --short`, `git diff --stat` et `git diff --check` ont été examinés avant les documents Phase 3.3.3. Le workspace portait déjà des modifications applicatives et rapports issus de phases antérieures; elles n'ont pas été écrasées.

## 2. Rôles

Quatre valeurs de rôle sont codées : `guest`, `employe`, `gestionnaire`, `admin`. Le serveur lit `role`; `access_level` n'est pas la source du guard central. Un JWT atteste l'identité, il n'accorde pas à lui seul une permission métier. L'UI React cache/affiche des modules mais n'est pas un contrôle serveur.

## 3. Matrice actuelle

La matrice unique avec colonnes techniques par rôle, statut métier séparé et proposition de décision se trouve dans [SITE-VITRINE-RBAC-DECISION-FINALE.md](SITE-VITRINE-RBAC-DECISION-FINALE.md), section « Matrice technique, métier et décision par ressource/action ». Elle couvre les 23 couples ressource/action demandés.

Synthèse technique :

- Guest authentifié : aucune permission privée; les routes publiques sont sans rôle et ne constituent pas un droit privé du rôle guest.
- Employé : aucune permission privée dans le guard central; les routes publiques demeurent accessibles sans JWT.
- Gestionnaire : lecture Clients/Site Vitrine/Media et de 34 tables de l'allowlist; aucun write, publish ou delete via le guard central.
- Admin : toutes les actions exposées par les routes protégées; `/tables` donne actuellement CRUD sur ses 38 noms connus.
- Routes publiques particulières : CMS GET; Layout détail publié; lots/réalisations publiés; assets de marque; POST `contact_messages` à payload restreint; enquête lot.

Les résultats test réels sont plus étroits que la policy : Phase 3.3.1 prouve Media, audit et refus d'escalade spécifiés; Phase 3.3 documente clients/tasks/layout/CMS et d'autres refus avec des JWT réels. Les tests ne valent pas décision métier.

## 4. Matrice proposée

La matrice précédente donne les valeurs exactes proposées et les règles `UNKNOWN` à soumettre. Principes proposés :

- Maintenir les accès publics actuels uniquement à leurs projections/contrats vérifiés.
- Refuser par défaut aux employés toute ressource privée.
- N'autoriser au gestionnaire que les lectures table/action/portée approuvées, sans créer/éditer/publier/supprimer automatiquement.
- Borner l'Admin aux opérations nécessaires, préférer une API métier dédiée et approuver `/tables` table par table.
- Traiter les catégories `/tables` comme propositions : `PUBLIC`, `METIER`, `ADMIN`, `SENSIBLE`, et candidates `INTERDIT` pour `app_settings`, `user_profiles`, `media_audit_logs` sur le endpoint générique.

Les permissions métier encore inconnues restent littéralement `UNKNOWN`; elles ne sont pas transformées en règles.

## 5. Employé

Code : aucune permission privée générale. Preuve réelle : refus employé Media GET/upload, publication layout et suppressions vérifiées dans le rapport de test; refus Clients documenté Phase 3.3. Métier : aucun document ne justifie l'accès privé employé par ressource. Décision attendue : confirmer/refuser les accès privés aux clients, CMS, Media, tables EGS et fonctions opérationnelles; si oui, préciser portée et champs.

## 6. Gestionnaire

Code : lecture technique seulement sur trois modules et 34 tables. Preuves réelles : Clients GET, tasks GET, Page Layout GET, Media GET; refus de mutations, publication, upload, `/tables/app_settings`. Risque : allowlist sans portée ligne et présence de données CNI, contact, prospect, visite ou financières. Décision attendue : adopter, réduire ou remplacer les 34 entrées; pour chaque permission confirmer tables, données et scope. Aucun droit write/publish/delete n'est justifié automatiquement par le titre.

## 7. Administrateur

Code : `admin` passe le guard central pour toutes les actions que les routes gardées exposent; rôle admin ouvre les 38 noms `/tables`. Preuves réelles : CMS write et Media upload/audit sur le périmètre reporté. Ceci n'est pas une justification d'accès absolu à toutes les tables. Décision attendue : nommer les tâches administratives nécessaires, puis confirmer une allowlist Admin explicite et les contrôles d'audit/champs sensibles.

## 8. `/tables`

Le routeur déclare 38 tables et GET/POST/PATCH/DELETE, sans PUT. Anonyme : GET filtré/projeté de réalisations/lots et POST contact restreint. Gestionnaire : GET 34 ressources. Admin : opérations génériques sur 38. Aucune portée de ligne sur l'accès gestionnaire. L'exception POST contact s'applique aussi sans rôle et reste cantonnée aux champs du formulaire.

Les composants SiteEditor et des pages publiques utilisent actuellement `/tables`. Des routes métier existent pour CMS content, Layout, Media, lots/réalisations, Clients, tâches, immobilier, Foncier, leads/campagnes, settings et autres modules. Pour certains adaptateurs frontend, un endpoint comme `/messages`, `/visiteurs`, `/social/posts` ou `/users/profiles` est configuré, mais aucun routeur/handler correspondant n'est monté ou n'a été confirmé dans le backend examiné. Le rapport de décision finale marque ces écarts et indique la route dédiée confirmée ou l'absence de preuve.

## 9. Allowlist

L'allowlist actuelle gestionnaire de 34 tables et les quatre exclusions sont listées dans la décision finale. Le `TABLES` dictionary est une liste de noms connus, mais n'impose pas de sous-ensemble Admin : l'Admin obtient actuellement toutes les opérations sur les 38. L'allowlist métier finale ne peut pas être déterminée par les preuves disponibles. Proposition soumise : deux GET publics filtrés, un POST public de contact strict, aucun accès privé non-admin avant approbation, et allowlist Admin revue par table. Les candidates `/tables` interdites ne sont pas encore retirées du code.

## 10. Contournements identifiés

1. **Alias générique de routes dédiées.** Pour réalisations/lots, CMS, layouts, Media, clients, tâches, immobilier, leads/campagnes, settings et Foncier, les routes métier sont préférables. `/tables` peut éviter leurs schémas de payload, logique spécifique, projections, validations ou audit si l'appelant Admin les contourne. Les guards de rôles connus ne montrent pas un bypass gestionnaire des writes : `/tables` les refuse; le risque principalement établi concerne le chemin générique Admin et les règles de données métier.
2. **Read-wide gestionnaire.** GET allowlist renvoie des lignes sans filtre par client/employé/village; aucun contrôle d'objet n'est ajouté par le routeur générique.
3. **Public lists.** Les paramètres/filter frontend ne constituent pas des contrôles de sécurité. Les réponses anonymes sont limitées côté backend aux deux tables et projections codées.
4. **Données publiques CMS.** `site_content` GET dédié est public et ne sépare pas brouillon/publié; cela existe hors `/tables` et appelle une décision de publication/contenu, non une permission de rôle générique.
5. **Routes configurées mais non vérifiées.** Certains adaptateurs pointent vers des chemins qui ne correspondent pas aux routeurs v1 montés examinés. Il faut établir l'endpoint réel avant de retirer le fallback générique; les faux équivalents ne doivent pas être comptés comme protection.

L'audit n'a pas effectué de requêtes HTTP supplémentaires; les preuves antérieures sont reprises telles qu'elles sont consignées.

## 11. Décisions métier nécessaires

### DÉCISIONS REQUISES

1. **Employé — privé :** Peut-il lire ou modifier des ressources privées (clients, Site Vitrine, Media, fonctions EGS) ? `OUI / NON`; si oui, nommer ressources et portée.
2. **Gestionnaire — 34 tables :** Approuvez-vous la liste existante pour lecture privée sans filtre ligne ? `OUI / NON`; sinon indiquer les tables à retirer et le scope requis.
3. **Gestionnaire — écritures :** Peut-il créer ou modifier une ressource privée précise ? `OUI / NON`; fournir la liste si oui.
4. **Publication / Media :** Le gestionnaire peut-il publier layouts/Vitrine/CMS, uploader/remplacer ou supprimer/restaurer Media ? `OUI / NON` par famille; lecture audit reste une décision distincte.
5. **`/tables` :** Acceptez-vous les deux seules lectures publiques et le POST contact borné, avec accès privé non-admin refusé en attendant approbation ? `OUI / NON`.
6. **Admin et sensibles :** L'Admin peut-il lire/écrire chacune des tables classées `SENSIBLE`, et lesquelles doivent être bloquées sur `/tables` même pour Admin ? `OUI / NON` pour les groupes présentés, puis exclusions nommées.
7. **Routes dédiées / fonction publique :** Confirmez-vous le maintien du contenu publié et des formulaires publics; et quelles routes dédiées deviennent la seule voie pour les tables à doublon ? `OUI / NON`, préciser les exceptions.

Les décisions sont à valider par le responsable métier. Un « oui » global ne suffit pas pour des données dont la portée ou la route n'est pas nommée.

## 12. Aucun changement de code

Cette phase a seulement créé `SITE-VITRINE-RBAC-DECISION-FINALE.md` et `SITE-VITRINE-PHASE3.3.3-RBAC-REVIEW.md`. Aucun test applicatif n'a été lancé. Aucun code, permission, route, DB, migration ou Page Builder n'a été modifié. Les changements applicatifs déjà présents au baseline précèdent Phase 3.3.3. Drift Alembic non traité.

## 13. Verdict

**READY FOR BUSINESS VALIDATION** — les faits, permissions techniques, preuves, propositions et questions humaines sont distingués; les règles métier inconnues restent explicitement `UNKNOWN`.

**GLOBAL PROJECT STATUS = NO-GO**. RBAC métier et allowlist ne sont pas validés; Alembic reste non traité. **PHASE 4 = INTERDITE.**
