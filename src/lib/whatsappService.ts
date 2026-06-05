/**
 * Service d'envoi de notifications WhatsApp
 * Supporte différents fournisseurs : Twilio, MessageBird, etc.
 */

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
    try {
      switch (this.config.provider) {
        case "twilio":
          return this.sendViaTwilio(message);
        case "messagebird":
          return this.sendViaMessageBird(message);
        case "whatsapp_business_api":
          return this.sendViaWhatsAppBusinessAPI(message);
        case "callmebot":
          return this.sendViaCallMeBot(message);
        default:
          console.error("Fournisseur WhatsApp non supporté:", this.config.provider);
          return false;
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi WhatsApp:", error);
      return false;
    }
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
      const apiKey = "123456"; // Clé API de test (à remplacer)
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
  const provider = (import.meta.env.VITE_WHATSAPP_PROVIDER ||
    "callmebot") as WhatsAppConfig["provider"];

  const config: WhatsAppConfig = {
    provider,
    accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
    authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN,
    phoneNumber: import.meta.env.VITE_TWILIO_PHONE_NUMBER,
    apiKey: import.meta.env.VITE_MESSAGEBIRD_API_KEY,
    whatsappBusinessNumber: import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER,
    accessToken: import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN,
  };

  // Vérifier que la configuration minimale est présente
  if (provider === "callmebot") {
    return config; // CallMeBot fonctionne avec config minimale
  }

  if (provider === "twilio" && (!config.accountSid || !config.authToken || !config.phoneNumber)) {
    console.error("Configuration Twilio incomplète");
    return null;
  }

  if (provider === "messagebird" && (!config.apiKey || !config.phoneNumber)) {
    console.error("Configuration MessageBird incomplète");
    return null;
  }

  if (provider === "whatsapp_business_api" && (!config.accessToken || !config.whatsappBusinessNumber)) {
    console.error("Configuration WhatsApp Business API incomplète");
    return null;
  }

  return config;
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
  if (!config) {
    console.error("Configuration WhatsApp non disponible");
    return false;
  }

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

  // Envoyer le message
  const service = new WhatsAppService(config);
  return service.sendMessage({ to: formattedPhone, message });
}
