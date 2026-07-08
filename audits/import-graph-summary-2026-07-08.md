# Import Graph Summary — 2026-07-08

Generated from static analysis of `src/` imports.

Summary (auto-generated):

- Total distinct local files referenced: 179
- Total resolved import edges: 455
- Detected entry points (heuristic): 49
- Orphan files (zero inbound, excluding entry points): 43 (sample list follows)

Notable orphan files (may be legitimate tests, utilities, or truly unused):

- src/components/filebrowser/FilebrowserIframe.tsx
- src/components/NetworkStatus.tsx
- src/components/NotificationButton.tsx
- src/lib/bot-engine.ts
- src/lib/social-publish.ts
- src/lib/attestationVerification.ts
- src/lib/attestationPdfLogger.ts
- src/lib/foncierOffline.ts
- src/lib/demoMode.ts
- src/utils/validation.ts
- many `__tests__` and test files (expected)

Interpretation:

- Several UI components and library modules are not imported by other modules; some are likely used dynamically (e.g., lazy-loaded, routed pages), others may be leftovers or utilities only used in tests.
- `src/lib/attestationVerification.ts` is listed as orphan because its import sites may be dynamic or in non-resolved patterns; confirm usages (it is used by print utilities and public pages).

Next steps:

- For each orphan file, verify if it is referenced dynamically (strings, router maps, `window` usage) or truly unused. Start with these UX/infra candidates: `FilebrowserIframe.tsx`, `NetworkStatus.tsx`, `NotificationButton.tsx`, `bot-engine.ts`, `social-publish.ts`.
- Produce a small codemod to safely remove or relocate legacy modules to `archive/` when confirmed unused.

Files used to generate this summary: `/tmp/egs_imports.tsv` (intermediate).
