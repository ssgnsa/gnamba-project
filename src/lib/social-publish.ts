/**
 * Social Media Auto-Publishing System
 * =====================================
 * Generates and publishes content on Facebook, Instagram, LinkedIn, X, Telegram.
 * AI-powered content generation with A/B testing.
 *
 * Usage: Call generateAndPublish() to auto-create from ERP events.
 */

import { supabase } from "../lib/supabase";

// ============================================
// Configuration
// ============================================
const CONFIG = {
  meta: {
    accessToken: import.meta.env.VITE_META_ACCESS_TOKEN || "",
    facebookPageId: import.meta.env.VITE_FACEBOOK_PAGE_ID || "",
    instagramAccountId: import.meta.env.VITE_INSTAGRAM_ACCOUNT_ID || "",
    apiUrl: "https://graph.facebook.com/v18.0",
  },
  linkedin: {
    accessToken: import.meta.env.VITE_LINKEDIN_ACCESS_TOKEN || "",
    personUrn: import.meta.env.VITE_LINKEDIN_PERSON_URN || "",
    organizationId: import.meta.env.VITE_LINKEDIN_ORG_ID || "",
    apiUrl: "https://api.linkedin.com/v2",
  },
  x: {
    apiKey: import.meta.env.VITE_X_API_KEY || "",
    apiSecret: import.meta.env.VITE_X_API_SECRET || "",
    accessToken: import.meta.env.VITE_X_ACCESS_TOKEN || "",
    accessSecret: import.meta.env.VITE_X_ACCESS_SECRET || "",
    apiUrl: "https://api.twitter.com/2",
  },
  telegram: {
    channelUsername: import.meta.env.VITE_TELEGRAM_CHANNEL || "",
    botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "",
  },
};

// ============================================
// AI Content Generation
// ============================================

/**
 * Generate post variants using AI prompt
 * In production, call Ollama or another LLM
 */
async function generatePostVariants(
  topic: string,
  platform: string,
  context?: string,
): Promise<{ text: string; hashtags: string[] }[]> {
  // AI-generated content templates (replace with LLM call in production)
  const templates: Record<string, Array<(ctx: string) => string>> = {
    facebook: [
      (
        ctx,
      ) => `🏗️ Gnamba Services — Votre partenaire de confiance en Côte d'Ivoire!

${ctx}

📞 Contactez-nous dès maintenant pour un devis gratuit!
🌐 www.gnambaservices.ci`,
      (ctx) => `✨ NOUVEAU CHEZ GNAMBA SERVICES!

${ctx}

💪 Des professionnels à votre service pour tous vos projets BTP, Immobilier et Foncier.
📍 Abidjan, Côte d'Ivoire

#GnambaServices #BTP #Immobilier #Abidjan`,
    ],
    linkedin: [
      (ctx) => `Gnamba Services est fier de vous présenter:

${ctx}

Notre expertise dans le BTP, l'immobilier et le foncier en Côte d'Ivoire nous permet de accompagner nos clients vers la réussite.

📧 contact@gnambaservices.ci
🌐 www.gnambaservices.ci

#Construction #Immobilier #CoteDIvoire #Business`,
    ],
    instagram: [
      (ctx) => `🏗️✨ ${ctx}

Contact: 📞 +225 07 XX XX XX XX
📍 Abidjan, Côte d'Ivoire

#GnambaServices #BTP #Construction #Immobilier #Foncier #Abidjan #CoteDIvoire #Architecture`,
    ],
    x: [
      (ctx) => `${ctx}

Gnamba Services — BTP · Immobilier · Foncier
🌐 www.gnambaservices.ci

#BTP #Abidjan`,
    ],
    telegram: [
      (ctx) => `📢 *Gnamba Services*

${ctx}

📞 +225 07 XX XX XX XX
🌐 www.gnambaservices.ci`,
    ],
  };

  const platformTemplates = templates[platform] || templates.facebook;

  return platformTemplates.map((template) => ({
    text: template(context || topic),
    hashtags: extractHashtags(context || topic),
  }));
}

