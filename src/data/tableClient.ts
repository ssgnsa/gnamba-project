import { getLocalStorageBaseUrl } from "../lib/selfHosted";
import { apiClient } from "../api/client";

type Filter = {
  column: string;
  value: unknown;
  operator: "eq" | "neq" | "gte" | "lte" | "in" | "is";
};

const tableEndpoints: Record<string, string> = {
  projects: "/api/v1/projects",
  employees: "/api/v1/employees",
  suppliers: "/api/v1/suppliers",
  products: "/api/v1/products",
  finances: "/api/v1/finance",
  immobilier_items: "/api/v1/immobilier",
  foncier_items: "/api/v1/foncier",
  media_files: "/api/v1/media",
};

class ApiTableQuery {
  private operation: "select" | "insert" | "update" | "delete" | "upsert" =
    "select";
  private payload: unknown;
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private singleRow = false;
  private countMode = false;
  private headMode = false;

  constructor(private readonly table: string) {}

  select(_columns = "*", options?: { count?: string; head?: boolean }) {
    this.operation = "select";
    this.countMode = Boolean(options?.count);
    this.headMode = Boolean(options?.head);
    return this;
  }

  insert(payload: unknown) {
    this.operation = "insert";
    this.payload = Array.isArray(payload) ? payload[0] : payload;
    return this;
  }

  upsert(payload: unknown) {
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

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true };
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

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private endpoint() {
    return tableEndpoints[this.table] ?? `/api/v1/tables/${encodeURIComponent(this.table)}`;
  }

  private idFilter(): string | null {
    const filter = this.filters.find((item) => item.column === "id" && item.operator === "eq");
    return typeof filter?.value === "string" ? filter.value : null;
  }

  private queryString() {
    const params = new URLSearchParams();
    for (const filter of this.filters) {
      if (filter.operator === "eq" && filter.value !== undefined && filter.value !== null) {
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

  private applyFilters(rows: any[]) {
    return rows.filter((row) =>
      this.filters.every((filter) => {
        const value = row?.[filter.column];
        if (filter.operator === "eq") return String(value) === String(filter.value);
        if (filter.operator === "neq") return String(value) !== String(filter.value);
        if (filter.operator === "gte") return String(value ?? "") >= String(filter.value ?? "");
        if (filter.operator === "lte") return String(value ?? "") <= String(filter.value ?? "");
        if (filter.operator === "in") {
          return Array.isArray(filter.value)
            ? filter.value.map(String).includes(String(value))
            : false;
        }
        if (filter.operator === "is") {
          return filter.value === null ? value === null || value === undefined : value === filter.value;
        }
        return true;
      }),
    );
  }

  private async execute() {
    try {
      const id = this.idFilter();
      if (this.operation === "select") {
        const result = await apiClient.request<any>(
          `${this.endpoint()}${this.queryString()}`,
        );
        const rows = Array.isArray(result.data)
          ? this.applyFilters(result.data)
          : result.data;
        const data = this.headMode
          ? null
          : this.singleRow && Array.isArray(rows)
            ? (rows[0] ?? null)
            : rows;
        return {
          data,
          count: this.countMode && Array.isArray(rows) ? rows.length : null,
          error: result.error ? { message: result.error } : null,
        };
      }

      if (this.operation === "insert" || this.operation === "upsert") {
        const result = await apiClient.request<any>(this.endpoint(), {
          method: "POST",
          body: JSON.stringify(this.payload ?? {}),
        });
        return { data: result.data, error: result.error ? { message: result.error } : null };
      }

      if (this.operation === "update") {
        const result = await apiClient.request<any>(`${this.endpoint()}/${id ?? ""}`, {
          method: "PATCH",
          body: JSON.stringify(this.payload ?? {}),
        });
        return { data: result.data, error: result.error ? { message: result.error } : null };
      }

      const result = await apiClient.request<any>(`${this.endpoint()}/${id ?? ""}`, {
        method: "DELETE",
      });
      return { data: result.data, error: result.error ? { message: result.error } : null };
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
}

const storageFrom = (_bucket: string) => ({
  async upload(path: string, file: File, _opts?: any) {
    // Use apiClient.media.upload and send category derived from path's prefix
    const category = path.split("/")[0] || undefined;
    return (await apiClient.media.upload(file, {
      category,
    })) as any;
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
        // Attempt a DELETE against a conventional storage endpoint.
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

const tableClient = {
  from(table: string) {
    return new ApiTableQuery(table);
  },

    async rpc(name: string, params?: Record<string, any>) {
    const res = await apiClient.request<any>(
      `/api/v1/rpc/${encodeURIComponent(name)}`,
      {
        method: "POST",
        body: JSON.stringify(params || {}),
      },
    );
    return { data: res.data, error: res.error } as any;
  },

  functions: {
    async invoke(
      name: string,
      _opts?: { body?: any; headers?: Record<string, string> },
    ) {
      return {
        data: null,
        error: {
          message: `Route fonction désactivée: ${name}. Utilisez une route /api/v1 métier.`,
        },
      } as any;
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

export default tableClient as any;
