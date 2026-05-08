import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests/minute per IP
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const getClientIP = (req: Request): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  return real || "unknown";
};

const checkRateLimit = (ip: string) => {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  rateLimitStore.set(ip, entry);
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
};

const buildRateHeaders = (rate: { remaining: number; resetAt: number }) => ({
  "X-RateLimit-Limit": `${RATE_LIMIT_MAX_REQUESTS}`,
  "X-RateLimit-Remaining": `${Math.max(rate.remaining, 0)}`,
  "X-RateLimit-Reset": `${Math.floor(rate.resetAt / 1000)}`,
});

const jsonResponse = (
  payload: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...headers,
    },
  });

const parseJsonObject = (
  value: string | null,
): Record<string, unknown> | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const normalizeWitnesses = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      nom: asString(item.nom),
      prenom: asString(item.prenom),
      profession: asString(item.profession),
      telephone: asString(item.telephone),
      cni: asString(item.cni),
    }))
    .filter((item) => item.nom || item.prenom);
};

const sha256Hex = async (input: string): Promise<string> => {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const normalizePem = (pem: string) => pem.replace(/\\n/g, "\n").trim();

const pemToArrayBuffer = (pem: string): ArrayBuffer => {
  const cleaned = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const importPublicKey = async (
  pem: string,
  algorithm: "RSA-PSS" | "RSASSA-PKCS1-v1_5",
) => {
  const keyData = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    "spki",
    keyData,
    { name: algorithm, hash: "SHA-256" },
    false,
    ["verify"],
  );
};

const base64ToUint8 = (value: string): Uint8Array => {
  const sanitized = value.includes("base64,")
    ? value.split("base64,")[1]
    : value;
  const binary = atob(sanitized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const verifySignature = async (
  payload: string,
  signature: string,
  publicKeyPem: string,
): Promise<boolean> => {
  const normalizedPem = normalizePem(publicKeyPem);
  const data = new TextEncoder().encode(payload);
  const signatureBytes = base64ToUint8(signature);

  try {
    const pssKey = await importPublicKey(normalizedPem, "RSA-PSS");
    const pssOk = await crypto.subtle.verify(
      { name: "RSA-PSS", saltLength: 32 },
      pssKey,
      signatureBytes,
      data,
    );
    if (pssOk) return true;
  } catch {
    // Ignore and fall back to PKCS1
  }

  try {
    const pkcsKey = await importPublicKey(normalizedPem, "RSASSA-PKCS1-v1_5");
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      pkcsKey,
      signatureBytes,
      data,
    );
  } catch {
    return false;
  }
};

const computePayloadHash = async (
  payload: Record<string, unknown>,
): Promise<string> => {
  const json = JSON.stringify(payload, (key, value) =>
    key === "hash_sha256" ? undefined : value,
  );
  return await sha256Hex(json);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const ip = getClientIP(req);
  const rate = checkRateLimit(ip);
  const rateHeaders = buildRateHeaders(rate);

  if (!rate.allowed) {
    return jsonResponse(
      {
        error: "Trop de requetes. Veuillez reessayer plus tard.",
        retry_after: Math.max(0, Math.ceil((rate.resetAt - Date.now()) / 1000)),
      },
      429,
      rateHeaders,
    );
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Methode non autorisee." }, 405, rateHeaders);
  }

  const url = new URL(req.url);
  const ref =
    url.searchParams.get("ref") || url.searchParams.get("reference") || "";
  const control =
    url.searchParams.get("control") ||
    url.searchParams.get("control_number") ||
    "";
  const hashParam =
    url.searchParams.get("hash") || url.searchParams.get("hash_sha256") || "";

  if (!ref && !control && !hashParam) {
    return jsonResponse({ error: "Reference manquante." }, 400, rateHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: "Configuration manquante." },
      500,
      rateHeaders,
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const buildQuery = (filterDeleted: boolean) => {
    let query = supabase
      .from("foncier_attestations")
      .select(
        "reference, date_etablissement, control_number, statut, qr_payload, hash_sha256, signature_numerique, created_at, version, lot:foncier_lots(reference, numero_lot, nom_lotissement, village, proprietaire_nom, proprietaire_prenom, superficie, quartier)",
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .neq("statut", "archive");

    if (ref) query = query.eq("reference", ref);
    else if (control) query = query.eq("control_number", control);
    else query = query.eq("hash_sha256", hashParam);

    if (filterDeleted) query = query.is("deleted_at", null);

    return query.maybeSingle();
  };

  let data: any = null;
  let error: any = null;

  ({ data, error } = await buildQuery(true));

  if (
    error &&
    typeof error.message === "string" &&
    error.message.includes("deleted_at")
  ) {
    ({ data, error } = await buildQuery(false));
  }

  if (error) {
    return jsonResponse(
      { error: "Erreur lors de la verification." },
      500,
      rateHeaders,
    );
  }

  if (!data) {
    return jsonResponse(
      { error: "Attestation introuvable." },
      404,
      rateHeaders,
    );
  }

  const parsedPayload = parseJsonObject(data.qr_payload ?? null);
  const payloadHash =
    typeof parsedPayload?.hash_sha256 === "string"
      ? parsedPayload.hash_sha256
      : null;
  let hashValid = false;

  if (parsedPayload && payloadHash) {
    const computedHash = await computePayloadHash(parsedPayload);
    hashValid = computedHash === payloadHash;
    if (data.hash_sha256 && data.hash_sha256 !== payloadHash) {
      hashValid = false;
    }
  }

  let signatureValid = false;
  const publicKey = Deno.env.get("ATTESTATION_PUBLIC_KEY");
  if (publicKey && data.signature_numerique && data.qr_payload) {
    signatureValid = await verifySignature(
      data.qr_payload,
      data.signature_numerique,
      publicKey,
    );
  }

  const villageInfo = asObject(parsedPayload?.village);
  const parcelInfo = asObject(parsedPayload?.parcelle);
  const holderInfo = asObject(parsedPayload?.titulaire);
  const validationInfo = asObject(parsedPayload?.validation);
  const lotData = Array.isArray(data.lot)
    ? (data.lot[0] ?? null)
    : (data.lot ?? null);
  const normalizedStatus = String(data.statut || "").toLowerCase();
  const documentAuthentic =
    Boolean(data.reference) &&
    !["archive", "revoque", "invalide", "annule"].includes(normalizedStatus) &&
    (hashValid || signatureValid);

  return jsonResponse(
    {
      reference: data.reference,
      date_etablissement: data.date_etablissement,
      numero_enregistrement: asString(parsedPayload?.numero_enregistrement),
      control_number: data.control_number,
      statut: data.statut,
      signature_valid: signatureValid,
      hash_sha256: data.hash_sha256 ?? payloadHash,
      hash_valid: hashValid,
      document_authentic: documentAuthentic,
      attestation_type: asString(parsedPayload?.attestation_type),
      version: asNumber(parsedPayload?.version) ?? asNumber(data.version),
      original:
        typeof parsedPayload?.original === "boolean"
          ? parsedPayload.original
          : undefined,
      lot: lotData,
      titulaire: holderInfo
        ? {
            nom: asString(holderInfo.nom),
            prenom: asString(holderInfo.prenom),
            naissance_date: asString(holderInfo.naissance_date),
            naissance_lieu: asString(holderInfo.naissance_lieu),
            domicile: asString(holderInfo.domicile),
            profession: asString(holderInfo.profession),
            cni_numero: asString(holderInfo.cni_numero),
            cni_date: asString(holderInfo.cni_date),
            cni_lieu: asString(holderInfo.cni_lieu),
            telephone: asString(holderInfo.telephone),
          }
        : null,
      parcelle: parcelInfo
        ? {
            superficie_m2: asNumber(parcelInfo.superficie_m2),
            limites: asObject(parcelInfo.limites)
              ? {
                  nord: asString(asObject(parcelInfo.limites)?.nord),
                  sud: asString(asObject(parcelInfo.limites)?.sud),
                  est: asString(asObject(parcelInfo.limites)?.est),
                  ouest: asString(asObject(parcelInfo.limites)?.ouest),
                }
              : null,
            coordonnees_gps: asObject(parcelInfo.coordonnees_gps)
              ? {
                  lat: asNumber(asObject(parcelInfo.coordonnees_gps)?.lat),
                  lng: asNumber(asObject(parcelInfo.coordonnees_gps)?.lng),
                  precision: asNumber(
                    asObject(parcelInfo.coordonnees_gps)?.precision,
                  ),
                }
              : null,
            gps_points: Array.isArray(parcelInfo.gps_points)
              ? parcelInfo.gps_points
                  .map((point) => asObject(point))
                  .filter((point): point is Record<string, unknown> =>
                    Boolean(point),
                  )
                  .map((point) => ({
                    label: asString(point.label),
                    lat: asNumber(point.lat),
                    lng: asNumber(point.lng),
                  }))
              : [],
          }
        : null,
      temoins: normalizeWitnesses(parsedPayload?.temoins),
      village_info: villageInfo
        ? {
            region: asString(villageInfo.region),
            departement: asString(villageInfo.departement),
            commune: asString(villageInfo.commune),
            village: asString(villageInfo.village),
            quartier: asString(villageInfo.quartier),
            lotissement: asString(villageInfo.lotissement),
            numero_lot: asString(villageInfo.numero_lot),
            numero_ilot: asString(villageInfo.numero_ilot),
          }
        : null,
      validation: validationInfo
        ? {
            agent_nom: asString(validationInfo.agent_nom),
            chef_nom: asString(validationInfo.chef_nom),
          }
        : null,
    },
    200,
    rateHeaders,
  );
});
