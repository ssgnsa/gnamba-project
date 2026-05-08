# 📱 SomAgro ERP — Optimisation Mobile Complète

**Dernière mise à jour** : 3 Avril 2026  
**Statut** : ✅ **OPTIMISÉ POUR MOBILE**  
**Cible** : Android Chrome (360px - 412px), iOS Safari  
**Framework** : Next.js 14 (App Router)

---

## 📑 Table des Matières

1. [Résumé des Optimisations](#1-résumé-des-optimisations)
2. [Architecture Responsive](#2-architecture-responsive)
3. [Hooks Mobiles](#3-hooks-mobiles)
4. [Composants Optimisés](#4-composants-optimisés)
5. [CSS Mobile](#5-css-mobile)
6. [PWA & Viewport](#6-pwa--viewport)
7. [Guide d'Utilisation MobileDataCard](#7-guide-dutilisation-mobiledatacard)
8. [Guide d'Utilisation Skeleton](#8-guide-dutilisation-skeleton)
9. [Checklist d'Optimisation par Page](#9-checklist-doptimisation-par-page)
10. [Tests Mobile](#10-tests-mobile)
11. [Dépannage](#11-dépannage)

---

## 1. Résumé des Optimisations

### ✅ Optimisations Implémentées

| Catégorie          | Optimisation                                                    | Statut |
| ------------------ | --------------------------------------------------------------- | ------ |
| **Viewport**       | Meta viewport avec `userScalable: false`, `viewportFit: cover`  | ✅     |
| **Touch Targets**  | Tous les boutons ≥ 44px (recommandation Apple/Google)           | ✅     |
| **Sidebar Mobile** | Drawer responsive avec icônes et swipe-to-close                 | ✅     |
| **Header**         | Hamburger menu, padding adaptatif, textes tronqués              | ✅     |
| **MetricCard**     | Tailles adaptatives (p-3→4, text-xl→2xl)                        | ✅     |
| **ModuleShell**    | Layout flex-col→flex-row, padding responsive                    | ✅     |
| **QueryDrawer**    | Pleine largeur mobile, swipe-to-close, bouton X 44px            | ✅     |
| **CSS**            | Safe area, overscroll, scroll fluide, zoom input désactivé      | ✅     |
| **Hooks**          | `useMobile`, `useTouchDevice`, `useSwipeGesture`, `useSafeArea` | ✅     |
| **Composants**     | `MobileDataCard`, `Skeleton` pour chargement                    | ✅     |

### 📊 Métriques d'Optimisation

| Métrique              | Avant             | Après                          | Cible            |
| --------------------- | ----------------- | ------------------------------ | ---------------- |
| **Touch Target Min**  | ~32px             | 44px                           | ≥ 44px ✅        |
| **Padding Dashboard** | 24px fixe         | 12-24px responsive             | 12-24px ✅       |
| **Sidebar**           | Cachée sur mobile | Drawer avec icônes             | Fonctionnelle ✅ |
| **QueryDrawer**       | max-w-xl fixe     | Full-width mobile, sm:max-w-xl | Adaptatif ✅     |
| **Navigation**        | Aucune sur mobile | Hamburger + drawer             | ✅               |

---

## 2. Architecture Responsive

### Breakpoints Utilisés

```typescript
// hooks/useMobile.ts
const BREAKPOINTS = {
  sm: 640, // Petit mobile (paysage)
  md: 768, // Tablette
  lg: 1024, // Desktop
  xl: 1280, // Grand écran
};
```

### Stratégie Responsive

```
Mobile (< 768px)
├── Sidebar: Drawer coulissant (w-72, overlay noir)
├── Header: Hamburger menu, texte tronqué
├── MetricCard: 1 colonne, p-3, text-xl
├── ModuleShell: flex-col, p-4
├── QueryDrawer: Pleine largeur
└── Padding: 12px

Tablette (768px - 1024px)
├── Sidebar: Visible ou drawer
├── Header: Standard
├── MetricCard: 2 colonnes
└── Padding: 16px

Desktop (> 1024px)
├── Sidebar: Fixe w-72
├── Header: Complet
├── MetricCard: 3-4 colonnes
└── Padding: 24px
```

---

## 3. Hooks Mobiles

### `useMobile()`

Détecte le type d'appareil et fournit des informations contextuelles.

```typescript
import { useMobile } from '@/hooks/useMobile';

function MonComposant() {
  const {
    isMobile,       // < 768px
    isTablet,       // 768px - 1024px
    isDesktop,      // > 1024px
    isSmallMobile,  // < 375px
    isLargeMobile,  // 375px - 640px
    viewportWidth,
    breakpoints
  } = useMobile();

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {/* Contenu adaptatif */}
    </div>
  );
}
```

### `useTouchDevice()`

Détecte si l'appareil supporte le tactile.

```typescript
import { useTouchDevice } from '@/hooks/useMobile';

function MonBouton() {
  const isTouch = useTouchDevice();

  return (
    <button className={isTouch ? 'touch-friendly' : ''}>
      Cliquer
    </button>
  );
}
```

### `useSwipeGesture()`

Gère les gestes de swipe pour fermer les drawers.

```typescript
import { useRef } from 'react';
import { useSwipeGesture } from '@/hooks/useMobile';

function MonDrawer() {
  const ref = useRef<HTMLDivElement>(null);

  useSwipeGesture(
    ref,
    () => handleClose(), // Swipe left
    () => handleOpen()   // Swipe right
  );

  return <div ref={ref}>Contenu</div>;
}
```

### `useSafeArea()`

Gère les zones de sécurité pour les écrans avec encoche.

```typescript
import { useSafeArea } from '@/hooks/useMobile';

function MonHeader() {
  const safeArea = useSafeArea();

  return (
    <header style={{ paddingTop: `${safeArea.top}px` }}>
      {/* Contenu protégé de l'encoche */}
    </header>
  );
}
```

---

## 4. Composants Optimisés

### Sidebar.tsx

**Avant** :

```tsx
<aside className="hidden min-h-screen w-72 ... md:flex">
  {/* Complètement caché sur mobile! */}
</aside>
```

**Après** :

```tsx
<aside
  className={`
  fixed inset-y-0 left-0 z-50 w-72 flex-col transition-transform duration-300
  ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
  md:translate-x-0 md:relative
  ${mobileOpen ? "flex" : "hidden md:flex"}
`}
>
  {/* Drawer sur mobile, fixe sur desktop */}
  {/* Icônes pour chaque module */}
  {/* Items avec min-h-[48px] */}
</aside>
```

**Optimisations** :

- ✅ Icônes lucide-react pour chaque module
- ✅ Items 48px minimum
- ✅ Drawer avec overlay sur mobile
- ✅ Fermeture par clic sur overlay
- ✅ Labels raccourcis ("Lots" au lieu de "Elevage - Lots")

### Dashboard Layout

**Avant** :

```tsx
<main className="flex-1 px-6 pb-10 pt-6">
  <div className="sticky top-6 ...">
    {/* Header fixe avec padding wasteful */}
  </div>
</main>
```

**Après** :

```tsx
<main className="flex-1 px-3 pb-6 pt-4 sm:px-4 sm:pb-8 sm:pt-6 md:px-6 md:pb-10 md:pt-6">
  {/* Mobile header avec hamburger */}
  <div className="sticky top-0 z-30 mb-4 md:mb-6">
    <button
      onClick={() => setMobileMenuOpen(true)}
      className="md:hidden min-h-[44px]"
    >
      <Menu size={20} />
    </button>
  </div>
</main>
```

**Optimisations** :

- ✅ Padding responsive: 12px → 16px → 24px
- ✅ Hamburger menu 44px
- ✅ Sticky header top-0 (au lieu de top-6)
- ✅ Overlay noir pour fermer le drawer

### MetricCard.tsx

**Optimisations** :

```tsx
// Padding responsive
className="p-3 shadow-sm sm:p-4"

// Label texte adaptatif
<p className="text-[10px] ... sm:text-xs sm:tracking-[0.2em]">

// Valeur responsive
<p className="text-xl ... sm:text-2xl">

// Dot size adaptative
<span className="h-1.5 w-1.5 ... sm:h-2 sm:w-2" />
```

### ModuleShell.tsx

**Optimisations** :

```tsx
// Layout flex responsive
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

// Padding responsive
<section className="p-4 ... sm:p-6 md:p-8">

// Titre adaptatif
<h1 className="text-2xl ... sm:text-3xl">

// Actions avec touch targets
<button className="min-h-[44px] px-3 py-2 ... sm:px-4 sm:py-2">
```

### QueryDrawer.tsx

**Avant** :

```tsx
<div className="h-full w-full max-w-xl">
  <button className="px-3 py-2 text-xs">Fermer</button>
</div>
```

**Après** :

```tsx
<div className="flex h-full w-full flex-col sm:max-w-xl">
  {/* Swipe to close */}
  useSwipeGesture(drawerRef, () => handleClose());

  {/* Bouton X 44px */}
  <button className="min-h-[44px] min-w-[44px] p-2">
    <X size={20} />
  </button>

  {/* Contenu responsive */}
  <div className="px-4 py-4 sm:px-6 sm:py-6 pb-20 sm:pb-24">
```

**Optimisations** :

- ✅ Pleine largeur sur mobile, max-w-xl sur desktop
- ✅ Swipe-to-close (gesture left)
- ✅ Bouton X 44px au lieu de texte "Fermer"
- ✅ Textes tronqués avec `truncate`
- ✅ Padding responsive

---

## 5. CSS Mobile

### Optimisations dans `globals.css`

#### 1. Safe Area Insets

```css
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}

@supports (padding: max(0px)) {
  body {
    padding-left: max(0px, var(--sal));
    padding-right: max(0px, var(--sar));
  }
}
```

#### 2. Touch Targets Minimum

```css
@media (max-width: 768px) {
  button,
  a,
  input[type="button"],
  input[type="submit"],
  input[type="reset"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

#### 3. Prevent Zoom on Input Focus

```css
@media (max-width: 768px) {
  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="number"],
  input[type="search"],
  textarea,
  select {
    font-size: 16px !important; /* Empêche le zoom sur iOS */
  }
}
```

#### 4. Smooth Scrolling

```css
body {
  overscroll-behavior-y: contain; /* Empêche pull-to-refresh */
  -webkit-overflow-scrolling: touch; /* Scroll fluide sur iOS */
}
```

---

## 6. PWA & Viewport

### Next.js Viewport Metadata

```typescript
// app/layout.tsx
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#064e3b", // Emerald 950
};

export const metadata = {
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "SomAgro ERP",
    "format-detection": "telephone=no",
  },
};
```

**Impact** :

- ✅ Empêche le zoom accidentel
- ✅ Permet l'installation PWA
- ✅ Gère les encoches d'écran
- ✅ Theme color pour la barre d'état

---

## 7. Guide d'Utilisation MobileDataCard

### Quand Utiliser MobileDataCard

Utilisez `MobileDataCard` pour remplacer les listes/tables sur mobile (< 768px).

### Exemple d'Utilisation

```tsx
import MobileDataCard from '@/components/ui/MobileDataCard';
import { useMobile } from '@/hooks/useMobile';
import { Beef } from 'lucide-react';

function AnimalsList() {
  const { isMobile } = useMobile();
  const animals = [...]; // Vos données

  // Sur desktop: afficher la table/liste normale
  if (!isMobile) {
    return (
      <div className="space-y-3">
        {animals.map(animal => (
          <div key={animal.id} className="...">
            {/* Liste desktop */}
          </div>
        ))}
      </div>
    );
  }

  // Sur mobile: afficher des cartes
  return (
    <div className="space-y-3">
      {animals.map(animal => (
        <MobileDataCard
          key={animal.id}
          title={animal.nom}
          subtitle={animal.espece}
          fields={[
            { label: 'Lot', value: animal.lot_nom },
            { label: 'Âge', value: `${animal.age} mois` },
            { label: 'Poids', value: `${animal.poids} kg` },
            { label: 'Statut', value: animal.statut },
          ]}
          actions={
            <>
              <button onClick={() => edit(animal)}>✏️</button>
              <button onClick={() => remove(animal)}>🗑️</button>
            </>
          }
          icon={<Beef size={20} className="text-emerald-600" />}
          onClick={() => viewDetails(animal)}
        />
      ))}
    </div>
  );
}
```

### Props de MobileDataCard

| Prop        | Type                    | Requis | Description                           |
| ----------- | ----------------------- | ------ | ------------------------------------- |
| `title`     | `string`                | ✅     | Titre principal de la carte           |
| `subtitle`  | `string`                | ❌     | Sous-titre optionnel                  |
| `fields`    | `Array<{label, value}>` | ✅     | Liste des champs label/valeur         |
| `actions`   | `ReactNode`             | ❌     | Boutons d'action (edit, delete, etc.) |
| `icon`      | `ReactNode`             | ❌     | Icône affichée à gauche du titre      |
| `className` | `string`                | ❌     | Classes CSS additionnelles            |
| `onClick`   | `() => void`            | ❌     | Rend la carte cliquable               |

---

## 8. Guide d'Utilisation Skeleton

### Skeleton de Base

```tsx
import Skeleton from "@/components/ui/Skeleton";

function Chargement() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="rectangular" height="200px" />
      <Skeleton variant="circular" width="40px" height="40px" />
    </div>
  );
}
```

### MetricCardSkeleton

```tsx
import { MetricCardSkeleton } from "@/components/ui/Skeleton";

function DashboardLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### DataCardSkeleton

```tsx
import { DataCardSkeleton } from "@/components/ui/Skeleton";

function ListLoading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <DataCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### TableRowSkeleton

```tsx
import { TableRowSkeleton } from "@/components/ui/Skeleton";

function TableLoading() {
  return <TableRowSkeleton count={8} />;
}
```

---

## 9. Checklist d'Optimisation par Page

### Pages Dashboard

| Page                   | Priorité | Optimisé   | Notes                                    |
| ---------------------- | -------- | ---------- | ---------------------------------------- |
| **/dashboard**         | Haute    | ✅ Partiel | MetricCards optimisés, charts à vérifier |
| **/analytics**         | Haute    | ⏳ À faire | Graphiques SVG à optimiser               |
| **/livestock/lots**    | Haute    | ⏳ À faire | Ajouter MobileDataCard                   |
| **/livestock/animals** | Haute    | ⏳ À faire | Ajouter MobileDataCard                   |
| **/crops/fields**      | Moyenne  | ⏳ À faire | Ajouter MobileDataCard                   |
| **/inventory**         | Moyenne  | ⏳ À faire | Filtres à optimiser                      |
| **/sales**             | Moyenne  | ⏳ À faire | Ajouter MobileDataCard                   |
| **/finance**           | Moyenne  | ⏳ À faire | Ajouter MobileDataCard                   |
| **/tasks**             | Basse    | ⏳ À faire | Ajouter MobileDataCard                   |
| **/settings**          | Basse    | ⏳ À faire | Formulaires à optimiser                  |

### Template d'Optimisation Type

Pour chaque page avec liste de données :

```tsx
import { useMobile } from "@/hooks/useMobile";
import MobileDataCard from "@/components/ui/MobileDataCard";

function MaPage() {
  const { isMobile } = useMobile();
  const { data, loading } = useData();

  if (loading) return <TableRowSkeleton count={8} />;

  // Version mobile
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item) => (
          <MobileDataCard
            key={item.id}
            title={item.titre}
            subtitle={item.sous_titre}
            fields={[
              { label: "Champ 1", value: item.champ1 },
              { label: "Champ 2", value: item.champ2 },
            ]}
            actions={<button>✏️</button>}
            onClick={() => router.push(`/detail/${item.id}`)}
          />
        ))}
      </div>
    );
  }

  // Version desktop
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.id} className="...">
          {/* Liste desktop */}
        </div>
      ))}
    </div>
  );
}
```

---

## 10. Tests Mobile

### Test sur Android Chrome

1. **Outils de développement Chrome**

   ```
   F12 → Toggle Device Toolbar (Ctrl+Shift+M)
   Sélectionner: Pixel 5, Samsung Galaxy S20, etc.
   ```

2. **Test Réel sur Appareil**

   ```bash
   cd somagro-erp
   npm run dev

   # Accéder depuis le mobile
   # http://<IP_SERVEUR>:3000
   ```

3. **Tests à Effectuer**

   | Test                   | Critère de Succès               |
   | ---------------------- | ------------------------------- |
   | **Navigation Sidebar** | Drawer s'ouvre/ferme fluidement |
   | **Touch Targets**      | Tous les boutons ≥ 44px         |
   | **Scroll**             | Fluide, sans rebond excessif    |
   | **Input Focus**        | Pas de zoom automatique         |
   | **Orientation**        | Fonctionne portrait et paysage  |
   | **MetricCards**        | 1 colonne sur mobile, lisible   |
   | **QueryDrawer**        | Swipe-to-close fonctionnel      |
   | **Formulaires**        | Champs remplissables sans zoom  |

### Lighthouse Mobile Audit

```bash
# Installer Lighthouse CLI
npm install -g lighthouse

