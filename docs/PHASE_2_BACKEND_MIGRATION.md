# Phase 2: Backend Edge Functions Refactoring

## Overview

After completing **Option A** (frontend Supabase removal), Phase 2 focuses on migrating the 9 Supabase Edge Functions to a fully self-hosted architecture using PostgreSQL directly.

## Current Architecture

```
Frontend (React)           Backend (Edge Functions)      Database
├─ apiClient ─────────►   ├─ attestation-verify        ┌─ PostgreSQL
├─ legacyAdapter  ┐        ├─ attestation-sign          │
└─ (self-hosted)  │        ├─ auto-assign-agent         │
                  │        ├─ calculate-lead-score      │
                  │        ├─ capture-lead              │
                  │        ├─ create-user-with-profile │
                  │        ├─ send-payment-notification │
                  │        ├─ send-welcome-message      │
                  │        └─ verify-turnstile          │
                  │
                  └────────► Uses: @supabase/supabase-js
```

## Phase 2 Goals

1. **Remove Supabase client** from all 9 Edge Functions
2. **Implement PostgreSQL direct access** using Deno native drivers
3. **Maintain API compatibility** with existing frontend calls
4. **Add error handling & retry logic** for network resilience
5. **Validate in staging** before production deployment

## Functions to Migrate (9 total)

### Priority 1: Core Data Access (4 functions)
- `attestation-verify/index.ts` — Queries `v_foncier_attestation_verification` table
- `auto-assign-agent/index.ts` — Query and update operations
- `create-user-with-profile/index.ts` — User creation with transaction
- `calculate-lead-score/index.ts` — Analytics/scoring logic

### Priority 2: Notifications & Communication (3 functions)
- `send-payment-notification/index.ts` — Email/SMS notifications
- `send-welcome-message/index.ts` — Onboarding messages
- `capture-lead/index.ts` — Lead tracking

### Priority 3: Crypto & Validation (2 functions)
- `attestation-sign/index.ts` — Digital signature generation
- `verify-turnstile/index.ts` — Captcha verification (minimal DB access)

## Implementation Strategy

### Step 1: PostgreSQL Module (DONE)
✅ Created `supabase/functions/_shared/db.ts` with:
- `QueryBuilder` class mimicking Supabase API
- `.select()`, `.eq()`, `.order()`, `.limit()`, `.maybeSingle()`
- Direct PostgreSQL connection using Deno drivers

### Step 2: Function Migration Template

Replace Supabase client pattern:
```typescript
// OLD (Supabase)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
const supabase = createClient(url, key);
const { data, error } = await supabase.from("table").select("*").eq("id", 1);

// NEW (PostgreSQL Direct)
import { from } from "../_shared/db.ts";
const { data, error } = await from("table").select("*").eq("id", 1).maybeSingle();
```

### Step 3: Refactor Functions (Sequential)

#### Iteration 1: attestation-verify (PoC)
1. Replace `createClient()` with PostgreSQL connection
2. Update query patterns to use `QueryBuilder`
3. Test with staging database
4. Validate cryptography logic remains intact

#### Iteration 2-9: Remaining Functions
Follow same pattern with decreasing complexity

### Step 4: Environment Configuration

Add to `supabase/config.toml` or `.env` (for local development):
```bash
DATABASE_URL=postgres://user:pass@localhost:5432/egs
# OR individual components:
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=egs
```

For Deno Edge Functions (Supabase hosted or local):
```bash
# Set secrets via Supabase dashboard or:
supabase secrets set DATABASE_URL "postgres://..."
```

## Testing Strategy

### Unit Tests
- Test QueryBuilder with mock data
- Verify error handling (connection failures, timeouts)
- Validate query construction

### Integration Tests
- Run functions against local PostgreSQL
- Test with real data (anonymized)
- Measure performance vs Supabase

### Staging Validation
- Deploy to staging environment
- Run 24h observation period
- Monitor error logs and response times

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Connection pool exhaustion | Implement connection reuse and timeout handling |
| Query performance degradation | Add database indexing where needed, profile queries |
| Transaction failures | Implement retry logic with exponential backoff |
| Secrets exposure | Use environment variables with restricted access |
| Lateral attacks | Validate all inputs, use parameterized queries |

## Rollback Plan

1. Keep Supabase client available during migration
2. Use feature flags to toggle between implementations
3. Maintain both code paths until 100% confident
4. Full revert possible within 24 hours

## Success Criteria

- ✅ All 9 functions migrated and tested
- ✅ 59 tests pass (frontend tests remain green)
- ✅ Zero Supabase imports in `supabase/functions/`
- ✅ Performance metrics within 10% of current
- ✅ 7-day production validation period without critical errors
- ✅ Documentation updated

## Timeline Estimate

- Week 1: PoC + Iteration 1 (attestation-verify)
- Week 2: Iterations 2-5 (remaining Priority 1)
- Week 3: Iterations 6-8 (Priority 2)
- Week 4: Iteration 9 + Staging validation
- Week 5: Production deployment + Monitoring

## Notes

- PostgreSQL module uses `@deno/postgres` for Deno compatibility
- Fallback to `postgres` via esm.sh if native unavailable
- Transaction support needed for `create-user-with-profile`
- Consider implementing connection pooling for high-load scenarios

---

**Phase 1 Status**: ✅ COMPLETE (PR #4)
**Phase 2 Status**: 📋 PLANNING
