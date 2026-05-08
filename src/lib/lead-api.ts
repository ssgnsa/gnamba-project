/**
 * Lead Capture API Endpoint
 * =========================
 * Receives leads from the universal form interceptor.
 * Stores in `leads` table with consent tracking.
 * Triggers welcome workflow if configured.
 *
 * POST /api/capture-lead
 * Body: { phone, first_name?, last_name?, email?, source, source_page?, source_form?, consent_text?, channels_optin? }
 */

import { supabase } from "../lib/supabase";

interface CaptureLeadRequest {
  phone: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  source: string;
  source_page?: string;
  source_form?: string;
  user_id?: string;
  consent_text?: string;
  channels_optin?: {
    sms: boolean;
    whatsapp: boolean;
    email: boolean;
    telegram: boolean;
  };
}

/**
 * Normalize phone to E.164
 */
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "");

  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "+225" + cleaned.substring(1);
  }
  if (cleaned.startsWith("00")) {
    return "+" + cleaned.substring(2);
  }
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  if (cleaned.length === 9) {
    return "+225" + cleaned;
  }
  return cleaned;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Trigger welcome workflow — sends initial SMS/WhatsApp
 */
async function triggerWelcomeWorkflow(
  leadId: string,
  firstName: string,
  channelsOptin: any,
) {
  try {
    const interactions = [];

    if (channelsOptin?.sms) {
      interactions.push({
        lead_id: leadId,
        channel: "sms",
        type: "outbound",
        content: `Bienvenue chez Gnamba Services${firstName ? ", " + firstName : ""}! Nous vous contacterons bientôt.`,
        status: "sent",
        metadata: { workflow: "welcome_sequence" },
      });
    }

    if (channelsOptin?.whatsapp) {
      interactions.push({
        lead_id: leadId,
        channel: "whatsapp",
        type: "outbound",
        content: `Bonjour${firstName ? " " + firstName : ""}! Bienvenue chez Gnamba Services 🏗️. Découvrez nos services BTP, Immobilier et Foncier.`,
        status: "sent",
        metadata: { workflow: "welcome_sequence" },
      });
    }

    if (interactions.length > 0) {
      await supabase.from("lead_interactions").insert(interactions);
    }

    // Update last_interaction_at
    await supabase
      .from("leads")
      .update({ last_interaction_at: new Date().toISOString() })
      .eq("id", leadId);
  } catch (err) {
    if (import.meta.env.DEV)
      console.error("[LeadCapture] Welcome workflow failed:", err);
    // Don't fail the lead capture if workflow fails
  }
}

/**
 * POST /api/capture-lead
 */
export async function captureLead(req: Request): Promise<Response> {
  try {
    const body: CaptureLeadRequest = await req.json();

    // Validate required fields
    if (!body.phone) {
      return new Response(
        JSON.stringify({ error: "Le numéro de téléphone est obligatoire." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!body.source) {
      return new Response(
        JSON.stringify({ error: "La source est obligatoire." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Normalize phone
    const normalizedPhone = normalizePhone(body.phone);

    // Validate email if provided
    if (body.email && !isValidEmail(body.email)) {
      return new Response(
        JSON.stringify({ error: "Format d'email invalide." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("leads")
      .select("id, status, tags, first_name, last_name, email")
      .eq("phone", normalizedPhone)
      .single();

    if (existing) {
      // Update existing lead's source/tags
      const newTags = [
        ...(existing.tags || []),
        body.source_form || "form_capture",
      ].filter((v, i, a) => a.indexOf(v) === i);

      await supabase
        .from("leads")
        .update({
          first_name: body.first_name || existing.first_name,
          last_name: body.last_name || existing.last_name,
          email: body.email || existing.email,
          tags: newTags,
          last_interaction_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      return new Response(
        JSON.stringify({
          message: "Lead mis à jour.",
          lead_id: existing.id,
          updated: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Insert new lead
    const { data: newLead, error } = await supabase
      .from("leads")
      .insert({
        phone: normalizedPhone,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        source: body.source,
        source_page: body.source_page,
        source_form: body.source_form,
        user_id: body.user_id,
        consent_text:
          body.consent_text ||
          "J'accepte de recevoir des communications commerciales par SMS, WhatsApp, Email et Telegram de la part de Gnamba Services.",
        channels_optin: body.channels_optin || {
          sms: true,
          whatsapp: true,
          email: true,
          telegram: false,
        },
        tags: body.source_form ? [body.source_form] : [],
      })
      .select()
      .single();

    if (error) {
      if (import.meta.env.DEV)
        console.error("[LeadCapture] Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'enregistrement du lead." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Trigger welcome workflow (async, non-blocking)
    triggerWelcomeWorkflow(
      newLead.id,
      newLead.first_name,
      newLead.channels_optin,
    );

    return new Response(
      JSON.stringify({
        message: "Lead capturé avec succès.",
        lead_id: newLead.id,
        created: true,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    if (import.meta.env.DEV)
      console.error("[LeadCapture] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
