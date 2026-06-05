# Lead Capture API Fix - May 13, 2026

## Problem
The application was receiving repeated **405 Method Not Allowed** errors when attempting to submit leads via `/api/capture-lead`.

**Root Cause**: The endpoint was never actually implemented. The client-side code attempted to POST to a local API endpoint that didn't exist, and Nginx had no route configured to handle it.

## Solution
Implemented a **Supabase Edge Function** (`capture-lead`) that:
- ✅ Accepts POST requests with lead data
- ✅ Validates required fields (phone number)
- ✅ Captures client IP from request headers
- ✅ Inserts lead into Supabase `leads` table
- ✅ Handles CORS properly for cross-origin requests
- ✅ Returns proper HTTP status codes (200, 400, 405, 500)

## Files Changed

### New Files
- `supabase/functions/capture-lead/index.ts` — Edge Function handler (Deno)
- `supabase/functions/capture-lead/deno.json` — Function dependencies
- `supabase/functions/capture-lead/README.md` — API documentation

### Modified Files
- `src/lib/lead-capture.ts` — Updated client-side code to POST to Supabase Edge Function instead of local endpoint

## Deployment

### Prerequisites
- Ensure `leads` table exists in Supabase with RLS policies allowing inserts
- Supabase CLI must be installed

### Steps

1. **Deploy Edge Function**
   ```bash
   supabase functions deploy capture-lead
   ```

2. **Verify Deployment**
   ```bash
   curl -X POST https://<PROJECT_ID>.supabase.co/functions/v1/capture-lead \
     -H "Content-Type: application/json" \
     -d '{"phone": "+225XXXXXXXXXX", "first_name": "Test"}'
   ```

3. **Rebuild Frontend**
   ```bash
   npm run build
   docker-compose build --no-cache egs-frontend
   ```

4. **Deploy to Production**
   ```bash
   docker-compose up -d
   ```

## Testing

The lead capture now works through:

1. **Public website forms** — Auto-intercepted via `initLeadCapture()`
2. **Direct API calls** — POST to `https://<SUPABASE_URL>/functions/v1/capture-lead`

### Test Form Submission
Fill and submit any form on the public site with a phone number and the lead-capture-consent checkbox checked.

## Error Messages (Resolved)
- ~~`POST /api/capture-lead 405 (Method Not Allowed)`~~ → Now properly handled
- ~~`Invalid Refresh Token: Refresh Token Not Found`~~ → Separate auth issue (unrelated to capture-lead)

## Related Issues
- **CSP Header Malformed** — Separate issue requiring nginx.conf update
- **Auth Token Failure** — Requires Supabase session investigation
