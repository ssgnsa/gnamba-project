import { render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockOpenConfig = vi.fn();
const mockFetchData = vi.fn();
const mockLoadCachedLots = vi.fn();
const mockRefreshQueueCount = vi.fn();

const baseState = {
  lots: [],
  totalCount: 0,
  villageStats: {},
  villageOptions: ["BRAFFOUEBY"],
  page: 1,
  pageSize: 20,
  totalPages: 1,
  setPage: vi.fn(),
  search: "",
  setSearch: vi.fn(),
  debouncedSearch: "",
  filterStatut: "",
  setFilterStatut: vi.fn(),
  filterVillage: "",
  setFilterVillage: vi.fn(),
  showArchived: false,
  setShowArchived: vi.fn(),
  loading: false,
  fetchData: mockFetchData,
  loadCachedLots: mockLoadCachedLots,
  refreshQueueCount: mockRefreshQueueCount,
  selectedVillage: "BRAFFOUEBY",
  setSelectedVillage: vi.fn(),
  villageOptionsLoading: false,
  config: {},
  configLoading: false,
  configError: null,
  loadConfig: vi.fn(),
  updateConfig: vi.fn(),
  saveConfig: vi.fn(),
  setConfigError: vi.fn(),
  logoUrl: undefined,
  setLogoUrl: vi.fn(),
  deviceId: "device-1",
  isOnline: true,
  setIsOnline: vi.fn(),
  syncing: false,
  syncPending: 0,
  syncProgress: 0,
  syncError: null,
  setSyncProgress: vi.fn(),
  setSyncError: vi.fn(),
  syncQueue: vi.fn(),
  auditModalOpen: false,
  setAuditModalOpen: vi.fn(),
  auditRecords: [],
  auditLoading: false,
  auditPage: 1,
  setAuditPage: vi.fn(),
  auditTotal: 0,
  auditActionFilter: "",
  setAuditActionFilter: vi.fn(),
  auditError: null,
  fetchAudit: vi.fn(),
  modalOpen: false,
  setModalOpen: vi.fn(),
  editingId: null,
  setEditingId: vi.fn(),
  form: {},
  setForm: vi.fn(),
  saving: false,
  setSaving: vi.fn(),
  configModalOpen: false,
  setConfigModalOpen: vi.fn(),
  configForm: {},
  setConfigForm: vi.fn(),
  configCache: {},
  setConfigCache: vi.fn(),
  activeTab: "lots",
  setActiveTab: vi.fn(),
  pageError: null,
  setPageError: vi.fn(),
  modalError: null,
  setModalError: vi.fn(),
  attestationModalOpen: false,
  setAttestationModalOpen: vi.fn(),
  attestationLot: null,
  setAttestationLot: vi.fn(),
  attestationForm: {},
  setAttestationForm: vi.fn(),
  attestationSaving: false,
  setAttestationSaving: vi.fn(),
  attestationError: null,
  setAttestationError: vi.fn(),
  workflowModalOpen: false,
  setWorkflowModalOpen: vi.fn(),
  workflowSelectedLot: null,
  setWorkflowSelectedLot: vi.fn(),
  attestationHistoryOpen: false,
  setAttestationHistoryOpen: vi.fn(),
  attestationHistoryLot: null,
  setAttestationHistoryLot: vi.fn(),
  attestationHistoryRecords: [],
  setAttestationHistoryRecords: vi.fn(),
  attestationHistoryScans: {},
  setAttestationHistoryScans: vi.fn(),
  attestationHistoryLoading: false,
  canManage: true,
  accessLevel: "admin",
  settings: { primary_color: "#1e3a5f" },
  profile: { role: "admin" },
  searchInputRef: { current: null },
  openAdd: vi.fn(),
  openEdit: vi.fn(),
  openAttestation: vi.fn(),
  openWorkflow: vi.fn(),
  openAttestationHistory: vi.fn(),
  openConfig: mockOpenConfig,
  openAudit: vi.fn(),
  handleArchive: vi.fn(),
  handleRestore: vi.fn(),
  handlePrintAttestation: vi.fn(),
  handlePrintAttestationAnnex: vi.fn(),
  handleGenerateAttestation: vi.fn(),
};

vi.mock("../context/SettingsContext", () => ({
  useSettings: () => ({ settings: { primary_color: "#1e3a5f" } }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ profile: { role: "admin", access_level: "admin" } }),
  resolveAccessLevel: () => "admin",
}));

vi.mock("../hooks/foncier", () => ({
  useFoncierState: () => baseState,
}));

vi.mock("../components/foncier/parts", () => ({
  LotTable: () => null,
  LotFormModal: () => null,
  AttestationModal: () => null,
  AttestationHistoryModal: () => null,
  ConfigModal: () => null,
  AuditModal: () => null,
}));

import Foncier from "./Foncier";

describe("Foncier module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenConfig.mockClear();
    mockFetchData.mockClear();
    mockLoadCachedLots.mockClear();
    mockRefreshQueueCount.mockClear();
  });

  it("does not auto-open the village configuration on first load", () => {
    render(<Foncier />);

    expect(mockOpenConfig).not.toHaveBeenCalled();
  });
});
