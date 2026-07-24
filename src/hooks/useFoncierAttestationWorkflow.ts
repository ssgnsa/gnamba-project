import { useState, useEffect, useCallback } from 'react';
import type { FoncierLot } from '@/types';

export const useFoncierAttestationWorkflow = () => {
  const [attestationModalOpen, setAttestationModalOpen] = useState(false);
  const [attestationLot, setAttestationLot] = useState<FoncierLot | null>(null);
  const [attestationForm, setAttestationForm] = useState<any>(null);
  const [attestationSaving, setAttestationSaving] = useState(false);
  const [attestationError, setAttestationError] = useState<string | null>(null);
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
  const [attestationHasDeletedAt, setAttestationHasDeletedAt] = useState<boolean | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    attestationHasDeletedAt,
    setAttestationHasDeletedAt,
    isOnline,
    setIsOnline,
    openAttestation,
    closeAttestation,
    handleGenerateAttestation,
  };
};
