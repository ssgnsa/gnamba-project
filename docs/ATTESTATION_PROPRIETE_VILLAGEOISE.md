# Attestation de Propriété Villageoise - Guide Complet

## Vue d'ensemble

Le système d'attestation de propriété villageoise est une solution complète pour générer, vérifier et sécuriser les documents fonciers coutumiers. Il combine :

- **Génération atomique** avec séquence SQL pour éviter les doublons
- **Sécurité cryptographique** avec hash SHA-256 et signature numérique
- **Vérification publique** via QR code et API
- **Template professionnel** optimisé pour l'impression A4

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FONCIER.TSX (Dashboard)                   │
│  - Formulaire d'attestation                                  │
│  - Gestion des lots et propriétaires                         │
│  - Workflow de validation                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          CREATE_FONCIER_ATTESTATION_ATOMIC (SQL)             │
│  - Séquence unique (attestation_seq)                         │
│  - Hash SHA-256                                              │
│  - Numéro de contrôle (Luhn)                                 │
│  - QR Payload                                                │
│  - Archivage automatique de l'ancienne version               │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────────┐  ┌──────────────────────┐
│   PRINT.TS          │  │  ATTESTATION-VERIFY  │
│  (Template A4)      │  │  (Edge Function)     │
│                     │  │                      │
│ - buildAttestation  │  │ - Vérification hash  │
│   CoutumiereHTML    │  │ - Validation signature│
│ - Impression PDF    │  │ - Rate limiting      │
└─────────┬───────────┘  └──────────┬───────────┘
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│              PUBLICVERIFICATION.TSX (Page publique)          │
│  - Affiche ✅ DOCUMENT AUTHENTIQUE ou ❌ NON RECONNU         │
│  - Montre tous les détails (bénéficiaire, parcelle, témoins) │
│  - Accessible via QR code                                    │
└─────────────────────────────────────────────────────────────┘
```

## Flux de génération

### 1. Création dans le Dashboard Foncier

```typescript
// Dans Foncier.tsx, lors de la soumission du formulaire
const handleGenerateAttestation = async () => {
  // 1. Construire les données de l'attestation
  const attestationData = {
    lot_id: selectedLot.id,
    attestation_type: "standard", // ou 'cession'
    mode_acquisition: form.mode_acquisition,
    historique_possession: form.historique_possession,
    // ... autres champs
  };

  // 2. Appeler la fonction atomique
  const { data, error } = await supabase.rpc(
    "create_foncier_attestation_atomic",
    {
      p_lot_id: attestationData.lot_id,
      p_attestation_type: attestationData.attestation_type,
      // ... tous les paramètres
    },
  );

  if (error) throw error;

  // 3. data contient : id, reference, control_number, hash_sha256, qr_payload
  // 4. Générer le QR code
  const qrDataUrl = await buildQrDataUrl(data.qr_payload);

  // 5. Imprimer l'attestation
  printAttestationCoutumiere({
    ...printData,
    qrDataUrl,
    hash_sha256: data.hash_sha256,
    control_number: data.control_number,
  });
};
```

### 2. Fonction SQL Atomique

La fonction `create_foncier_attestation_atomic` garantit :

```sql
-- 1. Utilise une SÉQUENCE pour la référence unique
v_sequence := nextval('public.attestation_seq');
v_reference := public.generate_attestation_reference(v_sequence);
-- Résultat: APV-20260430-0000001

-- 2. Génère un numéro de contrôle avec checksum Luhn
v_control_number := public.generate_attestation_control_number(v_sequence);
-- Résultat: 00000000017 (10 chiffres + 1 chiffre de contrôle)

-- 3. Calcule le hash SHA-256 du payload
v_hash := encode(digest(v_payload_core::text, 'sha256'), 'hex');

-- 4. Insère l'attestation ET les témoins dans une TRANSACTION
INSERT INTO foncier_attestations (...) VALUES (...);
INSERT INTO foncier_attestation_temoins (...) SELECT ...;

