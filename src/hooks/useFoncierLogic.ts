import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { FoncierLot, FoncierAttestation } from "../types";
import type { FoncierConfigMap, AttestationForm } from "../components/foncier/FoncierConstants";
import DOMPurify from "dompurify";
import {
  cleanText,
  generateFoncierReference,
  generateUUID,
  formatDateLong,
  parseNumberInput,
} from "../utils/reference";
import {
  printAttestationCoutumiere,
} from "../utils/print";
import {
  validateAttestationForm,
  validateFoncierForm,
} from "../lib/foncierValidation";
import { buildAttestationRpcParams } from "../lib/foncierAttestation";
import {
  parseAttestationSnapshot,
  getLocalDateInput,
  isMissingColumnError,
} from "../components/foncier/FoncierConstants";

type VerificationUrlParams = {
  reference?: string | null;
  control_number?: string | null;
  hash_sha256?: string | null;
  baseUrl?: string | null;
};

const buildAttestationVerificationUrl = ({
  reference,
  control_number,
  hash_sha256,
  baseUrl,
}: VerificationUrlParams) => {
  const origin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "http://localhost";
  const fallbackUrl = new URL("/verification-attestation", origin);

  let targetUrl = fallbackUrl;
  if (baseUrl && baseUrl.trim()) {
    try {
      targetUrl = new URL(baseUrl, origin);
    } catch {
      targetUrl = fallbackUrl;
    }
  }

  const ref = cleanText(reference || "");
  const control = cleanText(control_number || "");
  const hash = cleanText(hash_sha256 || "");

  if (ref) targetUrl.searchParams.set("ref", ref);
  if (control) targetUrl.searchParams.set("control", control);
  if (hash) targetUrl.searchParams.set("hash", hash);

  return targetUrl.toString();
};

