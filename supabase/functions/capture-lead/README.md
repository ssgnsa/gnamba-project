# Lead Capture Edge Function

Serverless function to capture lead data into the Supabase `leads` table.

## Endpoint

`POST https://<PROJECT_ID>.supabase.co/functions/v1/capture-lead`

## Request

```json
{
  "phone": "+225XXXXXXXXXX",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "source": "web_form",
  "source_page": "/services",
  "source_form": "contact-form",
  "consent_text": "J'accepte d'être contacté",
  "channels_optin": ["phone", "email"]
}
```

### Required Fields

- `phone` — Phone number (required)

### Optional Fields

- `first_name`, `last_name`, `email`
- `source` — Lead source (default: "web_api")
- `source_page` — Referring page
- `source_form` — Form identifier
- `consent_text` — Consent statement
- `channels_optin` — Array of opted-in channels (default: ["phone"])

## Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "phone": "+225XXXXXXXXXX",
    "created_at": "2026-05-13T15:10:11Z"
  }
}
```

**Error**

- 400 — Phone number required
- 405 — Method not allowed
- 500 — Server error

## Client-Side Usage

Update `src/lib/lead-capture.ts` to POST to the Edge Function:

```typescript
const response = await fetch('https://<PROJECT_ID>.supabase.co/functions/v1/capture-lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(leadData)
})
```
