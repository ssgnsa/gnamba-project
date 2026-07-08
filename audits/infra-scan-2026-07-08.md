# Infra & CI Scan — 2026-07-08

Objective: detect legacy envs, hosts, and build-args that could reintroduce alternate runtime paths (Supabase local, localhost ports, legacy hosts).

Key findings (representative):

- Many scripts and docs still refer to `VITE_SUPABASE_*` variables and `localhost:54321` (e.g., `fix-restart.sh`, `rebuild-fix.sh`, `startup.sh`, CI workflows, smoke tests).
- `.env` and CI workflows set `VITE_API_URL` and `VITE_LOCAL_API_URL` to `https://api.gnambaservices.ci` — good canonical API in place.
- Several helper scripts and deployment helpers still pass `VITE_SUPABASE_*` as build args to `docker build` (e.g., `rebuild-fix.sh`, `fix-nginx-now.sh`, `rebuild-and-run.sh`).
- GitHub Actions workflows (`.github/workflows/deploy.yml`, `deploy-supabase-functions.yml`) reference Supabase secrets and set `VITE_SUPABASE_LOCAL_URL` in environment for jobs.
- `supabase/` directory contains Edge Functions and migration scripts; these are active code that must be isolated from production builds.

Risk & recommendation summary:

1. Remove or neutralize `VITE_SUPABASE_*` build args in production build flows. Replace with canonical `VITE_API_URL`, `VITE_STORAGE_BASE_URL`, and `VITE_AUTH_DOMAIN` as needed.
2. Move `supabase/` folder to `archive/supabase/` and update documentation to reference the archive. Ensure CI does not copy `supabase/` into production images.
3. Update scripts in `scripts/` and root-level `*.sh` to avoid defaulting to `localhost:54321` for production runs — require explicit opt-in for local dev only.
4. Update `.github/workflows/*` to remove Supabase-specific environment unless the workflow targets migration or Supabase functions exclusively. Use dedicated workflow for that purpose with strict approvals.
5. Add a prebuild release-check step in CI to fail the build if `VITE_SUPABASE_*` are passed to production builds or if `localhost:54321` appears in `dist/` assets.

Files of interest (examples):

- `.github/workflows/deploy.yml`
- `rebuild-fix.sh`, `rebuild-and-run.sh`, `fix-restart.sh`, `fix-nginx-now.sh`, `startup.sh`
- `scripts/validate-frontend-release.sh`, `scripts/*supabase*.sh`
- `supabase/` directory (functions, migrations)

Actionable next steps:

- I can prepare an automated patch that:
  - Replaces `--build-arg VITE_SUPABASE_*` with `--build-arg VITE_LOCAL_API_URL` and documents the change.
  - Moves `supabase/` to `archive/supabase/` and updates README references.
  - Adjusts CI environment sections to remove unconditional `VITE_SUPABASE_LOCAL_URL` exposure.

Confirm if you want me to: (1) produce the remediation patch now, or (2) create a detailed list of all occurrences for manual review.
