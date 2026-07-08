/**
 * Lead API - Direct API locale Integration (No backend)
 */

import { leadsRepository } from "../data/leads.repository";

export async function captureLead(req: Request): Promise<Response> {
  try {
    const body = await req.json();
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

    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number required" }), {
        status: 400,
      });
    }

    const normalizedChannels = Array.isArray(channels_optin)
      ? {
          sms:
            channels_optin.includes("sms") || channels_optin.includes("phone"),
          whatsapp: channels_optin.includes("whatsapp"),
          email: channels_optin.includes("email"),
          telegram: channels_optin.includes("telegram"),
        }
      : {
          sms: Boolean(channels_optin?.sms),
          whatsapp: Boolean(channels_optin?.whatsapp),
          email: Boolean(channels_optin?.email),
          telegram: Boolean(channels_optin?.telegram),
        };

    const { data, error } = await leadsRepository.create({
      phone,
      first_name,
      last_name,
      email,
      source: source || "api",
      source_page,
      source_form,
      consent_text: consent_text || "Consentement via API",
      channels_optin: normalizedChannels,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Capture lead error:", error);
    return new Response(JSON.stringify({ error: "Failed to capture lead" }), {
      status: 500,
    });
  }
}
