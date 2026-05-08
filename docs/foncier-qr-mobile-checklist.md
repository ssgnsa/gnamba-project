# Checklist manuelle guidée — Scan QR mobile (Attestations foncières)

## Objectif

Valider de bout en bout le nouveau système QR des attestations foncières : génération, impression, scan mobile réel, vérification publique et robustesse.

## Prérequis

- Environnement applicatif accessible en HTTPS (obligatoire pour scan/lien mobile fiable).
- Module `Foncier` opérationnel avec au moins 1 lot actif prêt à attestation.
- Un smartphone Android + un iPhone (recommandé) avec appareil photo natif.
- Connexion Internet active sur le téléphone (4G/5G ou Wi‑Fi).

## Données de test

- Lot `A` : lot standard (non cession).
- Lot `B` : lot cession (si disponible).
- Utiliser des attestations nouvelles (et au moins une réimpression).

## Procédure guidée

### 1) Génération attestation (nominal)

- [ ] Ouvrir `Foncier` puis créer une attestation pour le lot `A`.
- [ ] Vérifier que le document imprimé n’affiche plus de code-barres.
- [ ] Vérifier que le document affiche un QR code net + numéro de contrôle.
- [ ] Vérifier la présence d’une URL de vérification en pied de page.

**Résultat attendu**

- QR visible, propre, sans chevauchement visuel.
- Aucune zone “code-barres” sur l’attestation officielle.

### 2) Scan réel Android

- [ ] Scanner le QR avec l’appareil photo Android natif.
- [ ] Ouvrir le lien proposé.
- [ ] Vérifier que la page de vérification se charge sans erreur.
- [ ] Vérifier le statut retourné (`valide` ou `soumis` selon workflow).
- [ ] Vérifier présence des champs : référence, contrôle, hash, lot.

**Résultat attendu**

- Redirection réussie vers `/verification-attestation?...`.
- Données cohérentes avec l’attestation imprimée.

### 3) Scan réel iPhone

- [ ] Scanner le même QR avec l’appareil photo iOS natif.
- [ ] Ouvrir le lien détecté.
- [ ] Contrôler les mêmes éléments que sur Android.

**Résultat attendu**

- Même comportement que Android, sans erreur d’affichage.

### 4) Test réimpression

- [ ] Réimprimer une attestation existante depuis le module.
- [ ] Scanner le QR de la version réimprimée.
- [ ] Vérifier que la vérification renvoie bien la bonne référence.

**Résultat attendu**

- QR fonctionnel aussi en réimpression.

### 5) Test de robustesse URL

- [ ] Copier l’URL du QR et ouvrir dans un navigateur desktop.
- [ ] Vérifier que les paramètres `ref`, `control`, `hash` sont présents.
- [ ] Supprimer volontairement `hash` puis recharger la page.
- [ ] Modifier volontairement `hash` (1 caractère) puis recharger.

**Résultat attendu**

- Sans `hash` : la vérification reste possible via `ref/control`.
- `hash` modifié : statut de vérification dégradé (non vérifié/invalide/introuvable selon cas).

### 6) Cas cession (si lot B disponible)

- [ ] Générer une attestation de cession.
- [ ] Scanner le QR.
- [ ] Vérifier que la page se charge et que la référence est correcte.

**Résultat attendu**

- Flux QR identique et stable pour les attestations de cession.

## Contrôles UX/UI (esthétique sobre et pro)

- [ ] QR bien cadré, non pixelisé, marge blanche suffisante.
- [ ] Footer sécurité lisible (contrôle + hash + URL).
- [ ] Aucune surcharge visuelle ou bloc de sécurité décalé.
- [ ] Affichage cohérent sur impression A4 (pas de coupure).

## Critères d’acceptation (Go/No-Go)

- [ ] 100% des scans Android/iPhone aboutissent à une page de vérification.
- [ ] 0 présence de code-barres sur l’attestation officielle.
- [ ] Les informations critiques correspondent (référence, contrôle, hash).
- [ ] Réimpression validée par scan réel.
- [ ] Aucun bug bloquant UI/UX détecté sur les écrans de vérification.

## Journal de recette (à remplir)

- Date :
- Environnement (Cloud/Local) :
- Testeur :
- Appareil Android :
- Appareil iPhone :
- Résultat global : ✅ GO / ❌ NO-GO
- Anomalies relevées :
