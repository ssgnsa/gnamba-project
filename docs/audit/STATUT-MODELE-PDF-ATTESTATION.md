# Statut du modèle PDF d'attestation foncière — EGS / Gnamba Services

**Statut : en attente d'approbation officielle (B3) — DÉLIVRANCE RÉELLE BLOQUÉE.**

Ce document consigne l'état de la fonctionnalité de génération/téléchargement de PDF d'attestation. Il ne constitue pas un modèle officiel approuvé et ne doit pas être utilisé pour produire des documents à valeur probante.

## État technique actuel (backend)

| Fonctionnalité | Route réelle | État | Message retourné |
|---|---|---|---|
| Génération PDF d'attestation | `POST /foncier/attestations/{attestation_id}/generate-pdf` | `501 Not Implemented` | "Génération PDF non implémentée" |
| Téléchargement PDF d'attestation | `GET /foncier/attestations/{attestation_id}/pdf` | `501 Not Implemented` | "Téléchargement PDF non implémenté" |

Aucun contenu juridique, aucune signature, aucun cachet n'est inventé ni généré. Conserver le `501` est le comportement sûr retenu tant que le modèle officiel n'est pas validé.

## Prérequis à la délivrance réelle (liste non exhaustive)

Avant de lever le blocage, les éléments suivants doivent être fournis et validés par l'autorité émettrice :

1. **Modèle officiel d'attestation** : mise en page, mentions obligatoires, formules légales, cadre légal applicable.
2. **Autorité émettrice** : identité, rôle, signature (numérique ou scannée) autorisée, cachet officiel.
3. **Mentions exigibles** : référence, date d'établissement, date d'expiration, statut, désignation du lot, identité du propriétaire (conformément aux règles de confidentialité publiques — voir ci-dessous).
4. **Circuit de signature et d'approbation** : qui peut générer, qui valide, qui délivre, traçabilité de chaque acte.
5. **Contrôle d'accès avant génération/téléchargement** : permissions par rôle et par village, refus par défaut pour les rôles non autorisés.
6. **Confidentialité publique** : aucun nom, prénom, téléphone, email, pièce d'identité, signature, scan ou PDF nominatif ne doit figurer dans une réponse publique non authentifiée. La vérification publique retourne uniquement un résultat minimal (référence, statut, dates, lot, village, `proprietaire={}`).

## Règles de confidentialité applicables au PDF (décision validée)

- Le nom et le prénom du propriétaire ne doivent PAS être exposés publiquement (lien/QR public).
- Sont également exclus : téléphone, adresse personnelle, pièce d'identité, signature, justificatifs, scan signé, PDF nominatif.
- La réponse publique de vérification est une liste blanche uniquement : référence, émetteur, date d'édition, statut.

## Conséquence

Tant que le modèle officiel et l'autorité émettrice n'ont pas été expressément validés :
- la génération et le téléchargement de PDF d'attestation restent en `501 Not Implemented` ;
- aucune délivrance réelle d'attestation n'est autorisée ;
- aucun squelette de PDF ni contenu juridique n'est produit.

Ce document est à présenter à l'arbitrage métier avant toute implémentation.
