import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  MapPin,
  Plus,
  RefreshCcw,
  Ruler,
  Save,
  Tag,
  Trash2,
} from "lucide-react";
import dbClient from '../lib/dbClient.service';
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { OFFICIAL_CONTACT } from "../lib/officialContact";
import { formatMontant, generateReference, generateUUID } from "../utils/reference";
import type { VitrineLot } from "../types";
import MediaPicker from "../components/media/MediaPicker";

const LOTS_CACHE_KEY = "egs.catalogue_lots.local_cache.v1";

type LotSyncStatus = "synced" | "pending" | "deleted";

type LocalVitrineLot = VitrineLot & {
  sync_status: LotSyncStatus;
  sync_error?: string | null;
  deleted_at?: string | null;
};

type CatalogFormState = {
  reference: string;
  titre: string;
  description: string;
  village: string;
  quartier: string;
  commune: string;
  departement: string;
  region: string;
  superficie: string;
  prix_vente: string;
  statut: VitrineLot["statut"];
  documents: string;
  caracteristiques_text: string;
  image_url: string;
  image_alt: string;
  contact_phone: string;
  contact_email: string;
  publier_sur_vitrine: boolean;
  ordre_affichage: string;
  notes: string;
};

const emptyForm: CatalogFormState = {
  reference: generateReference("GS-LOT"),
  titre: "",
  description: "",
  village: "",
  quartier: "",
  commune: "",
  departement: "",
  region: "",
  superficie: "",
  prix_vente: "",
  statut: "disponible",
  documents: "",
  caracteristiques_text: "",
  image_url: "",
  image_alt: "",
  contact_phone: OFFICIAL_CONTACT.phone,
  contact_email: OFFICIAL_CONTACT.email,
  publier_sur_vitrine: true,
  ordre_affichage: "0",
  notes: "",
};

function parseLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function lotToForm(lot: VitrineLot): CatalogFormState {
  return {
    reference: lot.reference,
    titre: lot.titre,
    description: lot.description,
    village: lot.village,
    quartier: lot.quartier,
    commune: lot.commune,
    departement: lot.departement,
    region: lot.region,
    superficie: String(lot.superficie ?? ""),
    prix_vente: String(lot.prix_vente ?? ""),
    statut: lot.statut,
    documents: lot.documents,
    caracteristiques_text: (lot.caracteristiques || []).join("\n"),
    image_url: lot.image_url,
    image_alt: lot.image_alt,
    contact_phone: lot.contact_phone || OFFICIAL_CONTACT.phone,
    contact_email: lot.contact_email || OFFICIAL_CONTACT.email,
    publier_sur_vitrine: lot.publier_sur_vitrine,
    ordre_affichage: String(lot.ordre_affichage ?? 0),
    notes: lot.notes,
  };
}

function buildLocalLot(
  lot: VitrineLot,
  syncStatus: LotSyncStatus,
): LocalVitrineLot {
  return {
    ...lot,
    sync_status: syncStatus,
    sync_error: null,
    deleted_at: null,
  };
}

function sortLocalLots(lots: LocalVitrineLot[]): LocalVitrineLot[] {
  return [...lots].sort((a, b) => {
    if (a.ordre_affichage !== b.ordre_affichage) {
      return a.ordre_affichage - b.ordre_affichage;
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

function readCachedLots(): LocalVitrineLot[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOTS_CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is LocalVitrineLot =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as { id?: unknown }).id === "string",
      )
      .map((item) => ({
        ...item,
        sync_status:
          item.sync_status === "deleted"
            ? "deleted"
            : item.sync_status === "pending"
              ? "pending"
              : "synced",
        sync_error: item.sync_error ?? null,
        deleted_at: item.deleted_at ?? null,
      }));
  } catch {
    return [];
  }
}

function saveCachedLots(lots: LocalVitrineLot[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LOTS_CACHE_KEY, JSON.stringify(lots));
  } catch {
    // Ignore quota / privacy mode failures.
  }
}

