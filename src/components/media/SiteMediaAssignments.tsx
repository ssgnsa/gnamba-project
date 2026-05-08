import { useState, useEffect, useCallback } from "react";
import { Globe, Image, Check, Upload, X, RefreshCw } from "lucide-react";
import {
  getUsageForSlot,
  assignMedia,
  removeAssignment,
  getMediaUsages,
} from "../../lib/mediaUtils";
import type { MediaFile } from "../../types";
import MediaPicker from "./MediaPicker";

interface SlotDef {
  entityType: string;
  entityId: string | null;
  usageType: string;
  label: string;
  description: string;
  category?: string;
}

const SITE_SLOTS: { group: string; slots: SlotDef[] }[] = [
  {
    group: "Page d'accueil",
    slots: [
      {
        entityType: "site_section",
        entityId: null,
        usageType: "hero_background",
        label: "Fond du Hero",
        description: "Image de fond de la bannière principale",
        category: "hero_backgrounds",
      },
      {
        entityType: "site_section",
        entityId: null,
        usageType: "hero_image",
        label: "Image principale Hero",
        description: "Image illustrative du hero",
        category: "site_vitrine",
      },
    ],
  },
  {
    group: "Section À propos",
    slots: [
      {
        entityType: "site_section",
        entityId: null,
        usageType: "about_image",
        label: "Image À propos",
        description: "Image de la section À propos",
        category: "site_vitrine",
      },
      {
        entityType: "site_section",
        entityId: null,
        usageType: "about_background",
        label: "Fond À propos",
        description: "Image de fond de la section",
        category: "hero_backgrounds",
      },
    ],
  },
  {
    group: "Services",
    slots: [
      {
        entityType: "site_section",
        entityId: "btp",
        usageType: "service_image",
        label: "Image BTP",
        description: "Illustration du service BTP",
        category: "services",
      },
      {
        entityType: "site_section",
        entityId: "immobilier",
        usageType: "service_image",
        label: "Image Immobilier",
        description: "Illustration du service Immobilier",
        category: "services",
      },
      {
        entityType: "site_section",
        entityId: "foncier",
        usageType: "service_image",
        label: "Image Foncier",
        description: "Illustration du service Foncier",
        category: "services",
      },
      {
        entityType: "site_section",
        entityId: "fournitures",
        usageType: "service_image",
        label: "Image Fournitures",
        description: "Illustration du service Fournitures",
        category: "services",
      },
    ],
  },
  {
    group: "Contact",
    slots: [
      {
        entityType: "site_section",
        entityId: null,
        usageType: "contact_background",
        label: "Fond Contact",
        description: "Image de fond de la section contact",
        category: "hero_backgrounds",
      },
    ],
  },
];

interface SlotCardProps {
  slot: SlotDef;
}

function SlotCard({ slot }: SlotCardProps) {
  const [current, setCurrent] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSlot = useCallback(async () => {
    setLoading(true);
    const file = await getUsageForSlot(
      slot.entityType,
      slot.entityId,
      slot.usageType,
    );
    setCurrent(file);
    setLoading(false);
  }, [slot.entityId, slot.entityType, slot.usageType]);

  useEffect(() => {
    void loadSlot();
  }, [loadSlot]);

  const handleAssign = async (file: MediaFile) => {
    setSaving(true);
    await assignMedia(
      file.id,
      slot.entityType,
      slot.entityId,
      slot.usageType,
      slot.label,
    );
    setCurrent(file);
    setSaving(false);
    setPicking(false);
  };

  const handleRemove = async () => {
    if (!current) return;
    setSaving(true);
    const usages = await getMediaUsages(current.id);
    const usage = usages.find(
      (u) =>
        u.entity_type === slot.entityType &&
        u.entity_id === slot.entityId &&
        u.usage_type === slot.usageType,
    );
    if (usage) await removeAssignment(usage.id);
    setCurrent(null);
    setSaving(false);
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-lg bg-gray-100 border border-dashed border-gray-200 flex-shrink-0 overflow-hidden">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              </div>
            ) : current ? (
              <img
                src={current.url}
                alt={slot.label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image size={20} className="text-gray-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">{slot.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{slot.description}</p>
            {current && (
              <p className="text-xs text-blue-600 mt-1 truncate flex items-center gap-1">
                <Check size={10} />
                {current.original_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setPicking(true)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw size={11} className="animate-spin" />
            ) : (
              <Upload size={11} />
            )}
            {current ? "Changer" : "Assigner"}
          </button>
          {current && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Retirer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {picking && (
        <MediaPicker
          onSelect={handleAssign}
          onClose={() => setPicking(false)}
          title={`Sélectionner : ${slot.label}`}
        />
      )}
    </>
  );
}

export default function SiteMediaAssignments() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Globe size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">
            Assignation des images du site vitrine
          </p>
          <p className="text-xs text-blue-700 mt-0.5">
            Assignez des images depuis votre bibliothèque à chaque section du
            site vitrine. Les changements sont appliqués immédiatement.
          </p>
        </div>
      </div>

      {SITE_SLOTS.map((group) => (
        <div key={group.group}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {group.group}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.slots.map((slot) => (
              <SlotCard
                key={`${slot.entityType}-${slot.entityId}-${slot.usageType}`}
                slot={slot}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
