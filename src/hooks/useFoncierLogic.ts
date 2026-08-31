import { useCallback } from "react";
import DOMPurify from "dompurify";
import { dataService } from "../lib/dbClient.service";
import type { FoncierLot } from "../types";
import { useFoncierAttestationWorkflow } from "./useFoncierAttestationWorkflow";
import { cleanText, generateFoncierReference, generateUUID } from "../utils/reference";
import {
  addQueueItem,
  getCachedLots,
  OFFLINE_STORAGE_FULL,
  upsertCachedLot,
} from "../lib/foncierOffline";
import { createEmptyForm as buildEmptyFoncierForm } from "../components/foncier/FoncierConstants";
import { validateFoncierForm } from "../lib/foncierValidation";

type LotForm = ReturnType<typeof buildEmptyFoncierForm>;

type SaveLotResult =
  | {
      success: true;
      data?: FoncierLot | null;
      offline?: boolean;
      message: string;
    }
  | {
      success: false;
      error: string;
      newRef?: string;
    };

const normalizeField = (value: string | null | undefined) => cleanText(value || "");

const sameLotKey = (lot: FoncierLot, input: {
  village: string;
  nom_lotissement: string;
  numero_ilot: string;
  numero_lot: string;
}) =>
  normalizeField(lot.village) === input.village &&
  normalizeField(lot.nom_lotissement) === input.nom_lotissement &&
  normalizeField(lot.numero_ilot) === input.numero_ilot &&
  normalizeField(lot.numero_lot) === input.numero_lot;

