# Immobilier V2 — arbitrages techniques et métier

Date : 2026-10-02. Autorité : demande SOMA d’arbitrer et d’exécuter
autonomement. Statut : choix d’implémentation retenus pour lever le HOLD.

## Synthèse du brainstorming

Le blocage venait du mélange de trois axes indépendants :

1. **Identité** du bien : référence et titre ;
2. **État opérationnel** : disponibilité, location, vente, travaux, retrait,
   archivage ;
3. **État éditorial** : publication ou retrait de la vitrine.

Les confondre faisait dépendre la disponibilité du bien de sa publication,
ou la publication de l’existence d’une fiche `vitrine_lots`. Le choix retenu
sépare ces axes et garde PostgreSQL comme autorité des invariants partagés.

## Choix arrêtés

| Sujet | Choix appliqué | Motif |
|---|---|---|
| Source de localité | `commune`, repli sur `ville`; refus si les deux sont absentes | L’adresse reste une ligne d’adresse et le quartier une précision; le titre garde une localité structurée. La norme d’adressage ne désigne pas le champ EGS à privilégier : c’est un arbitrage explicite, pas une exigence ISO. |
| Normalisation | espaces de bord retirés, suites d’espaces réduites; accents et casse d’origine conservés | Normalisation non destructive et stable; pas d’extension PostgreSQL implicite telle que `unaccent`. |
| Référence | compteur transactionnel par année; `IMM-AAAA-NNNN`; dépassement de 9999 refusé | Génération serveur, sans concurrence ni réutilisation silencieuse. |
| Titre | Calculé par trigger PostgreSQL : libellé français du type, localité retenue, référence; jamais fourni par le client | Une seule source de vérité protège aussi les INSERT SQL directs par le rôle applicatif. |
| Unicité | `UNIQUE(titre)` après contrôle NOT NULL/doublons | Contrat global explicite; PostgreSQL crée l’index unique qui porte la contrainte. |
| États | matrice exacte de l’addendum; `en_vente` est un état opérationnel exclusif, `retiree` est réversible, `archivee` se réactive uniquement vers `retiree` | Pas d’états ajoutés pour simplifier l’UI. Archivage métier reste distinct de `deleted_at`. |
| Publication | `properties.publier_vitrine` fait autorité pour publier un bien Property; `vitrine_lots` reste la projection foncière | La publication Property n’emprunte pas la publication d’un lot foncier. Une route publique dédiée expose une liste blanche. |
| Gel/réédition | gel à la publication (`titre_fige_le`); pour rééditer, dépublier, modifier, puis republier | Cycle éditorial simple, traçable, sans titre silencieusement périmé. |
| Dépublication | transition vers `louee`, `vendue`, `retiree` ou `archivee` force `publier_vitrine=false` dans le trigger de statut | Même transaction et même audit que la transition. |
| Audit | trigger de base; acteur/rôle fournis par dépendance d’authentification serveur, UUID de requête généré côté serveur, horodatage et snapshots OLD/NEW dérivés dans PostgreSQL | Le payload HTTP n’est jamais une autorité pour ces champs. Les refus de la route métier sont enregistrés avant le retour 409. |
| Suppression | `archivee` n’implique pas le soft delete; endpoint DELETE reste interdit | Les deux notions répondent à des besoins différents et les dossiers restent accessibles. |

## Limite de sécurité relevée

Sur `egs_test`, `current_user=postgres` et `rolsuper=true`; les tables métier
appartiennent à `egs_test_user`. Les privilèges ACL ne peuvent pas limiter un
superutilisateur. Aucun rôle PostgreSQL global n’est créé ou modifié, afin de
respecter le périmètre de données `egs_test` et de ne pas affecter les autres
bases. La migration ajoute une protection DML par trigger `BEFORE UPDATE OR
DELETE OR TRUNCATE` et révoque les privilèges ACL lorsque cela s’applique; le
test de refus est fait avec le rôle effectif `egs_test_user`. Un DBA ou un
superutilisateur reste capable de désactiver/supprimer les triggers : la
protection est append-only contre le chemin applicatif/DML, pas contre
l’administrateur PostgreSQL.

Pour rendre l’append-only opposable même à une compromission du compte DB
applicatif, l’exploitation devra connecter l’API avec un login PostgreSQL
non-superutilisateur distinct du propriétaire de la table. Cette modification
de rôles/identifiants est hors de la portée de données egs_test et n’est pas
faite dans cette mission.

## Références techniques

- PostgreSQL permet `NOT VALID` sur CHECK et FOREIGN KEY, pas sur UNIQUE; une
  contrainte UNIQUE crée un index B-tree unique.
- Une fonction `SECURITY DEFINER` doit fixer un `search_path` sûr, exclure les
  schémas contrôlables par des utilisateurs non fiables et révoquer EXECUTE
  PUBLIC quand nécessaire.
- Les transitions concurrentes utilisent le verrou de ligne `FOR UPDATE`;
  la dépublication est exécutée par le trigger dans la transaction de l’UPDATE.

Références PostgreSQL :
[Contraintes](https://www.postgresql.org/docs/18/ddl-constraints.html),
[ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html),
[CREATE FUNCTION — sécurité](https://www.postgresql.org/docs/current/sql-createfunction.html),
[Verrous explicites](https://www.postgresql.org/docs/17/explicit-locking.html).
