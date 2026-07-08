/**
 * PostgreSQL Database Connection Module for Deno
 * Replaces Supabase client for self-hosted mode
 * Supports both Postgres.js via esm.sh and native Deno Postgres drivers
 */

// Use postgres.js from esm.sh (lightweight, promise-based)
// Fallback to @deno/postgres if available
const getPostgresModule = async () => {
  try {
    return await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
  } catch {
    // Fallback: use postgres.js via esm.sh
    return await import("https://esm.sh/postgres@3.4.4");
  }
};

export interface QueryOptions {
  single?: boolean; // Return single row instead of array
  count?: "exact" | "planned" | "estimated"; // Return count
}

export interface QueryResult<T = any> {
  data: T[] | T | null;
  error: Error | null;
  count?: number;
}

/**
 * Initialize database connection
 * Reads connection params from environment variables:
 * - DATABASE_URL (priority)
 * - POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
 */
export async function initializeDatabase() {
  const connectionUrl =
    Deno.env.get("DATABASE_URL") ||
    `postgres://${Deno.env.get("POSTGRES_USER") || "postgres"}:${Deno.env.get("POSTGRES_PASSWORD") || ""}@${Deno.env.get("POSTGRES_HOST") || "localhost"}:${Deno.env.get("POSTGRES_PORT") || "5432"}/${Deno.env.get("POSTGRES_DB") || "postgres"}`;

  if (!connectionUrl) {
    throw new Error(
      "DATABASE_URL or POSTGRES_* environment variables not configured",
    );
  }

  // For Deno Postgres
  try {
    const PostgresModule = await getPostgresModule();
    if (PostgresModule.Client) {
      return new PostgresModule.Client(connectionUrl);
    }
  } catch {
    // Ignore fallback
  }

  // Fallback to using built-in fetch to call a database API
  throw new Error(
    "No suitable PostgreSQL driver available. Please configure DATABASE_URL.",
  );
}

/**
 * Simple SQL execution wrapper using Deno's Postgres or HTTP API
 * In self-hosted mode with local API, this can also delegate to HTTP endpoints
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] = [],
  options: QueryOptions = {},
): Promise<QueryResult<T>> {
  try {
    // Try to use environment-based connection
    const client = await initializeDatabase();

    // Execute query
    let result: any;
    if (params.length > 0) {
      result = await client.queryObject(query, params);
    } else {
      result = await client.queryObject(query);
    }

    const data = options.single ? result.rows?.[0] || null : result.rows || [];

    return {
      data: data as T,
      error: null,
      count: result.rowCount,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Simple table query builder (replaces supabase.from().select())
 * Usage: const query = new QueryBuilder("table_name");
 *        const { data } = await query.select("col1, col2").eq("id", 1).single().execute();
 */
export class QueryBuilder {
  private tableName: string;
  private selectCols: string = "*";
  private whereClauses: Array<{ col: string; op: string; val: any }> = [];
  private orderByCols: Array<{ col: string; asc: boolean }> = [];
  private limitVal?: number;
  private offsetVal?: number;
  private singleRow: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string): this {
    this.selectCols = columns;
    return this;
  }

  eq(column: string, value: any): this {
    this.whereClauses.push({ col: column, op: "=", val: value });
    return this;
  }

  neq(column: string, value: any): this {
    this.whereClauses.push({ col: column, op: "!=", val: value });
    return this;
  }

  is(column: string, value: null | boolean): this {
    if (value === null) {
      this.whereClauses.push({ col: column, op: "IS", val: "NULL" });
    } else {
      this.whereClauses.push({
        col: column,
        op: value ? "IS TRUE" : "IS FALSE",
        val: "",
      });
    }
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): this {
    const asc = options.ascending !== false;
    this.orderByCols.push({ col: column, asc });
    return this;
  }

  limit(count: number): this {
    this.limitVal = count;
    return this;
  }

  offset(count: number): this {
    this.offsetVal = count;
    return this;
  }

  single(): this {
    this.singleRow = true;
    return this;
  }

  async execute<T = any>(): Promise<QueryResult<T>> {
    let sql = `SELECT ${this.selectCols} FROM ${this.tableName}`;

    const params: any[] = [];
    if (this.whereClauses.length > 0) {
      const whereStr = this.whereClauses
        .map((w, i) => {
          if (w.op.includes("NULL")) {
            return `${w.col} ${w.op}`;
          } else if (w.op.includes("TRUE") || w.op.includes("FALSE")) {
            return `${w.col} ${w.op}`;
          }
          params.push(w.val);
          return `${w.col} ${w.op} $${params.length}`;
        })
        .join(" AND ");
      sql += ` WHERE ${whereStr}`;
    }

    if (this.orderByCols.length > 0) {
      const orderStr = this.orderByCols
        .map((o) => `${o.col} ${o.asc ? "ASC" : "DESC"}`)
        .join(", ");
      sql += ` ORDER BY ${orderStr}`;
    }

    if (this.limitVal !== undefined) {
      sql += ` LIMIT ${this.limitVal}`;
    }

    if (this.offsetVal !== undefined) {
      sql += ` OFFSET ${this.offsetVal}`;
    }

    const result = await executeQuery<T>(sql, params);

    if (this.singleRow && result.data && Array.isArray(result.data)) {
      return {
        ...result,
        data: result.data[0] || null,
      };
    }

    return result;
  }

  // Alias for Supabase API compatibility
  async maybeSingle(): Promise<QueryResult> {
    return this.single().execute();
  }
}

/**
 * Helper to mimic Supabase .from() API
 * Usage: const { data, error } = await from("table").select("*").eq("id", 1).maybeSingle();
 */
export function from(tableName: string): QueryBuilder {
  return new QueryBuilder(tableName);
}
