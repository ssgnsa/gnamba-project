import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ||
  Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") ||
  "";
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "";
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const ALLOWED_ORIGINS = [
  "https://gnambaservices.ci",
  "https://www.gnambaservices.ci",
  "https://portal.gnambaservices.ci",
];

const SHARED_SECRET = Deno.env.get("LEAD_CAPTURE_SECRET") || "";

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

function validatePhone(phone: string): boolean {
  return /^\+?[\d\s\-().]{7,20}$/.test(phone.trim());
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requireAuth(req: Request): { ok: boolean; error?: string } {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, error: "Authorization header required" };
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, error: "Token manquant" };
  }
  if (SHARED_SECRET && token !== SHARED_SECRET) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    if (token !== anonKey) {
      return { ok: false, error: "Token invalide" };
    }
  }
  return { ok: true };
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function jsonResponse(body: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(req),
    },
  });
}

interface LeadData {
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  source?: string;
  source_page?: string;
  source_form?: string;
  consent_text?: string;
  channels_optin?:
    | {
        sms?: boolean;
        whatsapp?: boolean;
        email?: boolean;
        telegram?: boolean;
      }
    | string[];
}

function normalizeChannelsOptIn(channels?: LeadData["channels_optin"]): {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
  telegram: boolean;
} {
  const defaults = {
    sms: true,
    whatsapp: true,
    email: true,
    telegram: false,
  };

  if (!channels) return defaults;
  if (Array.isArray(channels)) {
    const normalized = { ...defaults };
    for (const channel of channels) {
      const key = String(channel).toLowerCase();
      if (key === "phone" || key === "sms") normalized.sms = true;
      if (key === "whatsapp") normalized.whatsapp = true;
      if (key === "email") normalized.email = true;
      if (key === "telegram") normalized.telegram = true;
    }
    return normalized;
  }

  return {
    sms: Boolean(channels.sms ?? defaults.sms),
    whatsapp: Boolean(channels.whatsapp ?? defaults.whatsapp),
    email: Boolean(channels.email ?? defaults.email),
    telegram: Boolean(channels.telegram ?? defaults.telegram),
  };
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const auth = requireAuth(req);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error }, 401, req);
  }

  const ip = getClientIP(req);
  if (!checkRateLimit(ip)) {
    return jsonResponse(
      { error: "Trop de requêtes. Réessayez dans 1 minute." },
      429,
      req,
    );
  }

  if (!supabase) {
    return jsonResponse(
      { error: "Configuration Supabase Edge Function incomplète" },
      500,
      req,
    );
  }

  try {
    const body = (await req.json()) as LeadData;
    const {
      phone,
      first_name,
      last_name,
      email,
      source,
      source_page,
      source_form,
      consent_text,
      channels_optin,
    } = body;
    const normalizedChannels = normalizeChannelsOptIn(channels_optin);

    if (!phone || !validatePhone(phone)) {
      return jsonResponse(
        { error: "Numéro de téléphone invalide ou manquant" },
        400,
        req,
      );
    }

    if (email && !validateEmail(email)) {
      return jsonResponse({ error: "Adresse email invalide" }, 400, req);
    }

    const safeFirstName = first_name ? String(first_name).slice(0, 100) : null;
    const safeLastName = last_name ? String(last_name).slice(0, 100) : null;
    const safeSource = source ? String(source).slice(0, 50) : "web_api";
    const safeSourcePage = source_page
      ? String(source_page).slice(0, 255)
      : null;
    const safeSourceForm = source_form
      ? String(source_form).slice(0, 100)
      : null;
    const safeConsent = consent_text
      ? String(consent_text).slice(0, 500)
      : "Consentement via API";

    const { data, error } = await supabase
      .from("leads")
      .insert({
        phone: phone.trim(),
        first_name: safeFirstName,
        last_name: safeLastName,
        email: email || null,
        source: safeSource,
        source_page: safeSourcePage,
        source_form: safeSourceForm,
        consent_text: safeConsent,
        channels_optin: normalizedChannels,
        ip_address: ip !== "unknown" ? ip : null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    console.log("✅ Lead captured:", data?.id);
    return jsonResponse({ success: true, data }, 200, req);
  } catch (error) {
    console.error("❌ Capture lead error:", error);
    return jsonResponse(
      { error: "Échec de la capture. Veuillez réessayer." },
      500,
      req,
    );
  }
};

Deno.serve(handler);
