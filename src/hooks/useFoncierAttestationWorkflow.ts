import { useState, useEffect, useCallback } from 'react';
import type { FoncierLot } from '@/types';

export const useFoncierAttestationWorkflow = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [attestationModalOpen, setAttestationModalOpen] = useState(false);
  const [attestationLot, setAttestationLot] = useState<FoncierLot | null>(null);
  const [attestationForm, setAttestationForm] = useState<any>({});
  const [attestationSaving, setAttestationSaving] = useState(false);
  const [attestationError, setAttestationError] = useState<string | null>(null);
  const [attestationHasDeletedAt, setAttestationHasDeletedAt] = useState<boolean | null>(null);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowSelectedLot, setWorkflowSelectedLot] = useState<string | null>(null);
  const [attestationHistoryOpen, setAttestationHistoryOpen] = useState(false);
  const [attestationHistoryLot, setAttestationHistoryLot] = useState<FoncierLot | null>(null);
  const [attestationHistoryRecords, setAttestationHistoryRecords] = useState<any[]>([]);
  const [attestationHistoryScans, setAttestationHistoryScans] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<string>("lots");
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditRecords, setAuditRecords] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize] = useState(20);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditError, setAuditError] = useState<string | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState<any>(null);
  const [configCache, setConfigCache] = useState<any>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configLoadedVillage, setConfigLoadedVillage] = useState<string | null>(null);
  const [configVillage, setConfigVillage] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<string | null>(null);
  const isOnlineInit = typeof navigator !== "undefined" ? navigator.onLine : true;
  const [isOnline, setIsOnline] = useState(isOnlineInit);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const openAttestation = useCallback((lot?: FoncierLot) => {
    setAttestationLot(lot || null);
    setAttestationModalOpen(true);
  }, []);

  const closeAttestation = useCallback(() => {
    setAttestationModalOpen(false);
    setAttestationLot(null);
  }, []);

  const handleGenerateAttestation = useCallback(async () => {
    setAttestationSaving(true);
    setAttestationSaving(false);
  }, []);

  return {
    modalOpen,
    setModalOpen,
    editingId,
    setEditingId,
    form,
    setForm,
    saving,
    setSaving,
    modalError,
    setModalError,
    attestationModalOpen,
    setAttestationModalOpen,
    attestationLot,
    setAttestationLot,
    attestationForm,
    setAttestationForm,
    attestationSaving,
    setAttestationSaving,
    attestationError,
    setAttestationError,
    attestationHasDeletedAt,
    setAttestationHasDeletedAt,
    workflowModalOpen,
    setWorkflowModalOpen,
    workflowSelectedLot,
    setWorkflowSelectedLot,
    attestationHistoryOpen,
    setAttestationHistoryOpen,
    attestationHistoryLot,
    setAttestationHistoryLot,
    attestationHistoryRecords,
    setAttestationHistoryRecords,
    attestationHistoryScans,
    setAttestationHistoryScans,
    activeTab,
    setActiveTab,
    auditModalOpen,
    setAuditModalOpen,
    auditRecords,
    setAuditRecords,
    auditLoading,
    setAuditLoading,
    auditTotal,
    setAuditTotal,
    auditPage,
    setAuditPage,
    auditPageSize,
    setAuditActionFilter,
    auditActionFilter,
    auditError,
    setAuditError,
    configModalOpen,
    setConfigModalOpen,
    configForm,
    setConfigForm,
    configCache,
    setConfigCache,
    configLoaded,
    setConfigLoaded,
    configLoadedVillage,
    setConfigLoadedVillage,
    configVillage,
    setConfigVillage,
    savingConfig,
    setSavingConfig,
    configError,
    setConfigError,
    pageError,
    setPageError,
    pageNotice,
    setPageNotice,
    isOnline,
    setIsOnline,
    openAttestation,
    closeAttestation,
    handleGenerateAttestation,
  };
};
