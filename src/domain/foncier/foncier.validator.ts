/**
 * DOMAIN LAYER — Foncier Validator (Zod)
 * Validation Zod centralisée pour les données foncières.
 * Remplace les validations dispersées dans composants et pages.
 */

import { z } from 'zod';

export const lotSchema = z.object({
  village: z.string().min(1, 'Village requis').max(100),
  lotissement: z.string().min(1, 'Lotissement requis').max(100),
  ilot: z.string().min(1, 'Îlot requis').max(50),
  numero_lot: z.string().min(1, 'Numéro de lot requis').max(50),
  superficie: z.number().min(1, 'Superficie minimum : 1 m²').max(100_000, 'Superficie maximum : 100 000 m²'),
  prix_cession: z.number().min(0).optional().nullable(),
  statut: z.enum(['actif', 'reserve', 'vendu', 'litige', 'annule']).default('actif'),
  proprietaire_nom: z.string().max(200).optional().nullable(),
  proprietaire_prenom: z.string().max(200).optional().nullable(),
  proprietaire_telephone: z.string().max(30).optional().nullable(),
  mode_acquisition: z.string().max(100).optional().nullable(),
  quartier: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  commune: z.string().max(100).optional().nullable(),
  departement: z.string().max(100).optional().nullable(),
});

export type LotFormData = z.infer<typeof lotSchema>;

export const attestationSchema = z.object({
  lot_id: z.string().uuid('ID de lot invalide'),
  proprietaire_nom: z.string().min(1, 'Nom du propriétaire requis').max(200),
  proprietaire_prenom: z.string().min(1, 'Prénom requis').max(200),
  proprietaire_cni_numero: z.string().min(1, 'CNI requise').max(50),
  date_etablissement: z.string().min(1, 'Date requise'),
  numero_enregistrement: z.string().min(1, 'Numéro d\'enregistrement requis').max(100),
  chef_village: z.string().min(1, 'Chef de village requis').max(200),
  lieu_signature: z.string().min(1, 'Lieu de signature requis').max(200),
  registre_volume: z.string().min(1, 'Volume du registre requis').max(50),
  mode_acquisition: z.string().min(1, 'Mode d\'acquisition requis').max(200),
  historique_possession: z.string().min(1, 'Historique requis').max(2000),
});

export type AttestationFormData = z.infer<typeof attestationSchema>;

export const villageSchema = z.object({
  name: z.string().min(1, 'Nom de village requis').max(100),
  region: z.string().max(100).optional().nullable(),
  commune: z.string().max(100).optional().nullable(),
  departement: z.string().max(100).optional().nullable(),
  chef_village: z.string().max(200).optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
});

export type VillageFormData = z.infer<typeof villageSchema>;

export function validateLot(data: unknown): { success: true; data: LotFormData } | { success: false; errors: Record<string, string> } {
  const result = lotSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'general';
    errors[key] = issue.message;
  }
  return { success: false, errors };
}

export function validateAttestation(data: unknown): { success: true; data: AttestationFormData } | { success: false; errors: Record<string, string> } {
  const result = attestationSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'general';
    errors[key] = issue.message;
  }
  return { success: false, errors };
}
