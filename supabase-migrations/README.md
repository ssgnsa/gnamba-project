Legacy source for historical SQL files during the migration cleanup.

- `supabase-migrations/egs/` belongs to EGS.
- `supabase-migrations/somagro/` belongs to SomAgro.

Rules:

- Use `supabase/migrations/` with Supabase CLI for EGS.
- Use `somagro-erp/supabase/migrations/` with Supabase CLI for SomAgro.
- Use `npm run supabase:migrations:sync` only for EGS.
