/**
 * Lead Capture System — Universal Form Interceptor
 * Version: Supabase Edge Function
 */

const CONFIG = {
  retryAttempts: 3,
  retryDelay: 2000,
  consentCheckboxId: "lead-capture-consent",
}

const LEGACY_CAPTURE_PATTERNS = [/\/api\/capture-lead(?:\/|$)/i, /\/api\/capture(?:\/|$)/i]
const PHONE_SELECTORS = [
  'input[type="tel"]',
  'input[name*="phone" i]',
  'input[name*="tel" i]',
  'input[name*="mobile" i]',
  'input[name*="portable" i]',
  'input[name*="telephone" i]',
  'input[id*="phone" i]',
  'input[id*="tel" i]',
]

interface LeadData {
  phone: string
  first_name?: string
  last_name?: string
  email?: string
  source?: string
  source_page?: string
  source_form?: string
  consent_text?: string
  channels_optin?: string[]
}

export async function captureLead(leadData: LeadData): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    // Vérifier le consentement (RGPD/Loi ivoirienne)
    const consentCheckbox = document.getElementById(CONFIG.consentCheckboxId) as HTMLInputElement
    if (consentCheckbox && !consentCheckbox.checked) {
      throw new Error("Consentement requis pour collecter les données")
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error("Supabase URL not configured")
    }

    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY || ''
    const response = await fetch(`${supabaseUrl}/functions/v1/capture-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          phone: leadData.phone,
          first_name: leadData.first_name || null,
          last_name: leadData.last_name || null,
          email: leadData.email || null,
          source: leadData.source || 'web_form',
          source_page: leadData.source_page || window.location.pathname,
          source_form: leadData.source_form || 'unknown',
          consent_text: leadData.consent_text || "J'accepte d'être contacté",
          channels_optin: leadData.channels_optin || ['phone'],
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Lead capturé avec succès:', result.data)
    return { success: true, data: result.data }
  } catch (error) {
    console.error('❌ Erreur capture lead:', error)
    return { success: false, error }
  }
}

// Fonction pour intercepter automatiquement les formulaires
function isLegacyCaptureEndpoint(action?: string | null): boolean {
  if (!action) return false
  try {
    const url = new URL(action, window.location.href)
    return LEGACY_CAPTURE_PATTERNS.some((pattern) => pattern.test(url.pathname))
  } catch {
    return false
  }
}

function findPhoneInput(form: HTMLFormElement): HTMLInputElement | null {
  for (const selector of PHONE_SELECTORS) {
    const input = form.querySelector(selector) as HTMLInputElement | null
    if (input && input.value) return input
  }
  return null
}

export function initLeadCapture() {
  document.addEventListener('submit', async (event) => {
    const form = event.target as HTMLFormElement
    const originalAction = form.getAttribute('action')
    const phoneInput = findPhoneInput(form)
    const shouldIntercept = Boolean(phoneInput && phoneInput.value)

    if (!shouldIntercept || !phoneInput) return

    event.preventDefault()

    const leadData: LeadData = {
      phone: phoneInput.value,
      first_name: (form.querySelector('input[name="first_name"], input[name="firstName"], input[name*="prenom" i], input[name*="nom" i]') as HTMLInputElement)?.value,
      last_name: (form.querySelector('input[name="last_name"], input[name="lastName"], input[name*="prenom" i], input[name*="nom" i]') as HTMLInputElement)?.value,
      email: (form.querySelector('input[type="email"]') as HTMLInputElement)?.value,
      source_form: form.id || form.name || originalAction || 'unknown',
    }

    const result = await captureLead(leadData)

    if (result.success) {
      if (isLegacyCaptureEndpoint(originalAction)) {
        console.warn(
          'Lead capture succeeded, skipped legacy form submission to',
          originalAction,
        )
        return
      }

      form.submit()
    } else {
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.")
    }
  })
}

let leadCaptureInitialized = false

export function ensureLeadCaptureInit() {
  if (typeof window === 'undefined') return
  if (leadCaptureInitialized) return
  initLeadCapture()
  leadCaptureInitialized = true
}
