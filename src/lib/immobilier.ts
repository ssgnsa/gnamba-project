/**
 * Utilitaires centralisés pour le module Immobilier
 * Gestion cohérente des locataires, propriétés, contrats et paiements
 */

import type { Tenant, Property, LeaseContract, RentPayment } from "../types";

/**
 * Résout le nom complet d'un locataire depuis différents contextes
 * Gère les jointures Supabase et les données nullable
 */
export function getTenantName(
  tenant:
    | Pick<Tenant, "nom" | "prenom">
    | {
        nom?: string | null;
        prenom?: string | null;
        name?: string | null;
        first_name?: string | null;
        last_name?: string | null;
      }
    | null
    | undefined,
): string {
  if (!tenant) return "";

  // Schéma standard (tenants table)
  if ("nom" in tenant && tenant.nom) {
    const nom = tenant.nom || "";
    const prenom = tenant.prenom || "";
    return `${prenom} ${nom}`.trim();
  }

  // Schéma alternatif (legacy ou autre source)
  if ("last_name" in tenant && tenant.last_name) {
    const nom = tenant.last_name || "";
    const prenom = tenant.first_name || "";
    return `${prenom} ${nom}`.trim();
  }

  // Fallback générique
  if ("name" in tenant && tenant.name) {
    return String(tenant.name);
  }

  return "";
}

/**
 * Résout l'adresse d'une propriété depuis différents contextes
 */
export function getPropertyAddress(
  property:
    | Pick<Property, "adresse">
    | {
        adresse?: string | null;
        address?: string | null;
        localisation?: string | null;
        name?: string | null;
      }
    | null
    | undefined,
): string {
  if (!property) return "";

  if ("adresse" in property && property.adresse) {
    return property.adresse;
  }

  if ("address" in property && property.address) {
    return property.address;
  }

  if ("localisation" in property && property.localisation) {
    return property.localisation;
  }

  if ("name" in property && property.name) {
    return property.name;
  }

  return "";
}

/**
 * Extrait le locataire d'un contrat (jointure Supabase)
 */
export function getTenantFromContract(contract: LeaseContract): Tenant | null {
  return (contract.locataires as unknown as Tenant) || null;
}

/**
 * Extrait la propriété d'un contrat (jointure Supabase)
 */
export function getPropertyFromContract(
  contract: LeaseContract,
): Property | null {
  return (contract.properties as unknown as Property) || null;
}

/**
 * Extrait le locataire d'un paiement (jointure Supabase)
 */
export function getTenantFromPayment(payment: RentPayment): Tenant | null {
  return (payment.locataires as unknown as Tenant) || null;
}

/**
 * Extrait la propriété d'un paiement (jointure Supabase)
 */
export function getPropertyFromPayment(payment: RentPayment): Property | null {
  return (payment.properties as unknown as Property) || null;
}

/**
 * Valide un email (format simple)
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valide un téléphone (format international ou local)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  // Accepte: +225 XX XX XX XX, 0X XX XX XX XX, XX XX XX XX
  const cleaned = phone.replace(/\s|-/g, "");
  return /^(\+225|0)?[0-9]{8,10}$/.test(cleaned);
}

/**
 * Formate un montant pour l'affichage
 */
export function formatMontantImmo(montant: number): string {
  return new Intl.NumberFormat("fr-FR").format(montant);
}

/**
 * Calcule le nombre de mois entre deux dates
 */
export function getMonthsBetween(start: Date, end: Date): number {
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth();
  return years * 12 + months;
}

/**
 * Génère les mois entre deux dates pour la génération de loyers
 */
export function generateMonthRange(
  startDate: string,
  endDate: string | null,
): Array<{ mois: string; moisLabel: string; lastDay: string }> {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  end.setDate(1);

  const months: Array<{ mois: string; moisLabel: string; lastDay: string }> =
    [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cur <= end) {
    const moisKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    const moisLabel = cur.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    const lastDay = new Date(cur.getFullYear(), cur.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    months.push({ mois: moisKey, moisLabel, lastDay });
    cur.setMonth(cur.getMonth() + 1);
  }

  return months;
}

/**
 * Statut d'un contrat avec label et couleur
 */
export function getContractStatusConfig(statut: string): {
  label: string;
  color: "blue" | "gray" | "red" | "green";
  classes: string;
} {
  const config: Record<
    string,
    { label: string; color: "blue" | "gray" | "red" | "green"; classes: string }
  > = {
    actif: {
      label: "Actif",
      color: "blue",
      classes: "bg-blue-100 text-blue-700",
    },
    termine: {
      label: "Terminé",
      color: "gray",
      classes: "bg-gray-100 text-gray-600",
    },
    resilie: {
      label: "Résilié",
      color: "red",
      classes: "bg-red-100 text-red-700",
    },
    renouvele: {
      label: "Renouvelé",
      color: "green",
      classes: "bg-green-100 text-green-700",
    },
  };

  return (
    config[statut] || {
      label: statut || "Inconnu",
      color: "gray" as const,
      classes: "bg-gray-100 text-gray-600",
    }
  );
}

/**
 * Statut d'un bien immobilier avec label et couleur
 */
export function getPropertyStatusConfig(statut: string): {
  label: string;
  color: "green" | "blue" | "orange" | "gray";
} {
  const config: Record<
    string,
    { label: string; color: "green" | "blue" | "orange" | "gray" }
  > = {
    disponible: { label: "Disponible", color: "green" },
    loue: { label: "Loué", color: "blue" },
    en_vente: { label: "En Vente", color: "orange" },
    vendu: { label: "Vendu", color: "gray" },
  };

  return (
    config[statut] || { label: statut || "Inconnu", color: "gray" as const }
  );
}

/**
 * Statut d'un paiement avec label et couleur
 */
export function getPaymentStatusConfig(statut: string): {
  label: string;
  color: "green" | "red" | "yellow" | "orange";
} {
  const config: Record<
    string,
    { label: string; color: "green" | "red" | "yellow" | "orange" }
  > = {
    paye: { label: "Payé", color: "green" },
    retard: { label: "Retard", color: "red" },
    partiel: { label: "Partiel", color: "yellow" },
    en_attente: { label: "En Attente", color: "orange" },
  };

  return (
    config[statut] || { label: statut || "Inconnu", color: "orange" as const }
  );
}

/**
 * Type de bien avec label
 */
export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    appartement: "Appartement",
    villa: "Villa",
    bureau: "Bureau",
    commerce: "Commerce",
    terrain: "Terrain",
    autre: "Autre",
  };

  return labels[type] || type || "Autre";
}

/**
 * Mode de paiement avec label
 */
export function getPaymentModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    virement: "Virement",
    especes: "Espèces",
    mobile_money: "Mobile Money",
    cheque: "Chèque",
  };

  return labels[mode] || mode || "Inconnu";
}
