/**
 * DOMAIN LAYER — Leads Rules
 * Source unique des règles métier CRM leads.
 */

export type LeadStatut =
  | 'nouveau'
  | 'contacte'
  | 'qualifie'
  | 'chaud'
  | 'froid'
  | 'converti'
  | 'perdu';

export type CanalContact =
  | 'appel'
  | 'sms'
  | 'whatsapp'
  | 'email'
  | 'visite'
  | 'referral'
  | 'direct'
  | 'web_form'
  | 'web_api';

export interface LeadForRules {
  statut: LeadStatut;
  score?: number | null;
  budget_estime?: number | null;
  canal_contact?: CanalContact | null;
  derniere_interaction?: string | null;
}

export const leadsRules = {
  /**
   * Un lead peut être converti seulement s'il est qualifié ou chaud
   */
  canConvert(lead: LeadForRules): boolean {
    return lead.statut === 'qualifie' || lead.statut === 'chaud';
  },

  /**
   * Un lead est considéré "froid" si pas de contact depuis 30 jours
   */
  isCold(lead: LeadForRules): boolean {
    if (!lead.derniere_interaction) return true;
    const lastContact = new Date(lead.derniere_interaction);
    const daysSince = (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 30;
  },

  /**
   * Calcule le score d'un lead (0-100)
   * Aligné avec la logique SQL update_lead_score
   */
  computeScore(lead: LeadForRules): number {
    let score = 0;

    const budgetScore = lead.budget_estime
      ? Math.min(30, Math.floor((lead.budget_estime / 10_000_000) * 30))
      : 0;
    score += budgetScore;

    const statutBonus: Record<LeadStatut, number> = {
      chaud: 40,
      qualifie: 25,
      contacte: 15,
      nouveau: 10,
      froid: 5,
      converti: 0,
      perdu: 0,
    };
    score += statutBonus[lead.statut] ?? 0;

    const canalBonus: Record<string, number> = {
      referral: 30,
      direct: 20,
      visite: 25,
      appel: 15,
      whatsapp: 12,
      email: 10,
      sms: 8,
      web_form: 10,
      web_api: 5,
    };
    score += canalBonus[lead.canal_contact ?? ''] ?? 5;

    return Math.min(100, score);
  },

  /**
   * Label lisible du statut
   */
  statutLabel(statut: LeadStatut): string {
    const labels: Record<LeadStatut, string> = {
      nouveau: 'Nouveau',
      contacte: 'Contacté',
      qualifie: 'Qualifié',
      chaud: 'Chaud',
      froid: 'Froid',
      converti: 'Converti',
      perdu: 'Perdu',
    };
    return labels[statut] ?? statut;
  },

  /**
   * Couleur badge Tailwind
   */
  statutBadgeClass(statut: LeadStatut): string {
    const classes: Record<LeadStatut, string> = {
      nouveau: 'bg-blue-100 text-blue-800',
      contacte: 'bg-purple-100 text-purple-800',
      qualifie: 'bg-yellow-100 text-yellow-800',
      chaud: 'bg-orange-100 text-orange-800',
      froid: 'bg-gray-100 text-gray-600',
      converti: 'bg-green-100 text-green-800',
      perdu: 'bg-red-100 text-red-800',
    };
    return classes[statut] ?? 'bg-gray-100 text-gray-600';
  },

  /**
   * Transitions valides entre statuts (machine à états)
   */
  allowedTransitions: {
    nouveau: ['contacte', 'froid', 'perdu'],
    contacte: ['qualifie', 'froid', 'perdu'],
    qualifie: ['chaud', 'converti', 'perdu'],
    chaud: ['converti', 'froid', 'perdu'],
    froid: ['contacte', 'perdu'],
    converti: [],
    perdu: ['nouveau'],
  } as Record<LeadStatut, LeadStatut[]>,

  canTransition(from: LeadStatut, to: LeadStatut): boolean {
    return leadsRules.allowedTransitions[from]?.includes(to) ?? false;
  },
};
