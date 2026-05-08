import { useState, useEffect } from "react";
import { Star, Upload, Check, RefreshCw, Image } from "lucide-react";
import { getBrandAsset, setBrandAsset } from "../../lib/mediaUtils";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import type { MediaFile, BrandAssetType } from "../../types";
import MediaPicker from "./MediaPicker";

interface BrandSlot {
  type: BrandAssetType;
  label: string;
  description: string;
  usedIn: string[];
}

const BRAND_SLOTS: BrandSlot[] = [
  {
    type: "logo_principal",
    label: "Logo Principal",
    description: "Logo utilisé partout dans l'application",
    usedIn: ["Sidebar", "Site vitrine", "Documents PDF", "Factures", "Emails"],
  },
  {
    type: "favicon",
    label: "Favicon",
    description: "Icône affichée dans l'onglet du navigateur",
    usedIn: ["Onglet navigateur", "Bookmarks"],
  },
  {
    type: "logo_secondaire",
    label: "Logo Secondaire",
    description: "Version alternative du logo (fond sombre)",
    usedIn: ["Pied de page", "Présentations"],
  },
  {
    type: "watermark",
    label: "Filigrane",
    description: "Filigrane appliqué aux documents exportés",
    usedIn: ["Documents exportés", "Certificats"],
  },
];

export default function BrandAssetsManager() {
  const { user } = useAuth();
  const { refreshSettings } = useSettings();
  const [assets, setAssets] = useState<
    Record<BrandAssetType, MediaFile | null>
  >({
    logo_principal: null,
    favicon: null,
    logo_secondaire: null,
    watermark: null,
  });
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<BrandAssetType | null>(null);
  const [saving, setSaving] = useState<BrandAssetType | null>(null);
  const [saved, setSaved] = useState<BrandAssetType | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    const [logo, fav, secondary, watermark] = await Promise.all([
      getBrandAsset("logo_principal"),
      getBrandAsset("favicon"),
      getBrandAsset("logo_secondaire"),
      getBrandAsset("watermark"),
    ]);
    setAssets({
      logo_principal: logo,
      favicon: fav,
      logo_secondaire: secondary,
      watermark: watermark,
    });
    setLoading(false);
  };

  const handleAssign = async (type: BrandAssetType, file: MediaFile) => {
    if (!user) return;
    setSaving(type);
    const { error } = await setBrandAsset(file.id, type, user.id);
    if (!error) {
      setAssets((prev) => ({ ...prev, [type]: file }));
      setSaved(type);
      setTimeout(() => setSaved(null), 2500);
      await refreshSettings();
    }
    setSaving(null);
    setPicking(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Star size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Gestion des ressources de marque
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Le logo principal est utilisé automatiquement dans toute
            l'application. Toute modification ici est répercutée instantanément
            partout.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BRAND_SLOTS.map((slot) => {
          const current = assets[slot.type];
          const isSaving = saving === slot.type;
          const isSaved = saved === slot.type;

          return (
            <div
              key={slot.type}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {slot.label}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {slot.description}
                  </p>
                </div>
                {current && (
                  <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                    <Check size={10} />
                    Défini
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {current ? (
                    <img
                      src={current.url}
                      alt={slot.label}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Image size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {current ? (
                    <div>
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {current.original_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {current.size < 1024 * 1024
                          ? `${(current.size / 1024).toFixed(0)} KB`
                          : `${(current.size / (1024 * 1024)).toFixed(1)} MB`}
                        {" · "}
                        {current.type.split("/")[1]?.toUpperCase()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      Aucune image assignée
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-400 font-medium mb-1">
                  Utilisé dans :
                </p>
                <div className="flex flex-wrap gap-1">
                  {slot.usedIn.map((u) => (
                    <span
                      key={u}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setPicking(slot.type)}
                disabled={isSaving}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isSaved
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } disabled:opacity-50`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : isSaved ? (
                  <>
                    <Check size={14} />
                    Enregistré !
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    {current ? "Changer l'image" : "Assigner une image"}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {picking && (
        <MediaPicker
          onSelect={(file) => handleAssign(picking, file)}
          onClose={() => setPicking(null)}
          defaultCategory="brand_assets"
        />
      )}
    </div>
  );
}
