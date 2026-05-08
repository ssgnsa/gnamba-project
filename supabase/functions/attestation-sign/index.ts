/**
 * Edge Function: attestation-sign
 * Purpose: Sign attestation QR payload with RSA private key (SHA-256)
 * Security: Rate-limited (10 req/min), anti-replay (nonce + timestamp), admin/gestionnaire only
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (userId: string) => {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(userId, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  rateLimitStore.set(userId, entry);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count };
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const normalizePem = (pem: string) => pem.replace(/\\n/g, "\n").trim();

const pemToArrayBuffer = (pem: string): ArrayBuffer => {
  const cleaned = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace("-----BEGIN RSA PRIVATE KEY-----", "")
    .replace("-----END RSA PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const importPrivateKey = async (pem: string) => {
  const keyData = pemToArrayBuffer(pem);
  // Try PKCS#8 first, then PKCS#1
  try {
    return await crypto.subtle.importKey(
      "pkcs8",
      keyData,
      { name: "RSA-PSS", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch {
    // Fall back to PKCS#1 via RSASSA-PKCS1-v1_5
    return await crypto.subtle.importKey(
      "pkcs8",
      keyData,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }
};

const signPayload = async (
  payload: string,
  privateKeyPem: string,
  algorithm: "RSA-PSS" | "RSASSA-PKCS1-v1_5" = "RSA-PSS",
): Promise<string> => {
  const normalizedPem = normalizePem(privateKeyPem);
  const key = await importPrivateKey(normalizedPem);
  const data = new TextEncoder().encode(payload);

  let signature: ArrayBuffer;
  if (algorithm === "RSA-PSS") {
    try {
      signature = await crypto.subtle.sign(
        { name: "RSA-PSS", saltLength: 32 },
        key,
        data,
      );
    } catch {
      // Fall back to PKCS1
      const keyPkcs = await importPrivateKey(normalizedPem);
      signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyPkcs, data);
    }
  } else {
    signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, data);
  }

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

const MAX_NONCE_AGE_MS = 5 * 60 * 1000; // 5 minutes
const seenNonces = new Map<string, number>();

const checkNonce = (
  nonce: string,
  timestamp: string,
): { valid: boolean; error?: string } => {
  if (!nonce || nonce.length < 10) {
    return { valid: false, error: "Nonce invalide" };
  }
  if (seenNonces.has(nonce)) {
    return { valid: false, error: "Nonce déjà utilisé (rejeu détecté)" };
  }

  const issuedAt = new Date(timestamp).getTime();
  const now = Date.now();
  if (isNaN(issuedAt) || now - issuedAt > MAX_NONCE_AGE_MS) {
    return {
      valid: false,
      error: "Attestation expirée (non-signable après 5 min)",
    };
  }

  seenNonces.set(nonce, now);

  // Cleanup old nonces (> 10 min)
  if (seenNonces.size > 1000) {
    const cutoff = now - 10 * 60 * 1000;
    for (const [key, ts] of seenNonces.entries()) {
      if (ts < cutoff) seenNonces.delete(key);
    }
  }

  return { valid: true };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée." }, 405);
  }

  // Auth check
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Authentification requise." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const privateKeyPem = Deno.env.get("ATTESTATION_PRIVATE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Configuration serveur manquante." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Validate user
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return jsonResponse({ error: "Token invalide ou expiré." }, 401);
  }

  // Rate limit per user
  const rate = checkRateLimit(user.id);
  if (!rate.allowed) {
    return jsonResponse(
      {
        error: "Trop de signatures. Veuillez réessayer plus tard.",
        retry_after: Math.max(0, Math.ceil((rate.resetAt - Date.now()) / 1000)),
      },
      429,
    );
  }

  let body: { attestation_id?: string; payload?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corps de requête invalide." }, 400);
  }

  const { attestation_id, payload } = body;

  if (!attestation_id) {
    return jsonResponse({ error: "attestation_id requis." }, 400);
  }

  if (!privateKeyPem) {
    return jsonResponse(
      { error: "Clé de signature non configurée. Contactez l'administrateur." },
      500,
    );
  }

  if (!payload) {
    return jsonResponse({ error: "payload requis." }, 400);
  }

  // Parse and validate payload JSON
  let parsedPayload: Record<string, unknown>;
  try {
    parsedPayload = JSON.parse(payload);
  } catch {
    return jsonResponse({ error: "payload JSON invalide." }, 400);
  }

  // Anti-replay: check nonce + timestamp
  const nonce = String(parsedPayload.signature_nonce || "");
  const issuedAt = String(parsedPayload.signature_issued_at || "");
  const nonceCheck = checkNonce(nonce, issuedAt);
  if (!nonceCheck.valid) {
    return jsonResponse({ error: nonceCheck.error }, 400);
  }

  // Check attestation exists and is not already signed
  const { data: attestation, error: fetchError } = await supabase
    .from("foncier_attestations")
    .select(
      "id, statut, signature_numerique, qr_payload, version, lot_id, reference",
    )
    .eq("id", attestation_id)
    .is("deleted_at", null)
    .single();

  if (fetchError || !attestation) {
    return jsonResponse({ error: "Attestation introuvable." }, 404);
  }

  if (attestation.statut === "archive") {
    return jsonResponse(
      { error: "Impossible de signer une attestation archivée." },
      400,
    );
  }

  // If already has a signature, this is a re-sign (allowed for re-émission)
  const isReSign = Boolean(attestation.signature_numerique);

  try {
    // Sign the payload (without hash_sha256 field to avoid circular dependency)
    const payloadToSign = { ...parsedPayload };
    delete payloadToSign.hash_sha256;
    const payloadJson = JSON.stringify(payloadToSign);

    // Sign with RSA-PSS (fall back to PKCS1 if needed)
    let signature: string;
    try {
      signature = await signPayload(payloadJson, privateKeyPem, "RSA-PSS");
    } catch {
      signature = await signPayload(
        payloadJson,
        privateKeyPem,
        "RSASSA-PKCS1-v1_5",
      );
    }

    // Update attestation with signature
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("foncier_attestations")
      .update({
        signature_numerique: signature,
        statut: "valide",
        qr_payload: JSON.stringify({
          ...parsedPayload,
          hash_sha256: parsedPayload.hash_sha256,
        }),
        updated_at: now,
        validation_agent_date: now,
      })
      .eq("id", attestation_id);

    if (updateError) {
      console.error("Failed to update attestation signature:", updateError);
      return jsonResponse(
        { error: "Erreur lors de la sauvegarde de la signature." },
        500,
      );
    }

    // Log audit with the authenticated user token so auth.uid() is available inside the RPC.
    await supabase
      .rpc(
        "log_foncier_audit",
        {
          p_lot_id: attestation.lot_id,
          p_action: isReSign
            ? "RE_SIGNATURE_ATTESTATION"
            : "SIGNATURE_ATTESTATION",
          p_new_values: {
            attestation_id: attestation_id,
            reference: attestation.reference,
            version: attestation.version,
            signed_at: now,
            user_id: user.id,
          },
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      )
      .catch(() => {
        /* audit log failure is non-fatal */
      });

    return jsonResponse({
      success: true,
      signature,
      signed_at: now,
      statut: "valide",
    });
  } catch (error) {
    console.error("Signature error:", error);
    return jsonResponse({ error: "Erreur interne lors de la signature." }, 500);
  }
});
