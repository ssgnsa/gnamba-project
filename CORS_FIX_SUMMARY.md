# Résumé Corrections CORS & OpaqueResponseBlocking

**Date**: 2026-05-15  
**Problème**: Erreurs `OpaqueResponseBlocking` sur logos villages depuis Supabase Storage

---

## 🔍 Problèmes Identifiés

### 1. **OpaqueResponseBlocking** (Critique)
- **Symptôme**: Images bloquées avec erreur "A resource is blocked by OpaqueResponseBlocking"
- **Cause**: Images chargées sans `crossOrigin="anonymous"` depuis Supabase Storage
- **Impact**: Logos villages non affichés

### 2. **Cookie Cloudflare** (Mineur)
- **Symptôme**: Cookie `__cf_bm` rejeté
- **Cause**: Configuration domaine
- **Impact**: Non critique

### 3. **Preload Warning** (Mineur)
- **Symptôme**: Logo préchargé mais non utilisé
- **Cause**: Favicon preload
- **Impact**: Warning console uniquement

---

## ✅ Solutions Appliquées

### 1. Composant SafeImage (`src/components/ui/SafeImage.tsx`)

Wrapper universel pour toutes les images externes:

```typescript
<SafeImage
  src={url}
  alt="Description"
  className="w-full h-full object-cover"
/>
```

**Fonctionnalités**:
- ✅ `crossOrigin="anonymous"` automatique
- ✅ Fallback si erreur chargement
- ✅ Gestion erreur intégrée

### 2. Corrections Composants

#### `WorkflowValidation.tsx`
- **Avant**: `<img src={scanMedia.url} />`
- **Après**: `<SafeImage src={scanMedia.url} />`
- **Ligne**: ~498

#### `VillageLogoUploader.tsx`
- **Avant**: `<img src={logoUrl} />` (VillageLogoDisplay)
- **Après**: `<SafeImage src={logoUrl} />`
- **Ligne**: ~459

### 3. Migration SQL CORS Storage

**Fichier**: `supabase/migrations/20260515000004_fix_cors_storage.sql`

```sql
-- Activer CORS sur buckets
UPDATE storage.buckets
SET cors_origins = ARRAY['*']
WHERE name IN ('media', 'village-logos', 'documents', 'scans');

-- Politiques accès public
CREATE POLICY "Public Access to Village Logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'village-logos');
```

---

## 📋 Checklist Corrections

- [x] Audit images sans crossOrigin (2 trouvées)
- [x] Créer composant SafeImage
- [x] Corriger WorkflowValidation.tsx
- [x] Corriger VillageLogoUploader.tsx
- [x] Créer migration SQL CORS
- [ ] Appliquer migration sur cloud (`supabase db push`)
- [ ] Tester dans navigateur

---

## 🚀 Déploiement

```bash
# 1. Appliquer migration CORS
supabase db push

# 2. Vérifier buckets
supabase storage list

# 3. Tester images
# Ouvrir Foncier > Attestation avec scan
# Vérifier logos villages s'affichent
```

---

## 📝 Notes

### Pourquoi SafeImage ?

Le problème OpaqueResponseBlocking survient quand:
1. Image chargée depuis domaine externe (Supabase)
2. Sans attribut `crossOrigin`
3. Navigateur bloque pour sécurité CORS

Solution: `crossOrigin="anonymous"` force mode CORS au lieu de no-cors.

### Alternatives Non Retenues

1. **CSP Headers nginx**: Complexe, risqué
2. **Proxy images**: Trop lourd
3. **Conversion base64**: Trop lourd pour logos

**Solution choisie**: crossOrigin + CORS bucket (standard, léger)

---

## ✅ Statut

**Corrections Code**: ✅ Complètes  
**Migration SQL**: ✅ Prête à déployer  
**Tests**: ⏳ En attente déploiement  

**Prochaine Action**: `supabase db push` pour activer CORS sur storage