export function useFoncierLogic(
  deviceId: string,
  _profile?: { id?: string | null; full_name?: string | null } | null,
) {
  const workflowState = useFoncierAttestationWorkflow();

  const saveLot = useCallback(
    async (
      form: LotForm,
      editingId: string | null,
      lots: FoncierLot[],
      isOnline: boolean,
    ): Promise<SaveLotResult> => {
      const validation = validateFoncierForm(form);
      if (!validation.success || !validation.parsedData) {
        const errorEntries = validation.errors
          ? Object.entries(validation.errors)
          : [["general", "Validation impossible. Veuillez vérifier les champs."]];
        const [fieldName, errorMsg] = errorEntries[0];
        const fieldLabel = fieldName
          .replace(/_/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase());
        const fullError = errorMsg.includes("›")
          ? errorMsg
          : `${fieldLabel}: ${errorMsg}`;
        return { success: false, error: fullError };
      }

      const parsed = validation.parsedData;
      const normalizedVillage = normalizeField(form.village);
      const normalizedLotissement = normalizeField(form.nom_lotissement);
      const normalizedIlot = normalizeField(form.numero_ilot);
      const normalizedNumeroLot = normalizeField(form.numero_lot);

      if (normalizedVillage.length < 2 || normalizedVillage.length > 100) {
        return {
          success: false,
          error: "Le nom du village doit contenir entre 2 et 100 caractères.",
        };
      }

      const sourceLots = isOnline ? lots : await getCachedLots();
      const editableLots = sourceLots.filter(
        (lot) => !lot.deleted_at && lot.statut !== "annule",
      );

      const duplicateLocal = editableLots.find(
        (lot) =>
          sameLotKey(lot, {
            village: normalizedVillage,
            nom_lotissement: normalizedLotissement,
            numero_ilot: normalizedIlot,
            numero_lot: normalizedNumeroLot,
          }) &&
          lot.id !== editingId,
      );

      if (duplicateLocal) {
        return {
          success: false,
          error: `Un lot existe déjà avec ces caractéristiques : ${duplicateLocal.reference}.`,
        };
      }

      if (isOnline) {
        const { data: duplicateData, error: duplicateError } =
          await dataService.checkLotDuplicate({
            village: normalizedVillage,
            lotissement: normalizedLotissement,
            ilot: normalizedIlot,
            lot: normalizedNumeroLot,
            exclude_lot_id: editingId,
          });

        if (duplicateError) {
          return {
            success: false,
            error: "Erreur lors de la vérification des doublons.",
          };
        }

        const duplicateRows = (duplicateData || []) as Array<Pick<FoncierLot, "reference">>;
        if (duplicateRows.length > 0) {
          return {
            success: false,
            error: `Un lot existe déjà avec ces caractéristiques : ${duplicateRows[0].reference}.`,
          };
        }
      }

      const existingLot = sourceLots.find((lot) => lot.id === editingId);
      let reference = normalizeField(form.reference) || generateFoncierReference();
      if (
        editingId &&
        existingLot &&
        !sameLotKey(existingLot, {
          village: normalizedVillage,
          nom_lotissement: normalizedLotissement,
          numero_ilot: normalizedIlot,
          numero_lot: normalizedNumeroLot,
        })
      ) {
        reference = generateFoncierReference();
      }

      if (isOnline) {
        const { data: refExists, error: refError } =
          await dataService.checkLotReferenceExists(
            reference,
            editingId || undefined,
          );

        if (refError) {
          return {
            success: false,
            error: "Erreur lors de la vérification de la référence.",
          };
        }

        if (refExists) {
          return {
            success: false,
            error:
              "Référence déjà utilisée. Une nouvelle référence a été générée, veuillez réessayer.",
            newRef: generateFoncierReference(),
          };
        }
      }

      const nowIso = new Date().toISOString();
      const rawDateCession = normalizeField(form.date_cession);
      const rawPrix = normalizeField(form.prix_cession);
      const lotId = editingId || generateUUID();
      const superficieValue = Number(parsed.superficie || 0);
      const prixValue =
        rawPrix.length > 0 ? Number(parsed.prix_cession ?? 0) : undefined;

      const payload = {
        id: lotId,
        reference,
        numero_lot: normalizedNumeroLot,
        numero_ilot: normalizedIlot,
        nom_lotissement: normalizedLotissement,
        quartier: normalizeField(form.quartier),
        village: normalizedVillage,
        commune: normalizeField(form.commune),
        departement: normalizeField(form.departement),
        region: normalizeField(form.region),
        superficie: superficieValue,
        code_barre: normalizeField(form.code_barre),
        proprietaire_nom: normalizeField(form.proprietaire_nom),
        proprietaire_prenom: normalizeField(form.proprietaire_prenom),
        proprietaire_naissance_date: parsed.proprietaire_naissance_date || undefined,
        proprietaire_naissance_lieu: normalizeField(form.proprietaire_naissance_lieu),
        proprietaire_cni_numero: normalizeField(form.proprietaire_cni_numero),
        proprietaire_cni_date: parsed.proprietaire_cni_date || undefined,
        proprietaire_cni_lieu: normalizeField(form.proprietaire_cni_lieu),
        proprietaire_profession: normalizeField(form.proprietaire_profession),
        proprietaire_telephone: normalizeField(form.proprietaire_telephone),
        chef_village: normalizeField(form.chef_village),
        arrete_prefectoral: normalizeField(form.arrete_prefectoral),
        arrete_date: parsed.arrete_date || undefined,
        statut: parsed.statut,
        publier_sur_vitrine: Boolean(form.publier_sur_vitrine),
        date_cession: rawDateCession || undefined,
        prix_cession: prixValue,
        notes: DOMPurify.sanitize(form.notes || ""),
        client_updated_at: nowIso,
        last_modified_device_id: deviceId,
        updated_at: nowIso,
        created_at: existingLot?.created_at || nowIso,
        deleted_at: existingLot?.deleted_at ?? null,
        deleted_by: existingLot?.deleted_by ?? null,
        deleted_reason: existingLot?.deleted_reason ?? null,
        row_version: existingLot?.row_version ?? 1,
        retention_until: existingLot?.retention_until ?? null,
      } as FoncierLot;

      if (!isOnline) {
        try {
          await upsertCachedLot(payload);
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
        } catch (error: any) {
          if (error?.code === OFFLINE_STORAGE_FULL) {
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

      const { data, error: dbError } = await dataService.saveLot(
        payload,
        Boolean(editingId),
      );

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
        data: data as FoncierLot | null,
        message: editingId ? "Lot modifié." : "Lot créé.",
      };
    },
    [deviceId],
  );

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
        } catch {
          return {
            success: false,
            error: "Archivage hors-ligne impossible.",
          };
        }
      }

      const { error } = await dataService.softDeleteLot(lot.id);

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
        } catch {
          return {
            success: false,
            error: "Restauration hors-ligne impossible.",
          };
        }
      }

      const { error } = await dataService.restoreLot(lot.id);

      if (error) {
        return {
          success: false,
          error: "Restauration impossible. Vérifiez vos droits ou réessayez.",
        };
      }

      return { success: true, message: "Lot restauré." };
    },
    [],
  );

  return {
    ...workflowState,
    saveLot,
    archiveLot,
    restoreLot,
    createEmptyForm: buildEmptyFoncierForm,
  };
}