-- 5. Archive l'ancienne attestation si réémission
UPDATE foncier_attestations
SET deleted_at = now(), statut = 'archive'
WHERE id = p_previous_attestation_id;
```

### 3. Template d'impression

Deux templates sont disponibles :

#### Template principal (`print.ts`)

- Design moderne avec filigrane dynamique
- Bandes de sécurité colorées (orange, blanc, vert)
- Cadre double bordure
- QR code et hash SHA-256
- Signature et cachet

#### Template simplifié (`printAttestationVillageoise.ts`)

- Style traditionnel administratif
- En-tête en 3 colonnes (Région, Logo, République)
- Titre encadré
- Sections claires (Identité, Parcelle)
- Footer de sécurité avec QR code

## Flux de vérification

### 1. Scan du QR code

Le QR code contient une URL vers la page de vérification :

```
https://portal.gnambaservices.ci/verification-attestation?ref=APV-20260430-0000001&control=00000000017&hash=abc123...
```

### 2. Page de vérification publique

```typescript
// PublicVerification.tsx
const lookup = {
  ref: "APV-20260430-0000001",
  control: "00000000017",
  hash: "abc123...",
};

const result = await fetchAttestationVerification(lookup);

// Affiche :
// ✅ DOCUMENT AUTHENTIQUE (si hash_valide && signature_valide)
// ❌ DOCUMENT NON RECONNU (si introuvable)
// ⚠️ VÉRIFICATION INCOMPLÈTE (si hash ou signature invalide)
```

### 3. Edge Function de vérification

```typescript
// supabase/functions/attestation-verify/index.ts
// 1. Recherche l'attestation par ref, control_number ou hash
// 2. Vérifie le hash SHA-256
// 3. Vérifie la signature numérique (si clé publique configurée)
// 4. Retourne toutes les informations publiques
// 5. Rate limiting : 10 requêtes/minute par IP
```

## Sécurité

### 1. Numérotation unique

- **Séquence SQL** : Garantit l'unicité même en cas de concurrence
- **Index unique** : `reference`, `control_number`, `reference_sequence`
- **Format** : `APV-YYYYMMDD-NNNNNNN` (7 chiffres)

### 2. Hash cryptographique

- **SHA-256** du payload JSON complet
- **Vérifiable** par n'importe qui
- **Infalsifiable** sans accès à la base de données

### 3. Numéro de contrôle

- **Checksum Luhn** : Détecte les erreurs de saisie
- **11 chiffres** : 10 chiffres + 1 chiffre de contrôle
- **Validation** : `(somme * 9) % 10 == dernier_chiffre`

### 4. Signature numérique (optionnelle)

- **RSA-PSS** ou **RSASSA-PKCS1-v1_5**
- **Clé privée** : Serveur uniquement
- **Clé publique** : Edge Function pour vérification

### 5. Rate limiting

- **10 requêtes/minute** par IP
- **Protection** contre le scraping massif
- **Headers** : `X-RateLimit-*` pour le suivi

## Intégration dans le code existant

### Ajouter le template simplifié

```typescript
// Dans Foncier.tsx, importer le nouveau template
import {
  buildAttestationVillageoiseHTML,
  printAttestationVillageoise,
} from "../utils/printAttestationVillageoise";

