# Guide Complet du Système d'Attestation de Propriété Villageoise

## 📋 Vue d'Ensemble

Le système d'attestation de propriété villageoise est une solution complète de gestion foncière qui combine :

- **Sécurité cryptographique** (hash SHA-256, signatures numériques)
- **Vérification publique en ligne** (QR code + page web dédiée)
- **Numérotation robuste** (séquence SQL atomique)
- **Journal d'audit complet** (traçabilité des opérations)
- **Design professionnel** (template A4 optimisé pour impression)

---

## 🏗️ Architecture Technique

### 1. Base de Données (PostgreSQL via Supabase)

#### Séquence de Numérotation

```sql
CREATE SEQUENCE IF NOT EXISTS public.attestation_seq
  AS bigint
  INCREMENT BY 1
  MINVALUE 1
  START WITH 1
  CACHE 1;
```

**Pourquoi une séquence SQL ?**

- ✅ Garantit l'unicité absolue (pas de collisions)
- ✅ Fonctionne en environnement multi-utilisateurs
- ✅ Persistante et fiable (même après redémarrage)
- ✅ Performance optimale (pas de `SELECT COUNT(*)`)

#### Fonction de Génération de Référence

```sql
CREATE OR REPLACE FUNCTION public.generate_attestation_reference(
  p_sequence bigint,
  p_prefix text DEFAULT 'APV'
)
RETURNS text
```

**Format de référence :** `APV-YYYYMMDD-XXXXXXX`

- `APV` = Attestation de Propriété Villageoise
- `YYYYMMDD` = Date du jour
- `XXXXXXX` = Numéro séquentiel sur 7 chiffres

#### Fonction de Génération de Numéro de Contrôle

```sql
CREATE OR REPLACE FUNCTION public.generate_attestation_control_number(p_sequence bigint)
RETURNS text
```

**Algorithme :** 10 chiffres + clé de Luhn (comme les cartes bancaires)

- Exemple : `00000000017` (10 chiffres + checksum)

---

### 2. Fonction Atomique de Création

```sql
CREATE OR REPLACE FUNCTION public.create_foncier_attestation_atomic(...)
```

**Garanties offertes :**

1. **Atomicité** : Tout ou rien (ACID)
2. **Isolation** : Pas d'interférences entre créations simultanées
3. **Unicité** : Référence et control_number uniques
4. **Traçabilité** : Archive automatique de l'ancienne attestation lors d'une réémission

**Étapes de la transaction :**

1. Vérification des permissions (admin/gestionnaire/gerant/secretaire uniquement)
2. Verrouillage du lot (`FOR UPDATE`)
3. Récupération du prochain numéro de séquence
4. Génération de la référence et du control_number
5. Construction du payload JSON complet
6. Calcul du hash SHA-256
7. Insertion de l'attestation
8. Insertion des témoins
9. Archive de l'ancienne attestation (si réémission)

---

### 3. Template d'Impression (HTML/CSS)

#### Structure du Document A4

```
┌─────────────────────────────────────────────┐
│  BANDEAU DE SÉCURITÉ (3 couleurs CI)        │
├─────────────────────────────────────────────┤
│                                             │
│  EN-TÊTE (3 colonnes)                       │
│  - Gauche: Région/Département/Village       │
│  - Centre: Logo                             │
│  - Droite: République + Devise              │
│                                             │
│  TITRE PRINCIPAL (encadré)                  │
│  "ATTESTATION DE PROPRIÉTÉ VILLAGEOISE"     │
│                                             │
│  MÉTADONNÉES (3 boxes)                      │
│  - Référence officielle                     │
│  - Numéro de contrôle                       │
│  - Registre                                 │
│                                             │
│  INTRODUCTION JURIDIQUE                     │
│                                             │
│  SECTION 1: Identité du bénéficiaire        │
│  (2 colonnes)                               │
│                                             │
│  SECTION 2: Informations sur la parcelle    │
│  (2 colonnes)                               │
│                                             │
│  SECTION 3: Cession (si applicable)         │
│                                             │
│  NOTE LÉGALE (encadré vert)                 │
│                                             │
│  ZONE DE SIGNATURE                          │
│  - Chef du village                          │
│  - Signature manuscrite                     │
│  - Cachet                                   │
│                                             │
│  BANDE MICROTEXT                           │
│  (texte minuscule anti-contrefaçon)         │
│                                             │
│  PIED DE PAGE                               │
│  - Métadonnées (réf, contrôle, registre)    │
│  - Hash SHA-256                             │
│  - QR Code de vérification                  │
│                                             │
│  FILIGRANE (en arrière-plan)                │
│  Référence + Hash tronqué                   │
└─────────────────────────────────────────────┘
```

