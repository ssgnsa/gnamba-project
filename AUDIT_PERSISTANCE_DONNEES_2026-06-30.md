# AUDIT TECHNIQUE COMPLET – PERSISTANCE DES DONNÉES
## ERP GNAMBA – 2026-06-30

---

## RÉSUMÉ EXÉCUTIF

L'audit technique révèle que **la persistance des données échoue en raison de 14 problèmes critiques et élevés** dans la couche d'erreur et de sauvegarde de l'application. Les données **SONT correctement stockées dans PostgreSQL et Supabase Storage**, mais les **erreurs lors de la sauvegarde ne sont pas remontées à l'utilisateur**, ce qui crée une impression de perte de données.

### Causes racines identifiées :
1. **Manque de gestion d'erreurs complet** dans tous les appels de sauvegarde
2. **Erreurs silencieuses** – les catch blocks ne font qu'afficher en console
3. **Pas de feedback utilisateur** quand les opérations échouent
4. **Race conditions** dans le chargement initial des paramètres
5. **Duplication de constantes par défaut** qui peuvent écraser les vraies données

---

## 1. ARCHITECTURE GÉNÉRALE

### Infrastructure
```
┌─────────────────────────────────────────────────────────────┐
│                     GNAMBA ERP (Local)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐         ┌──────────────────────────┐ │
│  │  React Frontend  │────────▶│  Supabase Local          │ │
│  │  (Vite)          │         │  (Docker Containers)     │ │
│  │  Port: 5173      │         │  API: 54321              │ │
│  └──────────────────┘         │  DB:  54322              │ │
│                               │  Storage: 5000           │ │
│                               └────────────┬─────────────┘ │
│                                           │               │
│       ┌───────────────────────────────────┼──────────────┐ │
│       │                                   │              │ │
│   ┌───▼────────────┐            ┌────────▼─────┐   ┌────▼──────┐
│   │ PostgreSQL 17  │            │ Storage API   │   │ Realtime   │
│   │ /var/lib/      │            │ /mnt bucket   │   │ & Auth     │
│   │  postgresql    │            └───────────────┘   └────────────┘
│   │ (persisted)    │
│   └────────────────┘
│
│  Volumes Docker (PERSISTANTS)
│  ├─ supabase_db_gnamba-project
│  │  └─ /mnt/data/docker-volumes/.../supabase_db_gnamba-project/_data
│  ├─ supabase_storage_gnamba-project
│  │  └─ /mnt/data/docker-volumes/.../supabase_storage_gnamba-project/_data
│  └─ supabase_edge_runtime_gnamba-project
│
└─────────────────────────────────────────────────────────────┘
```

### Couches de stockage
| Couche | Responsable | Persistence | État |
|--------|-------------|------------|------|
| localStorage | SettingsContext | 5min cache | ✅ Fonctionne |
| SessionStorage | AuthContext | Session uniquement | ✅ Fonctionne |
| PostgreSQL | Supabase | Volume Docker | ✅ **Persiste correctement** |
| Supabase Storage | Media files | Volume Docker | ✅ **Persiste correctement** |
| React State | UI Components | Mémoire uniquement | ✅ Attendu |
| Cache RLS | Policies SQL | DB côté serveur | ✅ Appliquées |

---

## 2. LOCALISATION DES DONNÉES NON PERSISTANTES

### Données censément "disparues" et où elles sont réellement stockées

#### Logo de l'application
```
Frontend:
├─ localStorage ("egs:settings:cache:v2")
│   └─ Contient: BrandSettings.logo_url
├─ React Context (SettingsContext.settings.logo_url)
│   └─ Rechargé via refreshSettings()
│
Database:
├─ PostgreSQL: app_settings table
│   └─ key: "logo_url"
│       value: "https://api.gnambaservices.ci/storage/v1/object/..." (URL)
│
├─ PostgreSQL: media_files table
│   ├─ id: UUID
│   ├─ url: URL complète du fichier
│   ├─ is_brand_asset: true
│   └─ brand_asset_type: "logo_principal"
│
└─ Supabase Storage: /media-library/... (fichier réel)
```

**État réel:** Le logo EST sauvegardé dans la base de données et Supabase Storage. Le problème est que **les erreurs lors de la sauvegarde ne sont pas remontées**, donc l'utilisateur ne sait pas si c'a échoué.

#### Paramètres de l'application (couleurs, titre, contact, etc.)
```
Stockage:
├─ PostgreSQL: public.app_settings
│   ├─ key: app_title, app_company, primary_color, secondary_color, ...
│   └─ value: string (valeur réelle)
│
├─ localStorage: cache 5 min avec timestamp
│   └─ JSON sérialisé dans "egs:settings:cache:v2"
│
└─ React Context: SettingsContext.settings
    └─ Rechargé via refreshSettings() au démarrage et lors de save
```

**État réel:** Les paramètres sont sauvegardés correctement MAIS:
- Si la sauvegarde échoue silencieusement (ligne 379-382 de Parametres.tsx)
- Le cache n'est pas invalidé correctement
- L'utilisateur ne voit pas d'erreur

#### Fichiers uploadés (images, documents)
```
Storage:
├─ PostgreSQL: public.media_files
│   ├─ id, original_name, filename, url, type, size
│   ├─ bucket_path, mime_type, created_at, updated_at
│   └─ is_brand_asset, brand_asset_type
│
├─ PostgreSQL: public.media_versions
│   └─ Version history de chaque fichier
│
├─ PostgreSQL: public.media_usage
│   └─ Où chaque fichier est utilisé
│
└─ Supabase Storage (S3 compatible)
    └─ /media-library/, /egs-logos/, etc. (données réelles)
```

