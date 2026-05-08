# ANALYSE APPROFONDIE - SYSTÈME D'ATTESTATION

## Date: 5 mai 2026
## Problème: Attestation illisible, apparence de "deux attestations superposées"

---

## 1. FLUX COMPLET CRÉATION LOT → ATTESTATION → IMPRESSION

### 1.1 Création d'un Lot (Foncier.tsx)
```
FoncierLot (type TypeScript)
└── Propriétés:
    ├── reference: string (clé unique)
    ├── numero_lot: string
    ├── superficie: number (m²)
    ├── proprietaire_nom: string
    ├── proprietaire_prenom: string
    ├── proprietaire_cni_numero: string
    ├── region, departement, commune, village
    └── [autres champs...]
```

### 1.2 Génération de Données d'Impression
```
buildAttestationPrintData() 
│
├─ Input: attestationData (du DB)
├─ Input: lot (FoncierLot)
├─ Input: config (FoncierConfigMap)
├─ Input: form (AttestationForm - formulaire saisi)
│
└─ Output: AttestationCoutumiereData
   ├── reference: auto-générée si manquante
   ├── propriétaire: from lot + form
   ├── parcelle: from lot
   ├── validation: from form
   └── signature/cachet: from form
```

### 1.3 Impression
```
printAttestationCoutumiere(data)
│
├─ 1. Appelle buildAttestationCoutumiereHTML(data)
│     └─ Génère HTML complet avec:
│        ├── DOCTYPE, <html>, <head>, <style>
│        ├── CSS complet (interne)
│        └── <body> avec contenu
│
├─ 2. Appelle openPrintWindow(html)
│     └─ Crée Blob URL et ouvre nouvelle fenêtre
│
└─ 3. Affiche document pour impression
```

---

## 2. ARCHITECTURE DÉTAILLÉE buildAttestationCoutumiereHTML

### 2.1 Structure HTML Générée
```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <title>...</title>
    <style>/* CSS complet interne */</style>
  </head>
  <body>
    <div class="document">
      <!-- EN-TÊTE (région, département, logo) -->
      <div class="header">
        <div class="header-left">...</div>
        <div class="header-right">...</div>
      </div>
      
      <!-- TITRE -->
      <div class="title-section">
        <div class="title-main">ATTESTATION</div>
        <div class="title-subtitle">DE PROPRIÉTÉ VILLAGEOISE</div>
      </div>
      
      <!-- INTRODUCTION -->
      <div class="intro-text">...</div>
      
      <!-- 2 SECTIONS -->
      <div class="sections">
        <div class="section"><!-- Identité --></div>
        <div class="section"><!-- Parcelle --></div>
      </div>
      
      <!-- VALIDATION -->
      <div class="validation-section">...</div>
      
      <!-- SIGNATURE -->
      <div class="signature-section">...</div>
      
      <!-- PIED DE PAGE -->
      <div class="footer">
        <div class="footer-column"><!-- Références --></div>
        <div class="footer-column"><!-- Sécurité + QR --></div>
      </div>
      
      <!-- MENTION LÉGALE -->
      <div class="legal-notice">...</div>
    </div>
  </body>
</html>
```

### 2.2 CSS Principal
```css
body {
  font-family: 'Times New Roman', serif;
  font-size: 12pt;
  color: #000;              // Noir
  background: #f5f5f5;     // Gris clair
  print-color-adjust: exact;
}

.document {
  width: 210mm;
  height: 297mm;
  background: white;        // Blanc
  border: 2px solid #2d5a1b; // Vert foncé
  padding: 15mm;
  display: flex;
  flex-direction: column;
  position: relative;
}
```

---

## 3. FLUX DÉTAILLÉ: CRÉATION D'UN LOT JUSQU'À L'IMPRESSION

### Phase 1: Données Entrantes

#### Depuis la base de données (Supabase):
```sql
SELECT * FROM foncier_lots
WHERE reference = 'LOT-20260505-0001'

Résultat:
{
  reference: 'LOT-20260505-0001',
  numero_lot: 'K-001',
  superficie: 1500,
  proprietaire_nom: 'KOUAME',
  proprietaire_prenom: 'Jean',
  region: 'AGNEBY-TIASSA',
  -- ...autres champs
}
```

#### Depuis le formulaire saisi par l'utilisateur (AttestationForm):
```typescript
{
  gps_lat: '6.1256',
  gps_lng: '-5.5471',
  registre_page: 1,
  registre_ligne: 15,
  validation_chef_nom: 'NANAN FAUSTIN',
  // ...autres champs
}
```

### Phase 2: Construction de AttestationCoutumiereData

```typescript
// Dans buildAttestationPrintData():
return {
  reference: 'ATT-20260505-0001',
  region: 'AGNEBY-TIASSA',
  departement: 'DE SIKENSI',
  // ... fusionner DB + form
}
```