function toRemotePayload(
  lot: LocalVitrineLot,
  userId: string | null,
): VitrineLot {
  return {
    id: lot.id,
    reference: lot.reference,
    titre: lot.titre,
    description: lot.description,
    village: lot.village,
    quartier: lot.quartier,
    commune: lot.commune,
    departement: lot.departement,
    region: lot.region,
    superficie: lot.superficie,
    prix_vente: lot.prix_vente,
    statut: lot.statut,
    documents: lot.documents,
    caracteristiques: lot.caracteristiques,
    image_url: lot.image_url,
    image_alt: lot.image_alt,
    contact_phone: lot.contact_phone,
    contact_email: lot.contact_email,
    publier_sur_vitrine: lot.publier_sur_vitrine,
    ordre_affichage: lot.ordre_affichage,
    notes: lot.notes,
    created_by: lot.created_by ?? userId,
    updated_by: userId ?? lot.updated_by ?? null,
    created_at: lot.created_at,
    updated_at: lot.updated_at,
  };
}

export default function CatalogueLots() {
  const { user, profile } = useAuth();
  const { showToast } = useNotifications();
  const [lots, setLots] = useState<LocalVitrineLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CatalogFormState>(emptyForm);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  const roleLabel = profile?.role || profile?.access_level || "—";

  const loadLots = async () => {
    setLoading(true);
    setError(null);

    const cachedLots = sortLocalLots(readCachedLots());
    if (cachedLots.length > 0) {
      setLots(cachedLots);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await dbClient
      .from("vitrine_lots")
      .select("*")
      .order("ordre_affichage", { ascending: true })
      .order("created_at");

    if (fetchError) {
      setError(fetchError.message);
      setLots([]);
      setLoading(false);
      return;
    }

    const seededLots = sortLocalLots(
      ((data as VitrineLot[]) || []).map((lot) => buildLocalLot(lot, "synced")),
    );
    setLots(seededLots);
    saveCachedLots(seededLots);
    setLoading(false);
  };

  useEffect(() => {
    void loadLots();
  }, []);

  const stats = useMemo(
    () => ({
      total: lots.filter((lot) => lot.sync_status !== "deleted").length,
      published: lots.filter(
        (lot) => lot.sync_status !== "deleted" && lot.publier_sur_vitrine,
      ).length,
      drafts: lots.filter(
        (lot) => lot.sync_status !== "deleted" && !lot.publier_sur_vitrine,
      ).length,
      available: lots.filter(
        (lot) => lot.sync_status !== "deleted" && lot.statut === "disponible",
      ).length,
      pendingSync: lots.filter((lot) => lot.sync_status !== "synced").length,
    }),
    [lots],
  );

  const visibleLots = useMemo(
    () => lots.filter((lot) => lot.sync_status !== "deleted"),
    [lots],
  );
  const pendingSyncCount = stats.pendingSync;

  const resetForm = () => {
    setEditingId(null);
    setFormVisible(false);
    setForm({
      ...emptyForm,
      reference: generateReference("GS-LOT"),
    });
    setShowImagePicker(false);
  };

  const handleEdit = (lot: LocalVitrineLot) => {
    setEditingId(lot.id);
    setForm(lotToForm(lot));
    setFormVisible(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyReference = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference);
      showToast("success", "Référence copiée", reference);
    } catch {
      showToast(
        "error",
        "Copie impossible",
        "Votre navigateur a bloqué la copie.",
      );
    }
  };

  const handleDelete = async (lot: LocalVitrineLot) => {
    const ok = window.confirm(
      `Supprimer le lot ${lot.reference} ? Cette action est irréversible.`,
    );
    if (!ok) return;

    const now = new Date().toISOString();
    const nextLots = lots
      .map((item) => {
        if (item.id !== lot.id) return item;

        if (item.sync_status === "pending") {
          return null;
        }

        return {
          ...item,
          sync_status: "deleted" as const,
          deleted_at: now,
          updated_at: now,
          sync_error: null,
        };
      })
      .filter(Boolean) as LocalVitrineLot[];

    setLots(sortLocalLots(nextLots));
    saveCachedLots(sortLocalLots(nextLots));
    showToast(
      "success",
      "Suppression locale",
      lot.sync_status === "pending"
        ? `${lot.reference} retiré de la liste locale.`
        : `${lot.reference} sera supprimé du serveur distant lors de la synchronisation.`,
    );
    if (editingId === lot.id) resetForm();
  };

  const handleImageSelect = (url: string) => {
    setForm((current) => ({
      ...current,
      image_url: url,
      image_alt: current.image_alt.trim() || current.titre.trim(),
    }));
    setShowImagePicker(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.reference.trim()) {
      showToast(
        "error",
        "Référence requise",
        "Générez ou saisissez une référence.",
      );
      return;
    }
    if (!form.titre.trim() || !form.village.trim()) {
      showToast(
        "error",
        "Champs requis",
        "Le titre et le village sont obligatoires.",
      );
      return;
    }
    if (!form.superficie.trim() || Number(form.superficie) <= 0) {
      showToast(
        "error",
        "Superficie requise",
        "Saisissez une superficie valide.",
      );
      return;
    }
    if (!form.prix_vente.trim() || Number(form.prix_vente) < 0) {
      showToast("error", "Prix requis", "Saisissez un prix de vente valide.");
      return;
    }

    setSaving(true);

    const now = new Date().toISOString();
    const existingLot = lots.find((lot) => lot.id === editingId);
    const localRecord: LocalVitrineLot = {
      ...(existingLot ?? {}),
      id: existingLot?.id ?? generateUUID(),
      reference: form.reference.trim(),
      titre: form.titre.trim(),
      description: form.description.trim(),
      village: form.village.trim(),
      quartier: form.quartier.trim(),
      commune: form.commune.trim(),
      departement: form.departement.trim(),
      region: form.region.trim(),
      superficie: Number(form.superficie),
      prix_vente: Number(form.prix_vente),
      statut: form.statut,
      documents: form.documents.trim(),
      caracteristiques: parseLines(form.caracteristiques_text),
      image_url: form.image_url.trim(),
      image_alt: form.image_alt.trim() || form.titre.trim(),
      contact_phone: form.contact_phone.trim() || OFFICIAL_CONTACT.phone,
      contact_email: form.contact_email.trim() || OFFICIAL_CONTACT.email,
      publier_sur_vitrine: form.publier_sur_vitrine,
      ordre_affichage: Number(form.ordre_affichage || 0),
      notes: form.notes.trim(),
      created_by: existingLot?.created_by ?? user?.id ?? null,
      updated_by: user?.id ?? existingLot?.updated_by ?? null,
      created_at: existingLot?.created_at ?? now,
      updated_at: now,
      sync_status: "pending",
      sync_error: null,
      deleted_at: null,
    };

    const nextLots = sortLocalLots(
      lots.filter((lot) => lot.id !== localRecord.id).concat(localRecord),
    );

    setLots(nextLots);
    saveCachedLots(nextLots);
    setSaving(false);

    showToast(
      "success",
      editingId ? "Lot enregistré localement" : "Lot créé localement",
      `${form.reference} sera envoyé au serveur distant lors de la synchronisation.`,
    );
    resetForm();
  };

  const handleSyncToRemote = async () => {
    if (!user) {
      showToast(
        "error",
        "Synchronisation impossible",
        "Vous devez être connecté pour envoyer les lots vers le serveur distant.",
      );
      return;
    }

    if (pendingSyncCount === 0) {
      showToast(
        "info",
        "Synchronisation inutile",
        "Aucun lot local à envoyer vers le serveur distant.",
      );
      return;
    }

    setSyncing(true);
    setError(null);

    let syncedCount = 0;
    let failedCount = 0;
    const nextLots = [...lots];

    try {
      for (const lot of lots) {
        if (lot.sync_status === "synced") {
          continue;
        }

        if (lot.sync_status === "deleted") {
          const { error: deleteError } = await dbClient
            .from("vitrine_lots")
            .delete()
            .eq("id", lot.id);

          if (deleteError) {
            failedCount += 1;
            const index = nextLots.findIndex((item) => item.id === lot.id);
            if (index >= 0) {
              nextLots[index] = {
                ...nextLots[index],
                sync_error: deleteError.message,
              };
            }
            continue;
          }

          const index = nextLots.findIndex((item) => item.id === lot.id);
          if (index >= 0) {
            nextLots.splice(index, 1);
          }
          syncedCount += 1;
          continue;
        }

        const payload = toRemotePayload(lot, user?.id ?? null);
        const { error: saveError } = await dbClient
          .from("vitrine_lots")
          .upsert(payload, { onConflict: "id" });

        if (saveError) {
          failedCount += 1;
          const index = nextLots.findIndex((item) => item.id === lot.id);
          if (index >= 0) {
            nextLots[index] = {
              ...nextLots[index],
              sync_error: saveError.message,
            };
          }
          continue;
        }

        const index = nextLots.findIndex((item) => item.id === lot.id);
        if (index >= 0) {
          nextLots[index] = {
            ...nextLots[index],
            sync_status: "synced",
            sync_error: null,
            deleted_at: null,
            updated_at: new Date().toISOString(),
          };
        }
        syncedCount += 1;
      }

      const normalizedLots = sortLocalLots(
        nextLots.filter((lot) => lot.sync_status !== "deleted"),
      );
      setLots(normalizedLots);
      saveCachedLots(normalizedLots);

      if (failedCount === 0) {
        showToast(
          "success",
          "Synchronisation terminée",
          `${syncedCount} lot${syncedCount > 1 ? "s" : ""} envoyé${syncedCount > 1 ? "s" : ""} vers le serveur distant.`,
        );
      } else {
        showToast(
          "info",
          "Synchronisation partielle",
          `${syncedCount} lot${syncedCount > 1 ? "s" : ""} synchronisé${syncedCount > 1 ? "s" : ""}, ${failedCount} en échec.`,
        );
      }
    } catch (syncError) {
      const message =
        syncError instanceof Error ? syncError.message : "Erreur inconnue";
      setError(message);
      showToast("error", "Synchronisation impossible", message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full">
            Catalogue commercial
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Lots à vendre
          </h1>
          <p className="max-w-3xl text-sm sm:text-base text-slate-600">
            Saisissez librement des lots à proposer à la vente, sans dépendre du
            cycle foncier opérationnel. Les fiches publiées alimentent la
            vitrine publique et restent éditables depuis ce module.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadLots()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={16} />
            Recharger local
          </button>
          <button
            type="button"
            onClick={() => void handleSyncToRemote()}
            disabled={syncing || pendingSyncCount === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={16} />
            {syncing
              ? "Synchronisation..."
              : `Synchroniser vers le serveur distant${pendingSyncCount > 0 ? ` (${pendingSyncCount})` : ""}`}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm({
                ...emptyForm,
                reference: generateReference("GS-LOT"),
              });
              setEditingId(null);
              setFormVisible(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            Nouveau lot
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Publiés", value: stats.published },
          { label: "Brouillons", value: stats.drafts },
          { label: "À synchroniser", value: stats.pendingSync },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {card.label}
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {pendingSyncCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {pendingSyncCount} lot{pendingSyncCount > 1 ? "s" : ""} enregistré
          {pendingSyncCount > 1 ? "s" : ""} localement. Cliquez sur{" "}
          <span className="font-semibold">
            Synchroniser vers le serveur distant
          </span>{" "}
          pour les publier.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {formVisible && (
          <form
            onSubmit={handleSubmit}
            className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5"
          >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Modifier le lot" : "Nouveau lot"}
              </h2>
              <p className="text-sm text-slate-500">
                Rôle connecté: {roleLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  reference: generateReference("GS-LOT"),
                }))
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Copy size={14} />
              Générer réf.
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Référence
              </span>
              <input
                value={form.reference}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    reference: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="GS-LOT-20260607-1234"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Titre du lot *
              </span>
              <input
                value={form.titre}
                onChange={(e) =>
                  setForm((current) => ({ ...current, titre: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Terrain résidentiel avec fort potentiel"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Description
              </span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    description: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Décrivez librement le lot, le contexte, la valeur commerciale..."
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Village *
              </span>
              <input
                value={form.village}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    village: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Sikensi"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Quartier
              </span>
              <input
                value={form.quartier}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    quartier: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Zone résidentielle"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Commune
              </span>
              <input
                value={form.commune}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    commune: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Sikensi"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Département
              </span>
              <input
                value={form.departement}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    departement: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Agnéby-Tiassa"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Région
              </span>
              <input
                value={form.region}
                onChange={(e) =>
                  setForm((current) => ({ ...current, region: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Agnéby-Tiassa"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Superficie (m²) *
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.superficie}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    superficie: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="300"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Prix de vente (FCFA) *
              </span>
              <input
                type="number"
                min="0"
                value={form.prix_vente}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    prix_vente: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="3500000"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Statut
              </span>
              <select
                value={form.statut}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    statut: e.target.value as VitrineLot["statut"],
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400 bg-white"
              >
                <option value="disponible">Disponible</option>
                <option value="reserve">Réservé</option>
                <option value="vendu">Vendu</option>
              </select>
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Documents
              </span>
              <input
                value={form.documents}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    documents: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Attestation coutumière + plan de bornage"
              />
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Caractéristiques
              </span>
              <textarea
                rows={4}
                value={form.caracteristiques_text}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    caracteristiques_text: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder={"Viabilisé\nAccès route\nRéseau eau à proximité"}
              />
            </label>

            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Image
                </span>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ImageIcon size={14} />
                  {form.image_url
                    ? "Changer l'image"
                    : "Sélectionner une image"}
                </button>
              </div>
              <input
                value={form.image_url}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    image_url: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Lien direct vers l'image ou sélection via la médiathèque"
              />
              {form.image_url && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img
                    src={form.image_url}
                    alt={form.image_alt || form.titre || "Aperçu image lot"}
                    className="h-48 w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
                    <span className="truncate">{form.image_url}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({ ...current, image_url: "" }))
                      }
                      className="font-semibold text-red-600 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Texte alternatif
              </span>
              <input
                value={form.image_alt}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    image_alt: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Terrain à vendre Sikensi Côte d'Ivoire"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Téléphone
              </span>
              <input
                value={form.contact_phone}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    contact_phone: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder={OFFICIAL_CONTACT.phone}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Email
              </span>
              <input
                value={form.contact_email}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    contact_email: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder={OFFICIAL_CONTACT.email}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Ordre
              </span>
              <input
                type="number"
                value={form.ordre_affichage}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    ordre_affichage: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="0"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.publier_sur_vitrine}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    publier_sur_vitrine: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span className="text-sm text-slate-700">
                Publier sur la vitrine publique
              </span>
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Notes internes
              </span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((current) => ({ ...current, notes: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
                placeholder="Informations internes non visibles publiquement."
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              <Save size={16} />
              {saving
                ? "Enregistrement..."
                : editingId
                  ? "Mettre à jour"
                  : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Réinitialiser
            </button>
          </div>
        </form>
        )}

        <div className={formVisible ? "xl:col-span-3 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm" : "xl:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Lots saisis</h2>
              <p className="text-sm text-slate-500">
                {visibleLots.length} fiche{visibleLots.length > 1 ? "s" : ""}{" "}
                enregistrée
                {visibleLots.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Le catalogue public utilisera les fiches publiées.
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          ) : visibleLots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Aucun lot n'a encore été saisi. Utilisez le formulaire de gauche
              pour ajouter votre premier lot à vendre.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleLots.map((lot) => {
                const published = lot.publier_sur_vitrine;
                return (
                  <article
                    key={lot.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-200 flex items-center justify-center">
                        {lot.image_url ? (
                          <img
                            src={lot.image_url}
                            alt={lot.image_alt || lot.titre}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={24} className="text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              {lot.reference}
                            </div>
                            <h3 className="truncate text-base font-bold text-slate-900">
                              {lot.titre}
                            </h3>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              published
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {published ? (
                              <Eye size={11} />
                            ) : (
                              <EyeOff size={11} />
                            )}
                            {published ? "Publié" : "Brouillon"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              lot.sync_status === "synced"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {lot.sync_status === "synced" ? "Distant" : "Local"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} />
                            {lot.village}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Ruler size={12} />
                            {lot.superficie} m²
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Tag size={12} />
                            {formatMontant(lot.prix_vente)} FCFA
                          </span>
                        </div>

                        {lot.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                            {lot.description}
                          </p>
                        )}

                        {lot.sync_status !== "synced" && (
                          <p className="mt-2 text-xs font-medium text-amber-700">
                            Synchronisation en attente.
                            {lot.sync_error
                              ? ` Dernière erreur: ${lot.sync_error}`
                              : ""}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(lot)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <Edit3 size={13} />
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyReference(lot.reference)
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <Copy size={13} />
                            Copier
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(lot)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 size={13} />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showImagePicker && (
        <MediaPicker
          onSelect={(file) => handleImageSelect(file.url)}
          onClose={() => setShowImagePicker(false)}
          defaultCategory="site_vitrine"
          title="Sélectionner l'image du lot"
        />
      )}
    </div>
  );
}
