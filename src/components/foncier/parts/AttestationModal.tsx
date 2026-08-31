import { FC, useState, useEffect, useCallback } from "react";
import dbClient from "@/lib/dbClient.service";
import type { MediaFile } from "@/types";
import { 
  AttestationForm, 
  createAttestationForm,
  createEmptyTemoinForm,
  getLocalDateInput,
} from "../FoncierConstants";
import { validateAttestationForm } from "@/lib/foncierValidation";
import { buildAttestationRpcParams } from "@/lib/foncierAttestation";
import { generateFoncierReference, parseNumberInput, sha256Hex, generateUUID } from "@/utils/reference";
import { logFoncierAudit } from "@/lib/foncierAudit";
import { foncierRepository } from "@/data/foncier.repository";

interface AttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lot: {
    id: string;
    reference: string;
    numero_lot: string;
    village: string;
    proprietaire_nom?: string | null;
    proprietaire_prenom?: string | null;
    chef_village?: string | null;
  } | null;
  isLoading?: boolean;
  villageConfig: Record<string, string>;
  profile: { id?: string | null; full_name?: string | null } | null;
  isOnline: boolean;
  canManage: boolean;
  deviceId: string;
  accessLevel?: string;
  _accessLevel?: string;
}

export const AttestationModal: FC<AttestationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lot,
  isLoading = false,
  villageConfig,
  profile,
  isOnline,
  canManage,
  deviceId,
}) => {
  const [form, setForm] = useState<AttestationForm>(() => createAttestationForm({}));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [_gpsPointsResult, _setGpsPointsResult] = useState<Array<{ label: string; lat: number; lng: number }> | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | undefined>(undefined);
  
  // Témoins management
  const [temoins, setTemoins] = useState<AttestationForm["temoins"]>(() => [
    createEmptyTemoinForm(),
    createEmptyTemoinForm(),
  ]);
  
  // Scan / signature
  const [_pickerOpen, _setPickerOpen] = useState(false);
  const [_scanMedia, _setScanMedia] = useState<MediaFile | null>(null);
  const [_scanLoading, _setScanLoading] = useState(false);

  // Load data when lot changes
  useEffect(() => {
    if (!lot) return;
    const newForm = createAttestationForm({
      attestation_type: "standard",
      original: true,
      registre_volume: villageConfig.registre_volume || "Tome 1",
      registre_page: "",
      registre_ligne: "",
      domicile: villageConfig.commune || "",
      limites_nord: villageConfig.limites_nord || "",
      limites_sud: villageConfig.limites_sud || "",
      limites_est: villageConfig.limites_est || "",
      limites_ouest: villageConfig.limites_ouest || "",
      gps_lat: "",
      gps_lng: "",
      gps_precision: "",
      gps_nord_lat: "",
      gps_nord_lng: "",
      gps_sud_lat: "",
      gps_sud_lng: "",
      gps_est_lat: "",
      gps_est_lng: "",
      gps_ouest_lat: "",
      gps_ouest_lng: "",
      validation_agent_nom: profile?.full_name || "",
      validation_chef_nom: lot.chef_village || villageConfig.chef_village || "",
      cedant_nom: "",
      cedant_prenom: "",
      cedant_cni_numero: "",
      cedant_telephone: "",
      cedant_domicile: "",
      numero_enregistrement: villageConfig.registre_next_numero || "",
      mode_acquisition: "",
      historique_possession: "",
      temoins: []
    });
    setForm(newForm);
    setTemoins([
      createEmptyTemoinForm(),
      createEmptyTemoinForm(),
    ]);
    setQrDataUrl(undefined);
    _setGpsPointsResult(null);
    setVerificationUrl(undefined);
    _setScanMedia(null);
    setError(null);
  }, [lot, villageConfig, profile]);

  const handleChange = useCallback(<K extends keyof AttestationForm>(field: K, value: AttestationForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }, [error]);

  const handleTemoinChange = useCallback((index: number, field: keyof AttestationForm["temoins"][0], value: string) => {
    setTemoins((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  }, []);

  const addTemoin = useCallback(() => {
    if (temoins.length < 4) {
      setTemoins((prev) => [...prev, createEmptyTemoinForm()]);
    }
  }, [temoins.length]);

  const removeTemoin = useCallback((index: number) => {
    if (temoins.length > 2) {
      setTemoins((prev) => prev.filter((_, i) => i !== index));
    }
  }, [temoins.length]);

  const generateAttestation = async () => {
    if (!lot) return;
    if (!canManage) {
      setError("Accès réservé");
      return;
    }
    if (!isOnline) {
      setError("Connexion requise pour générer l'attestation");
      return;
    }

    // Validation
    const fullForm = { ...form, temoins };
    const validation = validateAttestationForm(fullForm);
    if (!validation.success) {
      const firstError = Object.values(validation.errors ?? {})[0];
      setError(firstError || "Formulaire invalide");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Generate reference if needed
      let reference = form.reference;
      if (!reference) {
        reference = generateFoncierReference("ATT", villageConfig);
      }

      // Build GPS points
      const gpsPoints = [
        { label: "Nord", lat: parseNumberInput(form.gps_nord_lat), lng: parseNumberInput(form.gps_nord_lng) },
        { label: "Sud", lat: parseNumberInput(form.gps_sud_lat), lng: parseNumberInput(form.gps_sud_lng) },
        { label: "Est", lat: parseNumberInput(form.gps_est_lat), lng: parseNumberInput(form.gps_est_lng) },
        { label: "Ouest", lat: parseNumberInput(form.gps_ouest_lat), lng: parseNumberInput(form.gps_ouest_lng) },
      ]
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ label: p.label, lat: p.lat as number, lng: p.lng as number }));
      
      _setGpsPointsResult(gpsPoints.length ? gpsPoints : null);

      // Generate QR payload
      const signatureNonce = generateUUID();
      const signatureIssuedAt = new Date().toISOString();
      const qrPayload = JSON.stringify({
        ref: reference,
        type: form.attestation_type,
        lot: lot.reference,
        nonce: signatureNonce,
        issued: signatureIssuedAt,
      });
      
      // Generate hash
      const hashInput = `${reference}|${signatureNonce}|${signatureIssuedAt}|${lot.id}`;
      const hashSha256 = await sha256Hex(hashInput);

      // Build verification URL
      const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verification-attestation?ref=${reference}&control=&hash=${hashSha256}`;
      setVerificationUrl(verifyUrl);

      // Generate QR code
      const QRCode = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(qrPayload, { 
        errorCorrectionLevel: qrPayload.length > 800 ? "M" : "H",
        width: 240,
        margin: 1,
      });
      setQrDataUrl(dataUrl);

      // Prepare RPC params
      const isCession = form.attestation_type === "cession";
      const rpcParams = buildAttestationRpcParams({
        attestationForm: fullForm,
        attestationLot: lot as any,
        signatureNonce,
        signatureIssuedAt,
        deviceId,
        isCession,
      });

      // Call RPC via repository
      const result = await foncierRepository.createAttestation(rpcParams as any);
      if (result.error) throw result.error;

      await logFoncierAudit(dbClient, {
        lotId: lot.id,
        action: "ATTESTATION_CREATE",
        details: {
          attestation_id: result.data?.[0]?.id,
          reference,
          type: form.attestation_type,
        },
      });

      onSuccess();
      setSaving(false);
    } catch (err: any) {
      console.error("Error generating attestation:", err);
      setError(err.message || "Erreur lors de la génération");
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg w-full">
          <div className="flex items-center justify-between p-4 border-b rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900">
              Générer une attestation coutumière
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
          </div>
          <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Lot info */}
            {lot && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-xs text-gray-500">Référence</p><p className="font-medium">{lot.reference}</p></div>
                  <div><p className="text-xs text-gray-500">N° Lot</p><p className="font-medium">{lot.numero_lot}</p></div>
                  <div><p className="text-xs text-gray-500">Village</p><p className="font-medium">{lot.village}</p></div>
                  <div><p className="text-xs text-gray-500">Propriétaire</p><p className="font-medium">{lot.proprietaire_prenom} {lot.proprietaire_nom}</p></div>
                </div>
              </div>
            )}

            {/* Form tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {["informations", "limites", "gps", "identités", "témoins", "validation", "révision"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className="px-3 py-1.5 text-xs rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition-colors"
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Main form fields - simplified version */}
            <div className="space-y-4">
              {/* Type & Reference */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type d'attestation *</label>
                  <select
                    value={form.attestation_type}
                    onChange={(e) => handleChange("attestation_type", e.target.value as AttestationForm["attestation_type"])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="cession">Cession</option>
                    <option value="succession">Succession</option>
                    <option value="mutation">Mutation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                  <input
                    type="text"
                    value={form.reference || ""}
                    onChange={(e) => handleChange("reference", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-générée si vide"
                  />
                </div>
              </div>

              {/* Original/Copy */}
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.original}
                    onChange={(e) => handleChange("original", e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Original (sinon copie)</span>
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date établissement</label>
                <input
                  type="date"
                  value={form.date_etablissement || getLocalDateInput()}
                  onChange={(e) => handleChange("date_etablissement", e.target.value)}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Limites */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite Nord</label>
                  <input type="text" value={form.limites_nord} onChange={(e) => handleChange("limites_nord", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite Sud</label>
                  <input type="text" value={form.limites_sud} onChange={(e) => handleChange("limites_sud", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite Est</label>
                  <input type="text" value={form.limites_est} onChange={(e) => handleChange("limites_est", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite Ouest</label>
                  <input type="text" value={form.limites_ouest} onChange={(e) => handleChange("limites_ouest", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* GPS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude centre</label>
                  <input type="text" value={form.gps_lat} onChange={(e) => handleChange("gps_lat", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: 5.3456" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude centre</label>
                  <input type="text" value={form.gps_lng} onChange={(e) => handleChange("gps_lng", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: -4.2345" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Précision GPS (m)</label>
                  <input type="text" value={form.gps_precision} onChange={(e) => handleChange("gps_precision", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: 5" />
                </div>
              </div>

              {/* GPS Points Nord/Sud/Est/Ouest */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nord - Latitude</label>
                  <input type="text" value={form.gps_nord_lat} onChange={(e) => handleChange("gps_nord_lat", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nord - Longitude</label>
                  <input type="text" value={form.gps_nord_lng} onChange={(e) => handleChange("gps_nord_lng", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sud - Latitude</label>
                  <input type="text" value={form.gps_sud_lat} onChange={(e) => handleChange("gps_sud_lat", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sud - Longitude</label>
                  <input type="text" value={form.gps_sud_lng} onChange={(e) => handleChange("gps_sud_lng", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Identity / Cession */}
              {form.attestation_type === "cession" && (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                  <h4 className="font-medium text-gray-700">Informations du cédant</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <input type="text" value={form.cedant_nom} onChange={(e) => handleChange("cedant_nom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                      <input type="text" value={form.cedant_prenom} onChange={(e) => handleChange("cedant_prenom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CNI</label>
                      <input type="text" value={form.cedant_cni_numero} onChange={(e) => handleChange("cedant_cni_numero", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input type="text" value={form.cedant_telephone} onChange={(e) => handleChange("cedant_telephone", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domicile</label>
                    <input type="text" value={form.cedant_domicile} onChange={(e) => handleChange("cedant_domicile", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}

              {/* Témoins */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700">Témoins (min 2, max 4)</h4>
                  <button type="button" onClick={addTemoin} disabled={temoins.length >= 4} className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50 disabled:opacity-50">+ Ajouter</button>
                </div>
                {temoins.map((temoin, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Témoin {idx + 1}</span>
                      <button type="button" onClick={() => removeTemoin(idx)} disabled={temoins.length <= 2} className="text-red-500 hover:text-red-700 disabled:opacity-50">✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input type="text" value={temoin.nom} onChange={(e) => handleTemoinChange(idx, "nom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                        <input type="text" value={temoin.prenom} onChange={(e) => handleTemoinChange(idx, "prenom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                        <input type="text" value={temoin.profession} onChange={(e) => handleTemoinChange(idx, "profession", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input type="text" value={temoin.telephone} onChange={(e) => handleTemoinChange(idx, "telephone", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">CNI</label>
                      <input type="text" value={temoin.cni} onChange={(e) => handleTemoinChange(idx, "cni", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Validation names */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent validateur</label>
                  <input type="text" value={form.validation_agent_nom} onChange={(e) => handleChange("validation_agent_nom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chef de village</label>
                  <input type="text" value={form.validation_chef_nom} onChange={(e) => handleChange("validation_chef_nom", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* QR Code Preview */}
              {qrDataUrl && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 mb-2">QR Code (aperçu)</p>
                  <img src={qrDataUrl} alt="QR Code" className="mx-auto w-32 h-32" />
                  {verificationUrl && (
                    <a href={verificationUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block mt-2">
                      Tester la vérification publique
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={generateAttestation}
                disabled={saving || isLoading || !lot || !canManage}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "⏳ Génération..." : "✓ Générer & Imprimer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};