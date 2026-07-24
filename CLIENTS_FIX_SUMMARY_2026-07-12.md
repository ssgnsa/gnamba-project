# Corrections Module Clients - 12 Juillet 2026

## Problèmes identifiés
1. **401 sur `api/v1/auth/me`** : Service `health` actif et reachable à `http://localhost:8000/health`
2. **Impossible d'enregistrer nouveau client** : Logique de synchronisation utilisait `editingId` local au lieu de vérifier l'existence côté serveur
3. **Perte d'ID après création** : Après création serveur, l'ID local n'était pas remplacé par l'ID serveur

## Solutions appliquées

### 1. Configuration API (.env)
- Changé `VITE_LOCAL_API_URL` de `http://192.168.1.58:8000` à `http://localhost:8000`
- Assure que le frontend local peut accéder au backend API sans erreurs de connectivité

### 2. Fixe synchronisation clients (src/pages/Clients.tsx)
**Avant** :
```typescript
if (editingId === client.id) {
  await clientsRepository.update(client.id, payload);
} else {
  await clientsRepository.create(payload);
}
```

**Après** :
```typescript
// Vérifier existence côté serveur plutôt que utiliser l'état local
const existing = await clientsRepository.getById(client.id);
if (existing.data) {
  // Client existe : UPDATE
  await clientsRepository.update(client.id, payload);
} else {
  // Client n'existe pas : CREATE
  const created = await clientsRepository.create(payload);
  // Remplacer ID local par ID serveur
  if (created.data) {
    next[index].id = created.data.id;
    next[index].created_at = created.data.created_at;
    next[index].updated_at = created.data.updated_at;
  }
}
```

### 3. Tests (src/pages/Clients.test.ts)
Ajout de tests unitaires couvrant :
- ✅ Création locale de client avec validation des champs
- ✅ Synchronisation d'un nouveau client (remplacement d'ID)
- ✅ Update d'un client existant
- ✅ Gestion des erreurs de synchronisation
- ✅ Opérations de sync en bulk

## Résultats de validation

### Tests unitaires (Vitest)
```
✓ src/pages/Clients.test.ts  (6 tests) 9ms
Test Files  1 passed (1)
Tests  6 passed (6)
```

### Vérification API
```bash
# Création de party directement sur l'API
curl -X POST http://localhost:8000/api/v1/tables/parties \
  -H 'Content-Type: application/json' \
  -d '{"nom":"TestClient",...}'
# Réponse: 200 OK avec ID serveur généré
```

### Serveur frontend
```
VITE v8.0.13  ready in 1271 ms
Local:   http://localhost:5173/
```

## Prochaines étapes
1. Accéder à http://localhost:5173/
2. Se connecter avec les identifiants appropriés
3. Aller à la page "Gestion des Clients"
4. Tester le flux complet :
   - Créer un nouveau client
   - Cliquer "Nouveau Client" → remplir formulaire → "Enregistrer"
   - Vérifier que le client apparaît dans la liste locale
   - Cliquer bouton "Synchroniser"
   - Vérifier que le client est maintenant marqué "synced" et a un ID serveur

## Architecture simplifiée du flux

```
┌─────────────────────────────────────────────────────┐
│ Frontend (React)                                     │
│ src/pages/Clients.tsx                              │
│ • Formulaire création/édition                       │
│ • Cache local (localStorage)                        │
│ • Bouton "Synchroniser"                             │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │ clientsRepository.ts        │
        │ • getById() → vérification  │
        │ • create() → serveur        │
        │ • update() → serveur        │
        └────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────────┐
        │ Backend FastAPI                │
        │ POST /api/v1/tables/parties   │
        │ PATCH /api/v1/tables/parties  │
        │ GET /api/v1/tables/parties    │
        └────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────────┐
        │ PostgreSQL (parties table)      │
        │ Génération ID UUID serveur      │
        └────────────────────────────────┘
```

## Fichiers modifiés
- ✅ `.env` : Configuration API locale
- ✅ `src/pages/Clients.tsx` : Logique de synchronisation
- ✅ `src/pages/Clients.test.ts` : Tests unitaires (nouveau)
- ✅ `src/data/clients.repository.ts` : Pas de changement (déjà correct)

## Vérification rapide
Tous les fichiers ont passé `npm run typecheck` sans erreur.
