# Brainstorming templates — Attestations foncières (A4)

## Contexte

Objectif de design : une attestation **belle, élégante, professionnelle, sobre** et qui inspire l’autorité, avec utilisation optimale de la page A4 et sécurité par **QR code uniquement**.

## Principes retenus

- Sobriété institutionnelle avant l’ornement.
- Hiérarchie visuelle nette (titre, métadonnées, contenu juridique, signatures, sécurité).
- Lisibilité immédiate à l’impression (A4 standard, noir/blanc + accents maîtrisés).
- Vérifiabilité évidente (QR + numéro de contrôle + URL + hash).

## Pistes de templates

### Option A — “Institutionnel sobre” (retenue)

- Double cadre fin, trame discrète, en-tête équilibré.
- Bloc titre central fort + métadonnées en grille.
- Sections en cartes structurées, signatures sur 2 blocs.
- Footer sécurité compact (QR + contrôle + hash + URL).
- **Avantages** : autorité, stabilité, excellente lisibilité, faible risque d’effet “chargé”.

### Option A2 — “Institutionnel respirant” (itération recommandée)

- Même ADN institutionnel que A, mais avec:
- En-tête simplifié.
- Corps en **2 colonnes intelligentes**:
- Colonne gauche: contenu juridique, identité, cession, parcelle, validation.
- Colonne droite: références administratives + sécurité.
- Bloc QR dédié plus visible, sans code-barres.
- **Avantages** : moins de surcharge en haut, meilleure occupation verticale A4, lecture plus fluide.

### Option B — “Notarial premium”

- Forte présence d’ornements, calligraphie, filigrane plus visible.
- Mise en scène “cérémonielle” du document.
- **Avantages** : prestige visuel.
- **Limites** : risque de surcharge, moins sobre, impression variable selon imprimante.

### Option C — “Minimal administratif”

- Design ultra simple, monochrome, sans effets.
- Priorité absolue au texte.
- **Avantages** : robustesse extrême, impression économique.
- **Limites** : manque de présence institutionnelle.

## Choix final

**Option A2 — Institutionnel respirant**, car meilleur équilibre entre :

- Autorité visuelle,
- Lisibilité juridique,
- Sobriété professionnelle,
- Compatibilité impression A4,
- Mise en valeur du QR sécurisé.
- Réduction nette de la surcharge du haut de page.

## Ajustements retenus (version finale)

- En-tête simplifié et compact (moins de lignes, logo recentré, contraste maîtrisé).
- Titre officiel conservé, mais visuellement allégé pour éviter l’effet “bloc lourd” en haut.
- Répartition verticale optimisée :
- Colonne gauche prioritaire pour le fond juridique et les signatures.
- Colonne droite dédiée aux références + sécurité, avec panneau sécurité ancré en bas.
- Espacements harmonisés pour exploiter toute la hauteur A4 sans “trous visuels”.
- Filigrane discret conservé pour l’autorité, sans gêner la lecture.
- Sécurité QR-only confirmée : QR + numéro de contrôle + hash + URL (aucun code-barres).

## Grille A4 finale (logique)

- Bandeau institutionnel + double cadre officiel.
- En-tête tripartite allégé (République / emblème / localisation).
- Titre principal centré et sobre.
- **Corps principal en 2 colonnes** pour utiliser toute la hauteur A4:
- Colonne gauche: base légale, identité, cession (si applicable), parcelle, signatures.
- Colonne droite: références administratives et sécurité.
- Bloc sécurité QR dédié (QR + N° contrôle + hash + URL).
- Mention légale en pied de page.

## Décisions de contenu

- **Suppression du code-barres**: seules les preuves QR sont conservées.
- Numéro de contrôle maintenu en texte lisible pour vérification manuelle.
- Hash SHA-256 et URL de vérification conservés pour l’authenticité.
