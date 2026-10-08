# Rapport de mission EGS — Contrat métier v2

## Addendum — Gate Migration 031 (2026-10-02)

Le prompt de reprise a ensuite autorisé la validation contrôlée directement sur `egs_test`. La migration 031 a été appliquée avec backup frais vérifié. Tests DB Products/Finance réussis, dont 50 créations concurrentes; toutes les données de test ont été nettoyées et les comptages initiaux préservés. Le Gate Migration 031 est **PASS**. Détails et preuves : [`RAPPORT-GATE.md`](/tmp/egs-contract-v2-products-finance-gate/RAPPORT-GATE.md).

Cette réussite ne lève pas les HOLD Immobilier/MFA et ne certifie pas la mission globale. Aucun commit, push ou déploiement n’a été effectué. La section ci-dessous décrit l’état de la mission initiale avant ce Gate.

Date : 2026-10-02. Les changements de travail préexistants ont été conservés; aucun `reset`, `clean` ou `stash` n’a été exécuté. Branche `audit/fix-schema-site`, HEAD initial `e0861ee7ec48e3fa7d0bf3d60a24d7b5237642a9`.

## 1. Résumé exécutif — [RISQUE : ÉLEVÉ]

Le contrat Products/Finance a été traduit dans le code et une migration Alembic 031 a été préparée. Les tests de schéma (11) passent, le typecheck et le build frontend passent. La migration n’a pas été appliquée : la mission exigeait une copie de test préalable, mais seule `egs_test` est autorisée. Sans base/copie distincte autorisée, le Gate migration reste HOLD. Aucun déploiement, commit ou test public n’a été effectué.

Immobilier reste HOLD : `properties.statut` décrit l’état opérationnel du bien (`disponible`, `louee`, `vendue`, etc.) et `publier_vitrine` décrit séparément la publication. Le contrat v2 exige aussi un état `brouillon`; lui donner le sens d’un statut actuel détruirait ces deux axes. La localité canonique du titre n’est pas identifiée avec certitude.

MFA tests reste HOLD : aucun parcours réel TOTP/AAL2 n’a été trouvé. Aucun `mfa_verified=True` n’a été fabriqué et le MFA de production n’a pas été modifié.

## 2. État initial et bases — [RISQUE : MOYEN]

- La mission a commencé avec un dépôt fortement modifié : branche `audit/fix-schema-site`, HEAD ci-dessus; l’inventaire initial est dans `/tmp/egs-contract-v2-20261002/MISSION_START.git-status.txt`.
- Les vérifications DB autorisées ont ciblé `egs_test`; ses tables Products, Finance et Properties ne contenaient aucune ligne. La base n’était pas vide : `entities` et `projects` avaient des lignes préexistantes, conservées.
- Alembic appliqué à `egs_test` : `030_restore_property_orm_compat_columns`. Tête des fichiers de migration après préparation : `031_contract_v2_products_finance`.
- Anomalie : un `alembic current` sans DSN explicite a effectué une lecture de version sur la base par défaut `egs_local`. Aucune migration, écriture ou restauration n’a été exécutée sur cette base. Les commandes DB suivantes ont explicitement construit le DSN `egs_test`.
- Aucun secret n’est reproduit dans ce rapport.

## 3. Audit du schéma et des données — [RISQUE : FAIBLE]

| Domaine | État constaté sur `egs_test` |
|---|---|
| Products | 0 ligne; `reference` NOT NULL et unique; aucune colonne d’entité/tenant applicable à l’unicité des produits. Portée retenue : globale. |
| Finance | 0 ligne; colonnes historiques `type`, `montant`, `montant_xof`, `date_operation`; CHECK historique `recette/depense/virement/ajustement`; aucun type/devise historique à convertir. |
| Immobilier | 0 bien; `reference` et `titre` NOT NULL et uniques; `ville`, `commune`, `quartier` existent; `statut` est opérationnel, et `publier_vitrine` est distinct. Aucun statut `brouillon` n’est accepté par le CHECK actuel. |
| Change | Aucune table de taux de change; aucune table `ref_counters`. |

La migration HEAD réelle de `egs_test` n’a pas changé. Aucun backfill ni réconciliation financière n’a été exécuté; les sommes avant/après restent sans objet avec 0 opération.

## 4. Audit du code et décisions appliquées — [RISQUE : MOYEN]

- Products : ajout d’une référence générée côté PostgreSQL via compteur transactionnel, format `PRD-AAAA-NNNNNN`; le trigger remplace toute référence reçue lors d’un INSERT et refuse sa modification ultérieure. L’API de création rejette le champ `reference`; le frontend utilise la route métier et ne saisit pas cette valeur.
- Finance : requêtes et écritures frontend dirigées vers les routes Finance; champs canoniques `type_operation`, `date_operation`, `montant`, `devise`; aliases temporaires `recette/depense` et `date_transaction` tolérés puis normalisés. `montant_xof`, taux et source sont serveur/DB seulement. La migration prévoit XOF, parité EUR/XOF et taux daté sourcé pour les autres devises; absence de taux = rejet. Les types historiques `virement/ajustement` font arrêter le backfill.
- Immobilier : aucune modification fonctionnelle. La distinction statut opérationnel/publication et le lieu du titre exigent un modèle métier sans ambiguïté avant d’ajouter des champs ou contraintes.
- RBAC Phase 3.4 : inchangé. Les dépendances d’accès présentes avant cette mission ont été conservées.
- MFA production : inchangé.

