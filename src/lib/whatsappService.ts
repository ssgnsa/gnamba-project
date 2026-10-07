/**
 * Service d'envoi de notifications WhatsApp
 * Supporte différents fournisseurs : Twilio, MessageBird, etc.
 */

import { apiPost } from "../lib/apiHelpers";

interface WhatsAppConfig {
  provider: "twilio" | "messagebird" | "whatsapp_business_api" | "callmebot";
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  apiKey?: string;
  whatsappBusinessNumber?: string;
  accessToken?: string;
}

interface WhatsAppMessage {
  to: string; // Format: +225XXXXXXXXX (avec code pays)
  message: string;
}

/**
 * Service principal pour l'envoi de messages WhatsApp
 */
export class WhatsAppService {
  constructor(_config: WhatsAppConfig) {}

  /**
   * Envoyer un message WhatsApp
   */
  async sendMessage(_message: WhatsAppMessage): Promise<boolean> {
    // Envoi côté client désactivé. Utilisez l'endpoint backend `/api/v1/notifications/whatsapp/send`.
    console.error("sendMessage côté client désactivé. Utilisez le proxy backend.");
    return false;
  }

  /**
   * Formatter un numéro de téléphone pour WhatsApp
   * Ajoute le code pays si nécessaire
   */
  static formatPhoneNumber(phone: string, defaultCountryCode: string = "225"): string {
    // Nettoyer le numéro
    let cleaned = phone.replace(/\D/g, "");

    // Si le numéro commence par 0, le remplacer par le code pays
    if (cleaned.startsWith("0")) {
      cleaned = defaultCountryCode + cleaned.substring(1);
    }

    // Si le numéro n'a pas de code pays, l'ajouter
    if (!cleaned.startsWith(defaultCountryCode) && cleaned.length === 10) {
      cleaned = defaultCountryCode + cleaned;
    }

    // Ajouter le préfixe + si nécessaire
    if (!cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }

    return cleaned;
  }
}

/**
 * Configuration WhatsApp depuis les variables d'environnement
 */
export function getWhatsAppConfig(): WhatsAppConfig | null {
  const provider = import.meta.env.VITE_WHATSAPP_PROVIDER;

  if (provider === "callmebot") {
    return {
      provider,
      apiKey: import.meta.env.VITE_CALLMEBOT_API_KEY || undefined,
      phoneNumber: import.meta.env.VITE_WHATSAPP_DEFAULT_RECIPIENT || undefined,
    };
  }

  if (import.meta.env.DEV) {
    console.warn(
      "WhatsApp direct est désactivé côté navigateur; utilisez une fonction serveur pour Twilio, MessageBird ou Meta.",
    );
  }

  return null;
}

/**
 * Envoyer une notification de paiement WhatsApp
 */
export async function sendPaymentNotification(
  tenantName: string,
  amount: number,
  propertyAddress?: string,
  recipientPhone?: string
): Promise<boolean> {
  // Numéro par défaut depuis les variables d'environnement ou utiliser celui du locataire
  const toNumber =
    recipientPhone || import.meta.env.VITE_WHATSAPP_DEFAULT_RECIPIENT || "";

  if (!toNumber) {
    console.error("Aucun numéro de téléphone destinataire disponible");
    return false;
  }

  // Formatter le numéro
  const formattedPhone = WhatsAppService.formatPhoneNumber(toNumber, "225"); // Côte d'Ivoire par défaut

  // Formatter le montant
  const formattedAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(amount);

  // Créer le message
  let message = `💰 *NOUVEAU PAIEMENT REÇU*\n\n`;
  message += `👤 Locataire: ${tenantName}\n`;
  message += `💵 Montant: ${formattedAmount}\n`;

  if (propertyAddress) {
    message += `🏠 Propriété: ${propertyAddress}\n`;
  }

  message += `\n📅 Date: ${new Date().toLocaleDateString("fr-FR")}\n`;
  message += `\n_Gnamba Services - EGS_`;
  // Envoi via backend uniquement (plus de fallback côté client pour éviter exposition de clés)
  try {
    const resp = await apiPost<{ status: string }, { to: string; message: string }>(
      "/notifications/whatsapp/send",
      { to: formattedPhone, message }
    );

    if (!resp.error) {
      return true;
    }

    console.error("Envoi WhatsApp via backend échoué:", resp.error);
    return false;
  } catch (err) {
    console.error("Erreur appel backend WhatsApp:", err);
    return false;
  }
}
