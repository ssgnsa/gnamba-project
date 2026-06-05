# 📴 Guide Mode Offline - EGS

Ce guide explique comment utiliser EGS en zone à faible connectivité (2G/3G/intermittente).

## 🎯 Architecture

```
┌─────────────────┐     WiFi/Fibre      ┌─────────────────┐
│  EGS (Cloud)    │ ◄──────────────────► │  EGS (Local)    │
│  Supabase Cloud │                      │  IndexedDB      │
└─────────────────┘                      └─────────────────┘
         │                                       │
         │         Zone sans connexion           │
         │      ┌─────────────────────┐         │
         └──────►  Mode Offline 100%  │◄────────┘
                │  • IndexedDB        │
                │  • Saisie clients   │
                │  • Photos locales   │
                └─────────────────────┘
                          │
                          ▼
                Connexion rétablie
                Sync automatique
```

## 🚀 Utilisation

### 1. Préparation au bureau (connexion stable)

```bash
# 1. Synchroniser les données essentielles
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIs..."
./scripts/sync-essential-data.sh

# 2. Vérifier que tout fonctionne
curl http://localhost:8080
```

### 2. Sur le terrain (mode offline)

L'application bascule automatiquement en mode offline :

- ✅ **Saisie clients** : Stockée dans IndexedDB
- ✅ **Fiches foncier** : Stockée localement
- ✅ **Photos** : Temporairement sur le device
- ⚠️  **Sync logos** : Fallback sur initiales SVG
- ❌ **Upload Cloud** : En attente de connexion

### 3. Retour au bureau (sync)

Les données saisies sync automatiquement :

```
IndexedDB → Supabase Cloud (quand connexion détectée)
```

## 📋 Tables synchronisées

| Table | Nb records | Usage |
|-------|-----------|-------|
| `user_profiles` | ~4 | Login offline |
| `app_settings` | ~20 | Config locale |
| `foncier_villages` | ~9 | Référentiel villages |

## 🔧 Commandes utiles

### Vérifier le statut local
```bash
# Tables locales
docker exec supabase_db_gnamba-project psql -U postgres -d postgres -c "\dt public.*"

# Compter records
./scripts/diagnose-storage.sh
```

### Forcer la sync manuellement
```bash
# Sync complet (si connexion stable)
./scripts/sync-essential-data.sh

# Sync une table spécifique
curl -s "${CLOUD_URL}/rest/v1/user_profiles?select=*" ...
```

## ⚠️ Limitations

### Données NON synchronisées
- ❌ `media_files` (trop volumineux)
- ❌ `foncier_lots` (référentiel complexe)
- ❌ Fichiers Storage (logos, documents)

### Workarounds
- Photos : Stockage local + upload retardé
- Logos : Fallback SVG avec initiales
- Documents : QR code vers version Cloud

## 🆘 Dépannage

### "Cloud inaccessible"
```bash
# Vérifier connexion
curl -I https://thykrnoqgylrbfupophs.supabase.co/rest/v1/

# Vérifier clé
echo $SUPABASE_SERVICE_ROLE_KEY | head -c 20
```

### "Table non trouvée"
```bash
# Reset Supabase local
supabase stop
supabase start
./scripts/sync-essential-data.sh
```

### Sync partielle
- Les données essentielles (users, config) sont synchronisées
- Le reste est récupéré à la connexion

## 📊 Monitoring

Dans la console navigateur (F12) :
```javascript
// Vérifier IndexedDB
(await navigator.storage.estimate()).usageDetails

// Statut connectivité
connectivityManager.getStatus()

// Forcer sync
syncEngine.trySync()
```

## 🎓 Workflow recommandé

### Matin (bureau)
1. Lancer sync : `./scripts/sync-essential-data.sh`
2. Vérifier login fonctionne
3. Partir sur le terrain

### Journée (terrain)
1. Utiliser EGS normalement
2. Données stockées automatiquement
3. Photos en local

### Soir (bureau)
1. Retour connexion WiFi
2. Sync automatique lancée
3. Vérifier données dans Dashboard Cloud

## 🔐 Sécurité

- Clé `service_role` : usage bureau uniquement
- Ne jamais committer dans git
- Rotation régulière recommandée

---

**Dernière mise à jour :** $(date +%Y-%m-%d)
**Version EGS :** Cloud-v3 + Offline Engine
