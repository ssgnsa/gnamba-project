import { useState, useCallback } from "react";
import { foncierRepository } from "../data/foncier.repository";
import dbClient from "../lib/dbClient.service";
import { buildAttestationRpcParams, FONCIER_ATTESTATION_WITH_TEMOINS_SELECT } from "../lib/foncierAttestation";
import { logFoncierAudit } from "../lib/foncierAudit";
import { generateFoncierReference, generateUUID } from "../utils/reference";
import type { FoncierLot } from "../types";
import type { AttestationForm } from "../components/foncier/FoncierConstants";

interface UseAttestationsOptions {
  deviceId: string;
  profile: { id?: string | null; full_name?: string | null } | null;
}

interface UseAttestationsReturn {
  // Data
  latestAttestation: any | null;
  attestationHistory: any[];
  attestationHistoryLoading: boolean;
  attestationHistoryError: string | null;
  setAttestationHistoryError: (error: string | null) => void;
  scans: Record<string, { url: string; original_name: string }>;
  
  // Loading states
  creating: boolean;
  submitting: boolean;
  validating: boolean;
  scanning: boolean;
  
  // Errors
  createError: string | null;
  submitError: string | null;
  validateError: string | null;
  scanError: string | null;
  
  // Actions
  getLatestAttestation: (lotId: string) => Promise<void>;
  fetchAttestationHistory: (lotId: string) => Promise<void>;
  fetchScan: (attestationId: string) => Promise<void>;
  
  // Generate attestation
  createAttestation: (params: {
    attestationForm: AttestationForm;
    lot: FoncierLot;
    villageConfig: Record<string, string>;
    isOnline: boolean;
  }) => Promise<any>;
  
  // Workflow
  submitAttestation: (attestationId: string, lotId: string, reference: string) => Promise<void>;
  validateAttestation: (attestationId: string, lotId: string, reference: string, chefName: string, userId: string | null) => Promise<void>;
  uploadScan: (attestationId: string, lotId: string, reference: string, mediaId: string) => Promise<void>;
  revokeAttestation: (attestationId: string, lotId: string, reference: string, reason: string) => Promise<void>;
  reissueAttestation: (attestationId: string, lotId: string) => Promise<void>;
}

