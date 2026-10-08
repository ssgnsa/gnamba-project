# Annexe — Contraintes et migration Immobilier V2

Date : 2026-10-02. Verdict de migration : **HOLD**, aucune migration
Immobilier V2 créée ou appliquée.

## `NOT VALID`

Aucune contrainte `NOT VALID` n’a été utilisée pour cette mission. PostgreSQL
ne permet pas cette forme pour une contrainte `UNIQUE`. Pour un CHECK ou une
clé étrangère, la séquence reste `ADD CONSTRAINT ... NOT VALID`, contrôle des
données, puis `VALIDATE CONSTRAINT`, seulement si le type de contrainte et la
syntaxe PostgreSQL le permettent.

## Unicité du titre

Le contrat impose `titre NOT NULL` et `UNIQUE(titre)`. L’audit antérieur de
`egs_test` a constaté zéro ligne dans `properties`; le schéma actuel garde
`titre NOT NULL`, sans contrainte ni index unique. Sur cette base vide,
l’implémentation autorisée devra recontrôler `NOT NULL` et l’absence de
doublons, puis ajouter directement `UNIQUE(titre)`. Aucune contrainte n’a été
créée pendant ce HOLD.

Pour une future base peuplée : détecter les doublons, obtenir leur résolution
contrôlée, créer un index unique, vérifier cet index, puis éventuellement le
rattacher en contrainte. Aucun nettoyage automatique de doublons n’est prévu.

## Ordre et objets

Ordre imposé pour une future migration :

1. structures nécessaires ;
2. tables de référence ;
3. compteur `IMM` ;
4. colonne `titre_fige_le` ;
5. table `statut_transitions` ;
6. table d’audit ;
7. données/seed nécessaires ;
8. contraintes ;
9. triggers ;
10. validations.

Aucun de ces objets Immobilier V2 n’a été créé. Les index, triggers et
fonctions prévus devront être déclarés après leurs dépendances et inclus dans
des fonctions `upgrade` et `downgrade` fonctionnelles. La contrainte unique
existante sur `properties.reference` ne remplace pas celle requise sur `titre`.

## Rollback et limites du gate

Aucune modification du schéma ou des données de `egs_test` n’ayant été faite,
aucun downgrade ni restauration n’a été nécessaire. Le dump frais vérifié du
gate précédent est `/tmp/egs-contract-v2-immobilier-gate/egs_test-20261002T112344Z.dump`
(SHA-256 `9692b87b8be1b012a36b2162571f3a441d0855148da0d4fa2297a400b8809427`);
il précède les contrôles en lecture seule de cette annexe. Avant tout futur
changement DB, produire un nouveau `pg_dump -Fc`, contrôler avec
`pg_restore --list` et recalculer le SHA-256. Les essais upgrade/downgrade/
upgrade ne pourront viser que `egs_test`; les données de test supprimables
devront être explicitement bornées à cette base.

Le format de titre est `{libellé_type_bien} – {localité} – {reference}` et le
client ne doit pas fournir le titre d’autorité. La source canonique de
`localité`, le modèle de publication/gel et les règles D1–D13 non présentes
dans une décision métier validée restent en HOLD; aucune interprétation n’a
été ajoutée au schéma ou à l’API.
