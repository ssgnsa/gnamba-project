# Audit Dashboard - Re-render Infini

## Date
2026-07-17

## Problème Identifié
Clignotement de la carte "Analyste Données" causé par un re-render infini dans le module Dashboard.

## Analyse Initiale

### Fichiers Analysés
1. `/src/pages/Dashboard.tsx` - Composant principal
2. `/src/components/dashboard/KPICard.tsx` - Composant carte KPI
3. `/src/components/dashboard/AlertsWidget.tsx` - Widget alertes
4. `/src/components/dashboard/RevenueChart.tsx` - Graphique revenus
5. `/src/components/dashboard/CategoryDonutChart.tsx` - Graphique donut
6. `/src/lib/assistant-egs/agents.ts` - Agents IA (AnalyticsAgent = "Analyste Données")
7. `/src/components/AICopilot.tsx` - Copilote IA
8. `/src/context/AuthContext.tsx` - Contexte d'authentification

### Cause Racine Suspectée

**BOUCLE DE RE-RENDER DÉTECTÉE** dans `/src/pages/Dashboard.tsx` :

```typescript
// Ligne 176-202 : checkServicesStatus dépend de serviceLinks
const checkServicesStatus = useCallback(async () => {
  const updatedServices = await Promise.all(
    serviceLinks.map(async (service) => { ... })
  );
  setServices(updatedServices);  // ← Change l'état "services"
}, [serviceLinks]);  // ← Dépend de serviceLinks

// Ligne 153-164 : serviceLinks est un useMemo
const serviceLinks = useMemo(() => {
  if (!isProduction) return SERVICES_LINKS;
  return SERVICES_LINKS.filter((service) => { ... });
}, [isProduction]);

// Ligne 204-454 : fetchData dépend de checkServicesStatus
const fetchData = useCallback(async () => {
  // ... logique de chargement ...
  
  // Ligne 453 : Appel à checkServicesStatus à la fin !
  checkServicesStatus();
}, [canViewFinances, checkServicesStatus]);

// Ligne 456-459 : useEffect avec DOUBLE dépendance
useEffect(() => {
  fetchData().catch(() => setLoading(false));
  checkServicesStatus();  // ← Appelé ici AUSSI
}, [fetchData, checkServicesStatus]);  // ← Dépend des deux fonctions
```

### Scénario de la Boucle

1. `useEffect` se déclenche
2. `fetchData()` est appelé
3. `fetchData()` charge les données puis appelle `checkServicesStatus()` (ligne 453)
4. `checkServicesStatus()` fait des requêtes HTTP et appelle `setServices(updatedServices)`
5. `setServices()` change l'état → **re-render**
6. Le re-render recalcule `serviceLinks` (même s'il est identique)
7. `checkServicesStatus` est recréé car `serviceLinks` a changé de référence
8. Le `useEffect` se redéclenche car `checkServicesStatus` a changé
9. **Retour à l'étape 2 → BOUCLE INFINIE**

### Problèmes Identifiés

1. **Double appel** : `checkServicesStatus()` est appelé à la fois dans `fetchData()` ET dans le `useEffect`
2. **Dépendances circulaires** : 
   - `useEffect` → dépend de `fetchData` et `checkServicesStatus`
   - `fetchData` → dépend de `checkServicesStatus`
   - `checkServicesStatus` → appelle `setServices` → re-render → recalcul des callbacks
3. **`serviceLinks` useMemo** pourrait recréer un nouveau tableau à chaque render même si le contenu est identique (comparaison par référence)

### Hypothèse Complémentaire

Le clignotement de "Analyste Données" pourrait aussi être lié à :
- Le composant `AICopilot` qui utilise `activePage` comme prop
- Des `setTimeout` dans `AICopilot.tsx` (ligne 533)
- Mais ces éléments semblent secondaires par rapport à la boucle principale

## Prochaines Étapes

1. ✅ Instrumenter le code avec console.log pour confirmer
2. ✅ Analyser les logs et identifier la cause racine
3. 🔄 Appliquer la correction minimale
4. Valider que le tableau de bord est stable
5. Vérifier les performances (CPU, mémoire, FPS)
6. Nettoyer les logs temporaires
7. Générer le rapport final

## Instrumentation Appliquée

Les logs suivants ont été ajoutés :
- Dashboard.tsx : render, serviceLinks recalculation, checkServicesStatus, fetchData, useEffect
- KPICard.tsx : render avec label
- AlertsWidget.tsx : render avec nombre d'alertes

## Correction Proposée

**Solution 1 (RECOMMANDÉE)** : Retirer l'appel redondant à `checkServicesStatus` dans le `useEffect`

Le `useEffect` appelle déjà `fetchData()` qui lui-même appelle `checkServicesStatus()` à la fin.
Il n'est donc PAS nécessaire d'appeler `checkServicesStatus()` une deuxième fois dans le `useEffect`.

```typescript
// AVANT (DOUBLE APPEL)
useEffect(() => {
  fetchData().catch(() => setLoading(false));
  checkServicesStatus();  // ← REDONDANT !
}, [fetchData, checkServicesStatus]);

// APRÈS (CORRECTION)
useEffect(() => {
  fetchData().catch(() => setLoading(false));
}, [fetchData]);
```

**Solution 2 (ALTERNATIVE)** : Retirer l'appel dans `fetchData` et ne garder que celui du `useEffect`

Mais cela implique que le bouton "Actualiser" ne rafraîchira plus le statut des services.

**Solution 3 (SI NÉCESSAIRE)** : Mémoïser `serviceLinks` avec une comparaison profonde

Mais normalement, `useMemo` avec `isProduction` devrait suffire si on corrige le double appel.
