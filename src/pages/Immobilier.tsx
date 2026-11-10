import { useEffect, useState, useCallback, type ComponentType } from "react";
import {
  Search,
  Building2,
  Users,
  FileText,
  DollarSign,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import dbClient from '../lib/dbClient.service';
import apiClient from "../api/client";
import { tenantsRepository } from '../lib/dbClient.service';
import type { Property, Tenant, RentPayment, LeaseContract } from "../types";
import { useSettings } from "../context/SettingsContext";
import PropertiesTab from "./immobilier/PropertiesTab";
import TenantsTab from "./immobilier/TenantsTab";
import ContractsTab from "./immobilier/ContractsTab";
import PaymentsTab from "./immobilier/PaymentsTab";
import PaymentReportsTab from "./immobilier/PaymentReportsTab";
import SyncRemoteButton from "../components/ui/SyncRemoteButton";
import {
  normalizeManualStatus,
  readManualCache,
  writeManualCache,
} from "../lib/manualSyncStore";

type Tab = "biens" | "locataires" | "contrats" | "paiements" | "rapports";

const PROPERTIES_CACHE_KEY = "egs.immobilier.properties.local_cache.v1";
const TENANTS_CACHE_KEY = "egs.immobilier.tenants.local_cache.v1";
const CONTRACTS_CACHE_KEY = "egs.immobilier.contracts.local_cache.v1";
const PAYMENTS_CACHE_KEY = "egs.immobilier.payments.local_cache.v1";

const tabs: {
  id: Tab;
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
}[] = [
  { id: "biens", label: "Biens", icon: Building2 },
  { id: "locataires", label: "Locataires", icon: Users },
  { id: "contrats", label: "Contrats", icon: FileText },
  { id: "paiements", label: "Paiements", icon: DollarSign },
  { id: "rapports", label: "Rapports", icon: BarChart3 },
];

export default function Immobilier() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>("biens");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

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
      // Read all four caches independently
      const cachedProperties = readManualCache<Property>(PROPERTIES_CACHE_KEY);
      const cachedTenants = readManualCache<Tenant>(TENANTS_CACHE_KEY);
      const cachedContracts = readManualCache<LeaseContract>(CONTRACTS_CACHE_KEY);
      const cachedPayments = readManualCache<RentPayment>(PAYMENTS_CACHE_KEY);

      // Fetch all four resources from the API independently.
      // We use Promise.allSettled so that one failure does not prevent
      // the other three from completing.
      const results = await Promise.allSettled([
        // Properties: use dbClient from supabase-like API
        dbClient.from("properties").select("*").order("created_at"),
        // Tenants: use tenantsRepository
        tenantsRepository.getAll({ limit: 1000 }),
        // Contracts: use dbClient
        dbClient.from("lease_contracts").select("*").order("created_at"),
        // Payments: use dbClient
        dbClient
          .from("rent_payments")
          .select("*")
          .order("date_paiement", { ascending: false }),
      ]);

      // Helper: extract data/error from a Promise.allSettled result
      const getResult = (p: PromiseSettledResult<any>) => {
        if (p.status === "fulfilled") {
          return { data: p.value.data, error: p.value.error, success: true };
        }
        return { data: null, error: p.reason?.message || "Unknown error", success: false };
      };

      const propResult = getResult(results[0]);
      const tenantResult = getResult(results[1]);
      const contractResult = getResult(results[2]);
      const paymentResult = getResult(results[3]);

      // ---- Properties ----
      let properties: Property[] = [];
      if (propResult.success && propResult.data !== null) {
        const propData = propResult.data as any[];
        properties = ((propData || []) as any[]).map(
          (property) => ({
            ...property,
            proprietaire_id: property.proprietaire_id ?? property.proprietaire_entity_id ?? null,
          }),
        ) as Property[];
        writeManualCache(PROPERTIES_CACHE_KEY, properties);
      } else if (cachedProperties.length > 0) {
        // Keep existing cache if API fails and we have cached data
        properties = cachedProperties;
      }
      const propertiesById = new Map(
        properties.map((property) => [property.id, property]),
      );

      // ---- Tenants ----
      let tenantsData: Tenant[] = [];
      if (tenantResult.success && tenantResult.data !== null) {
        tenantsData = (tenantResult.data as any[]) || [];
        writeManualCache(TENANTS_CACHE_KEY, tenantsData);
      } else if (cachedTenants.length > 0) {
        tenantsData = cachedTenants;
      }

      // Determine which tenant ID field to use (tenant_id vs locataire_id)
      const legacyTenantIdField =
        ((contractResult.data as any[]) || []).some(
          (c) => c.tenant_id && !c.locataire_id,
        ) ||
        ((paymentResult.data as any[]) || []).some(
          (p) => p.tenant_id && !p.locataire_id,
        );

      const tenantIdColumn: "locataire_id" | "tenant_id" =
        legacyTenantIdField ? "tenant_id" : "locataire_id";

      const tenantsById = new Map(
        (tenantsData || []).map((tenant) => [tenant.id, tenant]),
      );

      // ---- Contracts ----
      let enrichedContracts: LeaseContract[] = [];
      if (contractResult.success && contractResult.data !== null) {
        const contractData = contractResult.data as any[];
        const normalizedContracts = ((contractData || []) as any[]).map(
          (contract) => ({
            ...contract,
            locataire_id: contract.locataire_id ?? contract.tenant_id ?? "",
          }),
        ) as LeaseContract[];

        // Enrich contracts with property and tenant info
        enrichedContracts = normalizedContracts.map((contract) => ({
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

        writeManualCache(CONTRACTS_CACHE_KEY, enrichedContracts);
      } else if (cachedContracts.length > 0) {
        // Keep existing cache if API fails
        // Re-normalize based on current tenantIdColumn
        const normalized = ((cachedContracts.data as any[]) || []).map(
          (contract) => ({
            ...contract,
            locataire_id: contract.locataire_id ?? contract.tenant_id ?? "",
          }),
        ) as LeaseContract[];
        enrichedContracts = normalizedContracts.map((contract) => ({
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
      }

      // ---- Payments ----
      let enrichedPayments: RentPayment[] = [];
      if (paymentResult.success && paymentResult.data !== null) {
        const payData = paymentResult.data as any[];
        const normalizedPayments = ((payData || []) as any[]).map(
          (payment) => ({
            ...payment,
            locataire_id: payment.locataire_id ?? payment.tenant_id ?? null,
          }),
        ) as RentPayment[];

        // Enrich payments with property and tenant info
        enrichedPayments = normalizedPayments.map((payment) => ({
          ...payment,
          properties:
            payment.property_id && propertiesById.get(payment.property_id)
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
            payment.contract_id && enrichedContracts.some((c) => c.id)
              ? { reference: enrichedContracts.find((c) => c.id === payment.contract_id)!.reference }
              : undefined,
        })) as RentPayment[];

        writeManualCache(PAYMENTS_CACHE_KEY, enrichedPayments);
      } else if (cachedPayments.length > 0) {
        // Keep existing cache if API fails
        enrichedPayments = cachedPayments;
      }

      setProperties(properties);
      setTenants(tenantsData || []);
      setContracts(enrichedContracts);
      setPayments(enrichedPayments);
      setTenantTableName("locataires");
      setTenantIdColumn(tenantIdColumn);
    } catch (err) {
      // Global fallback: if absolutely everything fails, keep local caches as-is
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

  const totalProperties = properties.length;
  const occupiedProperties = properties.filter(
    (p) => p.statut === "louee" || p.statut === "loue",
  ).length;
  const availableProperties = properties.filter(
    (p) => p.statut === "disponible",
  ).length;

  const pendingSyncCount = [
    ...readManualCache<{ sync_status?: string }>(PROPERTIES_CACHE_KEY),
    ...readManualCache<{ sync_status?: string }>(TENANTS_CACHE_KEY),
    ...readManualCache<{ sync_status?: string }>(CONTRACTS_CACHE_KEY),
    ...readManualCache<{ sync_status?: string }>(PAYMENTS_CACHE_KEY),
  ].filter(
    (item) => normalizeManualStatus(item.sync_status) !== "synced",
  ).length;

  const handleSyncToRemote = useCallback(async () => {
    setError(null);
    setSyncing(true);

    try {
      const localProperties = readManualCache<any>(PROPERTIES_CACHE_KEY);
      const localTenants = readManualCache<any>(TENANTS_CACHE_KEY);
      const localContracts = readManualCache<any>(CONTRACTS_CACHE_KEY);
      const localPayments = readManualCache<any>(PAYMENTS_CACHE_KEY);

      let syncedCount = 0;
      let failedCount = 0;

      const syncCollection = async (
        items: any[],
        tableName: string,
        onSuccess?: (item: any) => void,
      ) => {
        const nextItems = [...items];
        for (const item of items) {
          const status = normalizeManualStatus(item.sync_status);
          if (status === "synced") continue;

          if (status === "deleted") {
            const { error } = await dbClient
              .from(tableName)
              .delete()
              .eq("id", item.id);
            if (error) {
              failedCount += 1;
              const index = nextItems.findIndex(
                (entry) => entry.id === item.id,
              );
              if (index >= 0)
                nextItems[index] = {
                  ...nextItems[index],
                  sync_error: error.message,
                };
              continue;
            }
            const index = nextItems.findIndex((entry) => entry.id === item.id);
            if (index >= 0) nextItems.splice(index, 1);
            syncedCount += 1;
            continue;
          }

          const payload = { ...item };
          delete payload.sync_status;
          delete payload.sync_error;
          delete payload.deleted_at;

          const { error } = await dbClient.from(tableName).upsert(payload, {
            onConflict: "id",
          });
          if (error) {
            failedCount += 1;
            const index = nextItems.findIndex((entry) => entry.id === item.id);
            if (index >= 0)
              nextItems[index] = {
                ...nextItems[index],
                sync_error: error.message,
              };
            continue;
          }
          const index = nextItems.findIndex((entry) => entry.id === item.id);
          if (index >= 0) {
            nextItems[index] = {
              ...nextItems[index],
              sync_status: "synced",
              sync_error: null,
              deleted_at: null,
            };
            onSuccess?.(nextItems[index]);
          }
          syncedCount += 1;
        }
        return nextItems;
      };

      const syncedProperties = [...localProperties];
      for (const item of localProperties) {
        const status = normalizeManualStatus(item.sync_status);
        if (status === "synced") continue;
        const index = syncedProperties.findIndex((entry) => entry.id === item.id);

        if (status === "deleted") {
          const nextStatus = item.statut === "vendue" ? "archivee" : "retiree";
          const result = await apiClient.immobilier.properties.transition(item.id, nextStatus);
          if (result.error) {
            failedCount += 1;
            if (index >= 0) syncedProperties[index] = { ...item, sync_error: result.error };
            continue;
          }
          if (index >= 0) syncedProperties.splice(index, 1);
          syncedCount += 1;
          continue;
        }

        const payload = {
          id: item.id,
          type_bien: item.type_bien,
          adresse: item.adresse,
          commune: item.commune || null,
          ville: item.ville || null,
          proprietaire_entity_id: item.proprietaire_id || null,
          valeur: item.valeur ?? null,
          loyer_mensuel: item.loyer_mensuel ?? 0,
          charges_mensuelles: item.charges_mensuelles ?? 0,
          statut: item.statut === "loue" ? "louee" : item.statut === "vendu" ? "vendue" : item.statut,
          description: item.description || null,
          cover_image_url: item.cover_image_url || null,
        };
        const desiredStatus = payload.statut;
        const createPayload = {
          ...payload,
          statut: ["disponible", "en_travaux"].includes(desiredStatus)
            ? desiredStatus
            : "disponible",
        };
        const updatePayload = { ...payload };
        delete (updatePayload as { id?: string }).id;
        delete (updatePayload as { statut?: string }).statut;
        const existing = await apiClient.immobilier.properties.get(item.id);
        let result = existing.status === 404
          ? await apiClient.immobilier.properties.create(createPayload)
          : existing.error
            ? existing
            : await apiClient.immobilier.properties.update(item.id, updatePayload);
        const legacyLeaseAlias = desiredStatus === "louee" && result.data?.statut === "loue";
        if (!result.error && result.data && result.data.statut !== desiredStatus && !legacyLeaseAlias) {
          result = await apiClient.immobilier.properties.transition(item.id, desiredStatus);
        }
        if (result.error || !result.data) {
          failedCount += 1;
          if (index >= 0) syncedProperties[index] = { ...item, sync_error: result.error || "Réponse serveur invalide" };
          continue;
        }
        if (index >= 0) {
          syncedProperties[index] = {
            ...item,
            ...(result.data as Property),
            sync_status: "synced",
            sync_error: null,
            deleted_at: null,
          };
        }
        syncedCount += 1;
      }
      writeManualCache(PROPERTIES_CACHE_KEY, syncedProperties);

      // Use server-side endpoint name 'tenants' to avoid legacy '/tables/locataires' 404
      const syncedTenants = await syncCollection(localTenants, "tenants");
      writeManualCache(TENANTS_CACHE_KEY, syncedTenants);

      const syncedContracts = await syncCollection(
        localContracts,
        "lease_contracts",
      );
      writeManualCache(CONTRACTS_CACHE_KEY, syncedContracts);

      const syncedPayments = await syncCollection(
        localPayments,
        "rent_payments",
      );
      writeManualCache(PAYMENTS_CACHE_KEY, syncedPayments);

      await fetchData();

      if (failedCount > 0) {
        setError(
          `${syncedCount} élément(s) synchronisé(s), ${failedCount} en échec.`,
        );
      }
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Synchronisation impossible.",
      );
    } finally {
      setSyncing(false);
    }
  }, [fetchData, tenantTableName]);

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
        <SyncRemoteButton
          pendingCount={pendingSyncCount}
          syncing={syncing}
          onClick={() => void handleSyncToRemote()}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-[0.16em] mb-2">
            Biens totaux
          </p>
          <p className="text-3xl font-semibold text-gray-900">
            {totalProperties}
          </p>
          <p className="text-sm text-gray-500 mt-1">Inventaire global</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-[0.16em] mb-2">
            Biens loués
          </p>
          <p className="text-3xl font-semibold text-gray-900">
            {occupiedProperties}
          </p>
          <p className="text-sm text-gray-500 mt-1">Locations actives</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-[0.16em] mb-2">
            Biens disponibles
          </p>
          <p className="text-3xl font-semibold text-gray-900">
            {availableProperties}
          </p>
          <p className="text-sm text-gray-500 mt-1">Prêts à être loués</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-[0.16em] mb-2">
            Paiements urgents
          </p>
          <p className="text-3xl font-semibold text-gray-900">
            {urgentPayments}
          </p>
          <p className="text-sm text-gray-500 mt-1">Retards et partiels</p>
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
              onRefresh={fetchData}
            />
          )}
          {activeTab === "rapports" && (
            <PaymentReportsTab
              payments={payments}
              contracts={activeContracts}
              properties={properties}
            />
          )}
        </>
      )}
    </div>
  );
}
