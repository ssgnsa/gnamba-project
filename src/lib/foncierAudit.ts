type RpcError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

type RpcResult<T = unknown> = { data: T | null; error: RpcError | null };
type RpcResponse<T = unknown> = Promise<RpcResult<T>>;

type RpcClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

export type FoncierAuditInput = {
  lotId: string;
  action: string;
  details?: Record<string, unknown> | null;
  oldValues?: Record<string, unknown> | null;
};

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const getErrorText = (error: RpcError | null): string => {
  if (!error) return "";
  return `${error.code || ""} ${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();
};

const shouldFallbackToLegacy = (error: RpcError | null): boolean => {
  if (!error) return false;
  if (error.code === "PGRST202") return true;
  const text = getErrorText(error);

  return (
    text.includes("could not find the function public.log_foncier_audit") ||
    text.includes("no matches were found in the schema cache") ||
    text.includes("p_lot_id") ||
    text.includes("p_new_values") ||
    text.includes("lot_id")
  );
};

const shouldFallbackToModern = (error: RpcError | null): boolean => {
  if (!error) return false;
  if (error.code === "PGRST202") return true;
  const text = getErrorText(error);

  return (
    text.includes("could not find the function public.log_foncier_audit") ||
    text.includes("no matches were found in the schema cache") ||
    text.includes("p_parcelle_id") ||
    text.includes("p_details") ||
    text.includes("parcelle_id")
  );
};

export const buildModernAuditPayload = (
  input: FoncierAuditInput,
): Record<string, unknown> => ({
  p_lot_id: input.lotId,
  p_action: input.action,
  p_old_values: input.oldValues || null,
  p_new_values: input.details || null,
});

export const buildLegacyAuditPayload = (
  input: FoncierAuditInput,
): Record<string, unknown> => ({
  p_parcelle_id: input.lotId,
  p_action: input.action,
  p_details: input.details || null,
});

export const normalizeAuditPayload = (
  payload: unknown,
): FoncierAuditInput | null => {
  const source = asObject(payload);
  if (!source) return null;

  const lotIdRaw =
    source.p_lot_id ??
    source.p_parcelle_id ??
    source.lot_id ??
    source.parcelle_id;
  const actionRaw = source.p_action ?? source.action;

  const lotId = String(lotIdRaw || "").trim();
  const action = String(actionRaw || "").trim();
  if (!lotId || !action) return null;

  const details =
    asObject(source.p_new_values) ||
    asObject(source.p_details) ||
    asObject(source.details);
  const oldValues =
    asObject(source.p_old_values) || asObject(source.old_values);

  return {
    lotId,
    action,
    details: details || null,
    oldValues: oldValues || null,
  };
};

export async function logFoncierAudit(
  client: RpcClient,
  input: FoncierAuditInput,
): RpcResponse {
  const modernResult = (await client.rpc(
    "log_foncier_audit",
    buildModernAuditPayload(input),
  )) as RpcResult;
  if (!modernResult.error) return modernResult;

  if (shouldFallbackToLegacy(modernResult.error)) {
    const legacyResult = (await client.rpc(
      "log_foncier_audit",
      buildLegacyAuditPayload(input),
    )) as RpcResult;
    if (!legacyResult.error) return legacyResult;
  }

  return modernResult;
}

export async function logFoncierAuditFromPayload(
  client: RpcClient,
  payload: unknown,
): RpcResponse {
  const normalized = normalizeAuditPayload(payload);
  if (!normalized) {
    return {
      data: null,
      error: {
        code: "AUDIT_PAYLOAD_INVALID",
        message: "Payload audit foncier invalide",
      },
    };
  }

  const legacyResult = (await client.rpc(
    "log_foncier_audit",
    buildLegacyAuditPayload(normalized),
  )) as RpcResult;
  if (!legacyResult.error) return legacyResult;

  if (shouldFallbackToModern(legacyResult.error)) {
    const modernResult = (await client.rpc(
      "log_foncier_audit",
      buildModernAuditPayload(normalized),
    )) as RpcResult;
    if (!modernResult.error) return modernResult;
  }

  return legacyResult;
}
