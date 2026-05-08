/**
 * Multi-Channel Bot Engine
 * =========================
 * Autonomous bot managing SMS, WhatsApp, Email, Telegram.
 * Processes workflows, sends messages, tracks interactions.
 *
 * Usage: Call processWorkflows() on schedule or via webhook.
 */

import { supabase } from "../lib/supabase";

// ============================================
// Configuration — Environment-driven
// ============================================
const CONFIG = {
  twilio: {
    accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || "",
    authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || "",
    messagingServiceSid:
      import.meta.env.VITE_TWILIO_MESSAGING_SERVICE_SID || "",
    fromPhone: import.meta.env.VITE_TWILIO_PHONE_NUMBER || "",
  },
  whatsapp: {
    accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || "",
    apiUrl: "https://graph.facebook.com/v18.0",
  },
  telegram: {
    botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "",
    apiUrl: "https://api.telegram.org/bot",
  },
  email: {
    fromEmail: import.meta.env.VITE_EMAIL_FROM || "contact@gnambaservices.ci",
    apiUrl: import.meta.env.VITE_EMAIL_API_URL || "",
    apiKey: import.meta.env.VITE_EMAIL_API_KEY || "",
  },
  batchSize: 50, // Max leads per batch
  rateLimitDelay: 1000, // ms between messages
};

// ============================================
// Channel Senders
// ============================================

/**
 * Send SMS via Twilio
 */
