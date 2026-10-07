// /types/village.ts — Types pour le Module Foncier — Attestation de Propriété Villageoise

export interface VillageChef {
  titre: string;
  prenom: string;
  nom: string;
  nomComplet: string;
}

export interface VillageLogo {
  path: string;
  alt: string;
}

export interface VillageAdresseAdministrative {
  prefixeRef: string;
  codePostal: string;
}

export interface Village {
  id: string; // Slug unique (ex: katadji)
  nom: string; // Nom officiel en MAJUSCULES
  commune: string;
  departement: string;
  region: string;
  chef: VillageChef;
  logo: VillageLogo;
  adresseAdministrative: VillageAdresseAdministrative;
  active: boolean; // false = village archivé
}

export interface VillagesData {
  version: string;
  lastUpdated: string;
  villages: Village[];
}

// Helper pour accéder au fichier villages.json
export const VILLAGES_JSON_PATH = "/lib/villages.json";

// Fonction utilitaire pour charger les villages (côté client)
export async function loadVillages(): Promise<VillagesData> {
  const response = await fetch(VILLAGES_JSON_PATH);
  if (!response.ok) {
    throw new Error(
      `Impossible de charger villages.json: ${response.statusText}`,
    );
  }
  return response.json() as Promise<VillagesData>;
}

// Fonction pour trouver un village par son ID
export function findVillageById(
  villages: Village[],
  id: string,
): Village | undefined {
  return villages.find((v) => v.id === id && v.active);
}

// Fonction pour générer le numéro de référence d'attestation
export function generateAttestationReference(
  _village: Village,
  date?: Date,
): string {
  const d = date || new Date();
  const yearMonthDay = d.toISOString().split("T")[0].replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  // prefix is reserved for future use
  return `ATT-${yearMonthDay}-${random}`;
}
