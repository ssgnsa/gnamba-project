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
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  /**
   * Envoyer un message WhatsApp
   */
  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    // Envoi côté client désactivé. Utilisez l'endpoint backend `/api/v1/notifications/whatsapp/send`.
    console.error("sendMessage côté client désactivé. Utilisez le proxy backend.");
    return false;
  }

  /**
   * Envoyer via Twilio WhatsApp API
   */
  private async sendViaTwilio(message: WhatsAppMessage): Promise<boolean> {
    if (!this.config.accountSid || !this.config.authToken || !this.config.phoneNumber) {
      console.error("Configuration Twilio incomplète");
      return false;
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${this.config.accountSid}:${this.config.authToken}`)}`,
          },
          body: new URLSearchParams({
            From: `whatsapp:${this.config.phoneNumber}`,
            To: `whatsapp:${message.to}`,
            Body: message.message,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Erreur Twilio:", error);
      return false;
    }
  }

  /**
   * Envoyer via MessageBird WhatsApp API
   */
  private async sendViaMessageBird(message: WhatsAppMessage): Promise<boolean> {
    if (!this.config.apiKey || !this.config.phoneNumber) {
      console.error("Configuration MessageBird incomplète");
      return false;
    }

    try {
      const response = await fetch("https://conversations.messagebird.com/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `AccessKey ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          to: message.to,
          from: this.config.phoneNumber,
          type: "text",
          content: {
            text: message.message,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Erreur MessageBird:", error);
      return false;
    }
  }

  /**
   * Envoyer via WhatsApp Business API (Meta)
   */
  private async sendViaWhatsAppBusinessAPI(message: WhatsAppMessage): Promise<boolean> {
    if (!this.config.accessToken || !this.config.whatsappBusinessNumber) {
      console.error("Configuration WhatsApp Business API incomplète");
      return false;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.config.whatsappBusinessNumber}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: message.to,
            type: "text",
            text: {
              body: message.message,
            },
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Erreur WhatsApp Business API:", error);
      return false;
    }
  }

  /**
   * Envoyer via CallMeBot (gratuit pour tests)
   * Limité à 10 messages par jour
   */
  private async sendViaCallMeBot(message: WhatsAppMessage): Promise<boolean> {
    try {
      const apiKey = this.config.apiKey || import.meta.env.VITE_CALLMEBOT_API_KEY || "";

      if (!apiKey) {
        console.error("Aucun apiKey CallMeBot configuré");
        return false;
      }

      const response = await fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${message.to}&text=${encodeURIComponent(message.message)}&apikey=${apiKey}`
      );

      return response.ok;
    } catch (error) {
      console.error("Erreur CallMeBot:", error);
      return false;
    }
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
  const config = getWhatsAppConfig();

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