/**
 * Extract hashtags from content
 */
function extractHashtags(content: string): string[] {
  const keywords = content.split(/\s+/).filter((w) => w.length > 3);
  const baseTags = ["#GnambaServices", "#BTP", "#Abidjan", "#CoteDIvoire"];
  const customTags = keywords
    .slice(0, 5)
    .map((k) => "#" + k.replace(/[^a-zA-Z]/g, ""));
  return [...new Set([...baseTags, ...customTags])].slice(0, 10);
}

// ============================================
// Platform Publishers
// ============================================

/**
 * Publish to Facebook Page
 */
async function publishToFacebook(
  content: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!CONFIG.meta.accessToken) {
      return { success: false, error: "Facebook not configured" };
    }

    const response = await fetch(
      `${CONFIG.meta.apiUrl}/${CONFIG.meta.facebookPageId}/feed`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${CONFIG.meta.accessToken}` },
        body: new URLSearchParams({ message: content }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      return {
        success: false,
        error: err.error?.message || "Facebook publish failed",
      };
    }

    const data = await response.json();
    return { success: true, postId: data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Publish to Instagram
 */
async function publishToInstagram(
  content: string,
  mediaUrl?: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!CONFIG.meta.accessToken) {
      return { success: false, error: "Instagram not configured" };
    }

    // Step 1: Create media container
    const containerRes = await fetch(
      `${CONFIG.meta.apiUrl}/${CONFIG.meta.instagramAccountId}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${CONFIG.meta.accessToken}` },
        body: new URLSearchParams({
          caption: content,
          ...(mediaUrl ? { image_url: mediaUrl } : {}),
        }),
      },
    );

    if (!containerRes.ok) {
      const err = await containerRes.json();
      return {
        success: false,
        error: err.error?.message || "Instagram container creation failed",
      };
    }

    const containerData = await containerRes.json();
    const containerId = containerData.id;

    // Step 2: Publish media
    const publishRes = await fetch(
      `${CONFIG.meta.apiUrl}/${CONFIG.meta.instagramAccountId}/media_publish`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${CONFIG.meta.accessToken}` },
        body: new URLSearchParams({ creation_id: containerId }),
      },
    );

    if (!publishRes.ok) {
      return { success: false, error: "Instagram publish failed" };
    }

    const publishData = await publishRes.json();
    return { success: true, postId: publishData.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Publish to LinkedIn
 */
async function publishToLinkedIn(
  content: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!CONFIG.linkedin.accessToken) {
      return { success: false, error: "LinkedIn not configured" };
    }

    const urn = CONFIG.linkedin.organizationId
      ? `urn:li:organization:${CONFIG.linkedin.organizationId}`
      : `urn:li:person:${CONFIG.linkedin.personUrn}`;

    const response = await fetch(`${CONFIG.linkedin.apiUrl}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CONFIG.linkedin.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: urn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    if (!response.ok) {
      return { success: false, error: "LinkedIn publish failed" };
    }

    const data = await response.json();
    return { success: true, postId: data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Publish to X (Twitter)
 */
async function publishToX(
  content: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (!CONFIG.x.apiKey) {
      return { success: false, error: "X/Twitter not configured" };
    }

    const response = await fetch(`${CONFIG.x.apiUrl}/tweets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CONFIG.x.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: content.slice(0, 280) }),
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.detail || "X publish failed" };
    }

    const data = await response.json();
    return { success: true, postId: data.data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Publish to Telegram Channel
 */
async function publishToTelegram(
  content: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!CONFIG.telegram.botToken) {
      return { success: false, error: "Telegram not configured" };
    }

    const response = await fetch(
      `https://api.telegram.org/bot${CONFIG.telegram.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CONFIG.telegram.channelUsername,
          text: content,
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      return {
        success: false,
        error: err.description || "Telegram publish failed",
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
// Main Publish Function
// ============================================

/**
 * Generate content and publish to specified platforms
 */
export async function generateAndPublish(
  topic: string,
  platforms: string[],
  context?: string,
  scheduleAt?: string,
): Promise<{
  success: boolean;
  results: Record<
    string,
    { success: boolean; postId?: string; error?: string }
  >;
}> {
  const results: Record<
    string,
    { success: boolean; postId?: string; error?: string }
  > = {};

  // Generate content variants
  for (const platform of platforms) {
    try {
      const variants = await generatePostVariants(topic, platform, context);
      const content = variants[0].text; // Use first variant (implement A/B testing later)
      const hashtags = variants[0].hashtags;

      // If scheduled, save for later
      if (scheduleAt) {
        await supabase.from("social_posts").insert({
          platform,
          content,
          content_variants: variants,
          hashtags,
          scheduled_at: scheduleAt,
          status: "scheduled",
          ai_generated: true,
          ai_prompt: topic,
        });
        results[platform] = { success: true };
        continue;
      }

      // Publish immediately
      let result;
      switch (platform) {
        case "facebook":
          result = await publishToFacebook(content);
          break;
        case "instagram":
          result = await publishToInstagram(content);
          break;
        case "linkedin":
          result = await publishToLinkedIn(content);
          break;
        case "x":
          result = await publishToX(content);
          break;
        case "telegram":
          result = await publishToTelegram(content);
          break;
        default:
          result = { success: false, error: `Unknown platform: ${platform}` };
      }

      results[platform] = result;

      // Save to database
      const postIdentifier =
        "postId" in result
          ? result.postId
          : "messageId" in result
            ? result.messageId
            : undefined;
      await supabase.from("social_posts").insert({
        platform,
        content,
        hashtags,
        posted_at: result.success ? new Date().toISOString() : null,
        post_id_platform: postIdentifier,
        status: result.success ? "posted" : "failed",
        ai_generated: true,
        ai_prompt: topic,
      });
    } catch (err) {
      results[platform] = {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  return {
    success: Object.values(results).every((r) => r.success),
    results,
  };
}

/**
 * Process scheduled posts — call this on schedule (e.g., every minute)
 */
export async function processScheduledPosts(): Promise<{
  published: number;
  failed: number;
}> {
  let published = 0;
  let failed = 0;

  try {
    // Get posts that are due
    const now = new Date().toISOString();
    const { data: posts } = await supabase
      .from("social_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .limit(50);

    if (!posts || posts.length === 0) {
      return { published: 0, failed: 0 };
    }

    for (const post of posts) {
      try {
        let result;
        switch (post.platform) {
          case "facebook":
            result = await publishToFacebook(post.content);
            break;
          case "instagram":
            result = await publishToInstagram(post.content);
            break;
          case "linkedin":
            result = await publishToLinkedIn(post.content);
            break;
          case "x":
            result = await publishToX(post.content);
            break;
          case "telegram":
            result = await publishToTelegram(post.content);
            break;
          default:
            continue;
        }

        await supabase
          .from("social_posts")
          .update({
            status: result.success ? "posted" : "failed",
            posted_at: result.success ? new Date().toISOString() : null,
            post_id_platform:
              "postId" in result
                ? result.postId
                : "messageId" in result
                  ? result.messageId
                  : undefined,
          })
          .eq("id", post.id);

        if (result.success) {
          published++;
        } else {
          failed++;
        }
      } catch {
        failed++;
        await supabase
          .from("social_posts")
          .update({ status: "failed" })
          .eq("id", post.id);
      }
    }
  } catch (err) {
    if (import.meta.env.DEV)
      console.error("[SocialPublish] Error processing scheduled posts:", err);
  }

  return { published, failed };
}

export default { generateAndPublish, processScheduledPosts };
