# Chaîne Alembic du Site Vitrine — Phase 3.2

Audit du 2026-09-23. Sources récupérées sans restauration dans `backend/alembic/versions/`. Aucune commande Alembic de modification et aucune migration n'ont été exécutées.

## Graphe observé et graphe récupéré

Le checkout versionné s'arrête à `024_add_media_taxonomy_and_content_hash`, qui reste son unique head. La DB locale `egs_local` porte le marqueur `027_fix_public_site_schema_drift`; Alembic ne peut donc pas résoudre son état courant. Les quatre sources 025–028 existent sous forme de blobs Git orphelins, non référencés par les commits inaccessibles examinés.

```text
Checkout actif :  ... → 024 (head)
                         │
Chaîne de sources :      025 → 026 → 027 → 028
                         │                   │
DB locale :              version 027        └─ aucun marqueur 028
```

La portion retrouvée est linéaire, sans branche ni merge entre 024 et 028. Le graphe antérieur du checkout contient son mergepoint déjà existant; rien dans les preuves ne permet de le relier autrement à 025–028.

## Inventaire de preuves

| Migration | `revision` | `down_revision` | Contenu retrouvé | Source / preuve | Confiance |
|---|---|---|---|---|---|
| 024 | `024_add_media_taxonomy_and_content_hash` | historique versionné antérieur | présente dans le checkout; head actif | Git suivi + `alembic heads` | certaine pour le checkout |
| 025 | `025_fix_missing_foncier_schema_columns` | `024_add_media_taxonomy_and_content_hash` | source complète retrouvée | blob orphelin `b0eea638d91c6704b278a09d36d79ef63c2509bb` | certaine pour le contenu; provenance inconnue |
| 026 | `026_add_lot_barcode_and_cedant` | `025_fix_missing_foncier_schema_columns` | source complète retrouvée | blob orphelin `d9111c5547296814b80bbe7c15c865c642d037e9` | certaine pour le contenu; provenance inconnue |
| 027 | `027_fix_public_site_schema_drift` | `026_add_lot_barcode_and_cedant` | source complète retrouvée; source identique au code compilé dans le `.pyc` ignoré | blob `3add81b38f8475123b0645239fca3ed67fdf5edf`, `.pyc` Python 3.12, marqueur DB | certaine pour le contenu et son existence locale; auteur/commit inconnus |
| 028 | `028_reconcile_page_layout_columns` | `027_fix_public_site_schema_drift` | source complète retrouvée, mais non présente dans le checkout et non marquée dans la DB | blob orphelin `2e25c325fa29386fd4c89abbae789fdf6feda5bf` | certaine pour le texte retrouvé; application et provenance inconnues |

`git fsck --full --no-reflogs --unreachable` a trouvé 6 190 objets, dont 84 commits inaccessibles; aucun de ces arbres de commit ne référence ces quatre blobs. Les recherches `git log --all`, reflogs et signatures n'ont identifié ni commit, ni auteur, ni branche d'origine. Le `.pyc` 027 (8 452 octets) a un `co_filename` attendu; son code objet correspond à la compilation du blob 027 (7 534 octets). Il confirme l'existence locale du fichier compilé, pas le contexte d'application de la migration.

## Portée réelle des migrations retrouvées

| Révision | Effets `upgrade()` | Effets `downgrade()` / risque |
|---|---|---|
| 025 | PostgreSQL seulement. `foncier_attestations.row_version INTEGER NOT NULL DEFAULT 1`; `foncier_attestation_temoins.entity_id UUID`, index `idx_temoin_entity_id`, FK `fk_attestation_temoins_entity` vers `entities(id) ON DELETE SET NULL`. | Supprime FK, index et les deux colonnes; l'historique ou les valeurs présentes seraient perdus. |
| 026 | PostgreSQL seulement. Ajoute `foncier_lots.code_barre VARCHAR(64)`, `cedant_nom`, `cedant_prenom`, `cedant_cni_numero`, `cedant_telephone`, `cedant_domicile`; peuple les codes-barres NULL à partir de l'UUID, impose NOT NULL et index unique `uq_foncier_lots_code_barre`. | Supprime index unique et toutes les colonnes ajoutées, code-barres compris. |
| 027 | PostgreSQL seulement. Ajoute, si absentes, 31 colonnes à `vitrine_lots`: `lot_id UUID`, `property_id UUID`, `titre VARCHAR(255)`, `description TEXT`, `prix NUMERIC(12,2)`, `surface NUMERIC(10,2)`, `localisation TEXT`, `photos JSON`, `publier BOOLEAN`, `ordre INTEGER`, `tags TEXT[]`, `reference/village/quartier/commune/departement/region VARCHAR(255)`, `superficie NUMERIC(10,2)`, `prix_vente NUMERIC(12,2)`, `statut VARCHAR(50)`, `documents/caracteristiques JSON`, `image_url/image_alt TEXT`, `contact_phone VARCHAR(50)`, `contact_email VARCHAR(255)`, `publier_sur_vitrine BOOLEAN`, `ordre_affichage INTEGER`, `notes TEXT`, `created_by/updated_by UUID`. Index non uniques `idx_vitrine_lot_reference`, `idx_vitrine_lot_statut`, `idx_vitrine_lot_publie`; convertit les liens texte en UUID, toute valeur non conforme devenant NULL; FK `fk_vitrine_lot_lot` et `fk_vitrine_lot_property`, `ON DELETE CASCADE`, si les tables existent. Répète `row_version`, `entity_id` et l'index témoin déjà ciblés par 025, sans répéter sa FK témoin. | Supprime systématiquement les index/FK puis les 31 colonnes `vitrine_lots`, qu'elles aient été créées par 027 ou non; supprime également `row_version` et `entity_id`. Downgrade potentiellement destructif, non sûr comme rollback. |
| 028 | PostgreSQL seulement. Ajoute `page_layouts.page_slug VARCHAR(100)`, `page VARCHAR(255)`, `published_at TIMESTAMPTZ`; copie les alias vides depuis `page_key/page_name`; ajoute l'index non unique `idx_page_layout_page_slug`. | Supprime l'index et les trois colonnes. Les données spécifiques à ces colonnes seraient perdues. |

Les sources 025–028 ne doivent pas être copiées dans les migrations actives ni exécutées à ce stade. Leurs downgrades ne garantissent pas la restauration des données antérieures.

## Résultat Alembic et décision

- `alembic current` : échec exact `Can't locate revision identified by '027_fix_public_site_schema_drift'`.
- `alembic heads` : `024_add_media_taxonomy_and_content_hash (head)`.
- `alembic history --verbose` : graphe versionné présent jusqu'à 024, sans 025–028.
- État : révisions présentes uniquement dans les blobs orphelins; marqueur 027 uniquement dans la DB locale; aucun marqueur ou index démontrant l'application de 028.
- Stratégie recommandée : conserver/restaurer les sources originales seulement après validation de provenance et comparaison complète à une sauvegarde restaurée; puis choisir humainement A (restaurer l'historique), B (recréer depuis preuves certifiées) ou C (réconciliation non destructive). Ne pas `stamp`, `upgrade`, `downgrade` ni modifier le schéma sur cette seule base.

Le détail de la DB et les options de réconciliation sont dans [SITE-VITRINE-PHASE3.2-ALEMBIC-RBAC-MEDIA.md](SITE-VITRINE-PHASE3.2-ALEMBIC-RBAC-MEDIA.md). Capture brute du baseline : [PHASE3.2-BASELINE.txt](PHASE3.2-BASELINE.txt).
