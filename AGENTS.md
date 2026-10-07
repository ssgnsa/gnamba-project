# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

EGS (Enterprise Gnamba System) is a full-stack ERP for **Gnamba Services**, a multi-service company in Côte d'Ivoire. It manages BTP/construction projects, real estate, land management, supplies, finances, HR, and documents. The UI is entirely in **French**.

Stack: React 18, TypeScript, Vite, Tailwind CSS, **Python/FastAPI (backend)**, PostgreSQL (database).

## Build and Development Commands

```powershell
npm run dev              # Start Vite dev server (localhost:5173)
npm run build            # Production build to dist/
npm run lint             # ESLint
npm run typecheck        # TypeScript type checking (tsc --noEmit -p tsconfig.app.json)
npm run preview          # Preview production build
```

### Backend Database (Python/FastAPI + Alembic)

The project uses a self-hosted Python/FastAPI backend with PostgreSQL. Database schema is managed by **alembic migrations** in the backend:

```powershell
cd backend
alembic upgrade head     # Apply all migrations
alembic revision --autogenerate -m "description"  # Create new migration
alembic downgrade -1     # Rollback last migration
```

Migrations are in `backend/alembic/versions/` as sequential Python files (18 complete migrations covering all modules).

### Docker

```powershell
docker-compose up -d     # Start the EGS frontend container only
docker-compose down      # Stop containers
```

Local PostgreSQL is managed separately (not by docker-compose.yml).

## Architecture

### No Router — State-Based Navigation

The app is a **single-page application without a router**. `App.tsx` manages navigation entirely via React state:

- `AppView` toggles between `'public'` (site vitrine) and `'dashboard'` (admin ERP).
- `dashPage` (type `Page`) selects which admin module to render from a static `dashboardPages` map.
- `publicPage` (type `PublicPage`) selects which public page to show.

All page components are eagerly imported in `App.tsx`. To add a new page, add it to the `Page` type in `Sidebar.tsx`, the `dashboardPages` map in `App.tsx`, and the `navItems` array in `Sidebar.tsx`.

### Context Providers (src/context/)

Three contexts wrap the app in this order: `AuthProvider` → `SettingsProvider` → `AppContent`.

- **AuthContext** — Local auth session via API (`/auth/me`, `/auth/refresh`), user profile from `user_profiles` table, sign in/out. Exports `hasAccess(role, module)` which enforces role-based module visibility. Roles: `admin` (all access), `gestionnaire` (most modules), `employe` (limited).
- **SettingsContext** — Loads brand settings (title, colors, logo) from `app_settings` table via API. Falls back to `media_files` brand assets for the logo. Provides `useSettings()`.
- **SiteContentContext** — Loads CMS key-value pairs from `site_content` table via API. Provides `useSiteContent().get(section, key, fallback)`.

### Data Layer

Data is fetched via a **local API client** (`src/api/client.ts`) that communicates with the Python/FastAPI backend. Each page component uses repository functions from `src/lib/dbClient.service.ts` which wrap the API client. The API client uses JWT authentication with tokens stored in localStorage.

### Key Modules

- **Page Builder** (`src/components/page-builder/`) — Visual editor for the public website. Section types (hero, text, services, gallery, etc.) are defined in `page-builder/types.ts` with typed props and defaults. Layouts are stored as JSON in the `page_layouts` table.
- **Media System** (`src/lib/mediaUtils.ts`, `src/components/media/`) — Centralized media library with file versioning (`media_versions`), usage tracking (`media_usage`), and brand asset management. Brand assets (logo, favicon, watermark) sync to `app_settings` when set.
- **Print Utilities** (`src/utils/print.ts`) — Generates printable HTML documents (Attestation de Cession Villageoise, Quittance de Loyer, Reçu de Paiement) and opens them in a new window for printing.
- **Foncier (Land Management)** (`src/pages/Foncier.tsx`) — Complex module with its own `FoncierLot` and `FoncierConfig` types for managing land lots with detailed owner/administrative data.
- **Immobilier (Real Estate)** (`src/pages/Immobilier.tsx`, `src/pages/immobilier/`) — Split into sub-tabs: Properties, Tenants, Payments, Contracts (LeaseContract).

### Types

All shared TypeScript interfaces are in `src/types/index.ts`. This includes every database entity type. API responses use these types for casting. Joined relations use `Pick<>` to type the included fields.

### Styling

Tailwind CSS with custom CSS variables `--color-primary` and `--color-secondary` set dynamically from `SettingsContext` in `App.tsx`. Colors are configurable per-deployment via `app_settings`.

### Environment Variables

Required in `.env` at the project root:

**Production:**

- `VITE_API_URL` — Backend API URL (e.g., https://api.gnamba.local/api/v1)

**Local Development:**

- `VITE_API_URL` — Local backend API URL (e.g., http://localhost:8000/api/v1)

The backend requires its own `.env` in the `backend/` folder with PostgreSQL connection details.

### Formatting Conventions

- Currency is formatted as `FCFA` (West African CFA franc) — see `formatMontant()` in `src/utils/reference.ts`.
- Dates use French locale (`fr-FR`) — see `formatDate()` and `formatDateLong()` in `src/utils/reference.ts`.
- Reference IDs are generated with `generateReference(prefix)` using the pattern `PREFIX-YYYYMMDD-RAND`.