# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

EGS (Enterprise Gnamba System) is a full-stack ERP for **Gnamba Services**, a multi-service company in Côte d'Ivoire. It manages BTP/construction projects, real estate, land management, supplies, finances, HR, and documents. The UI is entirely in **French**.

Stack: React 18, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL + Auth + Storage).

## Build and Development Commands

```powershell
npm run dev              # Start Vite dev server (localhost:5173)
npm run build            # Production build to dist/
npm run lint             # ESLint
npm run typecheck        # TypeScript type checking (tsc --noEmit -p tsconfig.app.json)
npm run preview          # Preview production build
```

### Supabase (database)

```powershell
supabase start           # Start local Supabase services
supabase stop            # Stop local services
supabase db push         # Apply migrations from supabase/migrations/
supabase db dump -f backup.sql  # Export database
```

Migrations are in `supabase/migrations/` as sequential SQL files. The schema uses RLS (Row Level Security) on all tables.

In this shared workspace:

- EGS owns `supabase/migrations/`
- SomAgro owns `somagro-erp/supabase/migrations/`
- Do not mix the two migration chains

### Docker

```powershell
docker-compose up -d     # Start the EGS frontend container only
docker-compose down      # Stop containers
```

Local Supabase is managed by `supabase start` / `supabase stop`, not by `docker-compose.yml`.

## Architecture

### No Router — State-Based Navigation

The app is a **single-page application without a router**. `App.tsx` manages navigation entirely via React state:

- `AppView` toggles between `'public'` (site vitrine) and `'dashboard'` (admin ERP).
- `dashPage` (type `Page`) selects which admin module to render from a static `dashboardPages` map.
- `publicPage` (type `PublicPage`) selects which public page to show.

All page components are eagerly imported in `App.tsx`. To add a new page, add it to the `Page` type in `Sidebar.tsx`, the `dashboardPages` map in `App.tsx`, and the `navItems` array in `Sidebar.tsx`.

### Context Providers (src/context/)

Three contexts wrap the app in this order: `AuthProvider` → `SettingsProvider` → `AppContent`.

- **AuthContext** — Supabase auth session, user profile from `user_profiles` table, sign in/out. Exports `hasAccess(role, module)` which enforces role-based module visibility. Roles: `admin` (all access), `gestionnaire` (most modules), `employe` (limited).
- **SettingsContext** — Loads brand settings (title, colors, logo) from `app_settings` table. Falls back to `media_files` brand assets for the logo. Provides `useSettings()`.
- **SiteContentContext** — Loads CMS key-value pairs from `site_content` table. Provides `useSiteContent().get(section, key, fallback)`.

### Data Layer

There is no API layer or data-fetching abstraction. Each page component directly calls `supabase.from('table')` for queries, inserts, updates, and deletes. The Supabase client is initialized in `src/lib/supabase.ts` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`.

### Key Modules

- **Page Builder** (`src/components/page-builder/`) — Visual editor for the public website. Section types (hero, text, services, gallery, etc.) are defined in `page-builder/types.ts` with typed props and defaults. Layouts are stored as JSON in the `page_layouts` table.
- **Media System** (`src/lib/mediaUtils.ts`, `src/components/media/`) — Centralized media library with file versioning (`media_versions`), usage tracking (`media_usage`), and brand asset management. Brand assets (logo, favicon, watermark) sync to `app_settings` when set.
- **Print Utilities** (`src/utils/print.ts`) — Generates printable HTML documents (Attestation de Cession Villageoise, Quittance de Loyer, Reçu de Paiement) and opens them in a new window for printing.
- **Foncier (Land Management)** (`src/pages/Foncier.tsx`) — Complex module with its own `FoncierLot` and `FoncierConfig` types for managing land lots with detailed owner/administrative data.
- **Immobilier (Real Estate)** (`src/pages/Immobilier.tsx`, `src/pages/immobilier/`) — Split into sub-tabs: Properties, Tenants, Payments, Contracts (LeaseContract).

### Types

All shared TypeScript interfaces are in `src/types/index.ts`. This includes every database entity type. Supabase queries use these types for casting responses. Joined relations use `Pick<>` to type the included fields.

### Styling

Tailwind CSS with custom CSS variables `--color-primary` and `--color-secondary` set dynamically from `SettingsContext` in `App.tsx`. Colors are configurable per-deployment via `app_settings`.

### Environment Variables

Required in `.env` at the project root:

**Cloud Mode (Default):**

- `VITE_SUPABASE_URL` — Supabase Cloud API URL
- `VITE_SUPABASE_ANON_KEY` — Supabase Cloud anonymous key

**Local Mode (Development):**

- `VITE_SUPABASE_LOCAL_URL` — Supabase Local URL (http://localhost:54321)
- `VITE_SUPABASE_LOCAL_ANON_KEY` — Supabase Local anonymous key
- `POSTGRES_PASSWORD` — Local PostgreSQL password
- `JWT_SECRET` — JWT secret for local Supabase (min. 32 characters)

**Switching Modes:**

- Copy `.env.local.example` to `.env` for local development
- Copy `.env.example` to `.env` for cloud/production
- Ensure `VITE_SUPABASE_MODE` matches the chosen mode
- Rebuild container after switching: `docker-compose build --no-cache egs-frontend`

See `README.md` for the current mode and local development instructions.

### Formatting Conventions

- Currency is formatted as `FCFA` (West African CFA franc) — see `formatMontant()` in `src/utils/reference.ts`.
- Dates use French locale (`fr-FR`) — see `formatDate()` and `formatDateLong()` in `src/utils/reference.ts`.
- Reference IDs are generated with `generateReference(prefix)` using the pattern `PREFIX-YYYYMMDD-RAND`.