async function sendSMS(
  phone: string,
  content: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!CONFIG.twilio.authToken) {
      return { success: false, error: "Twilio not configured" };
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${CONFIG.twilio.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            btoa(`${CONFIG.twilio.accountSid}:${CONFIG.twilio.authToken}`),
        },
        body: new URLSearchParams({
          From: CONFIG.twilio.fromPhone,
          To: phone,
          Body: content,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.message || "SMS sending failed" };
    }

    const data = await response.json();
    return { success: true, messageId: data.sid };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send WhatsApp via Meta Cloud API
 */
async function sendWhatsApp(
  phone: string,
  content: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!CONFIG.whatsapp.accessToken) {
      return { success: false, error: "WhatsApp not configured" };
    }

    // Clean phone: remove + and spaces
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    const response = await fetch(
      `${CONFIG.whatsapp.apiUrl}/${CONFIG.whatsapp.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONFIG.whatsapp.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: "gnamba_welcome",
            language: { code: "fr" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: content }],
              },
            ],
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      return {
        success: false,
        error: err.error?.message || "WhatsApp sending failed",
      };
    }

    const data = await response.json();
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send Email via API (Brevo/SendPulse/Resend)
 */
async function sendEmail(
  email: string,
  subject: string,
  content: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!CONFIG.email.apiKey || !CONFIG.email.apiUrl) {
      return { success: false, error: "Email API not configured" };
    }

    const response = await fetch(CONFIG.email.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": CONFIG.email.apiKey,
      },
      body: JSON.stringify({
        sender: { email: CONFIG.email.fromEmail, name: "Gnamba Services" },
        to: [{ email }],
        subject,
        htmlContent: content,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.message || "Email sending failed" };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId || data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Send Telegram message
 */
async function sendTelegram(
  chatId: string,
  content: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!CONFIG.telegram.botToken) {
      return { success: false, error: "Telegram not configured" };
    }

    const response = await fetch(
      `${CONFIG.telegram.apiUrl}${CONFIG.telegram.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: content,
          parse_mode: "HTML",
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      return {
        success: false,
        error: err.description || "Telegram sending failed",
      };
    }

    const data = await response.json();
    return { success: true, messageId: String(data.result?.message_id) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================
// Workflow Processor
// ============================================

/**
 * Process a single workflow action for a lead
 */
async function processAction(lead: any, action: any): Promise<void> {
  const { first_name, last_name, phone, email, channels_optin } = lead;
  const fullName =
    [first_name, last_name].filter(Boolean).join(" ") || "Client";

  // Personalize template
  const content = action.template
    .replace(/{first_name}/gi, first_name || "")
    .replace(/{last_name}/gi, last_name || "")
    .replace(/{full_name}/gi, fullName)
    .replace(/{phone}/gi, phone || "");

  // Check channel opt-in
  if (action.channel === "sms" && !channels_optin?.sms) return;
  if (action.channel === "whatsapp" && !channels_optin?.whatsapp) return;
  if (action.channel === "email" && !channels_optin?.email) return;
  if (action.channel === "telegram" && !channels_optin?.telegram) return;

  // Send message
  let result;
  switch (action.channel) {
    case "sms":
      result = await sendSMS(phone, content);
      break;
    case "whatsapp":
      result = await sendWhatsApp(phone, content);
      break;
    case "email":
      if (email) {
        result = await sendEmail(email, "Gnamba Services", content);
      } else {
        return; // No email to send to
      }
      break;
    case "telegram":
      if (lead.telegram_chat_id) {
        result = await sendTelegram(lead.telegram_chat_id, content);
      }
      return;
    default:
      return;
  }

  // Log interaction
  if (result) {
    await supabase.from("lead_interactions").insert({
      lead_id: lead.id,
      channel: action.channel,
      type: action.workflow_type || "outbound",
      content,
      status: result.success ? "sent" : "failed",
      metadata: {
        messageId: result.messageId,
        error: result.error,
        workflow: action.workflow_name,
      },
    });

    // Update lead's last_interaction_at
    if (result.success) {
      await supabase
        .from("leads")
        .update({ last_interaction_at: new Date().toISOString() })
        .eq("id", lead.id);
    }
  }
}

/**
 * Process all active workflows
 * Called on schedule or via webhook
 */
export async function processWorkflows(): Promise<{
  processed: number;
  errors: number;
}> {
  let processed = 0;
  let errors = 0;

  try {
    // Get all active workflows
    const { data: workflows, error: wfError } = await supabase
      .from("bot_workflows")
      .select("*")
      .eq("status", "active");

    if (wfError || !workflows) {
      if (import.meta.env.DEV)
        console.error("[BotEngine] Failed to fetch workflows:", wfError);
      return { processed: 0, errors: 1 };
    }

    for (const workflow of workflows) {
      try {
        const { trigger_type, trigger_config, actions } = workflow;

        let leads: any[] = [];

        // Fetch leads based on trigger type
        if (
          trigger_type === "event" &&
          trigger_config.event === "lead_created"
        ) {
          // Get leads created in last hour
          const oneHourAgo = new Date(
            Date.now() - 60 * 60 * 1000,
          ).toISOString();
          const { data } = await supabase
            .from("leads")
            .select("*")
            .eq("status", "active")
            .gte("created_at", oneHourAgo)
            .is("last_interaction_at", null); // Never contacted
          leads = data || [];
        } else if (trigger_type === "schedule") {
          // Get inactive leads for 30+ days
          const thirtyDaysAgo = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString();
          const { data } = await supabase
            .from("leads")
            .select("*")
            .eq("status", "active")
            .lt("last_interaction_at", thirtyDaysAgo)
            .limit(CONFIG.batchSize);
          leads = data || [];
        }

        // Process each lead
        for (const lead of leads) {
          for (const action of actions) {
            try {
              // Check delay
              if (action.delay_minutes) {
                // Schedule for later (in production, use a job queue)
                continue;
              }

              await processAction(lead, action);
              processed++;

              // Rate limiting
              await new Promise((r) => setTimeout(r, CONFIG.rateLimitDelay));
            } catch (err) {
              if (import.meta.env.DEV)
                console.error("[BotEngine] Action processing error:", err);
              errors++;
            }
          }
        }

        // Update workflow execution count
        await supabase
          .from("bot_workflows")
          .update({
            execution_count: (workflow.execution_count || 0) + 1,
            last_executed_at: new Date().toISOString(),
          })
          .eq("id", workflow.id);
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("[BotEngine] Workflow processing error:", err);
        errors++;
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error("[BotEngine] Fatal error:", err);
    errors++;
  }

  return { processed, errors };
}

// ============================================
// Campaign Processor
// ============================================

/**
 * Process a specific campaign
 */
export async function processCampaign(
  campaignId: string,
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  try {
    // Get campaign
    const { data: campaign } = await supabase
      .from("lead_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (!campaign) {
      if (import.meta.env.DEV)
        console.error("[BotEngine] Campaign not found:", campaignId);
      return { sent: 0, failed: 0 };
    }

    // Get matching leads
    let leadsQuery = supabase.from("leads").select("*").eq("status", "active");

    // Apply segment filters
    if (campaign.segment_filter) {
      const { tags, min_score, source } = campaign.segment_filter;
      if (tags?.length > 0) {
        leadsQuery = leadsQuery.overlaps("tags", tags);
      }
      if (min_score) {
        leadsQuery = leadsQuery.gte("score", min_score);
      }
      if (source) {
        leadsQuery = leadsQuery.eq("source", source);
      }
    }

    const { data: leads } = await leadsQuery.limit(CONFIG.batchSize);

    if (!leads || leads.length === 0) {
      return { sent: 0, failed: 0 };
    }

    // Update campaign status
    await supabase
      .from("lead_campaigns")
      .update({
        status: "running",
        started_at: campaign.started_at || new Date().toISOString(),
      })
      .eq("id", campaignId);

    // Send to each lead
    for (const lead of leads) {
      try {
        const channels = campaign.channels || ["sms"];

        for (const channel of channels) {
          const template = campaign.template_content?.[channel];
          if (!template) continue;

          // Check opt-in
          if (!lead.channels_optin?.[channel]) continue;

          // Personalize and send
          const content = template
            .replace(/{first_name}/gi, lead.first_name || "")
            .replace(/{last_name}/gi, lead.last_name || "")
            .replace(/{phone}/gi, lead.phone || "");

          let result;
          switch (channel) {
            case "sms":
              result = await sendSMS(lead.phone, content);
              break;
            case "whatsapp":
              result = await sendWhatsApp(lead.phone, content);
              break;
            case "email":
              if (lead.email) {
                result = await sendEmail(lead.email, campaign.name, content);
              }
              break;
            default:
              continue;
          }

          if (result?.success) {
            sent++;
            await supabase.from("lead_interactions").insert({
              lead_id: lead.id,
              channel,
              type: "campaign",
              template_id: campaignId,
              content,
              status: "sent",
            });
          } else {
            failed++;
          }

          await new Promise((r) => setTimeout(r, CONFIG.rateLimitDelay));
        }
      } catch (err) {
        if (import.meta.env.DEV)
          console.error("[BotEngine] Campaign send error:", err);
        failed++;
      }
    }

    // Update campaign stats
    await supabase
      .from("lead_campaigns")
      .update({
        stats: {
          ...campaign.stats,
          sent: (campaign.stats?.sent || 0) + sent,
          failed: (campaign.stats?.failed || 0) + failed,
        },
      })
      .eq("id", campaignId);

    // Check if campaign is complete
    if (!campaign.segment_filter?.repeat) {
      await supabase
        .from("lead_campaigns")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaignId);
    }
  } catch (err) {
    if (import.meta.env.DEV)
      console.error("[BotEngine] Campaign processing error:", err);
    failed++;
  }

  return { sent, failed };
}

/**
 * Export for use as Edge Function or scheduled job
 */
export default { processWorkflows, processCampaign };
