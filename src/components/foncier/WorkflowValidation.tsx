import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  Clock,
  FileText,
  User,
  AlertCircle,
  Upload,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { logFoncierAudit } from "../../lib/foncierAudit";
import Badge from "../ui/Badge";
import MediaPicker from "../media/MediaPicker";
import { assignMedia, getUsageForSlot } from "../../lib/mediaUtils";
import type { MediaFile } from "../../types";

interface AttestationStatus {
  id: string;
  lot_id: string;
  reference: string;
  statut: string | null;
  created_at: string;
  version?: number | null;
  validation_agent_nom?: string | null;
  validation_chef_nom?: string | null;
  validation_chef_date?: string | null;
  foncier_lots?: {
    reference: string;
    numero_lot: string;
    village: string;
    proprietaire_nom?: string | null;
    proprietaire_prenom?: string | null;
  } | null;
}

interface WorkflowValidationProps {
  lotId: string;
  userId?: string | null;
  userName?: string | null;
  isAdmin?: boolean;
  isOnline?: boolean;
  onWorkflowComplete?: () => void;
}

const statutLabels: Record<string, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  valide: "Validé",
  archive: "Archivé",
  revoque: "Révoqué",
  expire: "Expiré",
  annule: "Annulé",
};

const statutColors: Record<
  string,
  "gray" | "blue" | "orange" | "green" | "red"
> = {
  brouillon: "gray",
  soumis: "blue",
  valide: "green",
  archive: "gray",
  revoque: "red",
  expire: "orange",
  annule: "red",
};

const isMissingColumnError = (error: any, column: string) => {
  const message = typeof error?.message === "string" ? error.message : "";
  const code = typeof error?.code === "string" ? error.code : "";
  return (
    code === "42703" || message.includes(`column "${column}" does not exist`)
  );
};

