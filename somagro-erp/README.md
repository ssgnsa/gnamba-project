# SomAgro ERP

SomAgro ERP is a Next.js 14+ (App Router) application for multi-service agricultural operations.

## Quick Start

```bash
npm install
npm run dev
```

## Environment

Create a `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Health Check

`/api/health` returns `ok` for deployment probes.

## Local Workspace Integration

Within the shared `gnamba-project` workspace:

- SomAgro local Supabase uses `55321/55322/55323/55324`
- EGS local Supabase uses `54321/54322/54323/54324`
- Root operations script: `../scripts/workspace-stack.sh`

Examples:

```bash
bash ../scripts/workspace-stack.sh somagro status
bash ../scripts/workspace-doctor.sh somagro
bash ../scripts/workspace-stack.sh somagro start-local
bash ../scripts/workspace-stack.sh somagro set-mode local
```
