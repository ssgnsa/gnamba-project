import { useState, useMemo } from "react";
import {
  Printer,
  FileText,
  Calendar,
} from "lucide-react";
import type { RentPayment, Tenant, Property, LeaseContract } from "../../types";
import { formatMontant, formatDate } from "../../utils/reference";
import {
  getTenantName,
  getPaymentStatusConfig,
  getPaymentModeLabel,
} from "../../lib/immobilier";

interface Props {
  payments: RentPayment[];
  contracts: LeaseContract[];
  tenants: Tenant[];
  properties: Property[];
  tenantIdColumn: "locataire_id" | "tenant_id";
  onRefresh: () => void;
}

type ReportType = "tenant" | "owner" | "property" | "global";
type DateRange = "month" | "quarter" | "year" | "custom" | "all";

interface ReportConfig {
  type: ReportType;
  dateRange: DateRange;
  startDate?: string;
  endDate?: string;
  tenantId?: string;
  ownerId?: string;
  propertyId?: string;
}

export default function PaymentReportsTab({
  payments,
  tenants,
  properties,
}: Props) {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: "tenant",
    dateRange: "month",
  });

  const [_showConfigModal, setShowConfigModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Get unique owners from properties
  const uniqueOwners = useMemo(() => {
    const owners = properties
      .map((p) => p.proprietaire)
      .filter((v, i, a) => v && v.trim() && a.indexOf(v) === i)
      .sort();
    return owners;
  }, [properties]);

  // Filter payments based on config
  const getFilteredPayments = (config: ReportConfig) => {
    let filtered = [...payments];

    // Date filtering
    if (config.dateRange !== "all") {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (config.dateRange) {
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case "quarter": {
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
          break;
        }
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear() + 1, 0, 0);
          break;
        case "custom":
          if (config.startDate && config.endDate) {
            startDate = new Date(config.startDate);
            endDate = new Date(config.endDate);
          } else {
            return filtered;
          }
          break;
        default:
          return filtered;
      }

      filtered = filtered.filter((p) => {
        const paymentDate = new Date(p.date_paiement || p.date_echeance || "");
        return paymentDate >= startDate && paymentDate <= endDate;
      });
    }

    // Type-specific filtering
    switch (config.type) {
      case "tenant":
        if (config.tenantId) {
          filtered = filtered.filter((p) => p.locataire_id === config.tenantId);
        }
        break;
      case "owner":
        if (config.ownerId) {
          filtered = filtered.filter((p) => {
            const property = properties.find((prop) => prop.id === p.property_id);
            return property?.proprietaire === config.ownerId;
          });
        }
        break;
      case "property":
        if (config.propertyId) {
          filtered = filtered.filter((p) => p.property_id === config.propertyId);
        }
        break;
    }

    return filtered.sort((a, b) =>
      new Date(b.date_paiement || b.date_echeance || "").getTime() -
      new Date(a.date_paiement || a.date_echeance || "").getTime()
    );
  };

  // Generate report data based on type
  const generateReportData = (config: ReportConfig) => {
    const filtered = getFilteredPayments(config);

    switch (config.type) {
      case "tenant":
        return generateTenantReport(filtered);
      case "owner":
        return generateOwnerReport(filtered);
      case "property":
        return generatePropertyReport(filtered);
      case "global":
        return generateGlobalReport(filtered);
      default:
        return [];
    }
  };

  // Tenant-specific report
  const generateTenantReport = (filtered: RentPayment[]) => {
    const tenantMap = new Map<string, RentPayment[]>();
    
    filtered.forEach((payment) => {
      if (!payment.locataire_id) return;
      
      if (!tenantMap.has(payment.locataire_id)) {
        tenantMap.set(payment.locataire_id, []);
      }
      tenantMap.get(payment.locataire_id)!.push(payment);
    });

    const report = [];
    
    for (const [tenantId, tenantPayments] of tenantMap) {
      const tenant = tenants.find((t) => t.id === tenantId);
      if (!tenant) continue;

      const totalPaid = tenantPayments
        .filter((p) => p.statut === "paye")
        .reduce((sum, p) => sum + (p.montant || 0), 0);
      
      const totalPending = tenantPayments
        .filter((p) => p.statut === "en_attente" || p.statut === "retard")
        .reduce((sum, p) => sum + (p.montant || 0), 0);

      report.push({
        tenant: `${tenant.prenom} ${tenant.nom}`,
        telephone: tenant.telephone,
        totalPaid,
        totalPending,
        payments: tenantPayments,
        paymentCount: tenantPayments.length,
      });
    }

    return report.sort((a, b) => a.tenant.localeCompare(b.tenant));
  };

  // Owner-specific report
  const generateOwnerReport = (filtered: RentPayment[]) => {
    const ownerMap = new Map<string, RentPayment[]>();
    
    filtered.forEach((payment) => {
      const property = properties.find((prop) => prop.id === payment.property_id);
      const owner = property?.proprietaire || "Non spécifié";
      
      if (!ownerMap.has(owner)) {
        ownerMap.set(owner, []);
      }
      ownerMap.get(owner)!.push(payment);
    });

    const report = [];
    
    for (const [owner, ownerPayments] of ownerMap) {
      const totalPaid = ownerPayments
        .filter((p) => p.statut === "paye")
        .reduce((sum, p) => sum + (p.montant || 0), 0);
      
      const totalPending = ownerPayments
        .filter((p) => p.statut === "en_attente" || p.statut === "retard")
        .reduce((sum, p) => sum + (p.montant || 0), 0);

      const properties = [...new Set(ownerPayments.map(p => p.property_id))].length;

      report.push({
        owner,
        totalPaid,
        totalPending,
        properties,
        payments: ownerPayments,
        paymentCount: ownerPayments.length,
      });
    }

    return report.sort((a, b) => a.owner.localeCompare(b.owner));
  };

  // Property-specific report
  const generatePropertyReport = (filtered: RentPayment[]) => {
    const propertyMap = new Map<string, RentPayment[]>();
    
    filtered.forEach((payment) => {
      if (!payment.property_id) return;
      
      if (!propertyMap.has(payment.property_id)) {
        propertyMap.set(payment.property_id, []);
      }
      propertyMap.get(payment.property_id)!.push(payment);
    });

    const report = [];
    
    for (const [propertyId, propertyPayments] of propertyMap) {
      const property = properties.find((p) => p.id === propertyId);
      if (!property) continue;

      const totalPaid = propertyPayments
        .filter((p) => p.statut === "paye")
        .reduce((sum, p) => sum + (p.montant || 0), 0);
      
      const totalPending = propertyPayments
        .filter((p) => p.statut === "en_attente" || p.statut === "retard")
        .reduce((sum, p) => sum + (p.montant || 0), 0);

      const tenants = [...new Set(propertyPayments.map(p => p.locataire_id))].length;

      report.push({
        property: property.adresse,
        type: property.type_bien,
        proprietaire: property.proprietaire,
        totalPaid,
        totalPending,
        tenants,
        payments: propertyPayments,
        paymentCount: propertyPayments.length,
      });
    }

    return report.sort((a, b) => a.property.localeCompare(b.property));
  };

  // Global summary report
  const generateGlobalReport = (filtered: RentPayment[]) => {
    const totalPaid = filtered
      .filter((p) => p.statut === "paye")
      .reduce((sum, p) => sum + (p.montant || 0), 0);
    
    const totalPending = filtered
      .filter((p) => p.statut === "en_attente" || p.statut === "retard")
      .reduce((sum, p) => sum + (p.montant || 0), 0);

    const statusBreakdown = {
      paye: filtered.filter((p) => p.statut === "paye").length,
      en_attente: filtered.filter((p) => p.statut === "en_attente").length,
      retard: filtered.filter((p) => p.statut === "retard").length,
      partiel: filtered.filter((p) => p.statut === "partiel").length,
    };

    const modeBreakdown = {
      virement: filtered.filter((p) => p.mode_paiement === "virement").length,
      especes: filtered.filter((p) => p.mode_paiement === "especes").length,
      mobile_money: filtered.filter((p) => p.mode_paiement === "mobile_money").length,
      cheque: filtered.filter((p) => p.mode_paiement === "cheque").length,
    };

    return {
      totalPayments: filtered.length,
      totalPaid,
      totalPending,
      statusBreakdown,
      modeBreakdown,
      payments: filtered,
    };
  };

  // Handle report generation
  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const data = generateReportData(reportConfig);
      setPreviewData(data);
      setShowConfigModal(false);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGenerating(false);
    }
  };

  // Print report
  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const reportHTML = generateReportHTML(previewData, reportConfig.type);
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Generate HTML for printing
  const generateReportHTML = (data: any[], type: ReportType) => {
    const dateRangeText = getDateRangeText(reportConfig);
    
    let content = "";
    
    switch (type) {
      case "tenant":
        content = generateTenantHTML(data, dateRangeText);
        break;
      case "owner":
        content = generateOwnerHTML(data, dateRangeText);
        break;
      case "property":
        content = generatePropertyHTML(data, dateRangeText);
        break;
      case "global":
        content = generateGlobalHTML(data, dateRangeText);
        break;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport de Paiements</title>
          <style>
            ${getPrintStyles()}
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  };

  // HTML generators for each report type
  const generateTenantHTML = (data: any[], dateRangeText: string) => {
    return `
      <div className="report-header">
        <h1>Relevé de Paiements par Locataire</h1>
        <p className="date-range">${dateRangeText}</p>
        <p className="generated-date">Généré le: ${formatDate(new Date().toISOString())}</p>
      </div>
      
      <div className="summary">
        <p><strong>Total locataires:</strong> ${data.length}</p>
        <p><strong>Total encaissé:</strong> ${formatMontant(data.reduce((sum, t) => sum + t.totalPaid, 0))} FCFA</p>
        <p><strong>Total en attente:</strong> ${formatMontant(data.reduce((sum, t) => sum + t.totalPending, 0))} FCFA</p>
      </div>

      ${data.map(tenant => `
        <div className="report-section">
          <h2>${tenant.tenant}</h2>
          ${tenant.telephone ? `<p><strong>Téléphone:</strong> ${tenant.telephone}</p>` : ""}
          
          <div className="summary-box">
            <div className="summary-item">
              <span className="label">Total Payé:</span>
              <span className="value paid">${formatMontant(tenant.totalPaid)} FCFA</span>
            </div>
            <div className="summary-item">
              <span className="label">En Attente:</span>
              <span className="value pending">${formatMontant(tenant.totalPending)} FCFA</span>
            </div>
            <div className="summary-item">
              <span className="label">Nb Paiements:</span>
              <span className="value">${tenant.paymentCount}</span>
            </div>
          </div>

          <table className="payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Mois</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Mode</th>
                <th>Référence</th>
              </tr>
            </thead>
            <tbody>
              ${tenant.payments.map((payment: RentPayment) => `
                <tr>
                  <td>${formatDate(payment.date_paiement)}</td>
                  <td>${payment.mois_concerne}</td>
                  <td className="amount">${formatMontant(payment.montant)} FCFA</td>
                  <td>${getPaymentStatusConfig(payment.statut).label}</td>
                  <td>${getPaymentModeLabel(payment.mode_paiement)}</td>
                  <td>${payment.reference}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    `;
  };

  const generateOwnerHTML = (data: any[], dateRangeText: string) => {
    return `
      <div className="report-header">
        <h1>Relevé de Paiements par Propriétaire</h1>
        <p className="date-range">${dateRangeText}</p>
        <p className="generated-date">Généré le: ${formatDate(new Date().toISOString())}</p>
      </div>
      
      <div className="summary">
        <p><strong>Total propriétaires:</strong> ${data.length}</p>
        <p><strong>Total encaissé:</strong> ${formatMontant(data.reduce((sum, o) => sum + o.totalPaid, 0))} FCFA</p>
        <p><strong>Total en attente:</strong> ${formatMontant(data.reduce((sum, o) => sum + o.totalPending, 0))} FCFA</p>
      </div>

      ${data.map(owner => `
        <div className="report-section">
          <h2>${owner.owner}</h2>
          
          <div className="summary-box">
            <div className="summary-item">
              <span className="label">Total Payé:</span>
              <span className="value paid">${formatMontant(owner.totalPaid)} FCFA</span>
            </div>
            <div className="summary-item">
              <span className="label">En Attente:</span>
              <span className="value pending">${formatMontant(owner.totalPending)} FCFA</span>
            </div>
            <div className="summary-item">
              <span className="label">Nb Biens:</span>
              <span className="value">${owner.properties}</span>
            </div>
            <div className="summary-item">
              <span className="label">Nb Paiements:</span>
              <span className="value">${owner.paymentCount}</span>
            </div>
          </div>

          <table className="payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Locataire</th>
                <th>Bien</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              ${owner.payments.map((payment: RentPayment) => {
                const tenant = tenants.find(t => t.id === payment.locataire_id);
                const property = properties.find(p => p.id === payment.property_id);
                return `
                  <tr>
                    <td>${formatDate(payment.date_paiement)}</td>
                    <td>${getTenantName(tenant)}</td>
                    <td>${property?.adresse || "N/A"}</td>
                    <td className="amount">${formatMontant(payment.montant)} FCFA</td>
                    <td>${getPaymentStatusConfig(payment.statut).label}</td>
                    <td>${getPaymentModeLabel(payment.mode_paiement)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    `;
  };

  const generatePropertyHTML = (data: any[], dateRangeText: string) => {
    return `
      <div className="report-header">
        <h1>Relevé de Paiements par Bien Immobilier</h1>
        <p className="date-range">${dateRangeText}</p>
        <p className="generated-date">Généré le: ${formatDate(new Date().toISOString())}</p>
      </div>
      
      <div className="summary">
        <p><strong>Total biens:</strong> ${data.length}</p>
        <p><strong>Total encaissé:</strong> ${formatMontant(data.reduce((sum, p) => sum + p.totalPaid, 0))} FCFA</p>
        <p><strong>Total en attente:</strong> ${formatMontant(data.reduce((sum, p) => sum + p.totalPending, 0))} FCFA</p>
      </div>

      ${data.map(property => `
        <div className="report-section">
          <h2>${property.property}</h2>
          <p><strong>Type:</strong> ${property.type}</p>
          <p><strong>Propriétaire:</strong> ${property.proprietaire || "N/A"}</p>
          
          <div className="summary-box">
            <div className="summary-item">
              <span className="label">Total Payé:</span>
              <span className="value paid">${formatMontant(property.totalPaid)} FCFA</span>
            </div>
            <div className="summary-item">
              <span className="label">En Attente:</span>
              <span className="value pending">${formatMontant(property.totalPending)} FCFA</span>
            </div>
            <div className="summary-item">
              <span className="label">Nb Locataires:</span>
              <span className="value">${property.tenants}</span>
            </div>
            <div className="summary-item">
              <span className="label">Nb Paiements:</span>
              <span className="value">${property.paymentCount}</span>
            </div>
          </div>

          <table className="payment-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Locataire</th>
                <th>Mois</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              ${property.payments.map((payment: RentPayment) => {
                const tenant = tenants.find(t => t.id === payment.locataire_id);
                return `
                  <tr>
                    <td>${formatDate(payment.date_paiement)}</td>
                    <td>${getTenantName(tenant)}</td>
                    <td>${payment.mois_concerne}</td>
                    <td className="amount">${formatMontant(payment.montant)} FCFA</td>
                    <td>${getPaymentStatusConfig(payment.statut).label}</td>
                    <td>${getPaymentModeLabel(payment.mode_paiement)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    `;
  };

  const generateGlobalHTML = (data: any, dateRangeText: string) => {
    return `
      <div className="report-header">
        <h1>Rapport Global des Paiements</h1>
        <p className="date-range">${dateRangeText}</p>
        <p className="generated-date">Généré le: ${formatDate(new Date().toISOString())}</p>
      </div>
      
      <div className="summary">
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Total Paiements:</span>
            <span className="value">${data.totalPayments}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Encaissé:</span>
            <span className="value paid">${formatMontant(data.totalPaid)} FCFA</span>
          </div>
          <div className="summary-item">
            <span className="label">Total En Attente:</span>
            <span className="value pending">${formatMontant(data.totalPending)} FCFA</span>
          </div>
        </div>

        <div className="breakdown-section">
          <h3>Répartition par Statut</h3>
          <div className="breakdown-grid">
            ${Object.entries(data.statusBreakdown).map(([status, count]) => `
              <div className="breakdown-item">
                <span className="status-label">${getPaymentStatusConfig(status as any).label}:</span>
                <span className="status-count">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div className="breakdown-section">
          <h3>Répartition par Mode de Paiement</h3>
          <div className="breakdown-grid">
            ${Object.entries(data.modeBreakdown).map(([mode, count]) => `
              <div className="breakdown-item">
                <span className="mode-label">${getPaymentModeLabel(mode as any)}:</span>
                <span className="mode-count">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  };

  // Helper functions
  const getDateRangeText = (config: ReportConfig) => {
    const now = new Date();
    
    switch (config.dateRange) {
      case "month":
        return `Mois de ${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
      case "quarter": {
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Trimestre ${quarter} - ${now.getFullYear()}`;
      }
      case "year":
        return `Année ${now.getFullYear()}`;
      case "custom":
        if (config.startDate && config.endDate) {
          return `Du ${formatDate(config.startDate)} au ${formatDate(config.endDate)}`;
        }
        return "Période personnalisée";
      default:
        return "Toute la période";
    }
  };

  const getPrintStyles = () => `
    @page {
      margin: 1cm;
      size: A4;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
    }
    
    .report-header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 20px;
    }
    
    .report-header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
      color: #2c3e50;
    }
    
    .date-range {
      font-size: 14px;
      font-weight: bold;
      color: #666;
    }
    
    .generated-date {
      font-size: 12px;
      color: #999;
      margin-top: 5px;
    }
    
    .summary {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .summary p {
      margin: 5px 0;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .summary-box {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin: 20px 0;
      padding: 15px;
      background: #f1f3f4;
      border-radius: 6px;
    }
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .label {
      font-weight: 600;
      color: #555;
    }
    
    .value {
      font-weight: bold;
    }
    
    .value.paid {
      color: #27ae60;
    }
    
    .value.pending {
      color: #f39c12;
    }
    
    .report-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .report-section h2 {
      color: #2c3e50;
      border-bottom: 1px solid #ddd;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    
    .payment-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    
    .payment-table th,
    .payment-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    .payment-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .payment-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    .amount {
      font-weight: bold;
      text-align: right;
    }
    
    .breakdown-section {
      margin: 20px 0;
    }
    
    .breakdown-section h3 {
      color: #2c3e50;
      margin-bottom: 10px;
    }
    
    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }
    
    .breakdown-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 4px;
      border-left: 4px solid #3498db;
    }
    
    .status-label, .mode-label {
      font-weight: 500;
    }
    
    .status-count, .mode-count {
      font-weight: bold;
      color: #2c3e50;
    }
    
    @media print {
      .report-section {
        page-break-inside: avoid;
      }
      
      .payment-table {
        page-break-inside: avoid;
      }
    }
  `;

  return (
    <div className="space-y-4">
      {/* Report Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText size={20} className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">
            Rapports de Paiements
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de Rapport
            </label>
            <select
              value={reportConfig.type}
              onChange={(e) => setReportConfig({
                ...reportConfig,
                type: e.target.value as ReportType,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tenant">Par Locataire</option>
              <option value="owner">Par Propriétaire</option>
              <option value="property">Par Bien Immobilier</option>
              <option value="global">Global</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période
            </label>
            <select
              value={reportConfig.dateRange}
              onChange={(e) => setReportConfig({
                ...reportConfig,
                dateRange: e.target.value as DateRange,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">Ce Mois</option>
              <option value="quarter">Ce Trimestre</option>
              <option value="year">Cette Année</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {reportConfig.dateRange === "custom" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Début
                </label>
                <input
                  type="date"
                  value={reportConfig.startDate || ""}
                  onChange={(e) => setReportConfig({
                    ...reportConfig,
                    startDate: e.target.value,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Fin
                </label>
                <input
                  type="date"
                  value={reportConfig.endDate || ""}
                  onChange={(e) => setReportConfig({
                    ...reportConfig,
                    endDate: e.target.value,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* Specific Filters */}
          {reportConfig.type === "tenant" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locataire
              </label>
              <select
                value={reportConfig.tenantId || ""}
                onChange={(e) => setReportConfig({
                  ...reportConfig,
                  tenantId: e.target.value,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les locataires</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.prenom} {tenant.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportConfig.type === "owner" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Propriétaire
              </label>
              <select
                value={reportConfig.ownerId || ""}
                onChange={(e) => setReportConfig({
                  ...reportConfig,
                  ownerId: e.target.value,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les propriétaires</option>
                {uniqueOwners.map((owner) => (
                  <option key={owner} value={owner || ""}>
                    {owner || "Non spécifié"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportConfig.type === "property" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bien Immobilier
              </label>
              <select
                value={reportConfig.propertyId || ""}
                onChange={(e) => setReportConfig({
                  ...reportConfig,
                  propertyId: e.target.value,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les biens</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.adresse}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Génération...
              </>
            ) : (
              <>
                <FileText size={16} />
                Générer le Rapport
              </>
            )}
          </button>

          {previewData.length > 0 && (
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer size={16} />
              Imprimer
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      {previewData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Aperçu du Rapport
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} />
              {getDateRangeText(reportConfig)}
            </div>
          </div>

          {/* Preview content based on report type */}
          {reportConfig.type === "tenant" && (
            <div className="space-y-4">
              {previewData.slice(0, 3).map((tenant: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{tenant.tenant}</h4>
                    <div className="text-right">
                      <p className="text-sm text-green-600">
                        Payé: {formatMontant(tenant.totalPaid)} FCFA
                      </p>
                      <p className="text-sm text-amber-600">
                        En attente: {formatMontant(tenant.totalPending)} FCFA
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {tenant.paymentCount} paiement{tenant.paymentCount > 1 ? "s" : ""}
                  </p>
                </div>
              ))}
              {previewData.length > 3 && (
                <p className="text-center text-sm text-gray-500">
                  ... et {previewData.length - 3} autres
                </p>
              )}
            </div>
          )}

          {reportConfig.type === "owner" && (
            <div className="space-y-4">
              {previewData.slice(0, 3).map((owner: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{owner.owner}</h4>
                    <div className="text-right">
                      <p className="text-sm text-green-600">
                        Payé: {formatMontant(owner.totalPaid)} FCFA
                      </p>
                      <p className="text-sm text-amber-600">
                        En attente: {formatMontant(owner.totalPending)} FCFA
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {owner.properties} bien{owner.properties > 1 ? "s" : ""} • {owner.paymentCount} paiement{owner.paymentCount > 1 ? "s" : ""}
                  </p>
                </div>
              ))}
              {previewData.length > 3 && (
                <p className="text-center text-sm text-gray-500">
                  ... et {previewData.length - 3} autres
                </p>
              )}
            </div>
          )}

          {reportConfig.type === "property" && (
            <div className="space-y-4">
              {previewData.slice(0, 3).map((property: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{property.property}</h4>
                    <div className="text-right">
                      <p className="text-sm text-green-600">
                        Payé: {formatMontant(property.totalPaid)} FCFA
                      </p>
                      <p className="text-sm text-amber-600">
                        En attente: {formatMontant(property.totalPending)} FCFA
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {property.type} • {property.tenants} locataire{property.tenants > 1 ? "s" : ""} • {property.paymentCount} paiement{property.paymentCount > 1 ? "s" : ""}
                  </p>
                </div>
              ))}
              {previewData.length > 3 && (
                <p className="text-center text-sm text-gray-500">
                  ... et {previewData.length - 3} autres
                </p>
              )}
            </div>
          )}

          {reportConfig.type === "global" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Paiements</p>
                <p className="text-2xl font-bold text-blue-600">
                  {previewData.totalPayments}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Encaissé</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatMontant(previewData.totalPaid)} FCFA
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Total En Attente</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatMontant(previewData.totalPending)} FCFA
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
