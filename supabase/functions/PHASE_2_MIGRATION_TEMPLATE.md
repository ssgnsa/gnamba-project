/**
 * PHASE 2 MIGRATION TEMPLATE
 * 
 * Replace Supabase client with PostgreSQL direct access
 * All 9 Edge Functions follow this pattern
 */

// ✅ OLD (Supabase pattern - REMOVE THIS)
// ====================================================
/*
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

// Query
const { data, error } = await supabase
  .from("table_name")
  .select("col1, col2")
  .eq("id", 1)
  .maybeSingle();

// Insert
const { error: insertError } = await supabase
  .from("table_name")
  .insert({ col1: "value", col2: 123 });

// Update
const { error: updateError } = await supabase
  .from("table_name")
  .update({ col1: "new_value" })
  .eq("id", 1);

// RPC (stored procedure)
const { data: rpcData } = await supabase.rpc("function_name", { param: "value" });
*/

// ✅ NEW (PostgreSQL pattern - USE THIS)
// ====================================================
import { from as queryFrom } from "../_shared/db.ts";

// Query (SELECT)
const result = await queryFrom("table_name")
  .select("col1, col2")
  .eq("id", 1)
  .maybeSingle();
const { data, error } = result;

// Insert (basic INSERT)
// For now, use raw SQL via executeQuery - RPC pattern coming
// TODO: Implement INSERT builder in db.ts

// Update (UPDATE)
// TODO: Implement UPDATE builder in db.ts

// RPC (stored procedure)
// TODO: Implement RPC wrapper in db.ts

// ====================================================
// MIGRATION STEPS FOR EACH FUNCTION
// ====================================================

/**
 * STEP 1: Replace Imports
 * 
 * FROM:
 *   import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
 * 
 * TO:
 *   import { from as queryFrom } from "../_shared/db.ts";
 */

/**
 * STEP 2: Remove Client Initialization
 * 
 * REMOVE:
 *   const supabaseUrl = Deno.env.get("SUPABASE_URL");
 *   const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 *   const supabase = createClient(supabaseUrl, serviceRoleKey, {
 *     auth: { persistSession: false }
 *   });
 * 
 * Note: PostgreSQL connection is handled by _shared/db.ts
 * Environment vars: DATABASE_URL or POSTGRES_* (checked in db.ts)
 */

/**
 * STEP 3: Replace SELECT Queries
 * 
 * FROM:
 *   const { data, error } = await supabase
 *     .from("users")
 *     .select("id, email, role")
 *     .eq("role", "admin")
 *     .order("created_at", { ascending: false })
 *     .limit(10)
 *     .maybeSingle();
 * 
 * TO:
 *   const { data, error } = await queryFrom("users")
 *     .select("id, email, role")
 *     .eq("role", "admin")
 *     .order("created_at", { ascending: false })
 *     .limit(10)
 *     .maybeSingle();
 */

/**
 * STEP 4: Replace RPC Calls (Stored Procedures)
 * 
 * FROM:
 *   const { data: workload, error } = await supabase.rpc("get_agent_workload", {
 *     agent_ids: ["id1", "id2"]
 *   });
 * 
 * TO (Option A - Use as raw SQL if no complex logic):
 *   const { data: workload, error } = await queryFrom("agent_workload")
 *     .select("*")
 *     .execute();
 * 
 * TO (Option B - Direct PostgreSQL query for complex logic):
 *   // Import helper for raw queries
 *   const sqlResult = await executeQuery(
 *     "SELECT get_agent_workload($1::uuid[]) AS workload",
 *     [agentIds]
 *   );
 */

/**
 * STEP 5: Error Handling
 * 
 * Errors now come in { data, error } format from db.ts
 * 
 * FROM:
 *   if (error) {
 *     console.error("Query failed:", error.message);
 *     return { error };
 *   }
 * 
 * TO (same pattern):
 *   if (error) {
 *     console.error("Query failed:", error.message);
 *     return { error };
 *   }
 */

// ====================================================
// FUNCTION-BY-FUNCTION CHECKLIST
// ====================================================

/**
 * [1] attestation-verify
 *   ✅ Replaced: import + client init
 *   ✅ Replaced: .from().select()...maybeSingle()
 *   Status: READY FOR TESTING
 * 
 * [2] auto-assign-agent
 *   - Replace: import + client init
 *   - Replace: user_profiles .select()
 *   - Replace: .rpc("get_agent_workload")
 *   - Replace: leads .update()
 *   - Replace: taches .insert()
 *   - Replace: notifications .insert()
 *   - Add: transaction support (optional)
 * 
 * [3] create-user-with-profile
 *   - Replace: import + client init (2 instances)
 *   - Replace: auth.signUp()
 *   - Replace: user_profiles .insert()
 *   - Add: transaction support for consistency
 * 
 * [4] calculate-lead-score
 *   - Replace: import + client init
 *   - Replace: leads .select()
 *   - Replace: .rpc("calculate_score")
 * 
 * [5] capture-lead
 *   - Replace: import + client init
 *   - Replace: leads .insert()
 * 
 * [6] send-payment-notification
 *   - Replace: import + client init
 *   - Replace: payments .select()
 *   - External: Email/SMS providers (no change)
 * 
 * [7] send-welcome-message
 *   - Replace: import + client init
 *   - Replace: user_profiles .select()
 *   - External: Email/SMS providers (no change)
 * 
 * [8] attestation-sign
 *   - Replace: import + client init
 *   - Replace: attestations .select()
 *   - Replace: attestations .update()
 *   - Keep: Cryptography logic (unchanged)
 * 
 * [9] verify-turnstile
 *   - Replace: import + client init
 *   - External: Turnstile verification (no change)
 *   - No database queries (minimal changes)
 */

// ====================================================
// TESTING STRATEGY
// ====================================================

/**
 * For each refactored function:
 * 
 * 1. LOCAL TESTING
 *    - Run against local PostgreSQL (supabase start)
 *    - Verify response format matches original
 *    - Test error paths (missing data, null values)
 * 
 * 2. INTEGRATION TESTING
 *    - Run full workflow against staging DB
 *    - Verify side effects (records created, updated)
 *    - Check response times vs original
 * 
 * 3. STAGING VALIDATION
 *    - Deploy to staging Edge Functions
 *    - Monitor logs for errors
 *    - Verify frontend compatibility
 * 
 * 4. PRODUCTION VALIDATION (AFTER MERGE)
 *    - Canary deployment (5% traffic first)
 *    - Monitor error rates, latency
 *    - Full rollout after 24h without issues
 *    - Keep Supabase version available for rollback
 */

// ====================================================
// TROUBLESHOOTING
// ====================================================

/**
 * ISSUE: "DATABASE_URL not configured"
 * FIX: Set in Supabase secrets or .env:
 *   supabase secrets set DATABASE_URL "postgres://..."
 *   OR: export DATABASE_URL="postgres://..."
 * 
 * ISSUE: Query returns undefined instead of error
 * FIX: Check db.ts returns { data, error } format
 * 
 * ISSUE: Performance degradation
 * FIX: Add database indexes, profile slow queries:
 *   supabase start
 *   SELECT query_plan FROM pg_stat_statements WHERE query ~* 'table_name';
 * 
 * ISSUE: Connection pooling errors
 * FIX: Upgrade db.ts with PgBouncer or Pg_pool:
 *   TODO: Add in Phase 2B if load testing shows issues
 */

export {}; // Placeholder for TypeScript
