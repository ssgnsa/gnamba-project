# Stabilisation production EGS - 2026-07-06

## Corrections appliquees

- Appels Edge Functions runtime retires du frontend:
  - `attestation-sign` passe par `POST /api/v1/foncier/attestations/sign`.
  - `send-payment-notification` ne passe plus par `supabase.functions.invoke`; l'appel notification est best-effort et silencieux en cas d'endpoint indisponible.
- Auth/API locale:
  - parsing des reponses API rendu tolerant aux reponses non JSON pour eviter les exceptions navigateur parasites.
  - garde `selfhosted:guard` corrige pour detecter les imports directs de `src/lib/supabase`.
- CSP:
  - retrait de `unsafe-eval` et des domaines Supabase Cloud des CSP ERP principales.
  - maintien des sources reellement utilisees: API/files Gnamba, Cloudflare Insights, Turnstile, YouTube, OneSignal, Sentry, worker/blob, Ollama local optionnel.
  - validation release enrichie pour refuser `unsafe-eval` et les hotes Supabase Cloud.
- Realtime:
  - l'abonnement Supabase Realtime est ignore en mode self-hosted afin d'eviter les erreurs console quand le client legacy est desactive.

## Verification

- `npm run typecheck`
- `npm run selfhosted:guard`
- `npx vitest run src/lib/__tests__/supabase.service.test.ts src/lib/__tests__/supabase.selfhosted.test.ts src/lib/__tests__/mediaUtils.test.ts`
- `npm run build`
- Smoke HTTP local sur `dist-local` via `vite preview`: HTML servi et point de montage React present.

## Limite connue

Le smoke navigateur avec inspection console n'a pas pu etre execute dans ce workspace car Puppeteer ne trouve aucun Chrome/Chromium installe localement.

## Rollback

Les changements sont limites aux fichiers modifies par cette stabilisation. Pour revenir en arriere, restaurer ces fichiers depuis Git ou appliquer le diff inverse de cette intervention.
