/**
 * DOMAIN LAYER — Leads Validator (Zod)
 */

import { z } from 'zod';

export const leadSchema = z.object({
  phone: z
    .string()
    .min(7, 'Téléphone trop court')
    .max(20, 'Téléphone trop long')
    .regex(/^\+?[\d\s\-().]{7,20}$/, 'Format téléphone invalide'),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  email: z.string().email('Email invalide').max(255).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  canal_contact: z
    .enum(['appel', 'sms', 'whatsapp', 'email', 'visite', 'referral', 'direct', 'web_form', 'web_api'])
    .optional()
    .nullable(),
  statut: z
    .enum(['nouveau', 'contacte', 'qualifie', 'chaud', 'froid', 'converti', 'perdu'])
    .default('nouveau'),
  budget_estime: z.number().min(0).max(10_000_000_000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  consent_text: z.string().max(500).optional().nullable(),
  channels_optin: z.array(z.string()).optional().nullable(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export const visiteTerrainSchema = z.object({
  lead_id: z.string().uuid().optional().nullable(),
  date_visite: z.string().min(1, 'Date de visite requise'),
  heure_visite: z.string().optional().nullable(),
  lieu_rdv: z.string().max(500).optional().nullable(),
  terrain_id: z.string().uuid('ID terrain invalide'),
  statut: z.enum(['planifiee', 'confirmee', 'effectuee', 'annulee', 'reportee']).default('planifiee'),
  notes: z.string().max(2000).optional().nullable(),
  feedback_client: z.string().max(2000).optional().nullable(),
});

export type VisiteTerrainFormData = z.infer<typeof visiteTerrainSchema>;

export function validateLead(data: unknown): { success: true; data: LeadFormData } | { success: false; errors: Record<string, string> } {
  const result = leadSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    errors[issue.path.join('.') || 'general'] = issue.message;
  }
  return { success: false, errors };
}
