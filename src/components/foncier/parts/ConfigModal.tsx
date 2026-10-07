import { FC, useState, useEffect, useCallback } from "react";
import { Save, Loader2, Image as ImageIcon, Globe, MapPin, Building2, Shield, Settings as SettingsIcon, Palette, RefreshCw } from "lucide-react";
import { VillageLogoUploader } from "../VillageLogoUploader";
import { saveVillageConfig } from "@/lib/foncierVillageConfig";
import { foncierRepository } from "@/data/foncier.repository";
import dbClient, { withBackoff } from "@/lib/dbClient.service";
import type { MediaFile } from "@/types";
import MediaPicker from "@/components/media/MediaPicker";
import { assignMedia } from "@/lib/mediaUtils";
import { FoncierConfigMap, FoncierConfigKey } from "../FoncierConstants";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedVillage: string;
  initialConfig: FoncierConfigMap;
  isLoading?: boolean;
  accessLevel?: string;
  profile?: { id?: string | null; full_name?: string | null } | null;
  canManage: boolean;
  isOnline: boolean;
}

const configFields = [
  { key: "village", label: "Nom du village", type: "text" as const, required: true, icon: Globe },
  { key: "region", label: "Région", type: "text" as const, required: false, icon: MapPin },
  { key: "departement", label: "Département", type: "text" as const, required: false, icon: MapPin },
  { key: "commune", label: "Commune", type: "text" as const, required: false, icon: Building2 },
  { key: "chef_village", label: "Chef de village", type: "text" as const, required: false, icon: Shield },
  { key: "lieu_signature", label: "Lieu de signature", type: "text" as const, required: false, icon: MapPin },
  { key: "registre_volume", label: "Volume du registre", type: "text" as const, required: false, icon: SettingsIcon },
  { key: "registre_next_numero", label: "Prochain n° d'enregistrement", type: "text" as const, required: false, icon: SettingsIcon },
  { key: "arrete_lotissement", label: "Arrêté de lotissement", type: "text" as const, required: false, icon: SettingsIcon },
  { key: "arrete_date", label: "Date arrêté (JJ/MM/AAAA)", type: "text" as const, required: false, icon: SettingsIcon },
  { key: "primary_color", label: "Couleur primaire (hex)", type: "color" as const, required: false, icon: Palette },
  { key: "secondary_color", label: "Couleur secondaire (hex)", type: "color" as const, required: false, icon: Palette },
  { key: "logo_url", label: "Logo URL (fallback)", type: "text" as const, required: false, icon: ImageIcon },
  { key: "limites_nord", label: "Limite Nord par défaut", type: "text" as const, required: false, icon: MapPin },
  { key: "limites_sud", label: "Limite Sud par défaut", type: "text" as const, required: false, icon: MapPin },
  { key: "limites_est", label: "Limite Est par défaut", type: "text" as const, required: false, icon: MapPin },
  { key: "limites_ouest", label: "Limite Ouest par défaut", type: "text" as const, required: false, icon: MapPin },
];

export const ConfigModal: FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedVillage,
  initialConfig,
  isLoading = false,
  canManage,
  isOnline,
}) => {
  const [config, setConfig] = useState<FoncierConfigMap>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(initialConfig.logo_url);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedVillage) {
      setConfig(initialConfig);
      setLogoUrl(initialConfig.logo_url);
      setError(null);
    }
  }, [isOpen, selectedVillage, initialConfig]);

  const handleChange = useCallback((key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  }, [error]);

  const handleLogoSelect = useCallback(async (file: MediaFile) => {
    setPickerOpen(false);
    setLogoLoading(true);
    try {
      const entityId = selectedVillage.replace(/^(VILLAGE\s+DE\s+|VILLAGE\s+)/i, "").trim();
      const { error } = await assignMedia(
        file.id,
        "foncier_village",
        entityId,
        "logo",
        `Logo — ${selectedVillage}`
      );
      if (error) {
        setError(error);
        return;
      }
      setLogoUrl(file.url);
      setConfig((prev) => ({ ...prev, logo_url: file.url }));
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de l'assignation du logo");
    } finally {
      setLogoLoading(false);
    }
  }, [selectedVillage]);

  const handleSave = async () => {
    if (!selectedVillage || !canManage || !isOnline) {
      setError("Connexion et droits requis");
      return;
    }
    if (!config.village?.trim()) {
      setError("Le nom du village est obligatoire");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Save to localStorage fallback
      try {
        await saveVillageConfig(selectedVillage, config);
      } catch {
        throw new Error("Échec sauvegarde locale");
      }

      // Also try to persist to DB
      try {
        const villageResult = await withBackoff<{ data: { id: string; nom: string } | null; error: any }>(() => 
          dbClient.from("foncier_villages").select("id, nom").eq("nom", selectedVillage).maybeSingle()
        );
        
        const villageId = villageResult.data?.id;
        if (villageId) {
          await withBackoff(() =>
            dbClient.from("foncier_villages").update({
              config_jsonb: config,
              primary_color: config.primary_color || null,
              secondary_color: config.secondary_color || null,
              logo_url: config.logo_url || null,
              region: config.region || null,
              departement: config.departement || null,
              commune: config.commune || null,
              chef_village: config.chef_village || null,
              updated_at: new Date().toISOString(),
            }).eq("id", villageId)
          );
        }
      } catch (_dbErr) {
        console.warn("DB save failed, using localStorage only:", _dbErr);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error saving config:", err);
      setError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConfig = async () => {
    if (!selectedVillage) return;
    try {
      const result = await foncierRepository.getVillageStats(false);
      console.log("Village stats:", result);
    } catch (err) {
      console.error("Test config error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg w-full">
          <div className="flex items-center justify-between p-4 border-b rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <SettingsIcon size={20} /> Configuration village — {selectedVillage}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
          </div>
          <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Logo Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <ImageIcon size={18} /> Logo du village
              </h4>
              <VillageLogoUploader
                villageName={selectedVillage}
                villageId={selectedVillage}
                currentLogoUrl={logoUrl}
                onLogoUploaded={setLogoUrl}
                onError={setError}
                disabled={!canManage || !isOnline}
              />
              {logoLoading && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Assignation...
                </div>
              )}
            </div>

            {/* Config Fields */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h4 className="font-medium text-gray-700">Paramètres du village</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {configFields.map((field) => (
                  <div key={field.key} className={field.required ? "border-l-2 border-blue-500 pl-3" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <field.icon size={14} className="text-gray-400" />
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === "color" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config[field.key as FoncierConfigKey] || "#1e3a5f"}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config[field.key as FoncierConfigKey] || ""}
                          onChange={(e) => handleChange(field.key, e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono uppercase"
                          placeholder="#1E3A5F"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={config[field.key as FoncierConfigKey] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={field.required ? "Requis" : "Optionnel"}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleTestConfig}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <RefreshCw size={16} /> Tester
              </button>
              <button
                onClick={handleSave}
                disabled={saving || isLoading || !canManage || !isOnline}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} /> {saving ? "Sauvegarde..." : "Sauvegarder la configuration"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {pickerOpen && (
        <MediaPicker
          defaultCategory="foncier_villages"
          title={`Logo du village — ${selectedVillage}`}
          onSelect={handleLogoSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
};