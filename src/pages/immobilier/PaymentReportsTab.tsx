import { useState, useMemo } from "react";
import {
  DollarSign,
  Percent,
  Building2,
  User,
  Download,
} from "lucide-react";
import type { RentPayment, LeaseContract, Property } from "../../types";
import { useSettings } from "../../context/SettingsContext";
import { useNotifications } from "../../context/NotificationContext";
import { formatMontantImmo, getPropertyAddress } from "../../lib/immobilier";
import Badge from "../../components/ui/Badge";

function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  if (!year || !month) return monthStr;
  return new Date(year, month - 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

// Get available months from payments
function getAvailableMonths(payments: RentPayment[]): string[] {
  const months = new Set<string>();
  payments.forEach((p) => {
    if (p.mois_concerne) {
      months.add(p.mois_concerne);
    }
    if (p.mois_concerne_date) {
      const d = String(p.mois_concerne_date).slice(0, 7);
      if (d) months.add(d);
    }
  });
  return Array.from(months).sort().reverse();
}

interface Props {
  payments: RentPayment[];
  contracts: LeaseContract[];
  properties: Property[];
}

export default function PaymentReportsTab({
  payments,
  contracts,
  properties,
}: Props) {
  const { settings } = useSettings();
  const { showToast } = useNotifications();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"owner" | "company" | "all">("all");
  const [filterProperty, setFilterProperty] = useState<string>("all");

  // Get available months
  const availableMonths = useMemo(() => getAvailableMonths(payments), [payments]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Filter by month
      if (selectedMonth !== "all") {
        const paymentMonth = p.mois_concerne || String(p.mois_concerne_date || "").slice(0, 7);
        if (paymentMonth !== selectedMonth) return false;
      }

      // Filter by property (via contract)
      if (filterProperty !== "all") {
        const contract = contracts.find((c) => c.id === p.contract_id);
        if (!contract || contract.property_id !== filterProperty) return false;
      }

      // Only show paid payments for reports
      return p.statut === "paye";
    });
  }, [payments, contracts, selectedMonth, filterProperty]);

  // Group by owner for owner report
  const ownerReportData = useMemo(() => {
    const ownerMap = new Map<
      string,
      {
        ownerId: string;
        ownerName: string;
        ownerPhone: string;
        ownerEmail: string;
        properties: Map<string, { property: Property; payments: RentPayment[]; totalCollected: number; commissionRate: number; enterpriseShare: number; ownerShare: number }>;
        totalCollected: number;
        totalEnterpriseShare: number;
        totalOwnerShare: number;
      }
    >();

    filteredPayments.forEach((payment) => {
      const contract = contracts.find((c) => c.id === payment.contract_id);
      if (!contract) return;

      const property = properties.find((prop) => prop.id === contract.property_id);
      if (!property) return;

      const ownerId = property.proprietaire_id || "unknown";
      const ownerClient = property.proprietaire_client;
      const ownerName = ownerClient
        ? `${ownerClient.prenom} ${ownerClient.nom}`
        : property.proprietaire || "Propriétaire inconnu";
      const ownerPhone = ownerClient?.telephone || "";
      const ownerEmail = ownerClient?.email || "";

      const commissionRate = contract.commission_rate || 12;
      const enterpriseShare = Math.round((payment.montant * commissionRate) / 100);
      const ownerShare = payment.montant - enterpriseShare;

      if (!ownerMap.has(ownerId)) {
        ownerMap.set(ownerId, {
          ownerId,
          ownerName,
          ownerPhone,
          ownerEmail,
          properties: new Map(),
          totalCollected: 0,
          totalEnterpriseShare: 0,
          totalOwnerShare: 0,
        });
      }

      const ownerData = ownerMap.get(ownerId)!;
      ownerData.totalCollected += payment.montant;
      ownerData.totalEnterpriseShare += enterpriseShare;
      ownerData.totalOwnerShare += ownerShare;

      if (!ownerData.properties.has(contract.property_id)) {
        ownerData.properties.set(contract.property_id, {
          property,
          payments: [],
          totalCollected: 0,
          commissionRate,
          enterpriseShare: 0,
          ownerShare: 0,
        });
      }

      const propData = ownerData.properties.get(contract.property_id)!;
      propData.payments.push(payment);
      propData.totalCollected += payment.montant;
      propData.enterpriseShare += enterpriseShare;
      propData.ownerShare += ownerShare;
    });

    // Convert to array and sort by owner name
    return Array.from(ownerMap.values())
      .map((owner) => ({
        ...owner,
        properties: Array.from(owner.properties.values()).sort(
          (a, b) => a.property.adresse.localeCompare(b.property.adresse)
        ),
      }))
      .sort((a, b) => a.ownerName.localeCompare(b.ownerName));
  }, [filteredPayments, contracts, properties]);

  // Company report data
  const companyReportData = useMemo(() => {
    let totalCollected = 0;
    let totalEnterpriseCommission = 0;
    let totalOwnerShare = 0;
    const byProperty = new Map<
      string,
      { property: Property; payments: RentPayment[]; totalCollected: number; enterpriseCommission: number; ownerShare: number; commissionRate: number }
    >();

    filteredPayments.forEach((payment) => {
      const contract = contracts.find((c) => c.id === payment.contract_id);
      if (!contract) return;

      const property = properties.find((prop) => prop.id === contract.property_id);
      if (!property) return;

      const commissionRate = contract.commission_rate || 12;
      const enterpriseShare = Math.round((payment.montant * commissionRate) / 100);
      const ownerShare = payment.montant - enterpriseShare;

      totalCollected += payment.montant;
      totalEnterpriseCommission += enterpriseShare;
      totalOwnerShare += ownerShare;

      if (!byProperty.has(property.id)) {
        byProperty.set(property.id, {
          property,
          payments: [],
          totalCollected: 0,
          enterpriseCommission: 0,
          ownerShare: 0,
          commissionRate,
        });
      }

      const propData = byProperty.get(property.id)!;
      propData.payments.push(payment);
      propData.totalCollected += payment.montant;
      propData.enterpriseCommission += enterpriseShare;
      propData.ownerShare += ownerShare;
    });

    return {
      totalCollected,
      totalEnterpriseCommission,
      totalOwnerShare,
      byProperty: Array.from(byProperty.values()).sort((a, b) =>
        a.property.adresse.localeCompare(b.property.adresse)
      ),
    };
  }, [filteredPayments, contracts, properties]);

  const handleExport = (type: "owner" | "company") => {
    let csvContent = "";
    const monthLabel = selectedMonth === "all" ? "Tous les mois" : getMonthLabel(selectedMonth);
    const dateStr = new Date().toLocaleDateString("fr-FR");

    if (type === "owner") {
      csvContent = `Rapport Propriétaires - ${monthLabel} - ${dateStr}\n\n`;
      csvContent += "Propriétaire,Contact,Propriété,Adresse,Type Bien,Commission,Total Encaissé,Part Entreprise,Part Propriétaire\n";
      
      ownerReportData.forEach((owner) => {
        owner.properties.forEach((prop) => {
          csvContent += `"${owner.ownerName}","${owner.ownerPhone} ${owner.ownerEmail}","${prop.property.adresse}","${getPropertyAddress(prop.property)}","${prop.property.type_bien}",${prop.commissionRate}%,${formatMontantImmo(prop.totalCollected)},${formatMontantImmo(prop.enterpriseShare)},${formatMontantImmo(prop.ownerShare)}\n`;
        });
        csvContent += `TOTAL ${owner.ownerName},,,,,,,${formatMontantImmo(owner.totalCollected)},${formatMontantImmo(owner.totalEnterpriseShare)},${formatMontantImmo(owner.totalOwnerShare)}\n`;
      });
      
      const gTotalCollected = ownerReportData.reduce((sum, o) => sum + o.totalCollected, 0);
      const gTotalEnterprise = ownerReportData.reduce((sum, o) => sum + o.totalEnterpriseShare, 0);
      const gTotalOwner = ownerReportData.reduce((sum, o) => sum + o.totalOwnerShare, 0);
      csvContent += `TOTAL GÉNÉRAL,,,,,,,,${formatMontantImmo(gTotalCollected)},${formatMontantImmo(gTotalEnterprise)},${formatMontantImmo(gTotalOwner)}\n`;
    } else {
      csvContent = `Rapport Entreprise - ${monthLabel} - ${dateStr}\n\n`;
      csvContent += "Propriété,Adresse,Type Bien,Commission,Total Encaissé,Commission Entreprise (Part),Part Propriétaire\n";
      
      companyReportData.byProperty.forEach((prop) => {
        const contract = contracts.find((c) => c.property_id === prop.property.id);
        const commissionRate = contract?.commission_rate || 12;
        csvContent += `"${prop.property.adresse}","${getPropertyAddress(prop.property)}","${prop.property.type_bien}",${commissionRate}%,${formatMontantImmo(prop.totalCollected)},${formatMontantImmo(prop.enterpriseCommission)},${formatMontantImmo(prop.ownerShare)}\n`;
      });
      
      csvContent += `TOTAL GÉNÉRAL,,,,${formatMontantImmo(companyReportData.totalCollected)},${formatMontantImmo(companyReportData.totalEnterpriseCommission)},${formatMontantImmo(companyReportData.totalOwnerShare)}\n`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const filename = `rapport-${type}-${selectedMonth === "all" ? "all" : selectedMonth}-${dateStr.replace(/\//g, "-")}.csv`;
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showToast("success", "Export réussi", `Rapport ${type === "owner" ? "propriétaires" : "entreprise"} exporté`);
  };

  const monthLabel = selectedMonth === "all" ? "Tous les mois" : getMonthLabel(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Période :</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-auto px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            >
              <option value="all">Tous les mois</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Vue :</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["all", "owner", "company"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {mode === "all" ? "Tout" : mode === "owner" ? "Propriétaires" : "Entreprise"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">Propriété :</span>
            <select
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="w-auto px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            >
              <option value="all">Toutes les propriétés</option>
              {properties
                .filter((p) => p.statut === "loue")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.adresse}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {viewMode === "owner" && (
              <button
                onClick={() => handleExport("owner")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
                style={{
                  backgroundColor: settings.primary_color,
                  color: "var(--color-on-primary)",
                }}
              >
                <Download size={16} /> Export Propriétaires
              </button>
            )}
            {viewMode === "company" && (
              <button
                onClick={() => handleExport("company")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
                style={{
                  backgroundColor: settings.primary_color,
                  color: "var(--color-on-primary)",
                }}
              >
                <Download size={16} /> Export Entreprise
              </button>
            )}
            {viewMode === "all" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport("owner")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
                  style={{
                    backgroundColor: settings.primary_color,
                    color: "var(--color-on-primary)",
                  }}
                >
                  <Download size={16} /> Propriétaires
                </button>
                <button
                  onClick={() => handleExport("company")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
                  style={{
                    backgroundColor: "#6b7280",
                    color: "white",
                  }}
                >
                  <Download size={16} /> Entreprise
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Encaissé ({monthLabel})</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatMontantImmo(
                  (viewMode === "owner"
                    ? ownerReportData.reduce((s, o) => s + o.totalCollected, 0)
                    : viewMode === "company"
                    ? companyReportData.totalCollected
                    : filteredPayments.reduce((s, p) => s + p.montant, 0)
                ))} FCFA
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Part Entreprise (Commission {contracts[0]?.commission_rate || 12}%)
              </p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {formatMontantImmo(
                  viewMode === "owner"
                    ? ownerReportData.reduce((s, o) => s + o.totalEnterpriseShare, 0)
                    : viewMode === "company"
                    ? companyReportData.totalEnterpriseCommission
                    : filteredPayments.reduce((s, p) => {
                        const c = contracts.find((con) => con.id === p.contract_id);
                        const rate = c?.commission_rate || 12;
                        return s + Math.round((p.montant * rate) / 100);
                      }, 0)
                )} FCFA
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Part Propriétaires</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {formatMontantImmo(
                  viewMode === "owner"
                    ? ownerReportData.reduce((s, o) => s + o.totalOwnerShare, 0)
                    : viewMode === "company"
                    ? companyReportData.totalOwnerShare
                    : filteredPayments.reduce((s, p) => {
                        const c = contracts.find((con) => con.id === p.contract_id);
                        const rate = c?.commission_rate || 12;
                        return s + p.montant - Math.round((p.montant * rate) / 100);
                      }, 0)
                )} FCFA
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <User size={24} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Content */}
      {viewMode === "owner" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {ownerReportData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <User size={48} className="mb-3 opacity-30" />
              <p className="text-lg font-medium">Aucun rapport propriétaire</p>
              <p className="text-sm">Aucun paiement encaissé pour {monthLabel}</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Rapport par Propriétaire
              </h3>
              {ownerReportData.map((owner) => (
                <div
                  key={owner.ownerId}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* Owner Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {owner.ownerName}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            {owner.ownerPhone && (
                              <span className="flex items-center gap-1">
                                <span className="w-4 h-4"></span>{owner.ownerPhone}
                              </span>
                            )}
                            {owner.ownerEmail && (
                              <span className="flex items-center gap-1">
                                <span className="w-4 h-4"></span>{owner.ownerEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {formatMontantImmo(owner.totalCollected)} FCFA
                          </p>
                          <p className="text-xs text-gray-500">Total Encaissé</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-blue-600">
                            {formatMontantImmo(owner.totalEnterpriseShare)} FCFA
                          </p>
                          <p className="text-xs text-gray-500">Part Entreprise</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-amber-600">
                            {formatMontantImmo(owner.totalOwnerShare)} FCFA
                          </p>
                          <p className="text-xs text-gray-500">Part Propriétaire</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Properties for this owner */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                            Propriété
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                            Adresse complète
                          </th>
                          <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                            Type
                          </th>
                          <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                            Commission
                          </th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                            Encaissé
                          </th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                            Part Entreprise
                          </th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                            Part Propriétaire
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {owner.properties.map((prop) => (
                          <tr
                            key={prop.property.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="font-medium text-gray-800">
                                {prop.property.adresse}
                              </span>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <span className="text-gray-500">
                                {getPropertyAddress(prop.property)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center hidden sm:table-cell">
                              <Badge
                                label={prop.property.type_bien}
                                color="blue"
                              />
                            </td>
                            <td className="px-6 py-4 text-center hidden sm:table-cell">
                              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                <Percent size={10} /> {prop.commissionRate}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-green-600">
                              {formatMontantImmo(prop.totalCollected)} FCFA
                            </td>
                            <td className="px-6 py-4 text-right hidden md:table-cell font-medium text-blue-700">
                              {formatMontantImmo(prop.enterpriseShare)} FCFA
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-amber-600">
                              {formatMontantImmo(prop.ownerShare)} FCFA
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "company" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {companyReportData.byProperty.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Building2 size={48} className="mb-3 opacity-30" />
              <p className="text-lg font-medium">Aucun rapport entreprise</p>
              <p className="text-sm">Aucun paiement encaissé pour {monthLabel}</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 size={20} className="text-green-600" />
                Rapport Entreprise (Commissions)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Propriété
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                        Adresse
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                        Type
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">
                        Commission
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Total Encaissé
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Commission Entreprise
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                        Part Propriétaire
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {companyReportData.byProperty.map((prop) => (
                      <tr
                        key={prop.property.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800">
                            {prop.property.adresse}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-gray-500">
                            {getPropertyAddress(prop.property)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center hidden sm:table-cell">
                          <Badge
                            label={prop.property.type_bien}
                            color="green"
                          />
                        </td>
                        <td className="px-6 py-4 text-center hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Percent size={10} /> {prop.commissionRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-800">
                          {formatMontantImmo(prop.totalCollected)} FCFA
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-blue-600">
                          {formatMontantImmo(prop.enterpriseCommission)} FCFA
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-amber-600">
                          {formatMontantImmo(prop.ownerShare)} FCFA
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-4" colSpan={3}>TOTAL GÉNÉRAL</td>
                      <td className="px-6 py-4 text-center hidden sm:table-cell"></td>
                      <td className="px-6 py-4 text-right text-gray-800">
                        {formatMontantImmo(companyReportData.totalCollected)} FCFA
                      </td>
                      <td className="px-6 py-4 text-right text-blue-600">
                        {formatMontantImmo(companyReportData.totalEnterpriseCommission)} FCFA
                      </td>
                      <td className="px-6 py-4 text-right text-amber-600">
                        {formatMontantImmo(companyReportData.totalOwnerShare)} FCFA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === "all" && (
        <>
          {/* Owner Report */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {ownerReportData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 p-6 text-center">
                <User size={40} className="mb-2 opacity-30" />
                <p className="text-sm">Aucun rapport propriétaire pour {monthLabel}</p>
              </div>
            ) : (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <User size={20} className="text-blue-600" />
                  Rapport par Propriétaire
                </h3>
                <div className="space-y-4">
                  {ownerReportData.map((owner) => (
                    <div
                      key={owner.ownerId}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {owner.ownerName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {owner.properties.length} propriété(s)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatMontantImmo(owner.totalCollected)} FCFA
                          </p>
                          <p className="text-xs text-gray-500">Total encaissé</p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-sm">
                        <div className="text-center flex-1">
                          <p className="font-semibold text-blue-600">
                            {formatMontantImmo(owner.totalEnterpriseShare)} FCFA
                          </p>
                          <p className="text-xs text-gray-500">Part Entreprise</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="font-semibold text-amber-600">
                            {formatMontantImmo(owner.totalOwnerShare)} FCFA
                          </p>
                          <p className="text-xs text-gray-500">Part Propriétaire</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Company Report Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Building2 size={20} className="text-green-600" />
                Résumé Entreprise
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-gray-800">
                    {formatMontantImmo(companyReportData.totalCollected)} FCFA
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Total Encaissé</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatMontantImmo(companyReportData.totalEnterpriseCommission)} FCFA
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Commission Entreprise</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-amber-600">
                    {formatMontantImmo(companyReportData.totalOwnerShare)} FCFA
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Part Propriétaires</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}