## 5. Migrations, sauvegarde et retour arrière — [RISQUE : MOYEN]

- Migration ajoutée : `backend/alembic/versions/031_contract_v2_products_finance.py`; elle n’a pas été appliquée.
- Aucun backfill ni changement de base n’a eu lieu.
- Dump personnalisé de `egs_test` créé et vérifié avec `pg_restore --list` : `/tmp/egs-contract-v2-20261002/egs_test-20261002T092946Z.dump`, 229367 octets, SHA-256 `2bcd68923bade728a5800426c8e70626f4b3b5fa29ddd87fb77cec1803509afe`. Preuve et liste de restauration dans le même répertoire.
- Comme la migration n’a pas été appliquée, aucun rollback DB n’était nécessaire. Le dump vérifié reste disponible. Une validation de migration dans une copie distincte reste requise avant l’upgrade d’`egs_test`.

## 6. Tests et packaging — [RISQUE : MOYEN]

- Tests ciblés de contrat backend : `11 passed`; ils valident les schémas et alias, sans connexion ni écriture DB.
- Compilation Python (`py_compile`) : PASS.
- Chaîne de révisions (`alembic history`) : PASS; tête de code 031 après 030.
- TypeScript (`npm run typecheck`) : PASS.
- Build frontend (`npm run build`) : PASS. Avertissements existants de données Browserslist vieillissantes et imports dynamiques Foncier; aucune erreur de build.
- Suite backend complète : non exécutée. Elle comprend des tests/fixtures qui simulent l’état MFA et sa configuration DB de test ne correspond pas au périmètre imposé pour les tests de cette mission.
- Tests Products de création réelle/concurrence 50, Finance sur triggers/taux et tests d’intégration authentifiés : non exécutés, migration non appliquée et MFA réel indisponible.
- Tests Immobilier, localhost, tests publics : non exécutés.
- Artifact frontend de build créé localement. Aucun artifact n’a été publié; hashes de release et origin : sans objet.

## 7. Gate et anomalies résiduelles — [RISQUE : ÉLEVÉ]

- Gate A : HOLD pour l’exécution de la migration faute de copie de test distincte autorisée; les données des trois domaines sont lisibles et sans ambiguïté dans `egs_test`.
- Gate B : HOLD; migration, tests DB d’intégrité/concurrence et parcours authentifiés restent à faire.
- Gate C/D : HOLD; tests incomplets, RBAC Phase 3.4 toujours non validé, domaine MFA tests HOLD. Publisher non exécuté.
- Finance conserve un écart métier hors du nouveau contrat canonique : le statut opérationnel historique est validé par un CHECK séparé; la migration ne convertit aucune donnée Finance existante.
- Immigration/immobilier : décision technique nécessaire sur l’état brouillon/publication et le champ de localité avant implémentation.
- Le build officiel a régénéré `VERSION.json`, fichier déjà modifié avant cette mission; il n’a pas été restauré ni nettoyé.
- Aucun commit : les fichiers cibles faisaient partie d’un dépôt largement modifié; aucun commit atomique isolé n’a été créé.

## 8. Certification — [RISQUE : ÉLEVÉ]

La mission n’est pas certifiée. Products et Finance ont une implémentation préparée, mais restent HOLD tant que la migration et les tests DB/intégration ne sont pas démontrés. Immobilier et MFA tests restent HOLD. RBAC Phase 3.4 = NON VALIDÉ / INCHANGÉ. MFA production = INCHANGÉ. Déploiement = NON EFFECTUÉ.

## Rapport final demandé

============================================================
EGS — RAPPORT FINAL DE MISSION
============================================================

Products       : HOLD
Finance        : HOLD
Immobilier     : HOLD
MFA tests      : HOLD

Migration      : HOLD
Tests backend  : HOLD
Tests frontend : PASS (typecheck et build)
Tests public   : HOLD

RBAC 3.4       : NON VALIDÉ / INCHANGÉ
MFA production : INCHANGÉ

Déploiement    : NON EFFECTUÉ
Rollback       : DISPONIBLE (dump vérifié; aucune migration appliquée)

Commit(s) :
- Aucun

Points ouverts :
- Préparer une copie PostgreSQL de test dans un périmètre explicitement autorisé, puis tester/appliquer la migration 031 sur `egs_test`.
- Exécuter les tests de concurrence Products (50 créations), Finance (XOF, EUR, taux daté/manquant, invalides) et réconciliation avant/après.
- Obtenir un vrai parcours TOTP de test; aucun bypass ni faux AAL2.
- Définir le modèle Immobilier séparant disponibilité opérationnelle et brouillon/publication, ainsi que la localité du titre.
- Refaire les vérifications Alembic uniquement avec un DSN explicite vers la base autorisée; noter la lecture accidentelle précédente de `egs_local` (sans écriture).