# Exécuter l'audit
lighthouse http://localhost:3000 --view --emulated-form-factor=mobile
```

**Objectifs :**

- Performance: ≥ 80
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

---

## 11. Dépannage

### Problèmes Courants

| Problème                 | Cause                               | Solution                                   |
| ------------------------ | ----------------------------------- | ------------------------------------------ |
| **Sidebar ne ferme pas** | Overlay manquant                    | Vérifier le bouton overlay dans layout.tsx |
| **Boutons trop petits**  | Missing `min-h-[44px]`              | Ajouter classe utilitaire                  |
| **Zoom sur input**       | Font-size < 16px                    | Vérifier `globals.css`                     |
| **Scroll saccadé**       | Pas de `-webkit-overflow-scrolling` | Vérifier `globals.css`                     |
| **Pull-to-refresh**      | Pas de `overscroll-behavior`        | Vérifier `body` dans `globals.css`         |
| **Safe area ignorée**    | Viewport meta manquant              | Vérifier `layout.tsx` viewport export      |

### Commands de Vérification

```bash
cd somagro-erp

# Vérifier TypeScript
npm run typecheck

# Build de production
npm run build

# Démarrer en production
npm run start
```

### Debug Mobile

```tsx
// Ajouter temporairement pour voir le breakpoint
function DebugBreakpoint() {
  const { isMobile, isTablet, isDesktop, viewportWidth } = useMobile();

  return (
    <div className="fixed bottom-2 left-2 bg-black text-white text-xs p-2 z-50">
      {isMobile ? "MOBILE" : isTablet ? "TABLET" : "DESKTOP"}({viewportWidth}px)
    </div>
  );
}
```

---

## 📚 Fichiers Créés/Modifiés

### Nouveaux Fichiers

- ✅ `hooks/useMobile.ts` — Hooks responsive
- ✅ `components/ui/MobileDataCard.tsx` — Composant carte mobile
- ✅ `components/ui/Skeleton.tsx` — Skeletons de chargement
- ✅ `app/(dashboard)/DashboardLayoutClient.tsx` — Client wrapper pour layout

### Fichiers Modifiés

- ✅ `components/dashboard/Sidebar.tsx` — Icônes, drawer mobile, touch targets
- ✅ `app/(dashboard)/layout.tsx` — Server wrapper avec requireAccess
- ✅ `app/layout.tsx` — Viewport metadata, PWA tags
- ✅ `app/globals.css` — CSS mobile optimisé
- ✅ `components/dashboard/MetricCard.tsx` — Tailles responsives
- ✅ `components/dashboard/ModuleShell.tsx` — Layout responsive
- ✅ `components/forms/QueryDrawer.tsx` — Swipe-to-close, mobile optimisé

---

## 🎯 Prochaines Étapes

### Priorité Haute

1. **Appliquer MobileDataCard aux pages Livestock, Crops, Inventory**
2. **Tester sur appareil Android réel**
3. **Optimiser les graphiques Analytics pour mobile**

### Priorité Moyenne

4. **Ajouter des skeletons de chargement à toutes les pages**
5. **Optimiser les formulaires (touch targets, validation)**
6. **Ajouter pagination ou infinite scroll**

### Priorité Basse

7. **Activer PWA complete (manifest, service worker)**
8. **Optimiser les images avec Next.js Image**
9. **Ajouter dark mode support**

---

**Document créé le** : 3 Avril 2026  
**Statut** : ✅ **OPTIMISATIONS DE BASE TERMINÉES**  
**Prochain livrable** : MobileDataCard appliqué à toutes les pages listes
