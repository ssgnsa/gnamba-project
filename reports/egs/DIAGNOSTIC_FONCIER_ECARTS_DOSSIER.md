# Diagnostic — Écart dossier Foncier (1er clic / 2ème clic)

Date : 2026-11-02
Branche : fix/foncier-ecarts-dossier

## Symptôme

"1er clic = erreur, 2ème clic = existe déjà" sur la génération d'attestation coutumière depuis la modale `AttestationModal`.

## Root cause (identifié)

Dans `src/components/foncier/parts/AttestationModal.tsx`, `generateAttestation()` (ligne 234) appelle `onSuccess()` en cas de succès mais n'appelle **jamais `onClose()`**.

Conséquence :
1. Le 1er clic sur "Générer & Imprimer" réussit côté backend (2xx / attestation créée), mais la modale **reste ouverte** avec le formulaire pré-rempli. L'utilisateur ne voit aucun retour de succès ni de fermeture : perçu comme une "erreur" ou un silence.
2. Le 2ème clic tente de créer une seconde attestation sur la même version du lot. Le backend lève `IntegrityError` → HTTP 409 `Une attestation active existe déjà pour cette version du lot`.

Ce n'est donc **pas** un problème de double-commit backend (le `catch (IntegrityError)` de `create_attestation` renvoie bien un 409 sans commit partiel, voir `router.py:508-509`), ni une course côté base. C'est un problème d'orchestration frontale : succès non clos + pas de reset de formulaire.

## Preuves dans le code

- `AttestationModal.tsx:221` : l'appel RPC passe par `foncierRepository.createAttestation` (le `onSuccess` de `useAttestations` n'est **pas** utilisé).
- `AttestationModal.tsx:234-235` : `onSuccess(); setSaving(false);` — **`onClose()` absent**.
- `Foncier.tsx:525-530` : le `onClose` passé à `AttestationModal` ferme la modale et réinitialise `attestationLot`/`attestationForm`/`attestationError`. Comme il n'est jamais appelé, aucun de ces resets n'a lieu.
- `LotissementFormModal.tsx:74-75` et `ConfigModal.tsx:162-163` appellent bien `onSuccess(); onClose();` en cas de succès — `AttestationModal` est le seul à oublier `onClose()`.

## Inventaire des routes attestations (contrat backend)

| Méthode | Chemin | Rôle | Transition statut |
|---|---|---|---|
| POST | `/foncier/attestations` | Créer | — (crée en `brouillon`) |
| GET | `/foncier/attestations` | Recherche paginée | filtres `lot_id`, `statut` |
| GET | `/foncier/attestations/{id}` | Détail avec relations | — |
| PATCH | `/foncier/attestations/{id}` | MAJ (brouillon seulement) | — |
| POST | `/foncier/attestations/{id}/submit` | Soumettre | `brouillon` → `soumis` |
| POST | `/foncier/attestations/{id}/validate` | Valider | `soumis` → `valide` |
| POST | `/foncier/attestations/{id}/scan` | Scanner | `valide` → `archive` |
| GET | `/foncier/attestations/{id}/pdf` | Télécharger PDF (Blob) | requiert `valide` |
| POST | `/foncier/attestations/{id}/generate-pdf` | Générer PDF | 501 (HOLD, arbitrage métier) |
| POST | `/foncier/attestations/{id}/print` | Imprimer | — |
| POST | `/foncier/attestations/{id}/deliver` | Livrer | `valide` → `delivre` |
| POST | `/foncier/attestations/{id}/revoke` | Révoquer | — |

Statuts attestation (contrainte DB) : `brouillon`, `soumis`, `valide`, `archive`, `revoque`, `expire`, `annule`.

## Analyse d'impact

- Correction frontale uniquement : ajouter `onClose()` après `onSuccess()` dans `generateAttestation`, et idéalement restructurer le `try/catch/finally` pour fermer la modale **après** le succès confirmé et réinitialiser le formulaire.
- Aucun changement de structure de composant requis.
- Backend en lecture seule : aucune migration, aucun changement de route, aucun changement de schéma.

## Décision

Passer directement à Block 1 (anti-double-click / états de soumission) qui inclut cette correction (`onClose` + garde `isSubmitting` + bouton désactivé + spinner), puis Block 2, 3, 4.

## Suivi

- Un commit par bloc.
- Arrêt pour validation à la fin de chaque bloc.
- `npx tsc --noEmit` + `npm run build` à vérifier après chaque bloc.