const fetchLatestAttestationForLot = async (
  lotId: string,
  attestationHasDeletedAt: boolean | null,
  setAttestationHasDeletedAt: (value: boolean | null) => void,
  options?: { includeArchived?: boolean; select?: string },
) => {
  const select = options?.select || "*, foncier_attestation_temoins(*)";
  const includeArchived = options?.includeArchived ?? false;

  const runQuery = (supportsDeletedAt: boolean) =>
    withBackoff(() => {
      let query = supabase
        .from("foncier_attestations")
        .select(select)
        .eq("lot_id", lotId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (!includeArchived && supportsDeletedAt) {
        query = query.is("deleted_at", null);
      }
      return query.maybeSingle();
    });

  const supportsDeletedAt = attestationHasDeletedAt !== false;
  let result = await runQuery(supportsDeletedAt);

  if (result.error && isMissingColumnError(result.error, "deleted_at")) {
    setAttestationHasDeletedAt(false);
    result = await runQuery(false);
  } else if (
    !result.error &&
    supportsDeletedAt &&
    attestationHasDeletedAt === null
  ) {
    setAttestationHasDeletedAt(true);
  }

  return result;
};

const buildQrDataUrl = async (payload: string) => {
  const size = payload.length;
  const errorCorrectionLevel = size > 800 ? "M" : "H";
  const width = size > 800 ? 280 : 240;
  const margin = size > 800 ? 2 : 1;
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(payload, { errorCorrectionLevel, width, margin });
};

const signAttestationPayload = async (
  attestationId: string,
  payload: Record<string, unknown>,
) => {
  try {
    const { data, error } = await withBackoff(() =>
      supabase.functions.invoke("attestation-sign", {
        body: {
          attestation_id: attestationId,
          payload: JSON.stringify(payload),
        },
      }),
    );
    if (error) return "";
    return (data as { signature?: string })?.signature || "";
  } catch {
    return "";
  }
};
import { logFoncierAudit } from "../lib/foncierAudit";
import {
  createEmptyForm,
} from "../components/foncier/FoncierConstants";
import { withBackoff } from "./useFoncierSync";
import {
  upsertCachedLot,
  addQueueItem,
  OFFLINE_STORAGE_FULL,
} from "../lib/foncierOffline";

/**
 * Hook pour la logique métier foncier (CRUD opérations)
 */
export function useFoncierLogic(
  deviceId: string,
  profile?: any,
  attestationHasDeletedAt?: boolean | null,
  setAttestationHasDeletedAt?: (value: boolean | null) => void,
) {
  // ============ VALIDATE & SAVE LOT ============
  const saveLot = useCallback(
    async (
      form: any,
      editingId: string | null,
      lots: FoncierLot[],
      isOnline: boolean,
    ) => {
      // 1. Validation
      const validation = validateFoncierForm(form);
      if (!validation.success && validation.errors) {
        const firstError = Object.values(validation.errors)[0];
        return { success: false, error: firstError };
      }

      const parsed = validation.parsedData;
      if (!parsed) {
        return {
          success: false,
          error: "Validation impossible. Veuillez vérifier les champs.",
        };
      }

      // 2. Validation village
      const villageValue = form.village.trim();
      if (villageValue.length < 2 || villageValue.length > 100) {
        return {
          success: false,
          error:
            "Le nom du village doit contenir entre 2 et 100 caractères.",
        };
      }

      // 3. Préparer valeurs
      const superficieValue = Number(parsed.superficie || 0);
      const prixValue = Number(parsed.prix_cession || 0);
      const naissanceDate = parsed.proprietaire_naissance_date || "";
      const cniDate = parsed.proprietaire_cni_date || "";
      const arreteDate = parsed.arrete_date || "";

      // 4. Vérifier doublons localement
      const duplicateLocal = lots.find(
        (lot) =>
          lot.village === form.village &&
          lot.nom_lotissement === form.nom_lotissement &&
          lot.numero_ilot === form.numero_ilot &&
          lot.numero_lot === form.numero_lot &&
          lot.id !== editingId,
      );
      if (duplicateLocal) {
        return {
          success: false,
          error: `Un lot existe déjà avec ces caractéristiques : ${duplicateLocal.reference}.`,
        };
      }

      // 5. Vérifier doublons en ligne
      if (isOnline) {
        const { data: existingLot } = await withBackoff(
          () =>
            supabase
              .from("foncier_lots")
              .select("id, reference")
              .eq("village", form.village)
              .eq("nom_lotissement", form.nom_lotissement)
              .eq("numero_ilot", form.numero_ilot)
              .eq("numero_lot", form.numero_lot)
              .neq("id", editingId || "00000000-0000-0000-0000-000000000000")
              .is("deleted_at", null)
              .maybeSingle(),
        );

        if (existingLot) {
          return {
            success: false,
            error: `Un lot existe déjà avec ces caractéristiques : ${existingLot.reference}.`,
          };
        }
      }

      // 6. Créer/mettre à jour le payload
      const nowIso = new Date().toISOString();
      const dateCession = form.date_cession || getLocalDateInput();
      const lotId = editingId || generateUUID();
      const existing = lots.find((lot) => lot.id === editingId);

      // 7. Générer ou régénérer référence
      let ref = form.reference?.trim() || generateFoncierReference();
      if (
        editingId &&
        existing &&
        (existing.village !== form.village ||
          existing.nom_lotissement !== form.nom_lotissement ||
          existing.numero_ilot !== form.numero_ilot ||
          existing.numero_lot !== form.numero_lot)
      ) {
        ref = generateFoncierReference();
      }

      if (isOnline) {
        const { data: refExists } = await withBackoff(() =>
          supabase
            .from("foncier_lots")
            .select("id")
            .eq("reference", ref)
            .neq("id", editingId || "00000000-0000-0000-0000-000000000000")
            .maybeSingle(),
        );

        if (refExists) {
          const newRef = generateFoncierReference();
          return {
            success: false,
            error:
              "Référence déjà utilisée. Une nouvelle référence a été générée, veuillez réessayer.",
            newRef,
          };
        }
      }

      // 8. Construire payload
      const payload = {
        id: lotId,
        reference: ref,
        numero_lot: cleanText(form.numero_lot),
        numero_ilot: cleanText(form.numero_ilot),
        nom_lotissement: cleanText(form.nom_lotissement),
        quartier: cleanText(form.quartier),
        village: cleanText(form.village),
        commune: cleanText(form.commune),
        departement: cleanText(form.departement),
        region: cleanText(form.region),
        superficie: superficieValue,
        code_barre: "",
        proprietaire_nom: cleanText(form.proprietaire_nom),
        proprietaire_prenom: cleanText(form.proprietaire_prenom),
        proprietaire_naissance_date: cleanText(naissanceDate),
        proprietaire_naissance_lieu: cleanText(form.proprietaire_naissance_lieu),
        proprietaire_cni_numero: cleanText(form.proprietaire_cni_numero),
        proprietaire_cni_date: cleanText(cniDate),
        proprietaire_cni_lieu: cleanText(form.proprietaire_cni_lieu),
        proprietaire_profession: cleanText(form.proprietaire_profession),
        proprietaire_telephone: cleanText(form.proprietaire_telephone),
        chef_village: cleanText(form.chef_village),
        arrete_prefectoral: cleanText(form.arrete_prefectoral),
        arrete_date: cleanText(arreteDate),
        statut: form.statut,
        date_cession: dateCession,
        prix_cession: prixValue,
        notes: DOMPurify.sanitize(form.notes),
        client_updated_at: nowIso,
        last_modified_device_id: deviceId,
        updated_at: nowIso,
        created_at: existing?.created_at || nowIso,
        deleted_at: existing?.deleted_at || null,
        row_version: existing?.row_version ?? 1,
        retention_until: existing?.retention_until ?? null,
      };

      // 9. Sauvegarder hors-ligne ou en ligne
      if (!isOnline) {
        try {
          await upsertCachedLot(payload as FoncierLot);
          await addQueueItem({
            id: generateUUID(),
            op: "upsert_lot",
            payload,
            client_updated_at: nowIso,
          });
          return {
            success: true,
            offline: true,
            message: "Lot enregistré hors-ligne.",
          };
        } catch (err: any) {
          if (err?.code === OFFLINE_STORAGE_FULL) {
            return {
              success: false,
              error: "Stockage local plein. Libérez de l'espace puis réessayez.",
            };
          }
          return {
            success: false,
            error: "Impossible de sauvegarder hors-ligne.",
          };
        }
      }

      // 10. Insertion/mise à jour en ligne
      let data: FoncierLot | null = null;
      let dbError: string | null = null;

      if (editingId) {
        const result = await withBackoff(() =>
          supabase
            .from("foncier_lots")
            .update(payload)
            .eq("id", editingId)
            .eq("row_version", existing?.row_version ?? 1)
            .select("*")
            .single(),
        );
        data = result.data as FoncierLot | null;
        dbError = result.error?.message || null;
      } else {
        const result = await withBackoff(() =>
          supabase.from("foncier_lots").insert(payload).select("*").single(),
        );
        data = result.data as FoncierLot | null;
        dbError = result.error?.message || null;
      }

      if (dbError) {
        return {
          success: false,
          error: `Erreur: ${dbError}`,
        };
      }

      if (editingId && !data) {
        return {
          success: false,
          error:
            "Conflit de version détecté. Rafraîchissez la liste et réessayez.",
        };
      }

      if (data) {
        await upsertCachedLot(data as FoncierLot);
      }

      return {
        success: true,
        data,
        message: editingId ? "Lot modifié." : "Lot créé.",
      };
    },
    [deviceId],
  );

  // ============ ARCHIVE LOT ============
  const archiveLot = useCallback(
    async (lot: FoncierLot, isOnline: boolean) => {
      const nowIso = new Date().toISOString();

      if (!isOnline) {
        try {
          const payload = {
            ...lot,
            deleted_at: nowIso,
            deleted_reason: "archivage",
            client_updated_at: nowIso,
          };
          await upsertCachedLot(payload as FoncierLot);
          await addQueueItem({
            id: generateUUID(),
            op: "soft_delete_lot",
            payload: { id: lot.id, deleted_reason: "archivage" },
            client_updated_at: nowIso,
          });
          return {
            success: true,
            message: "Lot archivé hors-ligne.",
            offline: true,
          };
        } catch (err: any) {
          return {
            success: false,
            error: "Archivage hors-ligne impossible.",
          };
        }
      }

      const { error } = await withBackoff(() =>
        supabase.rpc("soft_delete_foncier_lot", {
          p_lot_id: lot.id,
          p_reason: "archivage",
        }),
      );

      if (error) {
        return {
          success: false,
          error: "Archivage impossible. Vérifiez vos droits ou réessayez.",
        };
      }

      return { success: true, message: "Lot archivé." };
    },
    [],
  );

  // ============ RESTORE LOT ============
  const restoreLot = useCallback(
    async (lot: FoncierLot, isOnline: boolean) => {
      const nowIso = new Date().toISOString();

      if (!isOnline) {
        try {
          const payload = {
            ...lot,
            deleted_at: null,
            deleted_reason: null,
            client_updated_at: nowIso,
          };
          await upsertCachedLot(payload as FoncierLot);
          await addQueueItem({
            id: generateUUID(),
            op: "restore_lot",
            payload: { id: lot.id },
            client_updated_at: nowIso,
          });
          return {
            success: true,
            message: "Lot restauré hors-ligne.",
            offline: true,
          };
        } catch (err: any) {
          return {
            success: false,
            error: "Restauration hors-ligne impossible.",
          };
        }
      }

      const { error } = await withBackoff(() =>
        supabase.rpc("restore_foncier_lot", { p_lot_id: lot.id }),
      );

      if (error) {
        return {
          success: false,
          error:
            "Restauration impossible. Vérifiez vos droits ou réessayez.",
        };
      }

      return { success: true, message: "Lot restauré." };
    },
    [],
  );

  // ============ ATTESTATION FUNCTIONS ============

  const buildAttestationPrintData = useCallback((
    attestationData: {
      reference: string;
      numero_enregistrement?: string | null;
      date_etablissement?: string | null;
      original: boolean;
      statut?: string | null;
      mode_acquisition?: string | null;
      historique_possession?: string | null;
      domicile?: string | null;
      limites_nord?: string | null;
      limites_sud?: string | null;
      limites_est?: string | null;
      limites_ouest?: string | null;
      gps_lat?: number | null;
      gps_lng?: number | null;
      gps_precision?: number | null;
      gps_points?: Record<string, unknown> | null;
      registre_volume?: string | null;
      registre_page?: number | null;
      registre_ligne?: number | null;
      control_number?: string | null;
      qr_payload?: string | null;
      hash_sha256?: string | null;
      validation_agent_nom?: string | null;
      validation_chef_nom?: string | null;
      type?: string | null;
      cedant_nom?: string | null;
      cedant_prenom?: string | null;
      cedant_cni_numero?: string | null;
      cedant_telephone?: string | null;
      cedant_domicile?: string | null;
      chef_empreinte_url?: string | null;
      signatureUrl?: string | null;
      cachetUrl?: string | null;
    },
    lot: FoncierLot,
    config: FoncierConfigMap,
    form: AttestationForm,
    qrDataUrl?: string,
    gpsPointsResult?: Array<{ label: string; lat: number; lng: number }> | null,
    verificationUrl?: string,
  ) => {
    const gpsLat = form.gps_lat ? parseFloat(form.gps_lat) : null;
    const gpsLng = form.gps_lng ? parseFloat(form.gps_lng) : null;
    const gpsPrecision = form.gps_precision
      ? parseFloat(form.gps_precision)
      : null;
    const isCession = attestationData.type === "cession";
    const registrePage = form.registre_page
      ? parseInt(form.registre_page, 10)
      : null;
    const registreLigne = form.registre_ligne
      ? parseInt(form.registre_ligne, 10)
      : null;

    return {
      reference: attestationData.reference,
      numero_enregistrement:
        attestationData.numero_enregistrement || attestationData.reference,
      date_etablissement: formatDateLong(
        attestationData.date_etablissement || getLocalDateInput(),
      ),
      original: attestationData.original,
      draft: attestationData.statut !== "valide",
      region: config.region || lot.region || "REGION",
      departement: config.departement || lot.departement || "DEPARTEMENT",
      commune: config.commune || lot.commune || "COMMUNE",
      village: config.village || lot.village || "VILLAGE",
      quartier: lot.quartier || "",
      lotissement: lot.nom_lotissement || "",
      numero_lot: lot.numero_lot || "",
      superficie_m2: lot.superficie || 0,
      limites: {
        nord: form.limites_nord || "",
        sud: form.limites_sud || "",
        est: form.limites_est || "",
        ouest: form.limites_ouest || "",
      },
      coordonnees_gps:
        gpsLat != null && gpsLng != null
          ? { lat: gpsLat, lng: gpsLng, precision: gpsPrecision ?? undefined }
          : undefined,
      gps_points: gpsPointsResult || undefined,
      mode_acquisition: form.mode_acquisition || "",
      historique_possession: form.historique_possession || "",
      proprietaire_nom: lot.proprietaire_nom || "",
      proprietaire_prenom: lot.proprietaire_prenom || "",
      proprietaire_naissance_date: lot.proprietaire_naissance_date || "",
      proprietaire_naissance_lieu: lot.proprietaire_naissance_lieu || "",
      proprietaire_domicile: form.domicile || "",
      proprietaire_profession: lot.proprietaire_profession || "",
      proprietaire_cni_numero: lot.proprietaire_cni_numero || "",
      proprietaire_cni_date: lot.proprietaire_cni_date || "",
      proprietaire_cni_lieu: lot.proprietaire_cni_lieu || "",
      proprietaire_telephone: lot.proprietaire_telephone || "",
      cedant_nom: isCession ? form.cedant_nom || "" : "",
      cedant_prenom: isCession ? form.cedant_prenom || "" : "",
      cedant_cni_numero: isCession ? form.cedant_cni_numero || "" : "",
      cedant_telephone: isCession ? form.cedant_telephone || "" : "",
      cedant_domicile: isCession ? form.cedant_domicile || "" : "",
      temoins: (form.temoins || []).map((t) => ({
        nom: t.nom || "",
        prenom: t.prenom || "",
        profession: t.profession || "",
        telephone: t.telephone || "",
        cni: t.cni || "",
      })),
      chef_village: config.chef_village || lot.chef_village || "",
      lieu_signature: config.lieu_signature || lot.village || "",
      registre_volume: form.registre_volume || "",
      registre_page: isNaN(registrePage as number) ? null : registrePage,
      registre_ligne: isNaN(registreLigne as number) ? null : registreLigne,
      control_number: attestationData.control_number || "",
      verification_url:
        verificationUrl ||
        buildAttestationVerificationUrl({
          reference: attestationData.reference,
          control_number: attestationData.control_number || "",
          hash_sha256: attestationData.hash_sha256 || "",
        }),
      qrDataUrl,
      hash_sha256: attestationData.hash_sha256 || "",
      validation_agent_nom:
        attestationData.validation_agent_nom || form.validation_agent_nom || "",
      validation_chef_nom:
        attestationData.validation_chef_nom ||
        form.validation_chef_nom ||
        config.chef_village ||
        "",
      logoUrl: config.logo_url || "",
      village_logo_url: config.village_logo_url || "",
      signatureUrl: attestationData.signatureUrl || "",
      cachetUrl:
        attestationData.cachetUrl || attestationData.chef_empreinte_url || "",
      chef_nom: config.chef_village || lot.chef_village || "",
      attestation_type: attestationData.type || "standard",
      statut: attestationData.statut || "soumis",
      lot_statut: lot.statut,
      date_cession: isCession ? lot.date_cession || "" : "",
      prix_cession: isCession ? lot.prix_cession : undefined,
    };
  }, []);

  const validateAttestationPrerequisites = useCallback(async (
    lot: FoncierLot,
    form: AttestationForm,
    isOnline: boolean,
    configVillage: string,
    ensureConfigLoaded: (village: string) => Promise<FoncierConfigMap>,
  ) => {
    const config = await ensureConfigLoaded(lot.village || configVillage);
    const attestationValidation = validateAttestationForm(form);
    if (!attestationValidation.success && attestationValidation.errors) {
      const firstError = Object.values(attestationValidation.errors)[0];
      return { success: false, error: firstError, config };
    }

    const parsedAttestation = attestationValidation.parsedData;
    if (!parsedAttestation) {
      return {
        success: false,
        error: "Validation de l'attestation impossible.",
        config,
      };
    }

    const attestationType =
      form.attestation_type === "cession" ? "cession" : "standard";
    const isCessionAttestation = attestationType === "cession";

    if (isCessionAttestation && !isOnline) {
      return {
        success: false,
        error: "Connexion requise pour réémettre une attestation de cession.",
        config,
      };
    }

    // Validation OBLIGATOIRE pour les cessions
    if (isCessionAttestation) {
      const cedantNom = cleanText(form.cedant_nom || "");
      const cedantPrenom = cleanText(form.cedant_prenom || "");
      const cedantCni = cleanText(form.cedant_cni_numero || "");
      if (!cedantNom || !cedantPrenom) {
        return {
          success: false,
          error: "Pour une cession, les nom et prénoms du cédant sont requis.",
          config,
        };
      }
      if (!cedantCni) {
        return {
          success: false,
          error: "Pour une cession, la CNI du cédant est requise.",
          config,
        };
      }
    }

    if (!isOnline) {
      return {
        success: false,
        error:
          "Connexion requise : la référence officielle, le numéro de contrôle et le hash sont générés côté serveur dans une transaction sécurisée.",
        config,
      };
    }

    // Validation des champs numériques du registre
    const registrePage = parseNumberInput(form.registre_page);
    const registreLigne = parseNumberInput(form.registre_ligne);

    if (form.registre_page.trim() && registrePage === null) {
      return {
        success: false,
        error: "La page du registre est invalide.",
        config,
      };
    }
    if (form.registre_ligne.trim() && registreLigne === null) {
      return {
        success: false,
        error: "La ligne du registre est invalide.",
        config,
      };
    }

    return {
      success: true,
      config,
      parsedAttestation,
      attestationType,
      isCessionAttestation,
      registrePage,
      registreLigne,
    };
  }, []);

  const createAttestationRecord = useCallback(async (
    lot: FoncierLot,
    parsedAttestation: any,
    config: FoncierConfigMap,
    attestationType: string,
    isCessionAttestation: boolean,
    attestationForm: AttestationForm,
  ) => {
    let baseAttestation: Pick<
      FoncierAttestation,
      | "id"
      | "reference"
      | "version"
      | "numero_enregistrement"
      | "control_number"
      | "statut"
    > | null = null;

    if (isCessionAttestation) {
      const { data, error } = await fetchLatestAttestationForLot(lot.id, attestationHasDeletedAt ?? null, setAttestationHasDeletedAt ?? (() => {}), {
        includeArchived: false,
        select:
          "id, reference, version, numero_enregistrement, control_number, statut",
      });
      if (error) {
        return {
          success: false,
          error: "Impossible de charger l'attestation précédente.",
        };
      }
      if (!data) {
        return {
          success: false,
          error: "Aucune attestation active à réémettre pour cette cession.",
        };
      }
      baseAttestation = data as Pick<
        FoncierAttestation,
        | "id"
        | "reference"
        | "version"
        | "numero_enregistrement"
        | "control_number"
        | "statut"
      >;
    }

    const signatureNonce = generateUUID();
    const signatureIssuedAt = new Date().toISOString();
    const agentName = cleanText(
      attestationForm.validation_agent_nom || profile?.full_name || "",
    );
    const chefName = cleanText(
      attestationForm.validation_chef_nom ||
        config.nom_chef_signe ||
        config.chef_village ||
        "",
    );

    const attestationPayload = buildAttestationRpcParams({
      attestationForm: parsedAttestation,
      attestationLot: lot,
      signatureNonce,
      signatureIssuedAt,
      deviceId,
      baseAttestationId: baseAttestation?.id ?? null,
      isCession: isCessionAttestation,
    });

    const { data: attestationRows, error: attestationError } =
      await withBackoff(() =>
        supabase.rpc("create_foncier_attestation_atomic", attestationPayload),
      );

    const createdAttestation = (
      Array.isArray(attestationRows) ? attestationRows[0] : attestationRows
    ) as Pick<
      FoncierAttestation,
      | "id"
      | "lot_id"
      | "reference"
      | "version"
      | "numero_enregistrement"
      | "qr_payload"
      | "hash_sha256"
      | "control_number"
      | "statut"
      | "date_etablissement"
      | "created_at"
    > | null;

    if (attestationError || !createdAttestation) {
      if (import.meta.env.DEV)
        console.error("❌ Attestation atomic creation failed", {
          error: attestationError,
          message: attestationError?.message,
          details: attestationError?.details,
          hint: attestationError?.hint,
          code: attestationError?.code,
        });
      return {
        success: false,
        error:
          attestationError?.message || "Création de l'attestation impossible.",
      };
    }

    // Audit logs pour création
    await withBackoff(() =>
      logFoncierAudit(supabase, {
        lotId: lot.id,
        action: "SOUMISSION_CHEF",
        details: {
          attestation_id: createdAttestation.id,
          reference: createdAttestation.reference,
        },
      }),
    );

    if (isCessionAttestation && baseAttestation) {
      await withBackoff(() =>
        logFoncierAudit(supabase, {
          lotId: lot.id,
          action: "ARCHIVAGE_ATTESTATION",
          details: {
            attestation_id: baseAttestation.id,
            reference: baseAttestation.reference,
          },
        }),
      );

      await withBackoff(() =>
        logFoncierAudit(supabase, {
          lotId: lot.id,
          action: "REEMISSION_CESSION",
          details: {
            attestation_id: createdAttestation.id,
            reference: createdAttestation.reference,
            archived_attestation_id: baseAttestation.id,
          },
        }),
      );
    }

    return {
      success: true,
      createdAttestation,
      baseAttestation,
      agentName,
      chefName,
      attestationType,
    };
  }, [deviceId, profile]);

  const signAndGenerateQr = useCallback(async (createdAttestation: any) => {
    const qrVerificationUrl = buildAttestationVerificationUrl({
      reference: createdAttestation.reference,
      control_number: createdAttestation.control_number || "",
      hash_sha256: createdAttestation.hash_sha256 || "",
    });
    const qrDataUrl = await buildQrDataUrl(qrVerificationUrl);

    let finalStatus = createdAttestation.statut || "soumis";
    const payloadToSign =
      parseAttestationSnapshot(createdAttestation.qr_payload) || {};

    try {
      const signature = await signAttestationPayload(
        createdAttestation.id,
        payloadToSign,
      );
      if (signature) {
        finalStatus = "valide";
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn("⚠️ Signature error:", error);
    }

    return {
      qrDataUrl,
      qrVerificationUrl,
      finalStatus,
      payloadToSign,
    };
  }, []);

  const printAndAuditAttestation = useCallback(async (
    createdAttestation: any,
    lot: FoncierLot,
    config: FoncierConfigMap,
    form: AttestationForm,
    qrDataUrl: string,
    qrVerificationUrl: string,
    finalStatus: string,
    attestationType: string,
    agentName: string,
    chefName: string,
    refreshQueueCount: () => void,
    setPageNotice: (notice: string) => void,
  ) => {
    const onlinePrintData = buildAttestationPrintData(
      {
        ...createdAttestation,
        original: form.original,
        statut: finalStatus,
        type: attestationType,
        validation_agent_nom: agentName,
        validation_chef_nom: chefName,
      },
      lot,
      config,
      form,
      qrDataUrl,
      undefined, // gpsPointsResult
      qrVerificationUrl,
    );

    printAttestationCoutumiere(onlinePrintData);

    // Attempt to attach metadata to DB via RPC (background script may also do this)
    try {
      const pdfMeta = {
        attestation_id: createdAttestation.id,
        pdf_path: undefined,
        hash_sha256: createdAttestation.hash_sha256 || undefined,
        verify_url: undefined,
        printed_by: profile?.id || null,
      };
      // Call client-side RPC (requires service role; best-effort)
      await withBackoff(() =>
        supabase.rpc("attach_foncier_attestation_pdf_metadata", {
          p_attestation_id: pdfMeta.attestation_id,
          p_hash_sha256: pdfMeta.hash_sha256,
          p_verify_url: pdfMeta.verify_url,
          p_pdf_path: pdfMeta.pdf_path,
          p_pdf_generated_at: new Date().toISOString(),
          p_printed_by: pdfMeta.printed_by,
        }),
      );
    } catch {
      // ignore — server script will reconcile metadata if RPC not available
    }

    const { error: printAuditError } = await withBackoff(() =>
      logFoncierAudit(supabase, {
        lotId: lot.id,
        action: "IMPRESSION",
        details: {
          attestation_id: createdAttestation.id,
          reference: createdAttestation.reference,
        },
      }),
    );

    if (printAuditError) {
      try {
        await addQueueItem({
          id: generateUUID(),
          op: "audit_log",
          payload: {
            lot_id: lot.id,
            action: "IMPRESSION",
            details: {
              attestation_id: createdAttestation.id,
              reference: createdAttestation.reference,
            },
          },
          client_updated_at: new Date().toISOString(),
        });
        await refreshQueueCount();
        setPageNotice(
          "Impression OK. Journalisation en attente de synchronisation.",
        );
      } catch {
        setPageNotice("Impression OK, mais journalisation impossible.");
      }
    }
  }, [profile]);

  const handleGenerateAttestation = useCallback(async (
    attestationLot: FoncierLot | null,
    attestationForm: AttestationForm,
    isOnline: boolean,
    configVillage: string,
    ensureConfigLoaded: (village: string) => Promise<FoncierConfigMap>,
    setAttestationError: (error: string | null) => void,
    setAttestationSaving: (saving: boolean) => void,
    setAttestationModalOpen: (open: boolean) => void,
    setAttestationLot: (lot: FoncierLot | null) => void,
    refreshQueueCount: () => void,
    setPageNotice: (notice: string) => void,
  ) => {
    if (!attestationLot) return;
    setAttestationError(null);

    // PHASE 1 - Étape 1: Validation des prérequis
    const validationResult = await validateAttestationPrerequisites(
      attestationLot,
      attestationForm,
      isOnline,
      configVillage,
      ensureConfigLoaded,
    );
    if (!validationResult.success) {
      setAttestationError(validationResult.error || "Erreur de validation inconnue");
      return;
    }

    const { config, parsedAttestation, attestationType, isCessionAttestation } =
      validationResult;

    setAttestationSaving(true);

    try {
      // PHASE 1 - Étape 2: Création de l'enregistrement
      const creationResult = await createAttestationRecord(
        attestationLot,
        parsedAttestation,
        config,
        attestationType!,
        isCessionAttestation!,
        attestationForm,
      );

      if (!creationResult.success) {
        setAttestationSaving(false);
        setAttestationError(creationResult.error || "Erreur de création inconnue");
        return;
      }

      const { createdAttestation, agentName, chefName } = creationResult;

      // PHASE 1 - Étape 3: Signature et génération QR
      const qrResult = await signAndGenerateQr(createdAttestation);

      // PHASE 1 - Étape 4: Impression et audit
      await printAndAuditAttestation(
        createdAttestation,
        attestationLot,
        config,
        attestationForm,
        qrResult.qrDataUrl,
        qrResult.qrVerificationUrl,
        qrResult.finalStatus,
        attestationType!,
        agentName!,
        chefName!,
        refreshQueueCount,
        setPageNotice,
      );

      // Nettoyage final
      setAttestationSaving(false);
      setAttestationModalOpen(false);
      setAttestationLot(null);
    } catch (error) {
      setAttestationSaving(false);
      setAttestationError(
        "Une erreur inattendue s'est produite lors de la génération de l'attestation.",
      );
      if (import.meta.env.DEV)
        console.error("Attestation generation error:", error);
    }
  }, [deviceId, profile]);

  return {
    saveLot,
    archiveLot,
    restoreLot,
    createEmptyForm,
    handleGenerateAttestation,
    buildAttestationPrintData,
  };
}
