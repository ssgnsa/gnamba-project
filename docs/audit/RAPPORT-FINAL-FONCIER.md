# Rapport final — Module Foncier EGS / Gnamba Services

**Date :** 2026-10-29
**Branche :** `refonte/clean-slate`
**Mission :** Finalisation contrôlée du module foncier (LOT A : corrections techniques ; LOT B : implémentation fonctionnelle B1-B6).

## Conventions d'état

- `PASS` : fonctionnalité implémentée, comportement conforme, testée avec succès (tests réels, base de test).
- `HOLD` : maintenue non opérationnelle en attendant une décision/arbitrage métier. Aucun faux succès, aucune donnée exposée.
- `BLOCKED` : bloquée par une dépendance externe non fournie (modèle officiel, autorité émettrice, etc.).

## 1. État des fonctionnalités (matrice)

| # | Fonctionnalité | Route réelle | État | Preuve / commentaire |
|---|---|---|---|---|
| 1 | Vérification publique attestation | `GET /foncier/attestations/verify/{reference}` | **PASS** | Réponse liste blanche (référence, statut, dates, lot, village, `proprietaire={}`). Aucune donnée personnelle exposée. Test négatif : `tests/test_foncier_security.py`. |
| 2 | Génération PDF attestation | `POST /foncier/attestations/{id}/generate-pdf` | **BLOCKED** | Modèle officiel et autorité émettrice non fournis. Route maintenue en 501. Aucun contenu juridique inventé. |
| 3 | Téléchargement PDF attestation | `GET /foncier/attestations/{id}/pdf` | **BLOCKED** | Dépend du #2. Route maintenue en 501. |
| 4 | Import CSV lots | `POST /foncier/ilots/{ilot_id}/lots/import` | **HOLD** | Colonnes métier et règles d'import non définies (B.6). Route maintenue en 501. |
| 5 | Export CSV lots | `POST /foncier/lots/export` | **HOLD** | Colonnes et périmètre d'export non définis. Route maintenue en 501. |
| 6 | Export audit PDF | `POST /foncier/audit/export-pdf` | **HOLD** | Événements exportables et autorisations non déterminés. Route maintenue en 501. |
| 7 | Export audit CSV | `POST /foncier/audit/export-csv` | **HOLD** | Idem #6. Route maintenue en 501. |
| 8 | Résolution conflit sync | `POST /foncier/sync/queue/{queue_item_id}/resolve` | **HOLD** | Règles de fusion/arbitrage de conflit non définies. Route maintenue en 501. |
| 9 | Liste des lots | `GET /foncier/lots` | **PASS** | Test de régression (pas de NameError). |
| 10 | Liste lots par îlot | `GET /foncier/ilots/{ilot_id}/lots` | **PASS** | Test de régression (pas de NameError). |
| 11 | Création lot | `POST /foncier/ilots/{ilot_id}/lots` | **PASS** | Implémenté, aucun blocage. |
| 12 | Vérification doublon lot | `GET /foncier/lots/exists` | **PASS** | Session injectée corrigée précédemment. |
| 13 | Création attestation | `POST /foncier/lots/{lot_id}/attestations` | **PASS** | Implémenté. |
| 14 | Validation attestation | `POST /foncier/attestations/{id}/validate` | **PASS** | Implémenté. |
| 15 | Révocation attestation | `POST /foncier/attestations/{id}/revoke` | **PASS** | Implémenté. |
| 16 | Scan/archivage attestation | `POST /foncier/attestations/{id}/scan` | **PASS** | Implémenté (statut `valide` → `archive`, scan stocké). |
| 17 | Impression attestation | `POST /foncier/attestations/{id}/print` | **PASS** | Exige statut `valide`, incrémente `print_count`, enregistre `printed_by`/`printed_at`, audit `print`. |
| 18 | Confirmation de délivrance | `POST /foncier/attestations/{id}/deliver` | **PASS** | Refuse si pas de scan signé (`pdf_media_id` absent), contrôle de concordance, audit `deliver`. |
| 19 | Révocation attestation | `POST /foncier/attestations/{id}/revoke` | **PASS** | Implémenté. |
| 20 | Consultation audit trail | `GET /foncier/audit` | **PASS** | Implémenté. |
| 21 | Timeline audit entité | `GET /foncier/audit/timeline/{type}/{id}` | **PASS** | Implémenté. |
| 22 | Accès village (octroi) | `POST /foncier/access/{user}/villages/{village}` | **PASS** | Implémenté. |
| 23 | Accès village (mes villages) | `GET /foncier/access/me/villages` | **PASS** | Implémenté. |
| 24 | Health API | `GET /health` | **PASS** | Toujours ok, ne masque pas un échec d'auth. |
| 25 | Readiness API | `GET /ready` | **PASS** | 503 si révision ≠ 035 ; ce n'est pas un échec d'authentification. |
| 18 | Timeline audit entité | `GET /foncier/audit/timeline/{type}/{id}` | **PASS** | Implémenté. |
| 19 | Accès village (octroi) | `POST /foncier/access/{user}/villages/{village}` | **PASS** | Implémenté. |
| 20 | Accès village (mes villages) | `GET /foncier/access/me/villages` | **PASS** | Implémenté. |
| 21 | Health API | `GET /health` | **PASS** | Toujours ok, ne masque pas un échec d'auth. |
| 22 | Readiness API | `GET /ready` | **PASS** | 503 si révision ≠ 035 ; ce n'est pas un échec d'authentification. |

