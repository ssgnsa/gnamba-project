import { apiClient } from "../api/client";

/**
 * Lead Capture System — Universal Form Interceptor
 * Version: API locale /api/v1
 */

const CONFIG = {
  retryAttempts: 3,
  retryDelay: 2000,
  consentCheckboxId: "lead-capture-consent",
};

const LOCAL_CAPTURE_PATH = "/api/v1/leads/capture";
const PHONE_SELECTORS = [
  'input[type="tel"]',
  'input[name*="phone" i]',
  'input[name*="tel" i]',
  'input[name*="mobile" i]',
  'input[name*="portable" i]',
  'input[name*="telephone" i]',
  'input[id*="phone" i]',
  'input[id*="tel" i]',
];

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
        sms: boolean;
        whatsapp: boolean;
        email: boolean;
        telegram: boolean;
      }
    | string[];
}

const DEFAULT_CHANNELS_OPTIN = {
  sms: true,
  whatsapp: true,
  email: true,
  telegram: false,
};

function normalizeChannelsOptIn(
  channels?: LeadData["channels_optin"],
): LeadData["channels_optin"] {
  if (!channels) return DEFAULT_CHANNELS_OPTIN;
  if (Array.isArray(channels)) {
    const normalized = { ...DEFAULT_CHANNELS_OPTIN };
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
    sms: Boolean(channels.sms),
    whatsapp: Boolean(channels.whatsapp),
    email: Boolean(channels.email),
    telegram: Boolean(channels.telegram),
  };
}

export async function captureLead(
  leadData: LeadData,
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    // Vérifier le consentement (RGPD/Loi ivoirienne)
    const consentCheckbox = document.getElementById(
      CONFIG.consentCheckboxId,
    ) as HTMLInputElement;
    if (consentCheckbox && !consentCheckbox.checked) {
      throw new Error("Consentement requis pour collecter les données");
    }

    const response = await apiClient.request<{ success: boolean; data?: any }>(
      LOCAL_CAPTURE_PATH,
      {
      method: "POST",
      body: JSON.stringify({
        phone: leadData.phone,
        first_name: leadData.first_name || null,
        last_name: leadData.last_name || null,
        email: leadData.email || null,
        source: leadData.source || "web_form",
        source_page: leadData.source_page || window.location.pathname,
        source_form: leadData.source_form || "unknown",
        consent_text: leadData.consent_text || "J'accepte d'être contacté",
        channels_optin: normalizeChannelsOptIn(leadData.channels_optin),
      }),
      },
    );

    if (response.error || !response.data?.success) {
      throw new Error(response.error || "Capture lead impossible");
    }

    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error };
  }
}

// Fonction pour intercepter automatiquement les formulaires
function isLocalCaptureEndpoint(action?: string | null): boolean {
  if (!action) return false;
  try {
    const url = new URL(action, window.location.href);
    return url.pathname === LOCAL_CAPTURE_PATH;
  } catch {
    return false;
  }
}

function findPhoneInput(form: HTMLFormElement): HTMLInputElement | null {
  for (const selector of PHONE_SELECTORS) {
    const input = form.querySelector(selector) as HTMLInputElement | null;
    if (input && input.value) return input;
  }
  return null;
}

export function initLeadCapture() {
  document.addEventListener("submit", async (event) => {
    const form = event.target as HTMLFormElement;
    const originalAction = form.getAttribute("action");
    const phoneInput = findPhoneInput(form);
    const shouldIntercept = Boolean(phoneInput && phoneInput.value);

    if (!shouldIntercept || !phoneInput) return;

    event.preventDefault();

    const leadData: LeadData = {
      phone: phoneInput.value,
      first_name: (
        form.querySelector(
          'input[name="first_name"], input[name="firstName"], input[name*="prenom" i], input[name*="nom" i]',
        ) as HTMLInputElement
      )?.value,
      last_name: (
        form.querySelector(
          'input[name="last_name"], input[name="lastName"], input[name*="prenom" i], input[name*="nom" i]',
        ) as HTMLInputElement
      )?.value,
      email: (form.querySelector('input[type="email"]') as HTMLInputElement)
        ?.value,
      source_form: form.id || form.name || originalAction || "unknown",
    };

    const result = await captureLead(leadData);

    if (result.success) {
      if (isLocalCaptureEndpoint(originalAction)) {
        return;
      }

      form.submit();
    } else {
      if (isLocalCaptureEndpoint(originalAction)) {
        return;
      }
      form.submit();
    }
  });
}

let leadCaptureInitialized = false;

export function ensureLeadCaptureInit() {
  if (typeof window === "undefined") return;
  if (leadCaptureInitialized) return;
  initLeadCapture();
  leadCaptureInitialized = true;
}
