import { apiClient } from "../api/client";
import type { FoncierConfigMap } from "../components/foncier/FoncierConstants";

const SETTINGS_PREFIX = "foncier_village_config";

const toStorageKey = (villageName: string, key: string) =>
  `${SETTINGS_PREFIX}:${villageName}:${key}`;

export async function loadVillageConfig(
  villageName: string,
): Promise<FoncierConfigMap | null> {
  const result = await apiClient.settings.getAll();
  if (result.error || !result.data) return null;

  const rows = result.data as Array<{ key: string; value: string }>;
  const config: Partial<FoncierConfigMap> = {};

  rows.forEach((row) => {
    if (!row.key.startsWith(`${SETTINGS_PREFIX}:`)) return;
    const suffix = row.key.slice(`${SETTINGS_PREFIX}:`.length);
    const separatorIndex = suffix.indexOf(":");
    if (separatorIndex === -1) return;
    const rowVillage = suffix.slice(0, separatorIndex);
    const rowKey = suffix.slice(separatorIndex + 1);
    if (rowVillage !== villageName) return;
    config[rowKey as keyof FoncierConfigMap] = row.value;
  });

  return {
    region: "",
    departement: "",
    commune: "",
    village: villageName,
    chef_village: "",
    arrete_prefectoral: "",
    nom_chef_signe: "",
    lieu_signature: "",
    logo_url: "",
    village_logo_url: "",
    primary_color: "",
    layout_preference: "",
    ...config,
  } as FoncierConfigMap;
}

export async function saveVillageConfig(
  villageName: string,
  config: FoncierConfigMap,
): Promise<boolean> {
  const entries = Object.entries(config)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ({
      key: toStorageKey(villageName, key),
      value: String(value),
    }));

  const result = await apiClient.settings.upsert(entries);
  if (result.error) return false;
  return true;
}
