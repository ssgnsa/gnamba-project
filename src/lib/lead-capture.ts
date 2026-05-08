/**
 * Lead Capture System — Universal Form Interceptor
 * ================================================
 * Injects into every page to capture phone numbers from ALL forms.
 * Sends leads to /api/capture-lead endpoint asynchronously.
 *
 * Usage: Add to index.html or inject via layout component.
 * Conforms to Loi n° 2013-450 (Côte d'Ivoire) — requires explicit consent.
 */

(function () {
  "use strict";

  const CONFIG = {
    apiUrl: "/api/capture-lead",
    retryAttempts: 3,
    retryDelay: 2000,
    consentCheckboxId: "lead-capture-consent",
    consentText:
      "J'accepte de recevoir des communications commerciales par SMS, WhatsApp, Email et Telegram de la part de Gnamba Services.",
    debug: false,
  };

  // Phone field detection patterns
  const PHONE_SELECTORS = [
    'input[type="tel"]',
    'input[name*="phone" i]',
    'input[name*="tel" i]',
    'input[name*="mobile" i]',
    'input[name*="portable" i]',
    'input[name*="telephone" i]',
    'input[id*="phone" i]',
    'input[id*="tel" i]',
    'input[id*="mobile" i]',
  ];

  const NAME_SELECTORS = [
    'input[name*="nom" i]',
    'input[name*="name" i]',
    'input[name*="prenom" i]',
    'input[name*="first_name" i]',
    'input[name*="last_name" i]',
  ];

  const EMAIL_SELECTORS = ['input[type="email"]', 'input[name*="email" i]'];

  /**
   * Extract phone number from form
   */
  function extractPhone(form: HTMLFormElement): string | null {
    for (const selector of PHONE_SELECTORS) {
      const el = form.querySelector(selector);
      if (
        el &&
        (el as HTMLInputElement).value &&
        (el as HTMLInputElement).value.trim()
      ) {
        return normalizePhone((el as HTMLInputElement).value.trim());
      }
    }
    return null;
  }

  /**
   * Extract name from form
   */
  function extractName(form: HTMLFormElement): {
    firstName: string;
    lastName: string;
  } {
    let firstName = "";
    let lastName = "";

    for (const selector of NAME_SELECTORS) {
      const el = form.querySelector(selector);
      if (
        el &&
        (el as HTMLInputElement).value &&
        (el as HTMLInputElement).value.trim()
      ) {
        if (selector.includes("prenom") || selector.includes("first")) {
          firstName = (el as HTMLInputElement).value.trim();
        } else if (selector.includes("nom") || selector.includes("last")) {
          lastName = (el as HTMLInputElement).value.trim();
        } else {
          // Generic name field — split on space
          const parts = (el as HTMLInputElement).value.trim().split(" ");
          if (parts.length > 1) {
            firstName = parts[0];
            lastName = parts.slice(1).join(" ");
          } else {
            lastName = parts[0];
          }
        }
      }
    }

    return { firstName, lastName };
  }

  /**
   * Extract email from form
   */
  function extractEmail(form: HTMLFormElement): string | null {
    for (const selector of EMAIL_SELECTORS) {
      const el = form.querySelector(selector);
      if (
        el &&
        (el as HTMLInputElement).value &&
        (el as HTMLInputElement).value.trim()
      ) {
        return (el as HTMLInputElement).value.trim();
      }
    }
    return null;
  }

  /**
   * Normalize phone to E.164 format
   */
  function normalizePhone(phone: string): string {
    // Remove all non-digit and non-plus characters
    const cleaned = phone.replace(/[^0-9+]/g, "");

    // Handle Ivorian local format: 07 XX XX XX XX → +225 07 XX XX XX XX
    if (cleaned.startsWith("0") && cleaned.length === 10) {
      return "+225" + cleaned.substring(1);
    }

    // Handle 00 prefix: 00225... → +225...
    if (cleaned.startsWith("00")) {
      return "+" + cleaned.substring(2);
    }

    // Already E.164
    if (cleaned.startsWith("+")) {
      return cleaned;
    }

    // Fallback: assume Ivorian
    if (cleaned.length === 9) {
      return "+225" + cleaned;
    }

    return cleaned;
  }

  /**
   * Check consent — returns true if user has opted in
   */
  function checkConsent(form: HTMLFormElement): boolean {
    // Try custom checkbox first
    const checkbox = document.getElementById(CONFIG.consentCheckboxId);
    if (checkbox && (checkbox as HTMLInputElement).type === "checkbox") {
      return (checkbox as HTMLInputElement).checked;
    }

    // Look for any consent checkbox in the form
    const allCheckboxes = form.querySelectorAll('input[type="checkbox"]');
    for (const cb of allCheckboxes) {
      const label = getLabelForCheckbox(cb);
      if (
        label &&
        (label.toLowerCase().includes("accept") ||
          label.toLowerCase().includes("consent") ||
          label.toLowerCase().includes("communication") ||
          label.toLowerCase().includes("promotion") ||
          label.toLowerCase().includes("recevoir"))
      ) {
        return (cb as HTMLInputElement).checked;
      }
    }

    // Default: assume consent if no checkbox found (will be flagged in backend)
    return true;
  }

  /**
   * Get label text for a checkbox
   */
  function getLabelForCheckbox(cb: Element): string | null {
    // Try <label for="...">
    if (cb.id) {
      const label = document.querySelector(`label[for="${cb.id}"]`);
      if (label) return label.textContent;
    }

    // Try wrapping label
    const parentLabel = cb.closest("label");
    if (parentLabel) return parentLabel.textContent;

    // Try next sibling
    const next = cb.nextElementSibling;
    if (next && next.tagName === "LABEL") return next.textContent;

    return "";
  }

  /**
   * Send lead to API with retry
   */
  interface LeadData {
    phone: string;
    source: string;
    source_form?: string;
    first_name?: string;
    last_name?: string;
    email?: string | null;
    consent_given: boolean;
    channels_optin?: {
      sms: boolean;
      whatsapp: boolean;
      email: boolean;
      telegram: boolean;
    };
  }

  async function sendLead(leadData: LeadData): Promise<boolean> {
    let attempts = 0;

    while (attempts < CONFIG.retryAttempts) {
      try {
        const response = await fetch(CONFIG.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadData),
        });

        if (response.ok) {
          if (CONFIG.debug) {
            console.log(
              "[LeadCapture] Lead captured successfully:",
              leadData.phone,
            );
          }
          return true;
        }

        if (response.status === 409) {
          // Duplicate — already captured
          if (CONFIG.debug) {
            console.log("[LeadCapture] Lead already exists:", leadData.phone);
          }
          return true;
        }

        attempts++;
        if (attempts < CONFIG.retryAttempts) {
          await new Promise((r) => setTimeout(r, CONFIG.retryDelay * attempts));
        }
      } catch (err) {
        attempts++;
        if (attempts < CONFIG.retryAttempts) {
          await new Promise((r) => setTimeout(r, CONFIG.retryDelay * attempts));
        } else if (CONFIG.debug && import.meta.env.DEV) {
          console.error(
            "[LeadCapture] Failed to capture lead after retries:",
            err,
          );
        }
      }
    }

    // Fallback: store in localStorage for later retry
    storeLeadLocally(leadData);
    return false;
  }

  /**
   * Store lead locally if API fails (background sync)
   */
  function storeLeadLocally(leadData: LeadData): void {
    try {
      const pending = JSON.parse(
        localStorage.getItem("egs:pending_leads") || "[]",
      );
      pending.push({ ...leadData, storedAt: Date.now() });
      localStorage.setItem("egs:pending_leads", JSON.stringify(pending));
      if (CONFIG.debug) {
        console.log(
          "[LeadCapture] Lead stored locally for retry:",
          leadData.phone,
        );
      }
    } catch {
      // localStorage full or unavailable
    }
  }

  /**
   * Retry pending leads from localStorage
   */
  async function retryPendingLeads() {
    try {
      const pending = JSON.parse(
        localStorage.getItem("egs:pending_leads") || "[]",
      );
      const remaining = [];

      for (const lead of pending) {
        const success = await sendLead(lead);
        if (!success) {
          remaining.push(lead);
        }
      }

      localStorage.setItem("egs:pending_leads", JSON.stringify(remaining));
    } catch {
      // Ignore
    }
  }

  /**
   * Handle form submission — intercept and capture
   */
  async function handleFormSubmit(event: Event): Promise<void> {
    const form = event.target as HTMLFormElement;

    // Skip if already processed
    if (form.hasAttribute("data-lead-captured")) return;

    const phone = extractPhone(form);
    if (!phone) return; // No phone found — skip

    const { firstName, lastName } = extractName(form);
    const email = extractEmail(form);
    const consent = checkConsent(form);

    // Check consent — do not capture if declined
    if (!consent) {
      if (CONFIG.debug) {
        console.log("[LeadCapture] User declined consent — not capturing");
      }
      return;
    }

    const leadData = {
      phone,
      first_name: firstName,
      last_name: lastName,
      email,
      source: window.location.href,
      source_page: window.location.pathname,
      source_form: form.id || form.className?.split(" ")[0] || "unknown",
      consent_text: CONFIG.consentText,
      consent_given: consent,
      channels_optin: {
        sms: true,
        whatsapp: true,
        email: true,
        telegram: false,
      },
    };

    // Mark form as processed
    form.setAttribute("data-lead-captured", "true");

    // Send asynchronously (don't block form submission)
    sendLead(leadData);
  }

  /**
   * Inject consent checkbox into forms with phone fields
   */
  function injectConsentCheckboxes() {
    const allForms = document.querySelectorAll("form");

    for (const form of allForms) {
      // Check if form has phone field
      let hasPhone = false;
      for (const selector of PHONE_SELECTORS) {
        if (form.querySelector(selector)) {
          hasPhone = true;
          break;
        }
      }

      if (!hasPhone) continue;

      // Check if consent checkbox already exists
      if (form.querySelector(`#${CONFIG.consentCheckboxId}`)) continue;

      // Find submit button
      const submitBtn = form.querySelector(
        'button[type="submit"], input[type="submit"]',
      );
      if (!submitBtn) continue;

      // Create consent checkbox
      const wrapper = document.createElement("div");
      wrapper.style.cssText =
        "margin-bottom: 12px; padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = CONFIG.consentCheckboxId;
      checkbox.checked = true;
      checkbox.style.cssText = "margin-right: 8px; accent-color: #16a34a;";

      const label = document.createElement("label");
      label.htmlFor = CONFIG.consentCheckboxId;
      label.style.cssText = "font-size: 13px; color: #166534; cursor: pointer;";
      label.textContent = CONFIG.consentText;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);

      // Insert before submit button
      if (submitBtn.parentNode) {
        submitBtn.parentNode.insertBefore(wrapper, submitBtn);
      }
    }
  }

  /**
   * Initialize — set up listeners
   */
  function init() {
    // Intercept all form submissions
    document.addEventListener("submit", handleFormSubmit, true);

    // Inject consent checkboxes
    injectConsentCheckboxes();

    // Re-inject on DOM changes (SPA navigation)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          injectConsentCheckboxes();
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Retry pending leads on load
    retryPendingLeads();

    // Retry every 5 minutes
    setInterval(retryPendingLeads, 5 * 60 * 1000);
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