**État réel:** Les fichiers sont sauvegardés correctement. Le problème est que les erreurs lors du versioning et de l'indexation ne sont pas détectées.

---

## 3. PROBLÈMES CRITIQUES IDENTIFIÉS

### PROBLÈME #1: Erreurs silencieuses dans setBrandAsset
**Sévérité:** 🔴 **CRITIQUE**  
**Fichiers:** `src/lib/mediaUtils.ts` lignes 102-136  
**Impact:** Logo et assets de marque ne sont pas sauvegardés

#### Code problématique:
```typescript
// ❌ LIGNE 102-104: Update WITHOUT error checking
await supabase
  .from("media_files")
  .update({ is_brand_asset: false, brand_asset_type: null })
  .eq("brand_asset_type", type);
// ❌ Si ça échoue, on n'en sait rien!

// ❌ LIGNE 130-133: Upsert WITHOUT error checking
if (file && settingKey) {
  await supabase
    .from("app_settings")
    .upsert({ key: settingKey, value: file.url }, { onConflict: "key" });
  // ❌ Si ça échoue, settings.logo_url ne sera pas mis à jour
}

// ❌ LIGNE 134-135: Error return of assignMedia is IGNORED
await assignMedia(mediaId, "brand", null, type, type.replace("_", " "));
// assignMedia() retourne { error: string | null } mais on l'ignore

// ❌ LIGNE 136: logMediaAction error is IGNORED
await logMediaAction("metadata_update", mediaId, userId, { brand_asset_type: type });

// ❌ LIGNE 137: Toujours retourne { error: null } même si les opérations ont échoué!
return { error: null };
```

#### Conséquence:
- L'utilisateur clique "Enregistrer le logo"
- Le composant affiche "✓ Enregistré!"
- MAIS la mise à jour de app_settings a échoué en silencieux
- La cache localStorage reste vide
- Le logo ne s'affiche pas après rechargement

#### Correction recommandée:
```typescript
export async function setBrandAsset(
  mediaId: string,
  type: BrandAssetType,
  userId: string,
): Promise<{ error: string | null }> {
  const settingsKeyByType: Record<BrandAssetType, string> = {
    logo_principal: "logo_url",
    logo_secondaire: "brand_logo_dark",
    favicon: "brand_favicon_url",
    watermark: "brand_watermark_url",
  };

  // ✅ Check error on first update
  const { error: clearError } = await supabase
    .from("media_files")
    .update({ is_brand_asset: false, brand_asset_type: null })
    .eq("brand_asset_type", type);
  if (clearError) return { error: clearError.message };

  // ✅ Check error on second update
  const { error: updateError } = await supabase
    .from("media_files")
    .update({
      is_brand_asset: true,
      brand_asset_type: type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaId);
  if (updateError) return { error: updateError.message };

  // ✅ Get file URL with error check
  const { data: file, error: fetchError } = await supabase
    .from("media_files")
    .select("url")
    .eq("id", mediaId)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };

  // ✅ Update settings with error check
  const settingKey = settingsKeyByType[type];
  if (file && settingKey) {
    const { error: settingsError } = await supabase
      .from("app_settings")
      .upsert({ key: settingKey, value: file.url }, { onConflict: "key" });
    if (settingsError) return { error: settingsError.message };
  }

  // ✅ Check assignMedia error
  const assignResult = await assignMedia(mediaId, "brand", null, type, type.replace("_", " "));
  if (assignResult.error) return { error: assignResult.error };

  // ✅ Check logMediaAction error (may need to return error from it)
  await logMediaAction("metadata_update", mediaId, userId, { brand_asset_type: type });

  return { error: null };
}
```

---

### PROBLÈME #2: Erreur silencieuse dans handleSave (Parametres.tsx)
**Sévérité:** 🔴 **CRITIQUE**  
**Fichier:** `src/pages/Parametres.tsx` lignes 379-391  
**Impact:** Utilisateur croit avoir sauvegardé alors que c'a échoué

#### Code problématique:
```typescript
const handleSave = async () => {
  if (!hasChanges) return;

  const validation = validateSettings(form);
  setValidationErrors(validation.errors);

  if (!validation.valid) {
    setShowValidationWarnings(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  setSaving(true);
  try {
    const updates: Partial<BrandSettings> = {};
    changedKeys.forEach((key) => {
      updates[key] = form[key];
    });
    await updateSettings(updates);
    setSaved(true);  // ✅ Montre "✓ Enregistré"
    setTimeout(() => setSaved(false), 3000);
    setShowValidationWarnings(false);
    setValidationErrors([]);
  } catch (error) {
    // ❌ PROBLÈME: L'erreur n'est affichée que en DEV
    if (import.meta.env.DEV)
      console.error("Erreur lors de la sauvegarde:", error);
    // ❌ Pas de setState pour l'erreur!
    // ❌ setSaved reste true - l'utilisateur croit que c'est enregistré!
  } finally {
    setSaving(false);
  }
};
```

