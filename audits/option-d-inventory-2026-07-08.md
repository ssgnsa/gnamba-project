# OPTION D — Initial Inventory

Date: 2026-07-08
Scope: repository-wide preliminary inventory to start the full "Zero Legacy" audit.

## Executive summary

- Primary runtime stack in the frontend has been migrated to a single API surface: `apiClient` + `/api/v1` endpoints.
- Legacy Supabase artifacts remain in `supabase/` (migrations, functions, templates) and in many docs and scripts. These are archival/operational materials but risk "legacy leakage" if not isolated from production release assets.
- Direct `fetch()` usages in `src/` largely target external services (Filebrowser, Ollama, LinkedIn/X, MessageBird, YouTube, Sentry). Internal `/api/v1` calls are centralized.

## Key findings (supabase occurrences)

Files and areas containing `supabase` references (representative, not exhaustive):

- README.md — multiple references to Supabase local/cloud usage and environment variables.
- supabase/ — full folder containing:
  - `supabase/migrations/` (schema snapshot)
  - `supabase/functions/` (Edge Functions using `@supabase/supabase-js` and Deno)
  - `supabase/seed/` (seed data)
  - function templates and migration helpers (PHASE_2_MIGRATION_TEMPLATE.md)
- Scripts referencing Supabase and env vars:
  - `rebuild-and-run.sh`
  - `final_remediation_plan.sh`
  - `reset_supabase.sh`
  - `test-build.sh`
- Docs and HOWTOs:
  - `SUPABASE_LOCAL_SOLUTION.md`
  - `POSTGRES_LOCAL_SETUP.md`
  - `CORS_FIX_SUMMARY.md`
  - various audit/analysis markdown files (historical)
- Docker / CI references (build args / env): `rebuild-and-run.sh`, `Dockerfile*` and CI scripts may use `VITE_SUPABASE_*` build-args.

## Runtime risk assessment

- Runtime frontend code (bundled into `dist`) does not currently appear to call Supabase endpoints directly — `release-check` previously passed for forbidden patterns in `dist/`.
- The `supabase/` tree contains active code (Edge Functions) that, if deployed or re-enabled, could reintroduce an alternate runtime path. These must be treated as archival and removed from release routes or moved to an `archive/` location until migrated.
- Scripts and README references to local Supabase may cause operators to start a local Supabase stack accidentally; CI/build must not reference these in production pipelines.

## Immediate recommendations (short term)

1. Isolate the `supabase/` directory from the main release tree by moving it to `archive/supabase/` (preserve git history). Prevent `supabase` artifacts from being copied into `dist` or Docker image.
2. Replace `VITE_SUPABASE_*` build-args and docs in production CI with explicit warnings and gated operations (only used in local dev): do not pass them in production build pipelines.
3. Generate an import graph (madge/ts-morph) to find orphan modules, unused pages, and cycles.
4. Run a targeted static security scan for OWASP patterns and secret literals (already started: forbidden pattern greps).
5. Start the full Auth audit (token storage, refresh flow, revocation, roles) — see next steps.

## Next automated actions I propose to run now (confirmable):

- Create an import graph of `src/` and list orphan files and largest modules.
- Scan `Dockerfile*`, `docker-compose*.yml`, CI files and `nginx.conf` for `VITE_SUPABASE` or legacy host references and produce a remediation patch plan.
- Produce a per-module inventory (list of files by module: Foncier, Immobilier, Comptabilité, CRM, RH, Documents) to kick off domain audits.

## Notes & provenance

- This inventory was generated from repository greps and file inspections on 2026-07-08.
- It is an initial baseline for Option D; further dynamic verification and runtime tests are required.

---

Prepared by: Audit automation — initial pass
