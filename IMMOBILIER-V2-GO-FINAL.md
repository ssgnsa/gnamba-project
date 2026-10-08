# Immobilier V2 — décision de Gate finale

Date : 2026-10-02. Périmètre d’exécution : `egs_test` uniquement.

## Décision

**Gate fonctionnel et schéma : GO. Certification de sécurité append-only : HOLD
opérationnel localisé. Verdict global : HOLD tant que l’API se connecte avec un
rôle PostgreSQL superutilisateur.** Aucun déploiement ni changement d’identifiants
ou de rôles PostgreSQL n’a été effectué.

Ce HOLD est limité à la garantie contre une compromission du compte SQL de
l’application. La base de test confirme `session_user=postgres` et
`rolsuper=true`. Les déclencheurs refusent bien UPDATE/DELETE/TRUNCATE ordinaires,
y compris les essais directs; néanmoins un superutilisateur peut désactiver les
déclencheurs. Un GO de sécurité append-only sous ce principal serait donc une
certification excessive. La séparation en compte applicatif non-superutilisateur
doit être mise en place dans l’environnement d’exploitation par l’autorité qui
gère les rôles du cluster.

## Choix métier retenus

- `commune`, puis `ville`, est la source structurée du titre; absence des deux
  entraîne un refus.
- Le titre et la référence sont dérivés en base (`IMM-AAAA-NNNN`), le compteur
  est transactionnel et non réutilisable; le type du bien a un référentiel
  français explicite.
- Le titre est unique et gelé pendant la publication. Réédition : dépublier,
  modifier, republier.
- Publication, statut opérationnel et suppression sont séparés. Les transitions
  vers `louee`, `vendue`, `retiree` et `archivee` dépublient atomiquement.
- `archivee` n’est pas `deleted_at`; la suppression physique est refusée.
- La liste publique utilise une réponse en liste blanche et n’expose que les
  biens publiés, non supprimés et `disponible` ou `en_vente`.

Le détail des arbitrages et des normes PostgreSQL citées se trouve dans
[`IMMOBILIER-V2-ARBITRAGES.md`](IMMOBILIER-V2-ARBITRAGES.md).

## Preuves exécutées

- Migration `032_immobilier_v2_contract` appliquée sur `egs_test` après un
  downgrade vérifié à `031`; le downgrade et l’upgrade ont été exécutés une
  seconde fois après les tests pour retirer leurs données de test.
- État final vérifié en lecture : base `egs_test`, révision 032, matrice de 16
  transitions, 17 types de biens, zéro ligne dans `properties`,
  `properties_audit` et `immobilier_reference_counters`.
- Sauvegarde personnalisée vérifiée par `pg_restore --list` :
  `/tmp/egs-contract-v2-immobilier-go/egs_test-final-20261002.dump`;
  SHA-256 `8ebc6f839b1381e4b0e04899bdf00303c1e65717692ba4759a5e91ebcfb72c82`.
- Tests ciblés : 13 tests de garde et schémas + 4 tests PostgreSQL passent.
  Les cas PostgreSQL couvrent la référence/titre DB, la matrice exacte, le gel,
  la dépublication, l’audit append-only, les refus journalisés et la concurrence.
- `npm run typecheck` : PASS. Compilation Python des fichiers modifiés : PASS.
- L’appel public utilise maintenant `/site/properties` depuis le client, soit
  `/api/v1/site/properties` après résolution de la base API; chemin confirmé par
  les préfixes des routeurs.
- `egs_local` et `egs_phase34_staging` n’ont reçu aucune écriture. Aucun
  déploiement, push, changement RBAC ou MFA production n’a eu lieu.

## Condition unique de levée du HOLD global

Configurer l’API avec un principal PostgreSQL de connexion non-superutilisateur,
distinct du propriétaire des objets d’audit et limité aux privilèges métier
nécessaires. Puis répéter les essais d’écriture métier et de refus direct
UPDATE/DELETE/TRUNCATE avec ce principal réel. Garder le déclencheur d’immutabilité
et les privilèges minimaux. Après ces preuves, la Gate de sécurité pourra être
passée à GO sans modifier le contrat Immobilier.