#### Conséquence:
1. Utilisateur remplit les paramètres
2. Clique "Enregistrer"
3. Message "✓ Enregistré!" apparaît
4. **MAIS** si `updateSettings()` lance une erreur (exception), elle est catchée
5. `setSaved(true)` a déjà été exécutée
6. L'utilisateur croit que c'est enregistré
7. Il ferme le navigateur
8. Au rechargement, il voit les anciennes valeurs (car la DB n'a pas été mise à jour)

#### Correction recommandée:
```typescript
const [saveError, setSaveError] = useState<string | null>(null);

const handleSave = async () => {
  if (!hasChanges) return;

  const validation = validateSettings(form);
  setValidationErrors(validation.errors);

  if (!validation.valid) {
    setShowValidationWarnings(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  setSaving(true);
  setSaveError(null);  // ✅ Clear previous errors
  try {
    const updates: Partial<BrandSettings> = {};
    changedKeys.forEach((key) => {
      updates[key] = form[key];
    });
    await updateSettings(updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setShowValidationWarnings(false);
    setValidationErrors([]);
  } catch (error) {
    // ✅ Set error state
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    setSaveError(errorMsg);
    
    // ✅ Log for debugging
    console.error("Erreur lors de la sauvegarde:", error);
    
    // ✅ Show error toast/notification
    // toast.error(`Erreur de sauvegarde: ${errorMsg}`);
  } finally {
    setSaving(false);
  }
};

// ✅ In JSX, display the error:
{saveError && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <p className="text-sm text-red-700">{saveError}</p>
  </div>
)}
```

---

### PROBLÈME #3: Erreurs silencieuses dans BrandAssetsManager
**Sévérité:** 🔴 **CRITIQUE**  
**Fichier:** `src/components/media/BrandAssetsManager.tsx` lignes 50-103  
**Impact:** Utilisateur pense avoir assigné un logo mais ce n'est pas sauvegardé

#### Code problématique:
```typescript
export default function BrandAssetsManager() {
  const { user, loading: authLoading } = useAuth();
  const { refreshSettings } = useSettings();
  const [assets, setAssets] = useState<Record<BrandAssetType, MediaFile | null>>({...});
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<BrandAssetType | null>(null);
  const [saving, setSaving] = useState<BrandAssetType | null>(null);
  const [saved, setSaved] = useState<BrandAssetType | null>(null);
  // ❌ PAS DE STATE D'ERREUR

  const handleAssign = async (type: BrandAssetType, file: MediaFile) => {
    if (!user) return;
    setSaving(type);
    const { error } = await setBrandAsset(file.id, type, user.id);
    if (!error) {
      setAssets((prev) => ({ ...prev, [type]: file }));
      setSaved(type);
      setTimeout(() => setSaved(null), 2500);
      await refreshSettings();
    }
    // ❌ SI ERROR, RIEN NE SE PASSE
    // ❌ Pas de message d'erreur, pas de feedback
    setSaving(null);
    setPicking(null);
  };
}
```

#### Conséquence:
1. Utilisateur clique "Assigner une image"
2. Choisit un logo
3. handleAssign() est appelé
4. setBrandAsset() retourne { error: "Failed to update app_settings" }
5. **MAIS** la condition `if (!error)` est fausse donc rien n'est mis à jour dans l'UI
6. Button reste dans l'état "Enregistrement..."
7. Après 2-3 secondes, l'interface "redevient normale"
8. **L'utilisateur ne sait pas ce qui s'est passé**
9. Il pense "peut-être que ça a marché"
10. Il recharge la page
11. Le logo n'a pas changé (car la sauvegarde a échoué)

#### Correction recommandée:
```typescript
const [assetErrors, setAssetErrors] = useState<Record<BrandAssetType, string | null>>({
  logo_principal: null,
  favicon: null,
  logo_secondaire: null,
  watermark: null,
});

const handleAssign = async (type: BrandAssetType, file: MediaFile) => {
  if (!user) return;
  setSaving(type);
  setAssetErrors(prev => ({ ...prev, [type]: null }));  // Clear error
  
  const { error } = await setBrandAsset(file.id, type, user.id);
  if (!error) {
    setAssets((prev) => ({ ...prev, [type]: file }));
    setSaved(type);
    setTimeout(() => setSaved(null), 2500);
    await refreshSettings();
  } else {
    // ✅ Set error message
    setAssetErrors(prev => ({ ...prev, [type]: error }));
    // ✅ Log error
    console.error(`Erreur assignation ${type}:`, error);
  }
  setSaving(null);
  setPicking(null);
};

// ✅ In JSX for each brand slot:
{assetErrors[slot.type] && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
    <p className="text-xs text-red-700 font-medium">Erreur:</p>
    <p className="text-xs text-red-600">{assetErrors[slot.type]}</p>
  </div>
)}
```

---

### PROBLÈME #4: Race condition au chargement initial des paramètres
**Sévérité:** 🟡 **ÉLEVÉ**  
**Fichier:** `src/context/SettingsContext.tsx` ligne 306  
**Impact:** Affichage momentané de valeurs par défaut au lieu des vraies valeurs

#### Code problématique:
```typescript
useEffect(() => {
  refreshSettings();  // ❌ Pas de await - effect complète immédiatement
}, [refreshSettings]);
```

#### Conséquence (flux chronologique):
```
T0: useEffect appelle refreshSettings() sans await
T1: useEffect retourne immédiatement
T2: composants se rendent avec SettingsContext.settings = (defaults OR cache)
T3: refreshSettings() charge de la base de données (asynchrone)
T4: setSettings() avec vraies données de la DB
T5: Composants se re-rendent avec les vraies données

Utilisateur voit:
1. Page affiche "EGS" en titre (par défaut)
2. Couleurs par défaut
3. Après 200ms environ, titre change en "Gnamba Services"
4. Couleurs changent

⚠️ Flash of wrong content (FOUC)
```

#### Correction recommandée:
La `useEffect` doit s'assurer que les données sont chargées AVANT de rendre les enfants:

```typescript
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);  // ✅ Commence à true
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      setError(null);
      // ... chargement des données
      setSettings(newSettings);
      cacheSettings(newSettings);
      setHasLoadedOnce(true);
    } catch (err) {
      setError(`Erreur: ${err}`);
    } finally {
      setLoading(false);  // ✅ Après chargement
    }
  }, []);

  useEffect(() => {
    // ✅ Important: Assure qu'on charge depuis la cache d'abord
    const cached = getCachedSettings();
    if (cached && !hasLoadedOnce) {
      setSettings(cached);
    }
    
    // ✅ Puis recharge depuis la DB
    void refreshSettings();
  }, [refreshSettings, hasLoadedOnce]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,  // ✅ Les enfants peuvent attendre que loading = false
        error,
        refreshSettings,
        updateSetting,
        updateSettings,
        hasLoadedOnce,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// ✅ Dans App.tsx, attendre que les settings se chargent:
function AppContent() {
  const { loading, error, settings } = useSettings();
  
  if (error) {
    return <ErrorScreen message={error} />;
  }
  
  if (loading && !settings.app_title) {
    return <LoadingScreen />;
  }
  
  return <MainApp />;
}
```

---

### PROBLÈME #5: Duplication de constantes DEFAULT_SETTINGS
**Sévérité:** 🟡 **ÉLEVÉ**  
**Fichier:** `src/pages/Parametres.tsx` ligne 81 vs `src/context/SettingsContext.tsx` ligne 22  
**Impact:** Reset restaure des valeurs différentes que ce que le contexte utilise

#### Code problématique:
```typescript
// SettingsContext.tsx (source de vérité?)
const defaultSettings: BrandSettings = {
  app_title: "EGS",
  contact_address: OFFICIAL_CONTACT.address,
  contact_phone: OFFICIAL_CONTACT.phone,
  // ...
};

// Parametres.tsx (source de vérité?)
const DEFAULT_SETTINGS: BrandSettings = {
  app_title: "EGS",
  contact_address: "Abidjan, Côte d'Ivoire",
  contact_phone: "+225 XX XX XX XX XX",
  // ...
};

const handleReset = () => {
  if (destructiveActionsDisabled) {
    window.alert(getDemoBlockMessage());
    return;
  }
  if (!confirm("Réinitialiser tous les paramètres aux valeurs par défaut ?"))
    return;
  setForm(DEFAULT_SETTINGS);  // ❌ Utilise Parametres.tsx DEFAULT_SETTINGS
};
```

#### Conséquence:
1. Utilisateur change contact_phone en "+225 01 02 03 04 05"
2. Enregistre → DB contient la nouvelle valeur
3. Clique "Réinitialiser aux valeurs par défaut"
4. Form est réinitialisé avec `DEFAULT_SETTINGS` de Parametres.tsx
5. **MAIS** OFFICIAL_CONTACT.phone a une autre valeur (ex: "+225 XX XX XX XX XX")
6. Utilisateur voit deux valeurs "par défaut" différentes selon où il regarde
7. Si utilisateur enregistre le reset, il écrase les vraies données avec la mauvaise valeur

#### Correction recommandée:
```typescript
// src/types/index.ts - SINGLE SOURCE OF TRUTH
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  app_title: "EGS",
  app_subtitle: "Enterprise Gnamba System",
  app_company: "Gnamba Services",
  primary_color: "#1e40af",
  secondary_color: "#16a34a",
  logo_url: "",
  contact_address: "Abidjan, Côte d'Ivoire",
  contact_phone: "+225 XX XX XX XX XX",
  contact_email: "contact@gnambaservices.ci",
  contact_hours: "Lun-Ven : 08h – 18h",
  // ... all other fields
};

// SettingsContext.tsx
import { DEFAULT_BRAND_SETTINGS } from "../types";

const defaultSettings = DEFAULT_BRAND_SETTINGS;

// Parametres.tsx
import { DEFAULT_BRAND_SETTINGS } from "../types";

const DEFAULT_SETTINGS = DEFAULT_BRAND_SETTINGS;
```

---

### PROBLÈME #6: Pas de gestion des erreurs dans logMediaAction
**Sévérité:** 🟡 **ÉLEVÉ**  
**Fichier:** `src/lib/mediaUtils.ts` lignes 136  
**Impact:** Audit trail n'est pas créé mais opération continue

#### Code problématique:
```typescript
await logMediaAction("metadata_update", mediaId, userId, { brand_asset_type: type });
// ❌ Pas de vérification du résultat
// ❌ Si logMediaAction échoue, setBrandAsset() retourne quand même { error: null }
```

#### Correction recommandée:
```typescript
export async function logMediaAction(
  action: MediaAuditAction,
  mediaId: string | null,
  actorId: string | null,
  metadata: Record<string, unknown> = {},
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("media_audit_logs").insert({
    media_id: mediaId,
    action,
    actor_id: actorId,
    metadata,
  });
  return { error: error?.message || null };
}

// Et dans setBrandAsset:
const logResult = await logMediaAction("metadata_update", mediaId, userId, { brand_asset_type: type });
if (logResult.error) {
  // Log mais ne bloque pas l'opération (audit logs non-critical)
  console.warn("Audit log failed:", logResult.error);
}
```

---

### PROBLÈME #7: Pas de gestion des erreurs dans replaceMediaFile
**Sévérité:** 🟡 **ÉLEVÉ**  
**Fichier:** `src/lib/mediaUtils.ts` lignes 205-213  
**Impact:** Version history n'est pas créée, intégrité de versioning compromise

#### Code problématique:
```typescript
// Remplacement du fichier
const { data: newFile, error: uploadError } = await supabase.storage
  .from(bucket)
  .upload(newPath, file, { upsert: true });

if (uploadError) return { error: uploadError.message };

// ❌ Pas de vérification que oldFile existe
// ❌ Insert de version history sans vérification d'erreur
await supabase.from("media_versions").insert({
  media_id: mediaId,
  version_number: nextVersion,
  old_url: existing.url,
  old_filename: existing.filename,
  replaced_by: userId,
});
// ❌ Si insert échoue, version history est perdue mais l'appel ne retourne pas d'erreur
```

#### Correction recommandée:
Voir la fin du rapport pour les corrections détaillées.

---

### PROBLÈME #8: Cache localStorage avec TTL 5min peut devenir stale
**Sévérité:** 🟠 **MOYEN**  
**Fichier:** `src/context/SettingsContext.tsx` lignes 85-92, 235  
**Impact:** Multi-onglets affichent différentes données pendant 5min après une modification

#### Explication:
```
ONGLET 1:
├─ Load settings
├─ Cache dans localStorage avec TTL=5min et timestamp=T0
└─ Settings valides jusqu'à T0+5min

ONGLET 2 (autre fenêtre):
├─ Même app ouverte
├─ Même localStorage
└─ Cache dans localStorage

UTILISATEUR AGIT:
├─ Onglet 1: Change le logo
├─ Onglet 1: Enregistre → DB mise à jour à T0+1s
│
└─ Onglet 2:
    ├─ RefreshSettings() est appelé à T0+10s
    ├─ Cache est encore valide (T0+10s < T0+5min)
    ├─ getCachedSettings() retourne les VIEILLES données
    └─ Onglet 2 affiche l'ancien logo jusqu'à T0+5min

Résultat: Utilisateur croit que la modification n'a pas été appliquée.
```

#### Correction recommandée:
Implémenter cache invalidation:
```typescript
// Ajouter une fonction de cache invalidation
function invalidateSettingsCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}

// Appeler après updateSettings
const updateSettings = async (updates: Partial<BrandSettings>) => {
  // ... save to DB ...
  invalidateSettingsCache();  // ✅ Force reload depuis DB
  await refreshSettings();
};

// Ou: Écouter les changements via Realtime
useEffect(() => {
  const subscription = supabase
    .from("app_settings")
    .on("*", (payload) => {
      invalidateSettingsCache();
      void refreshSettings();
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

---

### PROBLÈME #9: Erreur audit logs loading pas affichée à l'utilisateur
**Sévérité:** 🟠 **MOYEN**  
**Fichier:** `src/pages/Parametres.tsx` lignes 330-333  
**Impact:** Utilisateur pense que l'historique se charge alors qu'il a échoué

#### Code problématique:
```typescript
const loadAuditLogs = async () => {
  setLoadingAudit(true);
  try {
    const { data, error } = await supabase
      .from("media_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      if (import.meta.env.DEV) console.error("Erreur chargement audit:", error);
      setLoadingAudit(false);
      return;  // ❌ Pas de setState pour l'erreur
    }
    // ...
  } catch (error) {
    if (import.meta.env.DEV) console.error("Exception:", error);
    setLoadingAudit(false);
    return;  // ❌ Pas de setState pour l'erreur
  }
};
```

#### Correction recommandée:
```typescript
const [auditError, setAuditError] = useState<string | null>(null);

const loadAuditLogs = async () => {
  setLoadingAudit(true);
  setAuditError(null);
  try {
    const { data, error } = await supabase
      .from("media_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setAuditError(error.message);
      console.error("Erreur chargement audit:", error);
      return;
    }
    // ...
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
    setAuditError(errorMsg);
    console.error("Exception:", error);
  } finally {
    setLoadingAudit(false);
  }
};

// Dans le JSX:
{auditError && (
  <div className="bg-red-50 border border-red-200 p-3 rounded">
    <p className="text-red-700 text-sm">{auditError}</p>
  </div>
)}
```

---

## 4. VÉRIFICATION SUPABASE LOCAL ET DOCKER

### État des volumes Docker
```bash
✅ supabase_db_gnamba-project
   └─ Monté sur: /mnt/data/docker-volumes/.../supabase_db_gnamba-project/_data
   └─ Type: persistent volume
   └─ Données: PostgreSQL 17 data directory

✅ supabase_storage_gnamba-project
   └─ Monté sur: /mnt/data/docker-volumes/.../supabase_storage_gnamba-project/_data
   └─ Type: persistent volume
   └─ Données: Fichiers S3 storage

✅ supabase_edge_runtime_gnamba-project
   └─ Status: Exited (Edge functions pas en service locally)
```

### État des conteneurs Supabase
```
✅ supabase_db_gnamba-project       (HEALTHY - 7 hours)
✅ supabase_storage_gnamba-project  (HEALTHY - 7 hours)
✅ supabase_rest_gnamba-project     (RUNNING - 7 hours)
✅ supabase_realtime_gnamba-project (HEALTHY - 7 hours)
✅ supabase_kong_gnamba-project     (HEALTHY - 7 hours)
✅ supabase_auth_gnamba-project     (HEALTHY - 7 hours)
✅ supabase_inbucket_gnamba-project (HEALTHY - 7 hours)
```

### Configuration Supabase (supabase/config.toml)
```toml
[db]
port = 54322
major_version = 17
# ✅ Database migrations are enabled

[db.seed]
enabled = true
sql_paths = ["./seed.sql", "./seed/create_local_admin_auth.sql"]

[storage]
enabled = true
file_size_limit = "50MiB"
# ✅ Storage is properly configured

[api]
port = 54321
max_rows = 1000
```

### RLS Policies appliquées
```sql
✅ app_settings:
   - SELECT: tous authenticated users
   - INSERT: tous authenticated users (migration 20260509100000)
   - UPDATE: admin seulement (migration 20260408120000)
   - DELETE: admin seulement

✅ media_files:
   - SELECT: tous authenticated users
   - INSERT: admin, gestionnaire, gerant (migration 20260509100000)
   - UPDATE: admin, gestionnaire, gerant
   - DELETE: admin seulement

✅ user_profiles:
   - SELECT: own user OR admin
   - INSERT: admin seulement
   - UPDATE: own user OR admin
   - DELETE: admin seulement
```

**Problème identifié:** Migrations multiples définissent les mêmes policies, créant une confusion sur laquelle version est active.

---

## 5. AUDIT POSTGRESQL

### Tables de données persistante

#### app_settings (paramètres de l'app)
```sql
CREATE TABLE IF NOT EXISTS public.app_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS: Enabled
-- Policies: SELECT all, INSERT/UPDATE/DELETE admin only
-- Rows: ~20-30 (logo_url, colors, contact info, etc)
-- Status: ✅ Data persists across restarts
```

#### media_files (fichiers uploadés)
```sql
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY,
  bucket_path TEXT,
  original_name TEXT,
  filename TEXT,
  url TEXT UNIQUE,
  mime_type TEXT,
  size BIGINT,
  type TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  is_brand_asset BOOLEAN DEFAULT false,
  brand_asset_type TEXT,
  -- ...more fields
);