Preuves :
- backup : `/tmp/egs-contract-v2-20261002/egs_test-20261002T092946Z.dump`; SHA-256 `2bcd68923bade728a5800426c8e70626f4b3b5fa29ddd87fb77cec1803509afe`
- Alembic HEAD : DB `egs_test` à `030_restore_property_orm_compat_columns`; HEAD fichiers `031_contract_v2_products_finance`
- tests : `backend/tests/test_contract_v2_schemas.py` — 11 passed; `npm run typecheck` — PASS; `npm run build` — PASS
- SHA256 release : sans objet (non publié)
- SHA256 egs-web : sans objet
- SHA256 origin : sans objet

VERDICT :
HOLD — aucun déploiement. La certification attend la validation isolée de la migration et des intégrations; le contrat Immobilier et le parcours MFA de test restent ouverts.
============================================================

## Addendum — Mission Immobilier V2 (2026-10-02)

### Portée et résultat

L’addendum obligatoire a été appliqué à l’exécution. Le garde-fou Alembic
opt-in et ses tests ont été isolés et corrigés; les vérifications PostgreSQL
en lecture seule confirment que `egs_test` est autorisée et que
`egs_local`/`egs_phase34_staging` sont refusées. Aucun upgrade, downgrade,
écriture PostgreSQL, déploiement, push, changement RBAC ou changement MFA
production n’a eu lieu.

Le Gate Immobilier reste **HOLD localisé** : les documents d’arbitrage visibles
ne fixent pas la localité source du titre, le rôle de `properties.publier_vitrine`
et son lien à la ressource publique, ni l’ensemble des décisions D1–D13. La
matrice de statuts fournie par l’addendum est consignée comme contrat, mais
n’a pas été implémentée isolément car le workflow immobilier complet demeure
indécidable. Aucun backfill n’a été déclaré ou simulé; `properties` avait été
observée vide sur `egs_test` dans l’audit précédent.

### Vérification du garde-fou

- `egs_test`: garde actif, autorisé — PASS (connexion `READ ONLY`).
- `egs_local`: garde actif, refus explicite — PASS (connexion `READ ONLY`).
- `egs_phase34_staging`: garde actif, refus explicite — PASS (connexion `READ ONLY`).
- tests unitaires ciblés: 4 PASS; première exécution a révélé une mauvaise
  importation de `alembic.env`, corrigée par extraction sans effet de bord dans
  `backend/app/core/alembic_guard.py`.
- guard désactivé: la fonction retourne sans interroger la base; aucun blocage
  permanent n’est ajouté.

### Gate Immobilier

| Critère | Résultat |
|---|---|
| Référence IMM, titre dérivé, unicité du titre | HOLD — non implémentés; localité et décisions éditoriales ouvertes |
| Localité, publication, gel du titre | HOLD — arbitrage métier requis |
| Statuts et machine d’états | Contrat consigné; intégration HOLD jusqu’aux décisions métier complètes |
| Dépublication atomique, audit append-only, mass assignment, concurrence | HOLD — aucun workflow ni migration exécuté |
| Downgrade / upgrade après downgrade | HOLD — aucune migration Immobilier créée ou appliquée |
| `egs_local`, `egs_phase34_staging` | INCHANGÉES par cette mission; lectures limitées à `current_database()` |
| RBAC / MFA production | INCHANGÉS |

Annexes de preuves : [`ANNEXE-ALEMBIC-GUARD.md`](ANNEXE-ALEMBIC-GUARD.md) et
[`ANNEXE-CONTRAINTES.md`](ANNEXE-CONTRAINTES.md). Le dump vérifié antérieur
reste `/tmp/egs-contract-v2-immobilier-gate/egs_test-20261002T112344Z.dump`;
aucune restauration n’a été effectuée.

**VERDICT IMMOBILIER V2 : HOLD** — le point bloqué est l’absence de décisions
validées sur la source de localité, la sémantique de publication/gel et les
conditions métier D1–D13 complètes. Aucun comportement n’a été inféré.

## Addendum final — exécution autonome Immobilier V2 (2026-10-02)

Cette section remplace le verdict provisoire précédent pour le périmètre
Immobilier V2. À la demande explicite de SOMA, les arbitrages métier ont été
arrêtés et implémentés dans
[`IMMOBILIER-V2-ARBITRAGES.md`](IMMOBILIER-V2-ARBITRAGES.md), la migration 032,
les routes API et les écrans concernés. Le chemin de publication public a été
aligné sur `/api/v1/site/properties`.

- Migration sur `egs_test` : downgrade 032→031 vérifié, upgrade 031→032 réussi;
  cycle répété après tests pour laisser la base sans résidus de tests.
- Tests ciblés : 17 PASS (13 schémas/garde, 4 intégration PostgreSQL).
- TypeScript `npm run typecheck` et compilation Python : PASS.
- État final : Alembic 032; 16 transitions; 17 types; `properties`, journal
  d’audit et compteur de références vides.
- Dump final vérifié :
  `/tmp/egs-contract-v2-immobilier-go/egs_test-final-20261002.dump`, SHA-256
  `8ebc6f839b1381e4b0e04899bdf00303c1e65717692ba4759a5e91ebcfb72c82`.
