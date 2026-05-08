import { useEffect, useState, useCallback, type ComponentType } from "react";
import {
  Search,
  Building2,
  Users,
  FileText,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Property, Tenant, RentPayment, LeaseContract } from "../types";
import { useSettings } from "../context/SettingsContext";
import PropertiesTab from "./immobilier/PropertiesTab";
import TenantsTab from "./immobilier/TenantsTab";
import ContractsTab from "./immobilier/ContractsTab";
import PaymentsTab from "./immobilier/PaymentsTab";

type Tab = "biens" | "locataires" | "contrats" | "paiements";

const tabs: {
  id: Tab;
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
}[] = [
  { id: "biens", label: "Biens", icon: Building2 },
  { id: "locataires", label: "Locataires", icon: Users },
  { id: "contrats", label: "Contrats", icon: FileText },
  { id: "paiements", label: "Paiements", icon: DollarSign },
];

const isSchemaMismatchError = (
  error: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null,
) => {
  if (!error) return false;

  const combinedMessage = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ");
  return (
    error.code === "42P01" ||
    error.code === "PGRST200" ||
    error.code === "PGRST205" ||
    /schema cache|could not find a relationship|relation .* does not exist|not found/i.test(
      combinedMessage,
    )
  );
};

export default function Immobilier() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>("biens");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<LeaseContract[]>([]);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [tenantTableName, setTenantTableName] = useState<
    "locataires" | "tenants"
  >("locataires");
  const [tenantIdColumn, setTenantIdColumn] = useState<
    "locataire_id" | "tenant_id"
  >("locataire_id");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [propRes, tenantRes] = await Promise.all([
        supabase
          .from("properties")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("locataires").select("*").order("nom"),
      ]);

      let tenantsData = tenantRes.data ?? [];

      if (isSchemaMismatchError(tenantRes.error)) {
        const fallbackTenantRes = await supabase
          .from("tenants")
          .select("*")
          .order("nom");
        if (fallbackTenantRes.error) {
          setError(`Erreur locataires: ${fallbackTenantRes.error.message}`);
        } else {
          tenantsData = fallbackTenantRes.data ?? [];
        }
      }

      const [contractRes, payRes] = await Promise.all([
        supabase
          .from("lease_contracts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("rent_payments")
          .select("*")
          .order("date_paiement", { ascending: false }),
      ]);

      const legacyTenantIdField =
        ((contractRes.data as any[]) || []).some(
          (c) => c.tenant_id && !c.locataire_id,
        ) ||
        ((payRes.data as any[]) || []).some(
          (p) => p.tenant_id && !p.locataire_id,
        );

      setTenantTableName(
        isSchemaMismatchError(tenantRes.error) ? "tenants" : "locataires",
      );
      setTenantIdColumn(legacyTenantIdField ? "tenant_id" : "locataire_id");

      if (propRes.error) {
        setError(`Erreur propriétés: ${propRes.error.message}`);
      }
      if (tenantRes.error && !isSchemaMismatchError(tenantRes.error)) {
        setError(`Erreur locataires: ${tenantRes.error.message}`);
      }
      if (contractRes.error) {
        setError(`Erreur contrats: ${contractRes.error.message}`);
      }
      if (payRes.error) {
        setError(`Erreur paiements: ${payRes.error.message}`);
      }

      const normalizedContracts = ((contractRes.data as any[]) || []).map(
        (contract) => ({
          ...contract,
          locataire_id: contract.locataire_id ?? contract.tenant_id ?? "",
        }),
      ) as LeaseContract[];

      const normalizedPayments = ((payRes.data as any[]) || []).map(
        (payment) => ({
          ...payment,
          locataire_id: payment.locataire_id ?? payment.tenant_id ?? null,
        }),
      ) as RentPayment[];

      const propertiesById = new Map(
        (propRes.data || []).map((property) => [property.id, property]),
      );
      const tenantsById = new Map(
        (tenantsData || []).map((tenant) => [tenant.id, tenant]),
      );
      const contractsById = new Map(
        normalizedContracts.map((contract) => [contract.id, contract]),
      );

      const enrichedContracts = normalizedContracts.map((contract) => ({
        ...contract,
        properties: propertiesById.get(contract.property_id)
          ? {
              adresse: propertiesById.get(contract.property_id)!.adresse,
              type_bien: propertiesById.get(contract.property_id)!.type_bien,
            }
          : undefined,
        locataires: tenantsById.get(contract.locataire_id)
          ? {
              nom: tenantsById.get(contract.locataire_id)!.nom,
              prenom: tenantsById.get(contract.locataire_id)!.prenom,
              telephone: tenantsById.get(contract.locataire_id)!.telephone,
            }
          : undefined,
      })) as LeaseContract[];

      const enrichedPayments = normalizedPayments.map((payment) => ({
        ...payment,
        properties: propertiesById.get(payment.property_id)
          ? { adresse: propertiesById.get(payment.property_id)!.adresse }
          : undefined,
        locataires:
          payment.locataire_id && tenantsById.get(payment.locataire_id)
            ? {
                nom: tenantsById.get(payment.locataire_id)!.nom,
                prenom: tenantsById.get(payment.locataire_id)!.prenom,
              }
            : undefined,
        lease_contracts:
          payment.contract_id && contractsById.get(payment.contract_id)
            ? { reference: contractsById.get(payment.contract_id)!.reference }
            : undefined,
      })) as RentPayment[];

      setProperties(propRes.data || []);
      setTenants(tenantsData || []);
      setContracts(enrichedContracts);
      setPayments(enrichedPayments);
    } catch {
      setError("Une erreur est survenue lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeContracts = contracts.filter((c) => c.statut === "actif");

  const urgentPayments = payments.filter(
    (p) =>
      p.statut === "en_attente" ||
      p.statut === "retard" ||
      p.statut === "partiel",
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto w-full xl:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const showBadge = tab.id === "paiements" && urgentPayments > 0;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch("");
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={14} />
                {tab.label}
                {showBadge && (
                  <span className="ml-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {urgentPayments}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-auto">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-100)] focus:border-[var(--color-primary-400)] w-full sm:w-72"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: settings.primary_color }}
          />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
          <AlertCircle size={20} className="text-red-600" />
          <div>
            <p className="font-semibold">Une erreur est survenue</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="ml-auto px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {activeTab === "biens" && (
            <PropertiesTab
              properties={properties}
              activeContracts={activeContracts}
              contractHistory={contracts}
              search={search}
              onRefresh={fetchData}
            />
          )}
          {activeTab === "locataires" && (
            <TenantsTab
              tenants={tenants}
              activeContracts={activeContracts}
              search={search}
              tenantTableName={tenantTableName}
              onRefresh={fetchData}
            />
          )}
          {activeTab === "contrats" && (
            <ContractsTab
              contracts={contracts}
              properties={properties}
              tenants={tenants}
              search={search}
              tenantIdColumn={tenantIdColumn}
              onRefresh={fetchData}
            />
          )}
          {activeTab === "paiements" && (
            <PaymentsTab
              payments={payments}
              contracts={activeContracts}
              tenants={tenants}
              properties={properties}
              search={search}
              tenantIdColumn={tenantIdColumn}
              onRefresh={fetchData}
            />
          )}
        </>
      )}
    </div>
  );
}