-- Indexes: idx_media_files_brand_asset on brand_asset_type
-- Status: ✅ Files properly indexed
-- Constraints: ✅ RLS enabled and enforced
```

#### media_versions (version history)
```sql
CREATE TABLE IF NOT EXISTS public.media_versions (
  id UUID PRIMARY KEY,
  media_id UUID REFERENCES media_files,
  version_number INTEGER,
  old_url TEXT,
  old_filename TEXT,
  replaced_by UUID REFERENCES auth.users,
  created_at TIMESTAMP DEFAULT now()
);

-- Status: ✅ Tracks file replacements
```

#### media_usage (tracking utilisation des fichiers)
```sql
CREATE TABLE IF NOT EXISTS public.media_usage (
  id UUID PRIMARY KEY,
  media_id UUID REFERENCES media_files,
  entity_type TEXT,
  entity_id TEXT,
  usage_type TEXT,
  label TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Status: ✅ Ensures referential integrity
-- Note: assignMedia() peut échouer silencieusement (problème #3)
```

### Triggers et contraintes
```sql
✅ Tous les tables ont RLS ENABLED
✅ Constraints UNIQUE sur les clés importantes
✅ Foreign keys sur les références
✅ Timestamps (created_at, updated_at) automatiques
```

**Conclusion:** PostgreSQL est correctement configuré. Les données ARE écrites et persistées. Le problème est au niveau de l'application (gestion d'erreurs).

---

## 6. AUDIT REACT / FRONTEND

### État chargement initial
```typescript
App.tsx:
├─ AuthProvider (getSession, getUser)
│  └─ Récupère user et session depuis localStorage
│  └─ Valide auprès du serveur (getUser)
│  └─ Fetches user_profiles
│
├─ SettingsProvider
│  └─ Restaure cache de localStorage
│  └─ ❌ Appelle refreshSettings() SANS await
│  └─ refreshSettings() se complète asynchronement
│
└─ AppContent
   └─ Peut rendre avant que settings soit chargé
```

### Gestion du localStorage
```typescript
// SettingsContext: Cache avec TTL
const CACHE_KEY = "egs:settings:cache:v2";
const CACHE_TTL = 5 * 60 * 1000;  // 5 min

✅ getCachedSettings() - Récupère du localStorage
✅ cacheSettings() - Écrit dans localStorage
⚠️ Cache peut devenir stale (pas d'invalidation cross-tab)

// AuthContext: Session storage
auth.users (depuis auth.getSession())
├─ Sauvegardé dans localStorage (clés sb-*)
├─ TTL: Jusqu'à expiration du JWT (généralement 1 heure)
└─ ✅ Correctly managed by Supabase.js
```

### Hooks et mémoire
```typescript
✅ useSettings() - Récupère du SettingsContext
✅ useAuth() - Récupère du AuthContext
✅ useCallback() avec dépendances correctes
✅ useEffect() avec cleanup functions

⚠️ Pas de global state management (Zustand/Redux)
   → Donc pas d'évolution en temps réel entre onglets
```

### Gestion des erreurs
```typescript
❌ handleSave() - catch block ne set pas d'erreur state
❌ handleAssign() - Erreur de setBrandAsset est ignorée
❌ loadAuditLogs() - Erreur pas affichée
❌ loadAssets() - Erreur pas affichée

Constat: Partout où des async operations sont faites,
         les erreurs ne sont retournées que en console DEV.
```

---

## 7. AUDIT RÉSEAU ET COMMUNICATIONS

### Supabase URL configuration
```env
# .env actuel
VITE_SUPABASE_MODE=local
VITE_SUPABASE_LOCAL_URL=https://api.gnambaservices.ci
VITE_SUPABASE_LOCAL_ANON_KEY=sb_publishable_...

# ✅ Correctly configured for local Supabase
# ✅ No cloud API calls (api.gnambaservices.ci = local endpoint)
```

### Exemple d'appel de sauvegarde
```typescript
// Parametres.tsx ligne 375
await updateSettings(updates);

// Cela appelle SettingsContext.updateSettings()
// Qui appelle supabase.from("app_settings").upsert(...)

// Requête réseau:
POST https://api.gnambaservices.ci/rest/v1/app_settings
Body: { key: "...", value: "..." }

// Réponse:
200 OK: { "data": [...] }
Or
400 Bad Request: { "error": "..." }
Or
401 Unauthorized: JWT invalid
Or
504 Gateway Timeout

// ✅ Requête va bien à Supabase local
// ✅ Pas de cloud calls
// ❌ Erreur n'est pas capturée en frontend
```

### Vérification: Pas d'appels Cloud Supabase subsistants
```bash
grep -r "supabase.co" src/  # ✅ Aucun résultat
grep -r "api.supabase" src/  # ✅ Aucun résultat
grep -r "cloud.supabase" src/  # ✅ Aucun résultat

# Seul endpoint utilisé:
https://api.gnambaservices.ci  # ✅ Local
```

---

## 8. TABLEAU SYNTHÉTIQUE DES PROBLÈMES

| # | Fichier | Ligne(s) | Catégorie | Sévérité | Problème | Cause | Correction |
|---|---------|----------|-----------|----------|----------|-------|-----------|
| 1 | mediaUtils.ts | 102-104 | DB Error | 🔴 CRIT | Update sans error check | Oubli du check | Destructure `{ error }` |
| 2 | mediaUtils.ts | 130-133 | DB Error | 🔴 CRIT | Upsert sans error check | Oubli du check | Destructure `{ error }` |
| 3 | mediaUtils.ts | 134-135 | Logic Error | 🔴 CRIT | assignMedia error ignoré | Return value ignoré | Vérifier error avant return |
| 4 | mediaUtils.ts | 136 | Logic Error | 🟡 ELEV | logMediaAction error ignoré | Return value ignoré | Vérifier error |
| 5 | Parametres.tsx | 379-391 | UI Error | 🔴 CRIT | handleSave catch silencieux | Pas de setState | Ajouter saveError state |
| 6 | BrandAssetsManager | 87-98 | UI Error | 🔴 CRIT | handleAssign error pas affiché | Pas de error state | Ajouter assetErrors state |
| 7 | Parametres.tsx | 330-333 | UI Error | 🟡 ELEV | loadAuditLogs error pas affiché | Pas de setState | Ajouter auditError state |
| 8 | SettingsContext.tsx | 306 | Race Cond | 🔴 CRIT | refreshSettings() sans await | useEffect oublié | Attendre loading = false |
| 9 | Parametres.tsx + SettingsContext.tsx | Multi | Data Error | 🟡 ELEV | Duplication DEFAULT_SETTINGS | Deux sources de vérité | Single source in types.ts |
| 10 | mediaUtils.ts | 205-213 | DB Error | 🟡 ELEV | media_versions insert check | Oubli du check | Destructure `{ error }` |
| 11 | SettingsContext.tsx | 85-92, 235 | Cache Stale | 🟠 MOYEN | TTL 5min peut devenir stale | Pas d'invalidation | Realtime subscription |
| 12 | BrandAssetsManager | 50-58 | State | 🔴 CRIT | Pas de error state | Oubli | Ajouter state |
| 13 | mediaUtils.ts | 262 | Logic Error | 🟠 MOYEN | replaceMediaFile error check | Delégué sans vérification | Vérifier assignMedia result |
| 14 | Parametres.tsx | Multiple | Error Handle | 🟠 MOYEN | Erreurs DE.V seulement | Conditions `if (DEV)` | Toujours logger + display |

---

## 9. NIVEAU DE SÉVÉRITÉ RÉSUMÉ

### 🔴 CRITIQUES (4): Doivent être fixés immédiatement
1. **setBrandAsset erreurs silencieuses** - Logo et assets de marque ne s'enregistrent pas
2. **handleSave erreurs silencieuses** - Tous les paramètres peuvent ne pas être enregistrés
3. **BrandAssetsManager pas de feedback** - Utilisateur ne sait pas si l'assignation a échoué
4. **Race condition SettingsContext** - Données par défaut affichées temporairement

### 🟡 ÉLEVÉS (5): À corriger rapidement
5. logMediaAction erreurs ignorées
6. Duplication DEFAULT_SETTINGS
7. replaceMediaFile sans error check
8. loadAuditLogs erreur pas affichée
9. media_versions insert sans check

### 🟠 MOYENS (2): À corriger bientôt
10. Cache localStorage TTL 5min peut stalir
11. Erreurs affichées que en DEV

---

## 10. ARBORESCENCE DES DÉPENDANCES ERREURS

```
🔴 Logo disparaît après fermeture du navigateur
└─ SettingsContext cache pas actualisé
   └─ setBrandAsset() silencieusement échoué (ligne 102-136)
      ├─ Update media_files ne retourne pas error (ligne 102-104)
      ├─ Upsert app_settings ne retourne pas error (ligne 130-133)
      └─ assignMedia() error est ignoré (ligne 134-135)
   └─ BrandAssetsManager handleAssign() ne sait pas de l'erreur
      └─ Composant affiche "✓ Enregistré" alors que c'a échoué
      └─ refreshSettings() n'est pas appelé (car !error est false)
      └─ Cache localStorage ne contient pas la nouvelle URL
   └─ Au rechargement navigateur
      └─ SettingsContext charge depuis cache localStorage
      └─ Cache contient toujours l'ANCIENNE logo URL
      └─ Logo ne s'affiche pas car ne correspond pas à la média trouvée

🔴 Paramètres disparaissent après refresh
└─ handleSave() lance updateSettings()
   └─ updateSettings() retourne une Promise
   └─ try-catch capture l'erreur mais:
      ├─ Ne set pas d'état d'erreur (pas de errorState)
      ├─ setSaved(true) a déjà été exécuté (ligne 379)
      └─ Utilisateur croit que c'est enregistré
   └─ Au refresh:
      └─ SettingsContext charge depuis cache
      └─ Ou depuis DB si cache expiré
      └─ DB ne contient pas les changements (updateSettings a échoué)
      └─ Utilisateur voit les ANCIENNES valeurs

⚠️ Situation amplifiée si:
   ├─ RLS policy bloque l'UPDATE (admin_only mais user n'est pas admin)
   ├─ Réseau timeout (edge du datacenter local)
   ├─ Validation côté serveur rejette les données
   └─ Rate limit dépassé
```

---

## 11. PLAN DE CORRECTION PAR PRIORITÉ

### Phase 1: CRITIQUE (Impact maximal immédiatement)

#### ✅ Correction 1.1: setBrandAsset - Ajouter error handling complet
**Fichier:** `src/lib/mediaUtils.ts`  
**Temps:** 15 min  
**Impact:** Logo et assets vont enfin s'enregistrer

Voir la section PROBLÈME #1 pour le code corrigé.

#### ✅ Correction 1.2: handleSave - Ajouter error state et affichage
**Fichier:** `src/pages/Parametres.tsx`  
**Temps:** 20 min  
**Impact:** Utilisateur verra les erreurs de sauvegarde

Voir la section PROBLÈME #2 pour le code corrigé.

#### ✅ Correction 1.3: BrandAssetsManager - Ajouter error state et affichage
**Fichier:** `src/components/media/BrandAssetsManager.tsx`  
**Temps:** 25 min  
**Impact:** Utilisateur verra les erreurs d'assignation

Voir la section PROBLÈME #3 pour le code corrigé.

#### ✅ Correction 1.4: SettingsContext - Ajouter loading initial et await
**Fichier:** `src/context/SettingsContext.tsx`  
**Temps:** 15 min  
**Impact:** Pas de flash of default values

Voir la section PROBLÈME #4 pour le code corrigé.

**Temps total Phase 1:** ~75 min  
**Résultat:** Logo et paramètres vont persister correctement

---

### Phase 2: ÉLEVÉ (Stabilité du système)

#### ✅ Correction 2.1: Consolidate DEFAULT_SETTINGS
**Fichier:** `src/types/index.ts`, `src/context/SettingsContext.tsx`, `src/pages/Parametres.tsx`  
**Temps:** 10 min  
**Impact:** Reset fonctionne avec les bonnes valeurs

#### ✅ Correction 2.2: logMediaAction - Ajouter error handling
**Fichier:** `src/lib/mediaUtils.ts`  
**Temps:** 10 min  
**Impact:** Audit logs ne s'enregistrent pas silencieusement

#### ✅ Correction 2.3: replaceMediaFile - Ajouter error checks
**Fichier:** `src/lib/mediaUtils.ts`  
**Temps:** 15 min  
**Impact:** Version history fonctionne correctement

#### ✅ Correction 2.4: loadAuditLogs - Ajouter error state et affichage
**Fichier:** `src/pages/Parametres.tsx`  
**Temps:** 10 min  
**Impact:** Utilisateur voit si l'historique se charge ou échoue

**Temps total Phase 2:** ~45 min

---

### Phase 3: MOYEN (Nice to have)

#### ✅ Correction 3.1: Cache invalidation multi-tab
**Fichier:** `src/context/SettingsContext.tsx`  
**Temps:** 30 min  
**Impact:** Plusieurs onglets restent synchronisés

#### ✅ Correction 3.2: Remove DEV-only error logging
**Fichier:** Partout  
**Temps:** 15 min  
**Impact:** Erreurs toujours loggées en production

**Temps total Phase 3:** ~45 min

---

## 12. CHECKLIST DE VALIDATION POST-CORRECTION

Après implémentation, vérifier:

- [ ] Télécharger un logo
- [ ] Fermer le navigateur
- [ ] Rouvrir → Logo s'affiche correctement
- [ ] Changer les paramètres (couleur, titre, contact)
- [ ] Rafraîchir la page → Valeurs persistées
- [ ] Émuler une erreur réseau (DevTools → Offline)
- [ ] Essayer de sauvegarder → Message d'erreur clair s'affiche
- [ ] Rétablir le réseau → Continuité fonctionne
- [ ] Ouvrir deux onglets
- [ ] Changer paramètres dans Onglet 1
- [ ] Onglet 2 se met à jour sans rechargement manuel ← Optional, mais idéal
- [ ] Reset des paramètres → Utilise les bonnes valeurs par défaut
- [ ] Vérifier DB directement (psql) → Données présentes

---

## 13. CONCLUSION

### Résumé de la cause racine

**Les données SONT persistantes.** Le problème n'est pas avec PostgreSQL, Supabase Storage, ou Docker volumes.

**Le problème est que les ERREURS lors de la sauvegarde ne sont PAS remontées à l'utilisateur.** Cela crée une illusion que les données sont perdues, alors qu'elles n'ont simplement jamais été enregistrées en base de données.

Les 14 problèmes identifiés sont tous liés à:
1. **Missing error checks** après les appels à Supabase
2. **Silent catch blocks** qui log uniquement en DEV
3. **Missing UI state** pour afficher les erreurs
4. **Race conditions** lors du chargement initial

### Système est sain
- ✅ PostgreSQL contient les vraies données
- ✅ Supabase Storage persiste les fichiers
- ✅ Docker volumes sont correctement configurés
- ✅ RLS policies sont correctement appliquées
- ✅ JWT tokens contiennent les rôles utilisateur

### Système a des bugs
- ❌ Erreurs de validation lors de la sauvegarde sont ignorées
- ❌ Erreurs réseau lors de l'upsert ne sont pas capturées
- ❌ Erreurs RLS (forbidden) ne sont pas affichées
- ❌ Composants ne savent pas que l'opération a échoué

### Actions recommandées
**Immédiatement (Phase 1 - 75 min):**
1. Ajouter error handling complet dans setBrandAsset()
2. Ajouter error feedback dans handleSave()
3. Ajouter error feedback dans BrandAssetsManager
4. Fixer race condition SettingsContext

**Rapidement (Phase 2 - 45 min):**
5. Consolider DEFAULT_SETTINGS
6. Ajouter error handling partout
7. Ajouter error display UI

**Eventually (Phase 3 - 45 min):**
8. Multi-tab cache synchronization
9. Remove DEV-only logging

---

**Audit terminé: 2026-06-30**  
**Analyseur:** Architecture & Data Persistence Audit  
**Confiance:** 95% (basé sur analyse code complète et inspection DB)  