- Aucune écriture sur `egs_local` ou `egs_phase34_staging`; RBAC, MFA
  production, déploiement et push inchangés.

**Décision finale : GO fonctionnel et schéma; HOLD global localisé sur la
certification append-only face à une compromission SQL.** L’API se connecte
actuellement comme `postgres` (`rolsuper=true`); un superutilisateur peut
désactiver les triggers même si les mutations DML ordinaires sont refusées et
testées. Aucun rôle PostgreSQL cluster-global n’a été créé ou modifié. Le GO
global exige un login API non-superutilisateur distinct du propriétaire du
journal, puis les mêmes tests avec ce principal réel. Détails et preuves dans
[`IMMOBILIER-V2-GO-FINAL.md`](IMMOBILIER-V2-GO-FINAL.md).

## Addendum — préflight de déploiement sur gnamba-server (2026-10-03)

### État de l’instance active

- Le site public et `https://api.gnambaservices.ci/health` répondent HTTP 200.
- Le symlink `/var/www/egs/current` pointe vers
  `releases/frontend-20261001T170258Z-f77e28345f2341c6473875dbb11c2d45750eae0ed8c6317866ee1d5360a9e175`.
- Le manifeste servi indique le commit `1d717cfb5cef40d57488f373a3dd1b6c1da83247`,
  branche `codex/egs-j4-runtime-immutable-20261001`, release propre du
  2026-10-01 16:14 UTC.
- Le publisher root est installé; sa clé publique correspond à celle du dépôt,
  les répertoires d’arrivée/releases existent et sudo autorise
  `publish-pending`/`rollback-pending`. La disponibilité du secret privé CI
  et le transfert de l’artefact vers l’arrivée restent non vérifiés.

### Vérification des données de production

Connexion API active : base `egs_local`, révision Alembic
`029_auth_password_lifecycle`, principal `postgres` superutilisateur. La base
de test `egs_test` est à `032_immobilier_v2_contract`; elle ne représente pas
les données de production.

- Products : 0 ligne.
- Finance : 121 lignes. Répartition `type`/`type_transaction`/statut :
  `entree/recette/annule` 55, `sortie/depense/annule` 12,
  `NULL/NULL/annule` 40, `entree/recette/en_attente` 7,
  `sortie/depense/en_attente` 3, `NULL/NULL/approuve` 2,
  `NULL/NULL/en_attente` 2. La migration 031 s’arrête sur les valeurs
  `entree`, `sortie` et `NULL`; quatre lignes actives n’ont aucune direction.
- Immobilier : 27 biens (`villa` 18, `appartement` 5, `studio` 4; statuts
  `disponible` 22 et `loue` 5). Le schéma n’a ni `commune`, ni `ville`, ni
  `reference`, ni `titre`. La migration 032 cible exclusivement `egs_test`
  et refuse une table `properties` non vide.

Ces écarts rendent impossible l’application sûre des migrations 031–032 à
`egs_local` avec le contrat actuel. Aucun sens Finance, lieu ou titre n’a été
deviné. Aucun changement de schéma, rôle, secret ou conteneur n’a été effectué.

### Build et sauvegarde

- Dans une copie temporaire du worktree, avec URL API de production :
  typecheck PASS, lint PASS (0 erreur, 15 avertissements), build PASS,
  `release:check` PASS et `validate:frontend` PASS. Ce build enlève l’URL
  localhost présente dans l’ancien `dist/` du dépôt.
- Le manifeste de cette copie indique `workspace_dirty: true`; le paquet signé
  exige `false`. Le dépôt reste sur `audit/fix-schema-site`, avec 229 entrées
  modifiées/non suivies; `HEAD` local est cinq commits derrière le commit servi (`git rev-list --left-right --count 1d717cfb5cef40d57488f373a3dd1b6c1da83247...HEAD` : `5 0`).
- Dump PostgreSQL `egs_local` créé et vérifié par `pg_restore --list` (302
  entrées), mode 0600, 172476 octets, SHA-256
  `88a7928af079c769cfbe9477c3dcb3bc69d6e47c18944cb7f6bbcbffc34b7e24` :
  `/tmp/egs-deploy-20261003-0mai7xdi/egs_local-before-controller-deploy.dump`.

**Verdict au préflight initial : HOLD métier et release.** Le point de retour est prêt;
les gates frontend passent. Les arbitrages Finance et Immobilier ont depuis été
fournis et appliqués au candidat ci-dessous. La preuve administrative de chaque
bien reste à examiner avant sa validation individuelle. Le paquet ne peut être
signé qu’à partir d’un commit propre et livré via le publisher configuré.

### Arbitrage SOMA — conservation des données métier (2026-10-03)

- Finance : pour les 4 lignes non annulées dont `type` et
  `type_transaction` sont NULL, garder `type_operation = INCONNU/HOLD`; aucune
  déduction depuis le statut, attribution seulement sur pièce justificative.
  Conserver les 40 lignes annulées sans type, les exclure des flux réalisés et
  les garder pour l’audit/historique; aucune conversion automatique.
- Immobilier : ne pas déduire la commune ou la ville des 27 adresses libres.
  Rechercher une correspondance dans la BD Adresse officielle ou un justificatif
  administratif, puis vérifier l’appartenance avec les référentiels ANStat.
  Sans preuve suffisante, maintenir chaque bien en HOLD localisé et ne pas
  attribuer de titre IMM définitif.