#### Éléments de Sécurité Visuels

1. **Bandeau tricolore** (Orange/Blanc/Vert) - Rappel des couleurs ivoiriennes
2. **Double bordure** - Cadre interne + cadre externe
3. **Filigrane dynamique** - Référence + hash tronqué en diagonale
4. **Microtext band** - Texte minuscule (6.6pt) difficile à reproduire
5. **QR Code** - Lien vers la page de vérification
6. **Hash SHA-256** - Empreinte cryptographique complète

---

### 4. Système de Vérification

#### Page Publique de Vérification

URL : `/verification-attestation?ref=XXX&control=YYY&hash=ZZZ`

**Affichage selon le résultat :**

- ✅ **Document authentique** : Badge vert + toutes les données
- ❌ **Document non reconnu** : Badge rouge + avertissement
- ⚠️ **Vérification incomplète** : Badge orange + données partielles

**Données affichées :**

- Identité du bénéficiaire
- Informations sur la parcelle
- Limites et coordonnées GPS
- Témoins
- Hash SHA-256 complet
- Statut de validation

---

### 5. Journal d'Audit

#### Table `foncier_audit`

```sql
CREATE TABLE public.foncier_audit (
  id uuid PRIMARY KEY,
  parcelle_id uuid REFERENCES foncier_lots(id),
  action text, -- CREATION, MODIFICATION, SUPPRESSION, VALIDATION, etc.
  utilisateur_nom text,
  date_action timestamptz,
  details jsonb
);
```

**Actions tracées :**

- `CREATION` - Création d'un lot
- `MODIFICATION` - Modification d'un lot
- `SUPPRESSION` - Suppression d'un lot
- `ARCHIVE` - Archivage d'un lot
- `RESTORE` - Restauration d'un lot archivé
- `SOUMISSION` - Soumission d'une attestation
- `SOUMISSION_CHEF` - Soumission au chef
- `VALIDATION` - Validation par le chef
- `VALIDATION_CHEF` - Validation finale
- `SCAN_ORIGINAL` - Scan du document original
- `ARCHIVAGE_ATTESTATION` - Archivage d'une attestation
- `REEMISSION_CESSION` - Réémission pour cession
- `IMPRESSION` - Impression du document

---

## 🔒 Sécurité et Anti-Fraude

### 1. Hash SHA-256

Chaque attestation contient un hash SHA-256 calculé sur :

- Toutes les données de l'attestation
- La référence
- Le numéro de contrôle
- La date d'établissement
- Les coordonnées GPS
- Les témoins
- etc.

**Vérification :**

```javascript
const hash = await sha256Hex(JSON.stringify(payload));
// Comparer avec data.hash_sha256
```

### 2. Signature Numérique (Optionnelle)

Via Edge Function `attestation-sign` :

- Signe le payload avec une clé privée serveur
- Ajoute une couche supplémentaire de vérification
- Permet de valider que le document vient bien du système officiel

### 3. QR Code Dynamique

Le QR code contient l'URL complète de vérification :

```
https://portal.gnambaservices.ci/verification-attestation?ref=APV-20260501-0000001&control=00000000017&hash=abc123...
```

**Avantages :**

- ✅ Vérification instantanée avec smartphone
- ✅ Pas besoin d'application dédiée
- ✅ URL unique et infalsifiable
- ✅ Redirection vers la page officielle

### 4. Numéro de Contrôle avec Clé de Luhn

Comme les cartes bancaires, le numéro de contrôle inclut une clé de vérification :

- 10 chiffres + 1 chiffre de contrôle
- Algorithme de Luhn (modulo 10)
- Détecte les erreurs de saisie

---

## 📊 Workflow Complet

### Création d'une Attestation

```
1. Utilisateur remplit le formulaire
   ↓
2. Validation des données (Zod)
   ↓
3. Vérification des doublons
   ↓
4. Appel à `create_foncier_attestation_atomic()`
   ↓
5. Transaction SQL :
   - Verrouillage du lot
   - Récupération séquence
   - Génération référence + control_number
   - Calcul hash SHA-256
   - Insertion attestation
   - Insertion témoins
   ↓
6. Signature numérique (optionnelle)
   ↓
7. Génération QR Code
   ↓
8. Impression du document
   ↓
9. Journalisation audit
```

