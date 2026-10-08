# Contrat applicatif proposé — `vitrine_lots`

État : harmonisation applicative préparatoire, PostgreSQL non modifié.

## Décisions retenues

| Sujet | Contrat applicatif retenu | Motif / limite |
|---|---|---|
| `id` | UUID en base cible; chaîne canonique UUID dans les routes et le frontend | La route et l'éditeur génèrent des UUID et transportent des chaînes. La base locale utilise encore `text` et ne contient aucune ligne `vitrine_lots`. |
| `lot_id`, `property_id` | UUID nullable, chaîne UUID à l'API; clés étrangères avec `ON DELETE CASCADE` | C'est le contrat de 012 et 027. Le modèle ORM est maintenant explicite sur ces clés étrangères. |
| `created_by`, `updated_by` | TEXT nullable; chaînes d'identité opaques | `users.id` est `varchar`; les quatre valeurs présentes sont non UUID. Aucune conversion en UUID n'est justifiée. Les valeurs doivent rester celles du fournisseur d'identité. |
| `prix`, `prix_vente` | API JSON number / Python `float`; DB cible `NUMERIC(12,2)` | Conserve la forme publique existante et la précision de stockage annoncée par le modèle et les migrations. L'API ne promet pas une arithmétique décimale exacte après conversion en float. |
| `surface`, `superficie` | API JSON number / Python `float`; DB cible `NUMERIC(10,2)` | Même arbitrage que les montants. Les règles d'unité, de plage et d'arrondi restent celles du domaine et doivent être validées avant la migration physique. |
| `photos` | liste JSON; DB `JSON` | La création encode la liste JSON et le DTO consomme une liste. Le type `JSONB` du configurateur générique était divergent. |
| `tags` | `string[]`; DB `TEXT[]` | Le DTO et le schéma générique exposent un tableau de chaînes; aucun usage imbriqué n'a été observé. Le frontend transporte désormais les tags reçus, sans formulaire d'édition dédié. |
| `documents` | `string \| null`; DB `TEXT` | Route et formulaire manipulent du texte. L'API convertissait en `None` toute valeur non-string. Aucun usage JSON actif identifié. |
| `caracteristiques` | `string[] \| null`; DB `TEXT[]` | Le DTO, le type frontend et le formulaire ligne-par-ligne utilisent un tableau de chaînes. Aucun usage actif ne justifie JSON imbriqué. |
| `created_at`, `updated_at` | DB cible `TIMESTAMPTZ`; API ISO-8601 UTC avec offset; frontend chaîne ISO | Les écritures applicatives utilisent maintenant des datetimes UTC conscients du fuseau; la sérialisation ajoute explicitement `+00:00`. Les valeurs naïves lues dans la DB locale sont interprétées comme UTC, cohérent avec son `TimeZone=UTC`. |

## Types DB cibles complémentaires

| Colonnes | Type cible |
|---|---|
| `titre` | `VARCHAR(255)` |
| `description`, `localisation`, `reference`, `village`, `quartier`, `commune`, `departement`, `region`, `image_url`, `image_alt`, `contact_phone`, `contact_email`, `notes` | `TEXT` (nullable, sauf autre règle métier déjà établie) |
| `publier`, `publier_sur_vitrine` | `BOOLEAN` |
| `ordre`, `ordre_affichage` | `INTEGER` |
| `statut` | `VARCHAR(50)`, limite de longueur côté API; l'interface propose les valeurs `disponible`, `reserve`, `vendu` |

Les defaults de publication, ordre et statut restent appliqués par le DTO ou la route comme aujourd'hui; ils ne sont pas une garantie de défaut serveur dans le schéma physique.

## Compatibilité et préconditions

- Le modèle ORM et la configuration générique déclarent maintenant les types applicatifs retenus pour les nombres, tableaux, documents, médias et références.
- Les écritures de dates produisent UTC. La compatibilité de l'ancienne colonne sans timezone repose sur le fuseau PostgreSQL UTC observé localement. Chaque environnement existant doit confirmer son fuseau avant migration; une date naïve d'un autre fuseau ne peut pas être réinterprétée sans preuve.
- `vitrine_lots.id` et les dates de la DB locale ne peuvent pas être contrôlés par ligne: la table est vide. Les environnements non vides requièrent des contrôles agrégés de validité avant conversion.
- Les colonnes `REAL` historiques peuvent porter des valeurs décimales approximatives. La conversion vers `NUMERIC(...,2)` doit avoir une règle d'arrondi explicite et un précontrôle dans chaque environnement non vide.
- Les migrations 012 et 027 ne sont pas modifiées. 027 ne normalise pas les types des colonnes déjà présentes; son écart avec ce contrat doit être corrigé par une future migration en avant, après cadrage séparé.
- Aucun DDL, DML, `upgrade`, `downgrade`, `stamp` ou SQL de modification n'est autorisé par cette étape.

## État

Ce contrat fixe les choix applicatifs à utiliser pour le cadrage ultérieur. Il ne certifie pas la conformité physique de PostgreSQL et n'autorise pas encore la migration de normalisation. `site_offers` reste HOLD.