Aucune donnée Finance ou Immobilier n’a été modifiée. Le préflight documentaire
continue sur les référentiels officiels; il ne transmet pas les adresses à des
services tiers.

### Référentiels officiels et validation sur la base production actuelle

- La documentation de l’API publique ANStat décrit les référentiels de districts,
  régions, départements et sous-préfectures ainsi que leurs fichiers
  géographiques. Elle pourra servir à vérifier l’appartenance administrative
  après établissement d’une localité par preuve; elle ne suffit pas à déduire
  une commune depuis une adresse libre.
- Le portail BD Adresse officiel propose un moteur de recherche d’adresses et
  fait état des premiers certificats d’adresse à Koumassi. Sa couverture
  consultable ne permet pas d’établir une correspondance certifiée pour les 27
  biens hors recherche individuelle. Le portail n’a pas pu être interrogé de
  manière exploitable pendant ce préflight; aucune correspondance n’est donc
  retenue.
- Le préflight initial avait relevé des contrats incompatibles avec les HOLD.
  L’adaptation et sa validation isolée sont consignées dans la section suivante.

Références officielles consultées : [API publique ANStat](https://anstat.ci/public/api)
et [portail BD Adresse](https://www.adressage.gouv.ci/).

### Adaptation du candidat au contrat HOLD (2026-10-03)

- Finance : la migration 031 s’appuie uniquement sur `type_transaction` lorsqu’il
  vaut `recette` ou `depense`; elle ne lit pas le statut pour déduire le sens.
  Les autres lignes reçoivent `type_operation=INCONNU`, gardent leurs champs
  historiques, et sont verrouillées jusqu’à justification. L’alias historique
  `FCFA` reste conservé; les colonnes dérivées XOF sont renseignées à parité
  1:1. Les dates historiques absentes restent NULL et l’interface les affiche
  comme inconnues.
- Flux : les agrégats Finance excluent les opérations annulées. Les 40
  annulées inconnues restent consultables avec l’étiquette HOLD historique,
  sans action de restauration ni reclassement.
- Immobilier : la migration 032 ajoute les colonnes de localité manquantes et
  `localite_statut`. Les biens hérités restent sans `reference`/`titre` IMM,
  avec `localite_statut=HOLD` et vitrine désactivée. L’API génère la référence
  et le titre seulement après enregistrement d’une référence de justificatif et
  d’un code ANStat; la publication est refusée tant que le bien est en HOLD.
  Le statut historique `loue` reste lisible et compté dans les statistiques.
- Build : `vite.config.ts` transmet désormais la valeur CI de
  `VITE_LOCAL_API_URL`; le build production candidate embarque
  `https://api.gnambaservices.ci`, sans le placeholder de configuration.
- Gates sur le candidat temporaire basé sur le commit servi `1d717cfb` :
  typecheck PASS, lint PASS (0 erreur, 15 avertissements), build PASS,
  `release:check` PASS et `validate:frontend` PASS. Python `py_compile` PASS.
- Préflight Alembic dans un conteneur PostgreSQL 16 jetable, avec schéma de
  production synthétique et 121 opérations / 27 biens anonymisés : révisions
  029→030→031→032 PASS. Les résultats Finance reproduisent les groupes attendus
  (40 annulées inconnues, 2 approuvées inconnues, 2 en attente inconnues);
  `FCFA` est conservé et les colonnes XOF sont dérivées. Les 27 biens restent
  HOLD, sans référence/titre, et les cinq statuts historiques `loue` sont
  conservés. Les scénarios ont confirmé le verrouillage d’une opération
  INCONNU, le refus DB de publier un bien HOLD et la génération correcte d’un
  titre après validation justificatif/code ANStat. Les transactions du scénario
  de validation ont été annulées.
- Aucun test de suite n’a été lancé. Cette migration n’a pas été exécutée sur
  `egs_local` ni sur `gnamba-server`.
- État production relu : le rôle `egs_test_user` n’existe pas dans `egs_local`;
  son API utilise toujours `postgres` superutilisateur. Le HOLD de sécurité
  append-only demeure donc. GitHub a le secret de signature de release, mais
  l’environnement Production n’a aucun secret SSH de transfert. Le candidat
  local est encore dirty; aucun commit CI propre, artefact signé, push ou
  publication n’a été réalisé.

Les fichiers de travail d’origine sont conservés. Le comportement HOLD a passé
le préflight isolé; le déploiement reste suspendu à l’intégration CI propre, au
principal DB non-superutilisateur pour le GO de sécurité et au transfert signé
via le publisher.

### Confirmation de politique et préflight UUID production (2026-10-03)

- SOMA a confirmé les règles Finance : les quatre lignes actives sans type
  restent `INCONNU/HOLD` jusqu’à examen d’une pièce justificative; les 40 lignes
  annulées restent annulées et inconnues, exclues des flux réalisés et gardées
  pour audit. Aucun classement métier n’est déduit du statut.
- SOMA a confirmé pour Immobilier l’absence d’inférence de localité. La BD
  Adresse et les justificatifs administratifs sont à rechercher, puis les codes
  à vérifier auprès d’ANStat. Sans preuve, chacun des 27 biens reste en HOLD,
  sans référence/titre définitif.
- Une relecture agrégée en production confirme 27 IDs de propriétés au format
  UUID et une colonne `properties.id` de type PostgreSQL `uuid`. Le précédent
  scénario avec un identifiant textuel arbitraire n’était pas représentatif et
  n’a entraîné aucune modification de code.
- La migration 032 actuelle a été rejouée de 031 à 032 dans PostgreSQL 16
  jetable avec un schéma de propriété `uuid` conforme à la production. La lecture
  `Property` par SQLAlchemy réussit, `quartier` est présent, et une validation
  avec acteur, preuve et code ANStat génère `IMM-2026-0001` et le titre dérivé.
  La transaction de validation a été annulée; le conteneur a été supprimé.
- L’arbitrage métier est clos, mais les biens restent localement en HOLD jusqu’à
  la vérification des pièces. Le **déploiement global reste HOLD** : le candidat
  n’est pas un commit propre signé, la CI ne dispose pas du transfert vers le
  publisher et la base de production utilise encore un rôle superutilisateur.

### Préparation du chemin CI vers le publisher (2026-10-03)

- Le workflow `.github/workflows/deploy.yml` possède maintenant un job séparé
  `publish-frontend`, activable uniquement par `workflow_dispatch` et une case
  `publish_frontend` décochée par défaut. Il télécharge l’artefact signé de la
  même exécution, vérifie que le commit dans l’attestation et `VERSION.json`
  égale le SHA du dispatch, transfère les trois fichiers sous noms `.part`,
  appelle uniquement `/usr/local/sbin/egs-publisher publish-pending`, puis
  compare le commit exposé sur `https://gnambaservices.ci/VERSION.json`.
- Le transfert impose SSH en mode strict avec `EGS_PUBLISH_KNOWN_HOSTS`,
  l’utilisateur `soma`, une clé SSH distincte de la clé de signature et un
  nettoyage best effort des fichiers partiels. Les valeurs sont lues seulement
  depuis l’environnement GitHub `production`.
- Validation statique locale : analyse YAML et `bash -n` de tous les blocs `run`
  réussis; `git diff --check` propre. `actionlint` n’est pas installé. Le job
  n’a pas été déclenché et aucun secret n’a été modifié.
- Un run manuel récent (`36890327673`, SHA `1d717cfb`) confirme que build et
  signature passent; ses jobs Docker/deploy ont été ignorés. L’inventaire GitHub
  montre uniquement `EGS_RELEASE_SIGNING_KEY` au niveau dépôt et aucun secret
  dans l’environnement `production`. Les secrets requis pour publier sont
  `EGS_PUBLISH_HOST`, `EGS_PUBLISH_USER=egs-release`,
  `EGS_PUBLISH_SSH_PRIVATE_KEY`, `EGS_PUBLISH_KNOWN_HOSTS`, et le port SSH
  facultatif `EGS_PUBLISH_PORT`.
- Depuis cet environnement, `gnamba-server:22` répond `Connection refused`.
  La configuration SSH locale ne permet donc pas de vérifier la clé hôte ni
  d’installer les valeurs manquantes. Le dépôt courant est toujours sale
  (146 chemins suivis modifiés et 85 non suivis; 65 commits locaux et un commit
  propre à `origin/main` dans l’écart de graph), donc aucun de ces changements
  ne peut être engagé ou publié sans tri et validation de la portée.
- Aucun changement de production, de secret GitHub ou de base PostgreSQL n’a
  été effectué. Le rôle runtime API est encore superutilisateur; son remplacement
  requiert une stratégie de privilèges, un secret runtime et un accès
  d’administration au serveur. Le déploiement reste bloqué jusqu’à la
  configuration vérifiée de ces prérequis et à l’isolation d’un commit propre.
- Audit SQL de privilèges en lecture seule : principal API `postgres`, 69
  relations publiques détenues par ce login, quatre relations avec RLS activé
  et aucune politique RLS (`app_settings`, `media_files`, `page_layouts`,
  `site_content`). Un rôle runtime sans privilège `BYPASSRLS` n’aurait pas accès
  à ces quatre relations avant l’ajout et la validation de politiques ciblées.
  Aucun rôle, grant, policy ou secret n’a été créé ou modifié.
- Contrôle public après ces préparatifs : le site sert toujours le commit propre
  `1d717cfb` du 2026-10-01. L’artefact courant du workspace n’a pas été publié.

### Correction du port SSH et vérification serveur (2026-10-03)

- Correction confirmée par SOMA : le serveur SSH écoute sur le port `2222`, pas
  `22`. Le workflow prend désormais `2222` par défaut et le runbook du publisher
  est aligné; `EGS_PUBLISH_PORT` peut toujours surcharger le port si nécessaire.
- La connexion SSH vers `gnamba-server:2222` réussit en mode non interactif avec
  `StrictHostKeyChecking=yes`. Une entrée hôte hachée existe déjà dans le
  `known_hosts` local; l’authentification donne `soma`. L’ancien refus sur le
  port 22 était donc un mauvais port, pas un blocage réseau généralisé.
- Le publisher et sa clé publique sont présents sur le serveur. Le publisher
  est `root:root`, mode `0750`; `incoming` appartient à `soma` en mode `0700`.
  La règle sudoers liste bien la commande étroite sans mot de passe. La clé
  publique serveur a la même empreinte SHA-256 DER que `ops/egs-publisher/ci-ed25519.pub`.
  L’accès direct à l’exécutable est refusé à `soma` par conception; l’exécution
  prévue passe par sudo.
- La vérification a établi que le SSH fonctionne sur 2222 sans modifier de clé,
  secret, fichier serveur ou service. Il reste à fournir un accès SSH CI dédié
  et ses paramètres GitHub Production; la clé SSH locale de `soma` n’est pas
  réutilisée dans CI, car le compte a aussi l’appartenance au groupe `docker`.
- Le job de publication est encore une modification locale non publiée. Le
  workflow CI ne voit donc pas encore cette voie, et le code applicatif du
  workspace n’a pas été commité ni déployé.
- L’audit des comptes révèle que `soma` est le seul compte interactif et le
  seul membre du groupe `docker`; `nasuser` a un shell `nologin`. La CI ne doit
  donc pas recevoir une clé SSH de `soma`. Le workflow et le publisher source
  exigent maintenant `egs-release`, compte dédié sans Docker, avec seulement le
  droit sudo `publish-pending`. Le publisher valide désormais une inbox
  `root:egs-publisher` en mode `2770`; `rollback-pending` reste réservé à `soma`.
- Le serveur n’a pas encore le compte `egs-release` et son inbox est encore
  `soma:soma` en mode `0700`. La source locale modifiée n’est pas installée sur
  le serveur. Les commandes d’administration nécessitent un mot de passe sudo;
  seule l’ancienne commande publisher a l’exception sans mot de passe. Aucun
  compte, groupe, droit, secret ou fichier root n’a été changé sur le serveur.
- Aucun fichier n’est en attente dans l’inbox. Les validations ciblées locales
  passent : compilation Python, cinq tests publisher existants, contrôle de la
  politique appelant (soma/egs-release seulement), syntaxe YAML et `bash -n`.
- Le runbook a été complété par `ops/egs-publisher/provision-release-account.sh`.
  Il refuse les groupes supplémentaires de `egs-release`, préserve les clés
  SSH existantes, compare la clé de signature avant toute installation, prépare
  l’inbox root/groupe/setgid et installe le sudoers dédié avec validation
  `visudo`. Syntaxe `bash -n` vérifiée. Le script n’a pas été exécuté; l’accès
  sudo admin reste interactif.

## Addendum — reprise du déploiement contrôlé (2026-10-03)

- Hôte SSH : `gnamba-server`, port confirmé `2222`. L’authentification SSH non interactive fonctionne. `sudo -n /usr/local/sbin/egs-publisher status` répond `sudo: a password is required`; aucune commande privilégiée n’a donc été exécutée et aucun compte/service n’a été modifié.
- La préparation locale du publisher est dans `ops/egs-publisher/` et son workflow manuel reste désactivé par défaut. Le compte `egs-release`, le groupe `egs-publisher`, la boîte d’arrivée `root:egs-publisher` mode `2770`, et les secrets de l’environnement GitHub `production` ne sont pas encore provisionnés. La clé de soma ne sera pas réutilisée pour CI.
- Le préflight backend a découvert un import vers `auth/test_totp.py`, fichier vide. L’import et l’inclusion de ce routeur absent ont été retirés de `backend/app/api/v1/auth/router.py`; le fichier vide est conservé. L’import de l’application et la collecte des tests démarrent ensuite, mais la suite complète échoue sur plusieurs contrats API, autorisations et tables absentes de la base SQLite jetable. Ces échecs restent ouverts; la base temporaire créée par l’essai a été supprimée.
- La base de production et ses conteneurs n’ont pas été modifiés. Restent des prérequis bloquants : compte API PostgreSQL non-superutilisateur et propriétaire d’audit distinct; validation documentée des types Finance manquants (les lignes gardent `INCONNU/HOLD`, les 40 annulées restent annulées et exclues des flux réalisés); preuve officielle de localité pour chacun des 27 biens (sans preuve, `HOLD`, sans titre IMM définitif); et exécution des gates backend dans un environnement de test correspondant à PostgreSQL.

**Verdict de reprise : HOLD.** La connexion sur le bon port a levé le blocage réseau, et le défaut d’import TOTP est corrigé. Aucun déploiement n’a été lancé puisque les contrôles backend échouent encore et que le compte privilégié dédié ainsi que les validations métier/données restent absents.

## Addendum — contrôles live et artefact candidat (2026-10-03)

- Vérification live répétée sur le port 2222 : `/VERSION.json` sert toujours le commit `1d717cfb5cef40d57488f373a3dd1b6c1da83247`, `/health` répond `ok`; `egs-web`, `egs-api` et `egs-postgres` sont healthy. Aucun déploiement n’a été déclenché.
- L’image `egs-api:latest` date du 2026-09-28. `alembic heads` dans cette image retourne `028_normalize_vitrine_lots_types`, tandis que le point de révision lu précédemment dans `egs_local` est `029_auth_password_lifecycle`. `alembic current` échoue avec « Can't locate revision » pour 029 : l’image live ne contient pas la chaîne de migration correspondant à la base. Le candidat local possède les révisions 029–032; cela ne certifie pas encore leur application aux données de production.
- Réconciliation frontend basée sur le commit live : typecheck PASS; lint PASS (15 avertissements, 0 erreur); build production PASS avec `VITE_LOCAL_API_URL=https://api.gnambaservices.ci`; `release:check` PASS; `validate:frontend` PASS. Ce résultat valide seulement l’artefact frontend.
- Inventaire GitHub relu : aucune valeur dans l’environnement `production`; seul le secret de signature `EGS_RELEASE_SIGNING_KEY` existe au niveau dépôt. Il manque toujours les paramètres d’accès du publisher et la clé dédiée `egs-release`.

**HOLD renforcé :** le frontend candidat dépend d’un backend dont l’image live n’a pas la révision déjà enregistrée en base. Il faut d’abord préparer et valider une image backend alignée, rendre ses migrations compatibles avec les HOLD métier et utiliser un principal DB restreint; ensuite seulement une publication coordonnée frontend/backend peut être envisagée.

### Précaution d’exécution locale (2026-10-03)

Le shell de travail tourne sur l’hôte `gnamba-server`; le contexte Docker local `default` est le moteur de production et affiche les mêmes conteneurs que SSH. Aucun `docker build`, `compose up`, redémarrage, ou commande d’écriture Docker n’a été lancé localement. Les constructions vérifiées jusqu’ici sont frontend et restent sous `/tmp`.

### Image backend candidate isolée (2026-10-03)

- Build Docker réussi sous le tag local `egs-api:go-candidate-20261003` (image `sha256:b78884aeee6777381d783c9d28584f23e4645bb30716a1a7e9e3b734873e6e483b734873e6e48`, 76,7 MB). Le conteneur actif `egs-api` conserve l’image `sha256:7f290c0ecb2d8a5630068e800fb7514b57fa47bc8d0fff3f2af3154f827c38c1`; les services sont restés healthy.
- Dans le candidat, import de `app.main` avec réseau désactivé : PASS (239 routes); `alembic heads` : `032_immobilier_v2_contract`. Aucun conteneur candidat n’a été démarré avec la base de production.
- Tests ciblés sur SQLite temporaire explicite : garde Alembic et API auth, 9 PASS. La base temporaire a été supprimée.
- La validation Compose ne passe pas : `FB_ADMIN_PASSWORD` est obligatoire dans `docker-compose.yml`, absent de `.env.server` et absent des variables du Filebrowser actif. Aucun mot de passe n’a été inventé ni transféré; Compose n’a pas été lancé.

Le tag backend candidat reste inactif et n’a aucun accès à la base. Le remplacement de l’image active attend la migration et les privilèges DB approuvés ainsi qu’une configuration Compose complète et cohérente.

## Addendum — gates PostgreSQL candidat et correction migration 031 (2026-10-03)

- Le test de chaîne a trouvé que `031_contract_v2_products_finance` lisait `finances.type_transaction` avant de l’ajouter sur une installation neuve. L’ajout idempotent est maintenant placé avant la validation; les bases qui ont déjà cette colonne restent inchangées.
- Image reconstruite après cette correction : `egs-api:go-candidate-20261003-r2`, identifiant `sha256:c6a2514da9ecae11fade49f8f6805cfb6fdc0ed7c96e6bdab145db797fa986a0`, 76,7 MB. Le tag r1 de préflight a été supprimé. L’image API en service n’a pas été remplacée.
- Dans un PostgreSQL 16 éphémère, isolé par réseau interne et stockage tmpfs, les migrations complètes 001→032 passent avec le bootstrap explicite `alembic_version` et l’extension `uuid-ossp` déjà présente en production.
- Rejeu à partir de 029 avec données synthétiques reproduisant les 121 opérations et 27 biens : migration 030→032 PASS. Résultat Finance : `INCONNU/annule=40`, `INCONNU/approuve=2`, `INCONNU/en_attente=2`; les catégories connues donnent 55 recettes annulées, 12 dépenses annulées, 7 recettes en attente et 3 dépenses en attente. Les valeurs historiques `entree`/`sortie`, `recette`/`depense`, statuts et 121 lignes restent présentes.
- Résultat Immobilier : 27/27 biens en `HOLD`, sans référence/titre, masqués de la vitrine; les 5 statuts `loue` restent conservés. Les essais d’édition d’une opération inconnue et de publication d’un bien HOLD sont rejetés.
- Les conteneurs et réseau PostgreSQL temporaires ont été supprimés. Ces essais n’ont utilisé ni `egs_local` ni les adresses réelles. La production reste sur l’image API précédente.

**État :** les migrations sont désormais validées sur un échantillon métier représentatif. La migration de production reste en attente d’un rôle API restreint avec politiques RLS compatibles, d’une configuration Compose complète, de la livraison du code propre et des prérequis publisher/CI. Aucun GO global n’est déclaré.