### Phase 3: Génération HTML

```typescript
// Dans buildAttestationCoutumiereHTML():
const finalReference = data.reference || generateReference("ATT");
const controlNumber = data.control_number || generateControlNumber(finalReference);

// Générer HTML complet avec:
// - Tous les styles CSS
// - Contenu inséré via ${}
return `<!DOCTYPE html>...${finalReference}...`;
```

### Phase 4: Ouverture de la Fenêtre d'Impression

```typescript
// Dans openPrintWindow():
const blob = new Blob([html], { type: "text/html;charset=utf-8" });
const blobUrl = URL.createObjectURL(blob);
const printWindow = window.open(blobUrl, "_blank");
printWindow.print();
```

---

## 4. VÉRIFICATION DES DONNÉES

### Quantités de Divs:
- ✓ <div>: 99
- ✓ </div>: 99
- ✓ Équilibre: Parfait

### Contenus Dupliqués (Attendus):
- ✓ 'ATTESTATION': 2 fois (title + contenu)
- ✓ Propriétaire: 2 fois (intro + section identité)
- ✓ C'est normal!

---

## 5. POINTS SENSIBLES IDENTIFIÉS

### 5.1 CSS Inutilisé
```css
.model-bg {
  background-image: url('/attestation%20model.png');
  opacity: 0.12;  // Probablement un filigrane
  z-index: 0;
}
```
**STATUS**: Classe `.model-bg` n'existe PAS dans le HTML généré
**IMPACT**: Aucun impact sur buildAttestationCoutumiereHTML

### 5.2 Fichier Image
- ✓ /public/attestation model.png existe
- ✓ Utilisée dans autre fonction (printAttestationAnnex)
- ✓ Non référencée dans buildAttestationCoutumiereHTML

### 5.3 openPrintWindow Version
- ✓ Modifiée aujourd'hui pour utiliser Blob URL
- ✓ Évite les problèmes de document.write() qui peuvent causer des doublons
- ✓ Plus robuste et standard

---

## 6. HYPOTHÈSES SUR LE PROBLÈME "SUPERPOSITION"

### Hypothèse 1: Image de Fond
- ❌ Pas d'image de fond dans buildAttestationCoutumiereHTML
- ✓ CSS contient une image, mais classe non utilisée

### Hypothèse 2: Contenu Dupliqué
- ✓ HTML vérifié: pas de duplication
- ✓ Divs équilibrées: 99 = 99

### Hypothèse 3: Problème Visuel (CSS z-index)
- ✓ z-index utilisés dans CSS inutilisé
- ❌ Pas de chevauchement z-index dans CSS utilisé

### Hypothèse 4: Données Dupliquées
- ❌ Analysé: pas de duplication dans les données

### Hypothèse 5: openPrintWindow l'affiche Deux Fois
- ✓ Possible avec l'ancienne version (document.write)
- ✓ CORRIGÉ maintenant avec Blob URL

---

## 7. CORRECTIONS APPLIQUÉES AUJOURD'HUI

### Changement 1: openPrintWindow
```before:
  win.document.write(html);  // Peut causer des doublons
  
after:
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl);  // Méthode standard et robuste
```

---

## 8. RECOMMANDATIONS POUR VALIDATION

### Test 1: Visual Inspection
```
1. Accédez à Module Foncier
2. Créez/sélectionnez un lot
3. Cliquez "Imprimer l'attestation"
4. Vérifiez:
   - ✓ Contenu lisible
   - ✓ Pas de superposition
   - ✓ Couleurs correctes
   - ✓ Format A4 correct
```

### Test 2: Inspection du Code
```
- Vérifier document.readyState
- Vérifier console pour erreurs
- Vérifier network tab pour 404 images
```

### Test 3: Impression Réelle
```
- Imprimer sur papier
- Vérifier qualité
- Vérifier signature/cachet visibles
```

---

## 9. CONFIGURATION FINALE

### Fichier Modifié:
- ✓ src/utils/print.ts
  - ✓ buildAttestationCoutumiereHTML() - Template HTML/CSS
  - ✓ openPrintWindow() - Ouverture Blob URL

### Fichiers Importants:
- src/pages/Foncier.tsx - Module Foncier
- src/utils/reference.ts - Génération références
- src/lib/hash.ts - Numéro contrôle
- public/attestation model.png - Image (non utilisée actuellement)

---

## 10. STATUS FINAL

✅ **CODE**: Compilé sans erreur
✅ **ARCHITECTURE**: Validée
✅ **FLUX**: Bien défini
✅ **DONNÉES**: Pas de duplication
✅ **FUNCTION**: Robustifiée

🔍 **À VÉRIFIER**: Comportement visuel dans le navigateur