// Créer une fonction wrapper
const printAttestationStyleVillageois = (
  data: FoncierAttestation,
  lot: FoncierLot,
  config: FoncierConfigMap,
) => {
  const villageName = config.village || lot.village || "";
  const villageNom = villageName
    .replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, "")
    .trim();

  const attestationData: AttestationVillageoiseData = {
    region: config.region || lot.region || "",
    departement: config.departement || lot.departement || "",
    village: villageNom,
    logoUrl: config.logo_url || settings.logoUrl,

    nom: lot.proprietaire_nom || "",
    prenom: lot.proprietaire_prenom || "",
    naissance: lot.proprietaire_naissance_date || "",
    lieuNaissance: lot.proprietaire_naissance_lieu || "",
    telephone: lot.proprietaire_telephone || "",
    cni: lot.proprietaire_cni_numero || "",
    profession: lot.proprietaire_profession || "",
    domicile: form.domicile || "",

    lot: lot.numero_lot || "",
    superficie: `${lot.superficie?.toLocaleString("fr-FR") || 0} m²`,
    localisation:
      [lot.nom_lotissement, lot.quartier].filter(Boolean).join(" • ") ||
      villageNom,
    mode: form.mode_acquisition || "",

    date: formatDateLong(data.date_etablissement || new Date().toISOString()),
    chef: config.chef_village || lot.chef_village || "",
    signatureUrl: data.signatureUrl || "",
    cachetUrl: data.cachetUrl || "",

    ref: data.reference || "",
    controle: data.control_number || "",
    hash: data.hash_sha256 || "",
    qrCodeUrl: qrDataUrl,
  };

  printAttestationVillageoise(attestationData);
};
```

### Utiliser dans le workflow

```typescript
// Dans la modale d'attestation, ajouter un bouton
<Button
  onClick={() => printAttestationStyleVillageois(attestation, lot, config)}
  variant="outline"
>
  <Printer className="w-4 h-4 mr-2" />
  Imprimer (Style Villageois)
</Button>
```

## Bonnes pratiques

### 1. Toujours utiliser la fonction atomique

❌ **NE PAS FAIRE** :

```typescript
// Génération manuelle = risque de doublons
const reference = `APV-${dateFormat}-${count + 1}`;
await supabase.from('foncier_attestations').insert({ reference, ... });
```

✅ **FAIRE** :

```typescript
// La fonction atomique gère tout
const { data } = await supabase.rpc("create_foncier_attestation_atomic", {
  p_lot_id: lotId,
  // ...
});
```

### 2. Vérifier le hash après génération

```typescript
const computedHash = await sha256Hex(JSON.stringify(payload));
if (computedHash !== data.hash_sha256) {
  console.error("Hash mismatch!");
}
```

### 3. Archiver avant de réémettre

```typescript
// La fonction atomique le fait automatiquement
// Mais on peut aussi archiver manuellement
await supabase.rpc("revoke_foncier_attestation", {
  p_attestation_id: oldId,
  p_reason: "réémission",
});
```

### 4. Journaliser les impressions

```typescript
await logFoncierAudit(supabase, {
  parcelle_id: lotId,
  action: "IMPRESSION",
  details: {
    reference: data.reference,
    template: "villageois",
  },
});
```

## Dépannage

### "Attestation introuvable"

- Vérifier que l'attestation n'est pas archivée (`deleted_at IS NULL`)
- Vérifier le statut (`statut != 'archive'`)
- Utiliser le bon paramètre (ref, control, ou hash)

### "Hash invalide"

- Le payload a-t-il été modifié après génération ?
- La fonction `computePayloadHash` exclut-elle bien `hash_sha256` ?

### "Trop de requêtes"

- Rate limiting : attendre 1 minute
- Vérifier les headers `X-RateLimit-*`

### Erreur de séquence

```sql
-- Vérifier la séquence
SELECT last_value, is_called FROM public.attestation_seq;

-- Réinitialiser (si nécessaire)
SELECT setval('public.attestation_seq', 1000, true);
```

## Références

- **Migration principale** : `20260326000000_create_foncier_attestations_tables.sql`
- **Fonction atomique** : `20260430090000_create_atomic_attestation_generation.sql`
- **Template principal** : `src/utils/print.ts`
- **Template simplifié** : `src/utils/printAttestationVillageoise.ts`
- **Page de vérification** : `src/pages/public/PublicVerification.tsx`
- **Edge Function** : `supabase/functions/attestation-verify/index.ts`
- **Vérification client** : `src/lib/attestationVerification.ts`

## Checklist de déploiement

- [ ] Exécuter les migrations SQL
- [ ] Configurer `ATTESTATION_PUBLIC_KEY` dans les secrets Supabase
- [ ] Déployer l'Edge Function `attestation-verify`
- [ ] Tester la génération d'attestation
- [ ] Tester la vérification par QR code
- [ ] Vérifier l'impression A4
- [ ] Configurer le domaine de vérification (ex: `portal.gnambaservices.ci`)
