import { getLocalStorageBaseUrl } from "../lib/selfHosted";
import { apiClient } from "../api/client";

type Row = Record<string, unknown>;

type QueryError = { message: string; details?: string } | null;

export interface QueryResult<T = unknown> {
  data: T | null;
  error: QueryError;
  count?: number | null;
}

type Filter = {
  column: string;
  value: unknown;
  operator:
    | "eq"
    | "neq"
    | "gte"
    | "lte"
    | "in"
    | "is"
    | "ilike"
    | "like"
    | "not";
  negatedOperator?:
    | "eq"
    | "neq"
    | "gte"
    | "lte"
    | "in"
    | "is"
    | "ilike"
    | "like";
};

type OrClause = {
  column: string;
  operator: Filter["operator"];
  value: unknown;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toPatternRegex = (pattern: string, caseInsensitive: boolean): RegExp => {
  const parts = pattern.split("%").map(escapeRegExp);
  const regex = parts.join(".*");
  return new RegExp(`^${regex}$`, caseInsensitive ? "i" : undefined);
};

const getTargets = (row: Row, path: string): unknown[] => {
  const parts = path.split(".").filter(Boolean);
  const walk = (value: unknown, index: number): unknown[] => {
    if (value === null || value === undefined) {
      return [value];
    }
    if (index >= parts.length) {
      return Array.isArray(value) ? value : [value];
    }
    if (Array.isArray(value)) {
      return value.flatMap((item) => walk(item, index));
    }
    if (typeof value !== "object") {
      return [undefined];
    }
    const next = (value as Row)[parts[index]];
    if (index === parts.length - 1) {
      return Array.isArray(next) ? next : [next];
    }
    return walk(next, index + 1);
  };
  return walk(row, 0);
};

const evaluateComparison = (
  row: Row,
  filter: Pick<Filter, "column" | "operator" | "value">,
): boolean => {
  const targets = getTargets(row, filter.column);
  const textValue = String(filter.value ?? "");
  switch (filter.operator) {
    case "eq":
      return targets.some((target) => String(target) === String(filter.value));
    case "neq":
      return (
        targets.length > 0 &&
        targets.every((target) => String(target) !== String(filter.value))
      );
    case "gte":
      return targets.some(
        (target) => String(target ?? "") >= String(filter.value ?? ""),
      );
    case "lte":
      return targets.some(
        (target) => String(target ?? "") <= String(filter.value ?? ""),
      );
    case "in":
      return Array.isArray(filter.value)
        ? targets.some((target) =>
            (filter.value as unknown[]).map(String).includes(String(target)),
          )
        : false;
    case "is":
      return filter.value === null
        ? targets.some((target) => target === null || target === undefined)
        : targets.some((target) => target === filter.value);
    case "ilike": {
      const regex = toPatternRegex(textValue, true);
      return targets.some((target) => regex.test(String(target ?? "")));
    }
    case "like": {
      const regex = toPatternRegex(textValue, false);
      return targets.some((target) => regex.test(String(target ?? "")));
    }
    default:
      return true;
  }
};

const parseOrClause = (clause: string): OrClause | null => {
  const match = clause
    .trim()
    .match(/^(.*)\.(eq|neq|gte|lte|in|is|ilike|like)\.(.*)$/);
  if (!match) return null;
  const [, column, operator, rawValue] = match;
  let value: unknown = rawValue;
  if (operator === "is" && rawValue === "null") {
    value = null;
  } else if (operator === "in") {
    value = rawValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return {
    column,
    column: column,
    operator: operator as OrClause["operator"],
    value: value,
  };
};

const tableEndpoints: Record<string, string> = {
  projects: "/projects",
  employees: "/employees",
  suppliers: "/suppliers",
  products: "/products",
  finances: "/finance",
  immobilier_items: "/immobilier",
  foncier_items: "/foncier",
  media_files: "/media",
  app_settings: "/settings",
  site_content: "/site-content",
  clients: "/clients",
  leads: "/leads",
  lead_campaigns: "/leads/campaigns",
  lead_captures: "/leads/captures",
  lead_interactions: "/leads/interactions",
  party_roles: "/parties/roles",
  party_lead_details: "/parties/lead-details",
  parties: "/tables/parties",
  page_layouts: "/api/v1/page-layouts", // FIXED: Changed from "/site-content/page-layouts" to direct API endpoint
  bot_workflows: "/bot/workflows",
  user_profiles: "/users/profiles",
  media_audit_logs: "/media/audit-logs",
  media_usage: "/media/usage",
  media_versions: "/media/versions",
  messages_direction: "/messages",
  visites_en_cours: "/visites/en-cours",
  documents: "/documents",
  social_posts: "/social/posts",
  foncier_lots: "/foncier/lots",
  foncier_attestations: "/foncier/attestations",
  activites_journal: "/activites",
  stats_journalieres: "/stats",
  visites_terrain: "/visites/terrain",
  ventes_foncieres: "/foncier/ventes",
  campagnes_marketing: "/campagnes",
  visites: "/visites",
  opportunites: "/opportunites",
  site_realisations: "/site/realisations",
  vitrine_lots: "/site/vitrine-lots",
  visites_du_jour: "/visites/jour",
  visiteurs: "/visiteurs",
  employees_presence: "/employees/presence",
};

const resolveTableEndpoint = (tableName: string): string =>
  tableEndpoints[tableName] ??
  `/tables/${encodeURIComponent(tableName)}`;

const OPTIONAL_EMPTY_TABLES = new Set([
  "employees",
  "products",
  "suppliers",
  "site_content",
]);

class ApiTableQuery {
  private operation: "select" | "insert" | "update" | "delete" | "upsert" =
    "select";
  private payload: unknown;
  private filters: Filter[] = [];
  private orClauses: string[] = [];
  private selectedColumns = "*";
  private orderBy: { column: string; ascending: boolean } | null = null;
  private rangeBounds: { from: number; to: number } | null = null;
  private singleRow = false;
  private countMode = false;
  private headMode = false;

  constructor(private readonly table: string) {}

  select(_columns = "*", options?: { count?: string; head?: boolean }) {
    this.operation = "select";
    this.selectedColumns = _columns;
    this.countMode = Boolean(options?.count);
    this.headMode = Boolean(options?.head);
    return this;
  }

  insert(payload: unknown) {
    this.operation = "insert";
    this.payload = Array.isArray(payload) ? payload[0] : payload;
    return this;
  }

  upsert(payload: unknown, _options?: Record<string, unknown>) {
    this.operation = "upsert";
    this.payload = Array.isArray(payload) ? payload[0] : payload;
    return this;
  }

  update(payload: unknown) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value, operator: "eq" });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, value, operator: "neq" });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, value, operator: "gte" });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, value, operator: "lte" });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ column, value, operator: "in" });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push({ column, value, operator: "is" });
    return this;
  }

  ilike(column: string, value: unknown) {
    this.filters.push({ column, value, operator: "ilike" });
    return this;
  }

  like(column: string, value: unknown) {
    this.filters.push({ column, value, operator: "like" });
    return this;
  }

  not(column: string, operator: Filter["negatedOperator"], value: unknown) {
    this.filters.push({
      column,
      value,
      operator: "not",
      negatedOperator: operator,
    });
    return this;
  }

  or(expression: string) {
    this.orClauses.push(expression);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  }

  range(from: number, to: number) {
    this.rangeBounds = {
      from: Math.max(0, Number.isFinite(from) ? Math.floor(from) : 0),
      to: Math.max(0, Number.isFinite(to) ? Math.floor(to) : 0),
    };
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  maybeSingle() {
    this.singleRow = true;
    return this;
  }

  limit(_count: number) {
    return this;
  }

  async execute(): Promise<QueryResult<unknown>> {
    return this.executeInternal();
  }

  then<TResult1 = QueryResult<unknown>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult<unknown>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.executeInternal().then(
      onfulfilled ?? undefined,
      onrejected ?? undefined,
    );
  }

  private async executeInternal(): Promise<QueryResult<unknown>> {
    try {
      const id = this.idFilter();
      if (this.operation === "select") {
        const rawRows = await this.fetchSelectRows();
        const filteredRows = this.applyFilters(rawRows);
        const rows =
          Array.isArray(filteredRows) && this.rangeBounds
            ? filteredRows.slice(this.rangeBounds.from, this.rangeBounds.to + 1)
            : filteredRows;
        const data = this.headMode
          ? null
          : this.singleRow && Array.isArray(rows)
            ? (rows[0] ?? null)
            : rows;
        return {
          data,
          count:
            this.countMode && Array.isArray(filteredRows)
              ? filteredRows.length
              : null,
          error: null,
        };
      }

      if (this.operation === "insert" || this.operation === "upsert") {
        const result = await apiClient.request<unknown>(this.endpoint(), {
          method: "POST",
          body: JSON.stringify(this.payload ?? {}),
        });
        return {
          data: result.data,
          error: result.error ? { message: result.error } : null,
        };
      }

      if (this.operation === "update") {
        const result = await apiClient.request<unknown>(
          `${this.endpoint()}/${id ?? ""}`,
          {
            method: "PATCH",
            body: JSON.stringify(this.payload ?? {}),
          },
        );
        return {
          data: result.data,
          error: result.error ? { message: result.error } : null,
        };
      }

      const result = await apiClient.request<unknown>(
        `${this.endpoint()}/${id ?? ""}`,
        {
          method: "DELETE",
        },
      );
      return {
        data: result.data,
        error: result.error ? { message: result.error } : null,
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Erreur API locale inconnue",
        },
      };
    }
  }

  private endpoint() {
    return resolveTableEndpoint(this.table);
  }

  private idFilter(): string | null {
    const filter = this.filters.find(
      (item) => item.column === "id" && item.operator === "eq",
    );
    return typeof filter?.value === "string" ? filter.value : null;
  }

  private queryString() {
    const params = new URLSearchParams();
    for (const filter of this.filters) {
      if (
        filter.operator === "eq" &&
        filter.value !== undefined &&
        filter.value !== null &&
        !filter.column.includes(".")
      ) {
        params.append(filter.column, String(filter.value));
      }
    }
    if (this.orderBy) {
      params.set("order_by", this.orderBy.column);
      params.set("ascending", String(this.orderBy.ascending));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  private matchesOrClauses(row: Row): boolean {
    if (this.orClauses.length === 0) return true;
    return this.orClauses.some((expression) =>
      expression
        .split(",")
        .map((clause) => parseOrClause(clause))
        .filter((clause): clause is OrClause => Boolean(clause))
        .some((clause) => evaluateComparison(row, clause)),
    );
  }

  private applyFilters(rows: Row[]) {
    return rows.filter((row) => {
      if (!this.matchesOrClauses(row)) {
        return false;
      }
      return this.filters.every((filter) => {
        if (filter.operator === "not") {
          if (!filter.negatedOperator) return true;
          return !evaluateComparison(row, {
            column: filter.column,
            operator: filter.negatedOperator,
            value: filter.value,
          });
        }
        return evaluateComparison(row, filter);
      });
    });
  }

  private usesPartyRelations(): boolean {
    const relationPatterns = ["party_roles", "party_lead_details"];
    return (
      this.table === "parties" &&
      (relationPatterns.some((pattern) =>
        this.selectedColumns.includes(pattern),
      ) ||
        relationPatterns.some((pattern) =>
          this.filters.some((filter) => filter.column.includes(pattern)),
        ) ||
        this.orClauses.some((clause) =>
          relationPatterns.some((pattern) => clause.includes(pattern)),
        ))
    );
  }

  private async fetchRows(tableName: string): Promise<Row[]> {
    const result = await apiClient.request<Row[]>(
      `${resolveTableEndpoint(tableName)}${tableName === this.table ? this.queryString() : ""}`,
    );
    if (result.error) {
      if (result.status === 404 && OPTIONAL_EMPTY_TABLES.has(tableName)) {
        return [];
      }
      throw new Error(result.error);
    }
    return Array.isArray(result.data) ? result.data : [];
  }

  private async fetchPartyJoinedRows() {
    const [parties, roles, leadDetails] = await Promise.all([
      this.fetchRows("parties"),
      this.fetchRows("party_roles"),
      this.fetchRows("party_lead_details"),
    ]);
    const roleByPartyId = new Map<string, any[]>();
    for (const role of roles) {
      const partyId = String(role.party_id ?? "");
      if (!partyId) continue;
      const bucket = roleByPartyId.get(partyId) ?? [];
      bucket.push(role);
      roleByPartyId.set(partyId, bucket);
    }

    const detailsByPartyId = new Map<string, any[]>();
    for (const detail of leadDetails) {
      const partyId = String(detail.party_id ?? "");
      if (!partyId) continue;
      const bucket = detailsByPartyId.get(partyId) ?? [];
      bucket.push(detail);
      detailsByPartyId.set(partyId, bucket);
    }

    return parties.map((party) => ({
      ...party,
      party_roles: roleByPartyId.get(String(party.id)) ?? [],
      party_lead_details: detailsByPartyId.get(String(party.id)) ?? [],
    }));
  }

  private async fetchSelectRows() {
    if (this.usesPartyRelations()) {
      return this.fetchPartyJoinedRows();
    }
    return this.fetchRows(this.table);
  }
}

const storageFrom = (_bucket: string) => ({
  async upload(path: string, file: File, _opts?: unknown) {
    // Use apiClient.media.upload and send category derived from path's prefix
    const category = path.split("/")[0] || undefined;
    return await apiClient.media.upload(file, {
      category,
    });
  },

  getPublicUrl(path: string) {
    const base = getLocalStorageBaseUrl();
    const publicUrl = `${base}/${encodeURIComponent(path)}`;
    return { data: { publicUrl }, error: null };
  },

  async remove(paths: string[]) {
    // Best-effort delete using backend storage API.
    try {
      for (const p of paths) {
        await apiClient.request(
          `/api/v1/storage/media/${encodeURIComponent(p)}`,
          {
            method: "DELETE",
          },
        );
      }
      return { data: null, error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  },
});

const dataClient = {
  from(table: string) {
    return new ApiTableQuery(table);
  },

  async rpc(name: string, params?: Record<string, unknown>) {
    const res = await apiClient.request<unknown>(
      `/rpc/${encodeURIComponent(name)}`,
      {
        method: "POST",
        body: JSON.stringify(params || {}),
      },
    );
    return { data: res.data, error: res.error ? { message: res.error } : null };
  },

  functions: {
    async invoke(
      name: string,
      _opts?: { body?: unknown; headers?: Record<string, string> },
    ) {
      return {
        data: null,
        error: {
          message: `Route fonction désactivée: ${name}. Utilisez une route /api/v1 métier.`,
        },
      };
    },
  },

  storage: {
    from: storageFrom,
  },

  auth: {
    async signInWithPassword(creds: { email: string; password: string }) {
      return apiClient.auth.login(creds.email, creds.password);
    },
    async getUser() {
      return apiClient.auth.me();
    },
    async signOut() {
      return apiClient.auth.logout();
    },
  },
};

export const dbClient = dataClient;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async <T>(
  operation: () => PromiseLike<T>,
  retries = 3,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await operation();
      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        (result as { error?: unknown }).error
      ) {
        if (attempt === retries) {
          return result;
        }
      } else {
        return result;
      }
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw error;
      }
    }

    if (attempt < retries) {
      await delay(250 * (attempt + 1));
    }
  }

  throw lastError;
};

export default dataClient;