export default function WorkflowValidation({
  lotId,
  userId,
  userName,
  isAdmin = false,
  isOnline = navigator.onLine,
  onWorkflowComplete,
}: WorkflowValidationProps) {
  const [attestation, setAttestation] = useState<AttestationStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validatingChef, setValidatingChef] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanMedia, setScanMedia] = useState<MediaFile | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [userRole, setUserRole] = useState<string>("lecteur");
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("user_profiles")
      .select("foncier_role")
      .eq("id", userId)
      .maybeSingle();
    if (data?.foncier_role) {
      setUserRole(data.foncier_role);
    }
  }, [userId]);

  const fetchAttestation = useCallback(async () => {
    setLoading(true);
    setError(null);
    const baseQuery = supabase
      .from("foncier_attestations")
      .select(
        "id, lot_id, reference, statut, created_at, version, validation_agent_nom, validation_chef_nom, validation_chef_date, foncier_lots:lot_id(reference, numero_lot, village, proprietaire_nom, proprietaire_prenom)",
      )
      .eq("lot_id", lotId)
      .order("created_at", { ascending: false })
      .limit(1);

    let result = await baseQuery.is("deleted_at", null).maybeSingle();

    if (result.error && isMissingColumnError(result.error, "deleted_at")) {
      result = await baseQuery.maybeSingle();
    }

    if (result.error) {
      setError("Impossible de charger l’attestation.");
      setLoading(false);
      return;
    }
    if (!result.data) {
      setAttestation(null);
      setLoading(false);
      return;
    }

    const raw = result.data as any;
    const lot = Array.isArray(raw.foncier_lots)
      ? (raw.foncier_lots[0] ?? null)
      : (raw.foncier_lots ?? null);
    const normalized: AttestationStatus = {
      ...raw,
      foncier_lots: lot,
    };
    setAttestation(normalized);
    setLoading(false);
  }, [lotId]);

  const fetchScan = useCallback(async (attestationId: string) => {
    setScanLoading(true);
    try {
      const file = await getUsageForSlot(
        "foncier_attestation",
        attestationId,
        "attestation_scan",
      );
      setScanMedia(file);
    } catch {
      setScanMedia(null);
    } finally {
      setScanLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAttestation();
    void fetchUserRole();
  }, [fetchAttestation, fetchUserRole]);

  useEffect(() => {
    if (!attestation?.id) {
      setScanMedia(null);
      return;
    }
    void fetchScan(attestation.id);
  }, [attestation?.id, fetchScan]);

  const canSubmit =
    ["agent", "validateur_village", "admin"].includes(userRole) || isAdmin;
  const canValidateChef = userRole === "validateur_village" || isAdmin;

  const handleSubmit = async () => {
    if (!attestation) return;
    if (!isOnline) {
      alert("Connexion requise pour soumettre.");
      return;
    }
    if (!confirm("Soumettre l’attestation au Chef du village ?")) return;

    setSubmitting(true);
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("foncier_attestations")
      .update({ statut: "soumis", updated_at: now, client_updated_at: now })
      .eq("id", attestation.id);

    if (updateError) {
      alert("Erreur : " + updateError.message);
    } else {
      await logFoncierAudit(supabase, {
        lotId: attestation.lot_id,
        action: "SOUMISSION_CHEF",
        details: {
          attestation_id: attestation.id,
          reference: attestation.reference,
        },
      });
      await fetchAttestation();
      onWorkflowComplete?.();
    }
    setSubmitting(false);
  };

  const handleValidateChef = async () => {
    if (!attestation) return;
    if (!isOnline) {
      alert("Connexion requise pour valider.");
      return;
    }
    if (!confirm("Valider l’attestation (signature physique du Chef) ?"))
      return;

    setValidatingChef(true);
    const now = new Date().toISOString();
    const chefName = attestation.validation_chef_nom || userName || null;

    const { error: updateError } = await supabase
      .from("foncier_attestations")
      .update({
        statut: "valide",
        validation_chef_nom: chefName,
        validation_chef_id: userId || null,
        validation_chef_date: now,
        updated_at: now,
        client_updated_at: now,
      })
      .eq("id", attestation.id);

    if (updateError) {
      alert("Erreur : " + updateError.message);
    } else {
      await logFoncierAudit(supabase, {
        lotId: attestation.lot_id,
        action: "VALIDATION_CHEF",
        details: {
          attestation_id: attestation.id,
          reference: attestation.reference,
        },
      });
      await fetchAttestation();
      onWorkflowComplete?.();
    }
    setValidatingChef(false);
  };

  const handleScanSelect = async (file: MediaFile) => {
    if (!attestation) return;
    setScanLoading(true);
    const { error } = await assignMedia(
      file.id,
      "foncier_attestation",
      attestation.id,
      "attestation_scan",
      "Scan original",
    );
    if (error) {
      alert(`Erreur : ${error}`);
    } else {
      setScanMedia(file);
      await logFoncierAudit(supabase, {
        lotId: attestation.lot_id,
        action: "SCAN_ORIGINAL",
        details: {
          attestation_id: attestation.id,
          reference: attestation.reference,
          media_id: file.id,
        },
      });
    }
    setShowMediaPicker(false);
    setScanLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!attestation) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
        Aucune attestation trouvée pour ce lot. Créez d’abord une attestation
        dans le module foncier.
      </div>
    );
  }

  const statutKey = (attestation.statut || "brouillon").toLowerCase();

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700"
        >
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Validation Chef de Village
              </h2>
              <p className="text-sm text-gray-500">
                Signature physique requise
              </p>
            </div>
          </div>
          <Badge
            color={statutColors[statutKey] || "gray"}
            label={statutLabels[statutKey] || attestation.statut || "Brouillon"}
          />
        </div>

        {attestation.foncier_lots && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Référence</p>
              <p className="text-sm font-medium">
                {attestation.foncier_lots.reference}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">N° Lot</p>
              <p className="text-sm font-medium">
                {attestation.foncier_lots.numero_lot}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Village</p>
              <p className="text-sm font-medium">
                {attestation.foncier_lots.village}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Propriétaire</p>
              <p className="text-sm font-medium">
                {attestation.foncier_lots.proprietaire_prenom}{" "}
                {attestation.foncier_lots.proprietaire_nom}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Étapes</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                attestation.statut === "soumis" ||
                attestation.statut === "valide"
                  ? "bg-blue-100"
                  : "bg-gray-100"
              }`}
            >
              {attestation.statut === "soumis" ||
              attestation.statut === "valide" ? (
                <CheckCircle size={20} className="text-blue-600" />
              ) : (
                <Clock size={20} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  1. Soumission au Chef
                </h4>
                {attestation.statut === "soumis" && (
                  <span className="text-xs text-gray-500">
                    {new Date(attestation.created_at).toLocaleDateString(
                      "fr-FR",
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {attestation.statut === "soumis" ||
                attestation.statut === "valide"
                  ? `Soumis par ${attestation.validation_agent_nom || "Agent foncier"}`
                  : "En attente de soumission"}
              </p>
              {attestation.statut !== "soumis" &&
                attestation.statut !== "valide" &&
                canSubmit && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? "Soumission..." : "Soumettre"}
                  </button>
                )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                attestation.statut === "valide" ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              {attestation.statut === "valide" ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <User size={20} className="text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  2. Validation Chef
                </h4>
                {attestation.validation_chef_date && (
                  <span className="text-xs text-gray-500">
                    {new Date(
                      attestation.validation_chef_date,
                    ).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {attestation.statut === "valide"
                  ? `Validé par ${attestation.validation_chef_nom || "Chef du village"}`
                  : "Signature physique du Chef requise"}
              </p>
              {attestation.statut === "soumis" && canValidateChef && (
                <button
                  onClick={handleValidateChef}
                  disabled={validatingChef}
                  className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {validatingChef ? "Validation..." : "Valider (Chef)"}
                </button>
              )}
              {attestation.statut === "soumis" && !canValidateChef && (
                <p className="text-xs text-amber-600 mt-2">
                  Accès réservé au Chef (validateur village) ou admin.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">
              Scan original
            </h3>
            <p className="text-xs text-gray-500">
              Joindre le scan pour consultation en ligne
            </p>
          </div>
          <button
            onClick={() => setShowMediaPicker(true)}
            disabled={
              !isOnline || scanLoading || attestation.statut !== "valide"
            }
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <Upload size={14} className="inline mr-1" /> Scanner
          </button>
        </div>

        {scanLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />{" "}
            Chargement...
          </div>
        ) : scanMedia ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <img
                src={scanMedia.url}
                alt={scanMedia.original_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <ImageIcon size={20} className="text-gray-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                {scanMedia.original_name}
              </p>
              <a
                href={scanMedia.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Ouvrir <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400">Aucun scan enregistré.</div>
        )}

        {attestation.statut !== "valide" && (
          <div className="mt-3 text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle size={12} /> Le scan est disponible après validation du
            Chef.
          </div>
        )}
      </div>

      {showMediaPicker && (
        <MediaPicker
          title="Ajouter le scan original"
          defaultCategory="documents"
          onSelect={handleScanSelect}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
}