export function useAttestations({ deviceId, profile }: UseAttestationsOptions): UseAttestationsReturn {
  const [latestAttestation, setLatestAttestation] = useState<any | null>(null);
  const [attestationHistory, setAttestationHistory] = useState<any[]>([]);
  const [attestationHistoryLoading, setAttestationHistoryLoading] = useState(false);
  const [attestationHistoryError, setAttestationHistoryError] = useState<string | null>(null);
  const [scans, setScans] = useState<Record<string, { url: string; original_name: string }>>({});
  
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const [createError, setCreateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const getLatestAttestation = useCallback(async (lotId: string) => {
    try {
      const result = await foncierRepository.getLatestAttestation(lotId, false);
      if (result.error) throw result.error;
      setLatestAttestation(result.data || null);
    } catch (err) {
      console.error("Error fetching latest attestation:", err);
      setLatestAttestation(null);
    }
  }, []);

  const fetchAttestationHistory = useCallback(async (lotId: string) => {
    setAttestationHistoryLoading(true);
    setAttestationHistoryError(null);
    setScans({});
    
    try {
      const baseQuery = dbClient
        .from("foncier_attestations")
        .select(FONCIER_ATTESTATION_WITH_TEMOINS_SELECT)
        .eq("lot_id", lotId)
        .order("created_at", { ascending: false });

      let result = await baseQuery.is("deleted_at", null);
      
      if (result.error && result.error.code === "42703") {
        result = await baseQuery;
      }

      if (result.error) throw result.error;
      
      const data = result.data || [];
      setAttestationHistory(data);
      
      // Fetch scans
      const { getUsageForSlot } = await import("../lib/mediaUtils");
      const scanPromises = data.map(async (att: { id: string; [key: string]: any }) => {
        try {
          const scan = await getUsageForSlot("foncier_attestation", att.id, "attestation_scan");
          return { id: att.id, scan };
        } catch {
          return { id: att.id, scan: null };
        }
      });
      
      const scanResults = await Promise.all(scanPromises);
      const scanMap: Record<string, { url: string; original_name: string }> = {};
      scanResults.forEach(({ id, scan }) => {
        if (scan) scanMap[id] = { url: scan.url, original_name: scan.original_name };
      });
      setScans(scanMap);
    } catch (err: any) {
      console.error("Error fetching attestation history:", err);
      setAttestationHistoryError(err.message || "Impossible de charger l'historique");
    } finally {
      setAttestationHistoryLoading(false);
    }
  }, []);

  const fetchScan = useCallback(async (attestationId: string) => {
    try {
      const { getUsageForSlot } = await import("../lib/mediaUtils");
      const scan = await getUsageForSlot("foncier_attestation", attestationId, "attestation_scan");
      if (scan) {
        setScans((prev) => ({ ...prev, [attestationId]: { url: scan.url, original_name: scan.original_name } }));
      }
    } catch (err) {
      console.error("Error fetching scan:", err);
    }
  }, []);

  const createAttestation = useCallback(async (params: {
    attestationForm: AttestationForm;
    lot: FoncierLot;
    villageConfig: Record<string, string>;
    isOnline: boolean;
  }) => {
    const { attestationForm, lot, villageConfig, isOnline } = params;
    
    if (!isOnline) {
      setCreateError("Connexion requise pour générer l'attestation");
      return { error: new Error("Offline") };
    }

    setCreating(true);
    setCreateError(null);

    try {
      // Generate reference if needed
      let reference = attestationForm.reference;
      if (!reference) {
        reference = generateFoncierReference("ATT", villageConfig);
      }

      const signatureNonce = generateUUID();
      const signatureIssuedAt = new Date().toISOString();

      // Build RPC params
      const isCession = attestationForm.attestation_type === "cession";
      const rpcParams = buildAttestationRpcParams({
        attestationForm: { ...attestationForm, reference },
        attestationLot: lot,
        signatureNonce,
        signatureIssuedAt,
        deviceId,
        isCession,
      });

      // Call RPC
      const result = await foncierRepository.createAttestation(rpcParams as any);
      if (result.error) throw result.error;

      await logFoncierAudit(dbClient, {
        lotId: lot.id,
        action: "ATTESTATION_CREATE",
        details: {
          attestation_id: result.data?.[0]?.id,
          reference,
          type: attestationForm.attestation_type,
        },
      });

      setCreating(false);
      return result;
    } catch (err: any) {
      console.error("Error creating attestation:", err);
      const msg = err.message || "Erreur lors de la génération";
      setCreateError(msg);
      setCreating(false);
      return { error: err };
    }
  }, [deviceId]);

  const submitAttestation = useCallback(async (attestationId: string, lotId: string, reference: string) => {
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      const now = new Date().toISOString();
      const { error } = await dbClient
        .from("foncier_attestations")
        .update({ statut: "soumis", updated_at: now, client_updated_at: now })
        .eq("id", attestationId);

      if (error) throw error;

      await logFoncierAudit(dbClient, {
        lotId,
        action: "ATTESTATION_SUBMIT",
        details: { attestation_id: attestationId, reference },
      });

      setSubmitting(false);
    } catch (err: any) {
      console.error("Error submitting attestation:", err);
      setSubmitError(err.message || "Erreur lors de la soumission");
      setSubmitting(false);
    }
  }, []);

  const validateAttestation = useCallback(async (attestationId: string, lotId: string, reference: string, chefName: string, userId: string | null) => {
    setValidating(true);
    setValidateError(null);
    
    try {
      const now = new Date().toISOString();
      const { error } = await dbClient
        .from("foncier_attestations")
        .update({
          statut: "valide",
          validation_chef_nom: chefName,
          validation_chef_id: userId,
          validation_chef_date: now,
          updated_at: now,
          client_updated_at: now,
        })
        .eq("id", attestationId);

      if (error) throw error;

      await logFoncierAudit(dbClient, {
        lotId,
        action: "ATTESTATION_VALIDATE",
        details: { attestation_id: attestationId, reference },
      });

      setValidating(false);
    } catch (err: any) {
      console.error("Error validating attestation:", err);
      setValidateError(err.message || "Erreur lors de la validation");
      setValidating(false);
    }
  }, []);

  const uploadScan = useCallback(async (attestationId: string, lotId: string, reference: string, mediaId: string) => {
    setScanning(true);
    setScanError(null);
    
    try {
      const { assignMedia } = await import("../lib/mediaUtils");
      const { error } = await assignMedia(
        mediaId,
        "foncier_attestation",
        attestationId,
        "attestation_scan",
        "Scan original"
      );
      
      if (error) throw new Error(error);

      await logFoncierAudit(dbClient, {
        lotId,
        action: "ATTESTATION_SCAN",
        details: { attestation_id: attestationId, reference, media_id: mediaId },
      });

      // Fetch the scan to update UI
      await fetchScan(attestationId);
      
      setScanning(false);
    } catch (err: any) {
      console.error("Error uploading scan:", err);
      setScanError(err.message || "Erreur lors de l'upload");
      setScanning(false);
    }
  }, [fetchScan]);

  const revokeAttestation = useCallback(async (attestationId: string, lotId: string, reference: string, reason: string) => {
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      const now = new Date().toISOString();
      const { error } = await dbClient
        .from("foncier_attestations")
        .update({ 
          statut: "revoque", 
          revoke_reason: reason,
          revoked_at: now,
          revoked_by: profile?.id || null,
          updated_at: now,
          client_updated_at: now,
        })
        .eq("id", attestationId);

      if (error) throw error;

      await logFoncierAudit(dbClient, {
        lotId,
        action: "ATTESTATION_REVOKE",
        details: { attestation_id: attestationId, reference, reason },
      });

      setSubmitting(false);
    } catch (err: any) {
      console.error("Error revoking attestation:", err);
      setSubmitError(err.message || "Erreur lors de la révocation");
      setSubmitting(false);
    }
  }, [profile]);

  const reissueAttestation = useCallback(async (attestationId: string, lotId: string) => {
    setCreating(true);
    setCreateError(null);
    
    try {
      const { error } = await dbClient
        .rpc("reissue_attestation", { p_attestation_id: attestationId });
      
      if (error) throw error;

      await logFoncierAudit(dbClient, {
        lotId,
        action: "ATTESTATION_REISSUE",
        details: { original_attestation_id: attestationId },
      });

      setCreating(false);
    } catch (err: any) {
      console.error("Error reissuing attestation:", err);
      setCreateError(err.message || "Erreur lors de la réémission");
      setCreating(false);
    }
  }, []);

  return {
    // Data
    latestAttestation,
    attestationHistory,
    attestationHistoryLoading,
    attestationHistoryError,
    setAttestationHistoryError,
    scans,
    // Loading
    creating,
    submitting,
    validating,
    scanning,
    // Errors
    createError,
    submitError,
    validateError,
    scanError,
    // Actions
    getLatestAttestation,
    fetchAttestationHistory,
    fetchScan,
    createAttestation,
    submitAttestation,
    validateAttestation,
    uploadScan,
    revokeAttestation,
    reissueAttestation,
  };
}