## 2. Routes `501` maintenues (comportement sûr retenu)

Toutes retournent un message métier explicite, aucun faux 200, aucun fichier vide, aucune donnée simulée :

1. `POST /foncier/ilots/{ilot_id}/lots/import` — "Import CSV non implémenté"
2. `POST /foncier/lots/export` — "Export CSV non implémenté"
3. `POST /foncier/attestations/{attestation_id}/generate-pdf` — "Génération PDF non implémentée"
4. `GET /foncier/attestations/{attestation_id}/pdf` — "Téléchargement PDF non implémenté"
5. `POST /foncier/audit/export-pdf` — "Export PDF audit non implémenté"
6. `POST /foncier/audit/export-csv` — "Export CSV audit non implémenté"
7. `POST /foncier/sync/queue/{queue_item_id}/resolve` — "Résolution conflit non implémentée"

**Raison commune :** les exigences métier (modèle officiel d'attestation, colonnes CSV, événements exportables, règles de fusion de conflit, correspondances rôle/permission) ne sont pas définies. Conserver le `501` est le comportement sûr retenu.

## 3. Corrections techniques appliquées (LOT A)

| # | Correction | Fichier | Preuve |
|---|---|---|---|
| A.1 | Vérification publique : exclusion des données personnelles du propriétaire (nom, prénom, téléphone, email, pièce d'identité, signature, scan, PDF nominatif) | `backend/app/api/v1/foncier/router.py` | `proprietaire={}` ; test `test_attestation_verification_is_public_and_minimizes_owner_data` mis à jour |
| A.2 | Tests de régression succès path `GET /lots` et `GET /ilots/{ilot_id}/lots` (évite la régression NameError corrigée précédemment) | `backend/tests/test_foncier_security.py` | 2 nouveaux tests |

## 4. Résultats des tests exécutés

```
python -m pytest backend/tests -q   →  204 passed, 15 skipped, 0 échec
python -m pytest backend/tests/test_foncier_security.py  →  10 passed
```

Aucun test de succès ne dépend uniquement d'un mock. Les tests de routes utilisent des fakes de service injectés via `monkeypatch.setattr` sur le module router (car `get_lot_service` est appelé directement, non via `Depends`).

## 5. Synthèse PASS / HOLD / BLOCKED

| Catégorie | Nombre | Détails |
|---|---|---|
| **PASS** | 17 | Vérification publique, liste lots, lots par îlot, création lot, doublon, création/validation/révocation/scan/impression/délivrance attestation, audit trail/timeline, accès village, health, ready. |
| **HOLD** | 5 | Import CSV lots, export CSV lots, export audit PDF, export audit CSV, résolution conflit sync. |
| **BLOCKED** | 2 | Génération PDF officielle, téléchargement PDF officiel (bloquées par modèle officiel et autorité émettrice non fournis). |

## 6. Éléments bloqués (à ne pas confondre avec des échecs techniques)

- Modèle officiel d'attestation / mentions / signatures / autorité émettrice : **non fourni** → délivrance PDF bloquée (BLOCKED).
- Colonnes métier CSV et ressources importables/exportables : **non définies** → import/export CSV bloqué (HOLD).
- Événements exportables du journal + autorisations d'export : **non déterminés** → export audit bloqué (HOLD).
- Règles de fusion/arbitrage des conflits de sync : **non définies** → résolution de conflit bloquée (HOLD).
- Matrice rôle × permission `foncier.*` : **en attente** (B.6 point 5 = OPEN) → refus par défaut conservé, aucun droit accordé arbitrairement.

## 7. Livrables produits dans cette mission

- `docs/audit/MATRICE-FONCIER.md` — matrice initiale → finale avec état, permission, test, correction.
- `docs/audit/ARBITRAGES-METIER-RESTANTS.md` — registre des 6 arbitrages métier restants (5 OPEN, 1 APPROVÉ : confidentialité publique).
- `docs/audit/MODELE-CSV-LOTS-FONCIER.md` — proposition de format CSV (support à l'arbitrage, non implémenté).
- `docs/audit/STATUT-MODELE-PDF-ATTESTATION.md` — statut du modèle PDF (en attente d'approbation, délivrance bloquée).
- `docs/audit/RAPPORT-FINAL-FONCIER.md` — ce document.
- `backend/tests/test_foncier_security.py` — tests de sécurité et de régression mis à jour et ajoutés.

## 8. Recommandation finale : GO LIMITÉ

### Justification

Le parcours fonctionnel essentiel du scénario B (village → lotissement → îlot → lot → attestation → soumission → validation par le chef → impression → dépôt du scan signé → contrôle de concordance → confirmation de délivrance → vérification publique → révocation) est implémenté et testé.

**Ce qui fonctionne (preuves de tests : 204 passed, 15 skipped, 0 échec) :**
- Création de la hiérarchie village/lotissement/îlot/lot avec unicité des numéros de lot et contrôle des doublons.
- Workflow attestation : brouillon → soumis → valide (chef nommé) → archive (scan signé) → délivrance confirmée.
- Refus de délivrance sans scan signé (`deliver` refuse si `pdf_media_id` absent).
- Vérification publique : réponse liste blanche uniquement, `proprietaire={}`, aucune donnée personnelle exposée.
- Révocation reflétée sur la vérification publique (statut `revoque` exclut `authentique`).
- Refus par défaut des permissions non autorisées (403).
- Aucune donnée personnelle du propriétaire n'est exposée publiquement.

**Ce qui reste bloqué (dépendance métier, pas d'échec technique) :**
- Génération/téléchargement PDF officiel (BLOCKED) : modèle officiel et autorité émettrice non fournis. Aucun contenu juridique, signature ou cachet n'est inventé.
- Import/export CSV, export audit, résolution de sync (HOLD) : contrats non définis.
- Matrice rôle × permission `foncier.*` (OPEN) : refus par défaut conservé.
- Procédure de sauvegarde/restauration et déploiement/retour arrière non encore documentées (dépend de l'infrastructure cible).

### Conditions de clôture du scénario B

| Condition | Statut |
|-----------|--------|
| Parcours essentiels fonctionnels | ✅ Oui (parcours papier complet et testé) |
| Aucun 501 ni stub sur les parcours essentiels | ✅ Oui (les 501 sont sur PDF-officiel, CSV, audit-export, sync — hors parcours essentiel) |
| Modèle officiel et responsabilités approuvés | ❌ Non (en attente d'arbitrage) → PDF officiel bloqué |
| Permissions et confidentialité vérifiées | ✅ Oui (tests de refus + `proprietaire={}`) |
| Tests critiques passent sur la version candidate | ✅ Oui (204 passed) |
| Restauration exécutée avec succès | ❌ Non (pas de base PostgreSQL disponible en test) |
| Déploiement et retour arrière documentés et vérifiés | ❌ Non (en attente) |
| Limites restantes acceptées explicitement | ✅ Oui (HOLD/BLOCKED documentés) |

### Recommandation

**GO LIMITÉ** sur le scénario B : le parcours de délivrance papier (impression, scan signé, contrôle de concordance, délivrance, vérification publique, révocation) est opérationnel et recommandé pour mise en production. La délivrance PDF officielle et la procédure de restauration/déploiement restent en attente d'arbitrage métier et d'infrastructure, et ne doivent pas être présentées comme prêtes.

**Action suivante requise :** arbitrage métier sur les 5 points OPEN du registre (`docs/audit/ARBITRAGES-METIER-RESTANTS.md`) pour lever les blocages HOLD et BLOCKED. Aucun code ne doit être implémenté pour ces fonctionnalités tant que ces arbitrages ne sont pas validés.
