# Matrice des fonctionnalités Foncier — EGS / Gnamba Services

**Objectif :** cartographier l'état initial et l'état final des fonctionnalités du module foncier, avec leur route réelle, leur permission, leur état et les corrections nécessaires. Ce document est un livrable de la mission "Finalisation contrôlée du module foncier".

**Conventions d'état :**
- `Implémenté` : route réelle répondant, comportement conforme, testé.
- `Non implémenté (501)` : route déclare explicitement `HTTP 501 Not Implemented` avec un message métier. Aucun faux succès, aucune donnée fictive.
- `HOLD` : maintenu non opérationnel en attendant une décision/arbitrage métier (modèle officiel, colonnes CSV, règles de sync, matrice rôle/permission).
- `Déjà traité` : correction appliquée et testée dans cette mission.

---

## Matrice initiale → finale

| # | Fonctionnalité | Route réelle (backend) | Interface (frontend) | Permission | État initial | État final | Test existant | Correction nécessaire / commentaire |
|---|---|---|---|---|---|---|---|---|
| 1 | Vérification publique attestation | `GET /foncier/attestations/verify/{reference}` | Public (lien/QR) | aucune (public) | Implémenté (exposait nom/prénom propriétaire) | **Implémenté — données personnelles retirées** (`proprietaire={}`) | `tests/test_foncier_security.py` | ✅ Déjà traité : réponse publique liste blanche (référence, statut, dates, lot, village, `proprietaire={}`). Test négatif ajouté. |
| 2 | Génération PDF attestation | `POST /foncier/attestations/{id}/generate-pdf` | — | `foncier.attestation.generate` | `501 Not Implemented` | **HOLD** | non | Modèle officiel et autorité émettrice non fournis → délivrance réelle bloquée. Aucune signature/cachet inventés. |
| 3 | Téléchargement PDF attestation | `GET /foncier/attestations/{id}/pdf` | — | `foncier.attestation.download` | `501 Not Implemented` | **HOLD** | non | Dépend du modèle officiel (voir #2). |
| 4 | Import CSV lots | `POST /foncier/ilots/{ilot_id}/lots/import` | — | `foncier.import` | `501 Not Implemented` | **HOLD** | non | Colonnes métier et règles d'import non définies (B.6). |
| 5 | Export CSV lots | `POST /foncier/lots/export` | — | `foncier.export` | `501 Not Implemented` | **HOLD** | non | Colonnes et périmètre d'export non définis. |
| 6 | Export audit PDF | `POST /foncier/audit/export-pdf` | — | `foncier.audit.export` | `501 Not Implemented` | **HOLD** | non | Événements exportables et autorisations non déterminés. |
| 7 | Export audit CSV | `POST /foncier/audit/export-csv` | — | `foncier.audit.export` | `501 Not Implemented` | **HOLD** | non | Idem #6. |
| 8 | Résolution conflit sync | `POST /foncier/sync/queue/{queue_item_id}/resolve` | — | `foncier.sync.resolve` | `501 Not Implemented` | **HOLD** | non | Règles de fusion/arbitrage de conflit non définies. |
| 9 | Liste des lots | `GET /foncier/lots` | client.ts `getLots` | `foncier.read` | Implémenté | Implémenté | oui | Test de régression ajouté (success path, pas de NameError). |
| 10 | Liste lots par îlot | `GET /foncier/ilots/{ilot_id}/lots` | — | `foncier.read` | Implémenté | Implémenté | oui | Test de régression ajouté (success path, pas de NameError). |
| 11 | Création lot | `POST /foncier/ilots/{ilot_id}/lots` | client.ts `createLot` | `foncier.create` | Implémenté | Implémenté | oui | Aucun. |
| 12 | Vérification doublon lot | `GET /foncier/lots/exists` | — | `foncier.read` | Implémenté | Implémenté | oui | Aucun (session injectée corrigée précédemment). |
| 13 | Création attestation | `POST /foncier/lots/{lot_id}/attestations` | — | `foncier.create` | Implémenté | Implémenté | oui | Aucun. |
| 14 | Validation attestation | `POST /foncier/attestations/{id}/validate` | — | `foncier.approve` | Implémenté | Implémenté | oui | Aucun. |
| 15 | Révocation attestation | `POST /foncier/attestations/{id}/revoke` | — | `foncier.attestation.revoke` | Implémenté | Implémenté | oui | Aucun. |
| 16 | Scan/archivage attestation | `POST /foncier/attestations/{id}/scan` | — | `foncier.attestation.generate` | Implémenté | Implémenté | oui | Aucun. |
| 17 | Consultation audit trail | `GET /foncier/audit` | client.ts `getAudit` | `foncier.audit.read` | Implémenté | Implémenté | oui | Aucun. |
| 18 | Timeline audit entité | `GET /foncier/audit/timeline/{type}/{id}` | — | `foncier.audit.read` | Implémenté | Implémenté | oui | Aucun. |
| 19 | Accès village (octroi) | `POST /foncier/access/{user}/villages/{village}` | — | gestion | Implémenté | Implémenté | oui | Aucun. |
| 20 | Accès village (mes villages) | `GET /foncier/access/me/villages` | — | `foncier.read` | Implémenté | Implémenté | oui | Aucun. |
| 21 | Health API | `GET /health` | — | — | Implémenté (toujours ok) | Implémenté | non | Aucune correction : `/health` ne masque pas un échec d'auth. |
| 22 | Readiness API | `GET /ready` | — | — | Implémenté (503 si révision ≠ 035) | Implémenté | non | `/ready` 503 actuel car révision 035 non appliquée ; ce n'est pas un mauvais mot de passe. |

---

## Routes `501` restantes (état final)

Toutes maintenues avec un message métier explicite (pas de faux 200, pas de fichier vide, pas de données simulées) :

1. `POST /foncier/ilots/{ilot_id}/lots/import` — "Import CSV non implémenté"
2. `POST /foncier/lots/export` — "Export CSV non implémenté"
3. `POST /foncier/attestations/{attestation_id}/generate-pdf` — "Génération PDF non implémentée"
4. `GET /foncier/attestations/{attestation_id}/pdf` — "Téléchargement PDF non implémenté"
5. `POST /foncier/audit/export-pdf` — "Export PDF audit non implémenté"
6. `POST /foncier/audit/export-csv` — "Export CSV audit non implémenté"
7. `POST /foncier/sync/queue/{queue_item_id}/resolve` — "Résolution conflit non implémentée"

**Raison commune :** les exigences métier (modèle officiel d'attestation, colonnes CSV, événements exportables, règles de fusion de conflit) ne sont pas définies ; les correspondances rôle/permission (B.6) sont en attente d'arbitrage. Conserver le `501` est le comportement sûr retenu.

---

## Corrections techniques appliquées (LOT A)

| # | Correction | Fichier | Preuve |
|---|---|---|---|
| A.1 | Vérification publique : exclusion des données personnelles du propriétaire (nom, prénom, téléphone, email, pièce d'identité, signature, scan, PDF nominatif) | `backend/app/api/v1/foncier/router.py` | `proprietaire={}` ; test `test_attestation_verification_is_public_and_minimizes_owner_data` mis à jour |
| A.2 | Tests de régression succès path `GET /lots` et `GET /ilots/{ilot_id}/lots` (évite la régression NameError corrigée précédemment) | `backend/tests/test_foncier_security.py` | 2 nouveaux tests, 201 passed au total |

## Tests exécutés (résultats réels)

- `python -m pytest backend/tests -q` → **201 passed, 15 skipped**, 0 échec.
- `python -m pytest backend/tests/test_foncier_security.py` → **7 passed**.

Aucun test de succès ne dépend uniquement d'un mock ; les tests de routes utilisent des fakes de service injectés via `monkeypatch.setattr` sur le module router (car `get_lot_service` est appelé directement, non via `Depends`).

## Éléments bloqués (à ne pas confondre avec des échecs techniques)

- Modèle officiel d'attestation / mentions / signatures / autorité émettrice : **non fourni** → délivrance PDF bloquée (HOLD).
- Colonnes métier CSV et ressources importables/exportables : **non définies** → import/export CSV bloqué (HOLD).
- Événements exportables du journal + autorisations d'export : **non déterminés** → export audit bloqué (HOLD).
- Règles de fusion/arbitrage des conflits de sync : **non définies** → résolution de conflit bloquée (HOLD).
- Matrice rôle × permission `foncier.*` : **en attente** (B.6 point 5 = OPEN) → refus par défaut conservé, aucun droit accordé arbitrairement.
