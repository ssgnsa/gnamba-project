/**
 * Utilitaires pour la génération de rapports immobiliers
 * Support des résumés par locataire, propriétaire, et comptes rendus mensuels/annuels
 */

import type { Property, Tenant, LeaseContract, RentPayment } from "../types";

export interface TenantSummary {
  tenant: Tenant;
  contracts: LeaseContract[];
  payments: RentPayment[];
  totalPaid: number;
  totalPending: number;
  activeContract: LeaseContract | null;
}

export interface PropertySummary {
  property: Property;
  contracts: LeaseContract[];
  payments: RentPayment[];
  currentTenant: Tenant | null;
  totalCollected: number;
  totalPending: number;
}

export interface OwnerSummary {
  ownerName: string;
  properties: Property[];
  totalProperties: number;
  totalMonthlyRent: number;
  contracts: LeaseContract[];
  payments: RentPayment[];
  totalCollected: number;
  totalPending: number;
}

export interface MonthlySummary {
  month: string;
  year: number;
  expectedRent: number;
  paidRent: number;
  pendingRent: number;
  latePayments: number;
  partialPayments: number;
  paymentsByStatus: Record<string, number>;
}

export interface YearlySummary {
  year: number;
  months: MonthlySummary[];
  totalExpected: number;
  totalPaid: number;
  totalPending: number;
  collectionRate: number;
}

export interface PaymentStatement {
  period: string;
  startDate: string;
  endDate: string;
  payments: RentPayment[];
  totalAmount: number;
  paymentCount: number;
  averagePayment: number;
}

/**
 * Génère un résumé locataire avec tous les contrats et paiements
 */
export function generateTenantSummary(
  tenant: Tenant,
  contracts: LeaseContract[],
  payments: RentPayment[],
): TenantSummary {
  const tenantContracts = contracts.filter((c) => c.locataire_id === tenant.id);
  const tenantPayments = payments.filter((p) => p.locataire_id === tenant.id);

  const totalPaid = tenantPayments
    .filter((p) => p.statut === "paye")
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  const totalPending = tenantPayments
    .filter((p) => p.statut !== "paye")
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  const activeContract = tenantContracts.find((c) => c.statut === "actif") || null;

  return {
    tenant,
    contracts: tenantContracts,
    payments: tenantPayments,
    totalPaid,
    totalPending,
    activeContract,
  };
}

/**
 * Génère un résumé par propriété avec contrats et paiements
 */
export function generatePropertySummary(
  property: Property,
  contracts: LeaseContract[],
  payments: RentPayment[],
  tenants: Tenant[],
): PropertySummary {
  const propertyContracts = contracts.filter(
    (c) => c.property_id === property.id,
  );
  const propertyPayments = payments.filter(
    (p) => p.property_id === property.id,
  );

  const activeContract = propertyContracts.find((c) => c.statut === "actif");
  const currentTenant = activeContract
    ? tenants.find((t) => t.id === activeContract.locataire_id) || null
    : null;

  const totalCollected = propertyPayments
    .filter((p) => p.statut === "paye")
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  const totalPending = propertyPayments
    .filter((p) => p.statut !== "paye")
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  return {
    property,
    contracts: propertyContracts,
    payments: propertyPayments,
    currentTenant,
    totalCollected,
    totalPending,
  };
}

/**
 * Génère un résumé par propriétaire
 */
export function generateOwnerSummary(
  ownerName: string,
  properties: Property[],
  contracts: LeaseContract[],
  payments: RentPayment[],
): OwnerSummary {
  const ownerProperties = properties.filter(
    (p) => p.proprietaire === ownerName,
  );

  const ownerContracts = contracts.filter((c) =>
    ownerProperties.some((p) => p.id === c.property_id),
  );

  const ownerPayments = payments.filter((p) =>
    ownerProperties.some((prop) => prop.id === p.property_id),
  );

  const totalMonthlyRent = ownerProperties.reduce(
    (sum, p) => sum + p.loyer_mensuel,
    0,
  );

  const totalCollected = ownerPayments
    .filter((p) => p.statut === "paye")
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  const totalPending = ownerPayments
    .filter((p) => p.statut !== "paye")
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  return {
    ownerName,
    properties: ownerProperties,
    totalProperties: ownerProperties.length,
    totalMonthlyRent,
    contracts: ownerContracts,
    payments: ownerPayments,
    totalCollected,
    totalPending,
  };
}

