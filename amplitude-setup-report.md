<wizard-report>
# Amplitude post-wizard report

The wizard has completed a full integration of Amplitude analytics into the EGS Enterprise project. The `@amplitude/unified` SDK was installed and initialized in `src/main.tsx` with full autocapture, Session Replay (100% sample rate), and Guides & Surveys (engagement) enabled. Ten custom events were instrumented across authentication, foncier/attestation, immobilier, visitor registry, and marketing leads flows. User identity is wired at login and cleared at logout.

## Files changed

| File | Change |
|------|--------|
| `src/main.tsx` | Added `@amplitude/unified` import + `initAll()` with full autocapture, Session Replay, Guides & Surveys, EU data residency |
| `.env.local` | Added `VITE_AMPLITUDE_API_KEY` |
| `src/context/AuthContext.tsx` | Added `setUserId`, `identify`, `track("User Signed In")`, `track("User Signed Out")`, `reset()` on logout |
| `src/pages/public/LoginPage.tsx` | Added `track("Login Failed")` with error_code and captcha context |
| `src/data/foncier.repository.ts` | Added `track("Attestation Created")` with village and type |
| `src/utils/print.ts` | Added `track("Attestation Printed")` with type, village, and statut |
| `src/pages/public/PublicVerification.tsx` | Added `track("Attestation Verified")` for both found and not-found outcomes |
| `src/pages/RegistreVisiteur.tsx` | Added `track("Visitor Registered")` and `track("Visit Recorded")` |
| `src/pages/Leads.tsx` | Added `track("Campaign Launched")` with channel count and recipient count |
| `src/pages/immobilier/PaymentsTab.tsx` | Added `track("Rent Payment Recorded")` with payment mode and amount |

## Events instrumented

| Event | File | Properties captured |
|-------|------|---------------------|
| User Signed In | `src/context/AuthContext.tsx:283` | `access_level`, `role` |
| User Signed Out | `src/context/AuthContext.tsx:299` | _(none — lifecycle event)_ |
| Login Failed | `src/pages/public/LoginPage.tsx:157` | `error_code`, `has_captcha` |
| Attestation Created | `src/data/foncier.repository.ts:383` | `village`, `attestation_type` |
| Attestation Printed | `src/utils/print.ts:934` | `attestation_type`, `village`, `statut` |
| Attestation Verified | `src/pages/public/PublicVerification.tsx:115,127` | `lookup_method`, `found` |
| Visitor Registered | `src/pages/RegistreVisiteur.tsx:677` | `piece_type` |
| Visit Recorded | `src/pages/RegistreVisiteur.tsx:683` | `visit_type` |
| Campaign Launched | `src/pages/Leads.tsx:259` | `channel_count`, `recipient_count` |
| Rent Payment Recorded | `src/pages/immobilier/PaymentsTab.tsx:438` | `mode_paiement`, `montant` |

## Event reconciliation

**Instrumented (10 / 10):**
- User Signed In — `src/context/AuthContext.tsx`
- User Signed Out — `src/context/AuthContext.tsx`
- Login Failed — `src/pages/public/LoginPage.tsx`
- Attestation Created — `src/data/foncier.repository.ts`
- Attestation Printed — `src/utils/print.ts`
- Attestation Verified — `src/pages/public/PublicVerification.tsx`
- Visitor Registered — `src/pages/RegistreVisiteur.tsx`
- Visit Recorded — `src/pages/RegistreVisiteur.tsx`
- Campaign Launched — `src/pages/Leads.tsx`
- Rent Payment Recorded — `src/pages/immobilier/PaymentsTab.tsx`

**Covered by autocapture (0):** All approved events required custom `track()` calls — none were delegated to autocapture.

**Dropped (0):** All 10 approved events were instrumented.

## SDK configuration

- **SDK**: `@amplitude/unified` (bundles Analytics, Session Replay, Guides & Surveys)
- **Init location**: `src/main.tsx`
- **Data region**: EU (`serverZone: "EU"`, endpoint: `https://api.eu.amplitude.com`)
- **Session Replay**: enabled at `sampleRate: 1` (100%)
- **Guides & Surveys**: enabled with `engagement: {}`
- **Autocapture surfaces enabled**: attribution, pageViews, sessions, formInteractions, fileDownloads, elementInteractions, frustrationInteractions, pageUrlEnrichment, networkTracking, webVitals
- **User identify**: `setUserId` + `Identify` with `access_level` and `role` set at sign-in; `amplitude.reset()` called at sign-out

## Next steps

### Environment variable for production

The API key is read from `VITE_AMPLITUDE_API_KEY` via Vite's `import.meta.env`. This is set in `.env.local` for local development (not committed to git).

**Action required for production:** Add `VITE_AMPLITUDE_API_KEY` (use the value from your `.env.local`) to your deployment platform's environment variable settings. For Vercel: Project Settings → Environment Variables. For Docker/self-hosted: set in your `.env.production` or container environment.

Note: Vite public env vars (prefixed `VITE_`) are bundled into the client — the Amplitude browser key is intentionally public and safe to expose this way.

### Analytics dashboard

Chart and dashboard creation is deferred to the `amplitude-wizard dashboard` command, which runs once events have been ingested. Run it after your first authenticated session in the app.

### Agent skill

The skill files used by the wizard are in `.claude/skills/` — they provide context for further agent-assisted development with Claude Code.
</wizard-report>
