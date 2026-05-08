/**
 * Service d'envoi automatique de SMS pour les rappels de paiement de loyer
 *
 * Configuration:
 * 1. Ajouter VITE_SMS_API_URL et VITE_SMS_API_KEY dans .env.server
 * 2. Configurer un cron job pour exécuter ce script le 5 de chaque mois
 *
 * Usage:
 * - Appel automatique via Cloud Function ou serveur
 * - Ou via cron: 0 9 5 * * (le 5 du mois à 9h)
 */

import { supabase } from "../lib/supabase";

interface TenantWithContact {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  property_id?: string;
  loyer?: number;
}

interface PaymentReminder {
  tenant: TenantWithContact;
  amount: number;
  dueDate: string;
  monthsLate: number;
}

/**
 * Formater un numéro de téléphone ivoirien
 */
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\s|-/g, "");

  // Format international
  if (cleaned.startsWith("225")) {
    return `+${cleaned}`;
  }

  // Format local
  if (/^[0-9]{8,10}$/.test(cleaned)) {
    return `+225${cleaned}`;
  }

  return cleaned;
}

/**
 * Envoyer un SMS via l'API configurée
 */
async function sendSMS(
  phone: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const smsApiUrl = import.meta.env.VITE_SMS_API_URL;
  const smsApiKey = import.meta.env.VITE_SMS_API_KEY;

  if (!smsApiUrl || !smsApiKey) {
    if (typeof window !== "undefined" && import.meta.env.DEV)
      console.warn("SMS API not configured. Skipping SMS send.");
    return { success: false, error: "SMS API not configured" };
  }

  try {
    const response = await fetch(smsApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${smsApiKey}`,
      },
      body: JSON.stringify({
        to: formatPhoneNumber(phone),
        message: message,
        sender: "EGS",
      }),
    });

    if (!response.ok) {
      throw new Error(`SMS API error: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, ...result };
  } catch (error: any) {
    if (typeof window !== "undefined" && import.meta.env.DEV)
      console.error("SMS send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Récupérer les locataires avec paiements en retard
 */
async function getTenantsWithLatePayments(): Promise<PaymentReminder[]> {
  const today = new Date();
  // Get all active contracts with unpaid rent
  const { data: contracts, error: contractsError } = await supabase
    .from("lease_contracts")
    .select(
      `
      *,
      properties (*),
      locataires (*)
    `,
    )
    .eq("statut", "actif");

  if (contractsError) {
    if (typeof window !== "undefined" && import.meta.env.DEV)
      console.error("Error fetching contracts:", contractsError);
    return [];
  }

  const reminders: PaymentReminder[] = [];

  for (const contract of contracts || []) {
    const tenant = contract.locataires as TenantWithContact;

    if (!tenant || !tenant.telephone) {
      continue;
    }

    // Check for unpaid payments
    const { data: payments, error: paymentsError } = await supabase
      .from("rent_payments")
      .select("*")
      .eq("locataire_id", tenant.id)
      .eq("statut", "en_attente")
      .lte("date_echeance", today.toISOString().split("T")[0])
      .order("date_echeance", { ascending: true });

    if (paymentsError || !payments || payments.length === 0) {
      continue;
    }

    // Get the oldest unpaid payment
    const oldestPayment = payments[0];
    const dueDate = new Date(
      oldestPayment.date_echeance || oldestPayment.date_paiement,
    );

    // Calculate months late
    const monthsDiff =
      (today.getFullYear() - dueDate.getFullYear()) * 12 +
      (today.getMonth() - dueDate.getMonth());

    if (monthsDiff > 0) {
      reminders.push({
        tenant,
        amount: oldestPayment.montant || contract.loyer_mensuel || 0,
        dueDate: dueDate.toISOString().split("T")[0],
        monthsLate: monthsDiff,
      });
    }
  }

  return reminders;
}

/**
 * Générer le message SMS de rappel
 */
function generateReminderMessage(reminder: PaymentReminder): string {
  const { tenant, amount, monthsLate } = reminder;

  const monthLabel = monthsLate === 1 ? "mois" : "mois";

  return `Bonjour ${tenant.prenom} ${tenant.nom},

Rappel de paiement de loyer - EGS Immobilier

Votre loyer de ${amount.toLocaleString("fr-FR")} FCFA est en attente de paiement depuis ${monthsLate} ${monthLabel}.

Merci de régulariser votre situation dans les plus brefs délais.

Pour toute question, contactez-nous au 07 07 07 07 07.

Cordialement,
EGS Immobilier`;
}

/**
 * Fonction principale - À exécuter le 5 de chaque mois
 */
export async function sendRentPaymentReminders(): Promise<{
  sent: number;
  failed: number;
  total: number;
  results: Array<{ tenant: string; success: boolean; error?: string }>;
}> {
  console.log("Starting rent payment reminder SMS campaign...");

  const reminders = await getTenantsWithLatePayments();
  console.log(`Found ${reminders.length} tenants with late payments`);

  const results: Array<{ tenant: string; success: boolean; error?: string }> =
    [];
  let sent = 0;
  let failed = 0;

  for (const reminder of reminders) {
    const message = generateReminderMessage(reminder);
    const phone = reminder.tenant.telephone;

    console.log(
      `Sending SMS to ${phone} (${reminder.tenant.prenom} ${reminder.tenant.nom})`,
    );

    const result = await sendSMS(phone, message);

    if (result.success) {
      sent++;
      results.push({
        tenant: `${reminder.tenant.prenom} ${reminder.tenant.nom}`,
        success: true,
      });
      console.log(
        `✓ SMS sent to ${reminder.tenant.prenom} ${reminder.tenant.nom}`,
      );
    } else {
      failed++;
      results.push({
        tenant: `${reminder.tenant.prenom} ${reminder.tenant.nom}`,
        success: false,
        error: result.error,
      });
      if (typeof window !== "undefined" && import.meta.env.DEV)
        console.error(
          `✗ Failed to send SMS to ${reminder.tenant.prenom} ${reminder.tenant.nom}: ${result.error}`,
        );
    }

    // Rate limiting: wait 1 second between SMS
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(
    `Campaign complete: ${sent} sent, ${failed} failed, ${reminders.length} total`,
  );

  return {
    sent,
    failed,
    total: reminders.length,
    results,
  };
}

/**
 * Vérifier si nous sommes le 5 du mois
 */
export function isFifthOfMonth(): boolean {
  const today = new Date();
  return today.getDate() === 5;
}

/**
 * Scheduler - À appeler quotidiennement
 */
export async function checkAndSendReminders(): Promise<void> {
  if (isFifthOfMonth()) {
    const now = new Date();
    const hour = now.getHours();

    // Send at 9 AM
    if (hour === 9) {
      await sendRentPaymentReminders();
    }
  }
}

// Export for CLI usage
if (typeof window === "undefined") {
  // Node.js environment - can be run as CLI
  sendRentPaymentReminders()
    .then((result) => {
      console.log("Result:", result);
      process.exit(0);
    })
    .catch((error) => {
      if (import.meta.env.DEV) console.error("Error:", error);
      process.exit(1);
    });
}