/**
 * Génère un résumé mensuel des paiements
 */
export function generateMonthlySummary(
  year: number,
  month: number,
  contracts: LeaseContract[],
  payments: RentPayment[],
): MonthlySummary {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  // Expected rent from active contracts
  const activeContractsInMonth = contracts.filter((c) => {
    const start = new Date(c.date_debut);
    const end = c.date_fin ? new Date(c.date_fin) : new Date();
    const checkDate = new Date(year, month - 1, 1);
    return start <= checkDate && end >= checkDate && c.statut === "actif";
  });

  const expectedRent = activeContractsInMonth.reduce(
    (sum, c) => sum + c.loyer_mensuel + (c.charges || 0),
    0,
  );

  // Payments for this month
  const monthPayments = payments.filter((p) => {
    const paymentMonth = (p.date_paiement || p.date_echeance || "").slice(
      0,
      7,
    );
    return paymentMonth === monthStr;
  });

  const paidRent = monthPayments
    .filter((p) => p.statut === "paye")
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  const pendingRent = monthPayments
    .filter((p) => p.statut === "en_attente")
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  const latePayments = monthPayments.filter((p) => p.statut === "retard").length;
  const partialPayments = monthPayments.filter(
    (p) => p.statut === "partiel",
  ).length;

  const paymentsByStatus: Record<string, number> = {
    paye: monthPayments.filter((p) => p.statut === "paye").length,
    en_attente: monthPayments.filter((p) => p.statut === "en_attente").length,
    retard: latePayments,
    partiel: partialPayments,
  };

  return {
    month: monthLabel,
    year,
    expectedRent,
    paidRent,
    pendingRent: pendingRent + expectedRent - paidRent,
    latePayments,
    partialPayments,
    paymentsByStatus,
  };
}

/**
 * Génère un résumé annuel complet
 */
export function generateYearlySummary(
  year: number,
  contracts: LeaseContract[],
  payments: RentPayment[],
): YearlySummary {
  const months: MonthlySummary[] = [];

  for (let month = 1; month <= 12; month++) {
    months.push(generateMonthlySummary(year, month, contracts, payments));
  }

  const totalExpected = months.reduce((sum, m) => sum + m.expectedRent, 0);
  const totalPaid = months.reduce((sum, m) => sum + m.paidRent, 0);
  const totalPending = months.reduce((sum, m) => sum + m.pendingRent, 0);
  const collectionRate =
    totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

  return {
    year,
    months,
    totalExpected,
    totalPaid,
    totalPending,
    collectionRate,
  };
}

/**
 * Génère un relevé de paiements pour une période
 */
export function generatePaymentStatement(
  startDate: string,
  endDate: string,
  payments: RentPayment[],
): PaymentStatement {
  const periodPayments = payments.filter(
    (p) =>
      (p.date_paiement || p.date_echeance || "") >= startDate &&
      (p.date_paiement || p.date_echeance || "") <= endDate,
  );

  const totalAmount = periodPayments.reduce((sum, p) => sum + p.montant, 0);
  const averagePayment =
    periodPayments.length > 0 ? totalAmount / periodPayments.length : 0;

  return {
    period: `${startDate} au ${endDate}`,
    startDate,
    endDate,
    payments: periodPayments.sort(
      (a, b) =>
        new Date(b.date_paiement || b.date_echeance || "").getTime() -
        new Date(a.date_paiement || a.date_echeance || "").getTime(),
    ),
    totalAmount,
    paymentCount: periodPayments.length,
    averagePayment,
  };
}

/**
 * Formate un montant avec séparateur de milliers
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate une date en français
 */
export function formatDateFR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
