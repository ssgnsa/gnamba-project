# Modèle CSV d'import/export lots fonciers — EGS / Gnamba Services

**Statut : support à l'arbitrage métier (B2) — NON IMPLÉMENTÉ.**

Ce document est une proposition de format destinée à alimenter la décision B.6 (formats CSV). Il ne constitue pas une implémentation et ne doit pas être utilisé en production tant que les colonnes métier et les règles d'import/export n'ont pas été expressément validées.

## Règles de format (spécification proposée)

| Règle | Valeur proposée |
|---|---|
| Encodage | UTF-8 (BOM déconseillé) |
| Séparateur | Point-virgule `;` |
| En-têtes | Première ligne, noms de colonnes documentés ci-dessous |
| Dates | AAAA-MM-JJ (ISO 8601) |
| Identifiants | UUID stables, génération côté serveur |
| Décimales | Point `.` comme séparateur décimal |
| Texte avec séparateur | Mis entre guillemets doubles `"` |

## Colonnes proposées pour l'export de lots (exemple)

| Colonne | Type | Obligatoire | Description | Exemple (fictif) |
|---|---|---|---|---|
| id | UUID | oui | Identifiant stable du lot | `a1b2c3d4-e5f6-...` |
| reference | Texte(100) | oui | Référence unique du lot | `LOT-VIL-01-12` |
| ilot_id | UUID | oui | Identifiant de l'îlot parent | `i7i8i9j0-k1l2-...` |
| numero_lot | Texte(50) | oui | Numéro de lot dans l'îlot | `12` |
| superficie | Décimal(10,2) | oui | Superficie en m² | `250.00` |
| statut | Texte(20) | oui | `actif`, `vendu`, `litige`, `reserve`, `annule`, `archive` | `actif` |
| proprietaire_client_id | UUID | non | Référence client (parties) | `p1p2p3p4-q5r6-...` |
| date_cession | Date | non | Date de cession | `2026-03-15` |
| prix_cession | Décimal(12,2) | non | Prix de cession | `12000000.00` |
| publier_sur_vitrine | Booléen | non | Publication vitrine | `0` ou `1` |
| deleted_at | DateTime | non | Soft-delete (si archivé) | vide |

## Exemple de fichier fictif (données d'illustration uniquement)

```csv
id;reference;ilot_id;numero_lot;superficie;statut;proprietaire_client_id;date_cession;prix_cession;publier_sur_vitrine
a1b2c3d4-e5f6-7890-abcd-ef1234567890;LOT-VIL-01-12;i7i8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2;12;250.00;actif;p1p2p3p4-q5r6-s7t8-u9v0-w1x2y3z4a5b6;2026-03-15;12000000.00;1
```

## Règles de validation proposées (à valider par l'arbitrage)

- Types : UUID valide, texte borné, décimal positif pour superficie/prix.
- Références : `ilot_id` doit désigner un îlot existant ; `numero_lot` unique dans l'îlot (contrainte d'unicité active).
- Doublons : rejet du lot en doublon, rapport d'erreur par ligne.
- Champs obligatoires : `reference`, `ilot_id`, `numero_lot`, `superficie`, `statut`.
- Limites : taille et nombre de lignes configurables, testées.
- Transactionnel : première version = import d'un lot validé ; aucune insertion si la validation du lot échoue.
- Aucun écrasement silencieux de données existantes.
- Pas d'import de rôles, d'audit ou de statuts délivrés.
- Les dossiers importés restent des brouillons.

## Délimitation de responsabilité

Ce modèle est une proposition technique. Les colonnes réelles, les règles de validation, les limites et les permissions d'import/export relèvent de l'arbitrage métier et doivent être documentées dans `docs/audit/ARBITRAGES-METIER-RESTANTS.md` avant toute implémentation.