### Vérification d'une Attestation

```
1. Scan du QR Code
   ↓
2. Redirection vers /verification-attestation
   ↓
3. Extraction des paramètres (ref, control, hash)
   ↓
4. Appel à l'Edge Function `attestation-verify`
   ↓
5. Recherche en base de données
   ↓
6. Vérification :
   - Référence existe
   - Control number valide (Luhn)
   - Hash correspond
   - Signature valide (si présente)
   ↓
7. Affichage du résultat
   - ✅ Document authentique
   - ❌ Document non reconnu
   - ⚠️ Vérification incomplète
```

---

## 🎨 Design et Impression

### Optimisation A4

- Marges précises (16mm haut, 15mm côtés, 12mm bas)
- Police Times New Roman (sérieuse, lisible)
- Couleurs institutionnelles (vert foncé, orange, gris)
- Hiérarchie visuelle claire
- Espacement aéré

### Impression Parfaite

```css
@page {
  size: A4;
  margin: 0; /* Géré par .sheet */
}

@media print {
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
```

### Rendu Puppeteer (Serveur)

Pour génération PDF côté serveur :

```javascript
await page.pdf({
  format: "A4",
  printBackground: true,
  margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
});
```

---

## 🚀 Déploiement et Maintenance

### Prérequis

- PostgreSQL 13+ (pour les séquences)
- Supabase (pour l'authentification et le stockage)
- Node.js 18+ (pour les Edge Functions)

### Migrations

Toutes les migrations sont dans `supabase/migrations/` :

- `20260430090000_create_atomic_attestation_generation.sql` - Fonction atomique
- `20260326000000_create_foncier_attestations_tables.sql` - Tables de base
- `20260401080000_fix_foncier_attestations.sql` - Corrections

### Monitoring

- Vérifier les logs Supabase
- Surveiller les erreurs 400/401/429
- Contrôler l'utilisation de la séquence
- Auditer les créations d'attestations

---

## 📝 Bonnes Pratiques

### Pour les Utilisateurs

1. **Toujours vérifier** une attestation avant toute transaction
2. **Scanner le QR Code** avec un smartphone
3. **Comparer le hash** affiché avec celui du document
4. **Contacter la chefferie** en cas de doute

### Pour les Administrateurs

1. **Ne jamais modifier** une attestation validée
2. **Toujours archiver** l'ancienne version lors d'une réémission
3. **Vérifier les logs** d'audit régulièrement
4. **Sauvegarder** la base de données quotidiennement

### Pour les Développeurs

1. **Respecter l'atomicité** des transactions
2. **Valider les données** côté serveur (pas seulement côté client)
3. **Utiliser les types TypeScript** pour la sécurité des types
4. **Tester les cas limites** (doublons, conflits, erreurs réseau)

---

## 🔧 Dépannage

### Erreur "Référence déjà utilisée"

- Cause : Collision de référence (très rare avec séquence SQL)
- Solution : Régénérer la référence avec `generateFoncierReference()`

### Erreur "Numéro de contrôle invalide"

- Cause : Mauvaise saisie ou falsification
- Solution : Vérifier avec l'algorithme de Luhn

### Erreur "Hash invalide"

- Cause : Document modifié après génération
- Solution : Rejeter le document, demander une nouvelle attestation

### Erreur "Document non reconnu"

- Cause : Référence inexistante en base
- Solution : Contacter la chefferie pour vérification manuelle

---

## 📞 Support

Pour toute question ou problème :

- **Documentation technique** : `AGENTS.md`
- **Audit complet** : `AUDIT_COMPLET_EGS_2026-04-05.md`
- **Guide de déploiement** : `README.md`

---

## ✅ Checklist de Validation

Avant de délivrer une attestation :

- [ ] Toutes les données sont complètes
- [ ] La référence est unique
- [ ] Le numéro de contrôle est valide (Luhn)
- [ ] Le hash SHA-256 est généré
- [ ] Le QR code pointe vers la bonne URL
- [ ] La signature du chef est présente
- [ ] Le cachet est apposé
- [ ] L'audit est journalisé
- [ ] Le document est imprimé en A4
- [ ] La vérification en ligne fonctionne

---

**Document généré le 01/05/2026**  
**Version 2.0 - Système d'Attestation de Propriété Villageoise**
