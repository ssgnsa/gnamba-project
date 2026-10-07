/**
 * Lead Scoring System — Scoring algorithmique pour priorisation commerciale
 * Score 0-100 basé sur: source, engagement, récence, fréquence, complétude, pages visitées
 */
import type { Lead } from '../types';

// ============================================
// CONFIGURATION DES POIDS
// ============================================

export const LEAD_SCORING_WEIGHTS = {
  // Source du lead (max 30 pts)
  source: {
    'landing_page': 30,
    'referral': 25,
    'web_form': 20,
    'phone_call': 15,
    'walk_in': 15,
    'social_media': 15,
    'email_campaign': 10,
    'direct': 10,
    'unknown': 5,
  } as Record<string, number>,

  // Engagement par canal (max 20 pts)
  channelEngagement: {
    whatsapp: 15,
    email: 10,
    sms: 8,
    telegram: 5,
    call: 20,
    meeting: 25,
  } as Record<string, number>,

  // Récence dernière interaction (max 20 pts)
  recency: (hoursSinceLastInteraction: number): number => {
    if (hoursSinceLastInteraction <= 1) return 20;
    if (hoursSinceLastInteraction <= 4) return 18;
    if (hoursSinceLastInteraction <= 12) return 15;
    if (hoursSinceLastInteraction <= 24) return 12;
    if (hoursSinceLastInteraction <= 48) return 10;
    if (hoursSinceLastInteraction <= 72) return 8;
    if (hoursSinceLastInteraction <= 168) return 5; // 7 jours
    if (hoursSinceLastInteraction <= 720) return 2; // 30 jours
    return 0;
  },

  // Fréquence interactions (max 15 pts)
  frequency: (interactionCount: number): number => {
    if (interactionCount >= 10) return 15;
    if (interactionCount >= 5) return 12;
    if (interactionCount >= 3) return 10;
    if (interactionCount >= 2) return 7;
    if (interactionCount >= 1) return 4;
    return 0;
  },

  // Complétude profil (max 10 pts)
  profileCompleteness: (lead: Lead): number => {
    let score = 0;
    if (lead.first_name) score += 2;
    if (lead.last_name) score += 2;
    if (lead.email) score += 2;
    if (lead.channels_optin?.whatsapp) score += 1;
    if (lead.channels_optin?.email) score += 1;
    if (lead.channels_optin?.sms) score += 1;
    if (lead.channels_optin?.telegram) score += 1;
    return Math.min(score, 10);
  },

  // Profondeur navigation (max 5 pts) - à enrichir avec analytics
  pageDepth: (pageViews: number = 1): number => {
    if (pageViews >= 10) return 5;
    if (pageViews >= 5) return 4;
    if (pageViews >= 3) return 3;
    if (pageViews >= 2) return 2;
    return 1;
  },
};

// ============================================
// TYPES
// ============================================

export interface LeadScoreBreakdown {
  total: number;
  source: number;
  channelEngagement: number;
  recency: number;
  frequency: number;
  profileCompleteness: number;
  pageDepth: number;
  tier: 'hot' | 'warm' | 'cold' | 'churned';
  factors: string[];
}

export interface ScoringContext {
  interactionCount?: number;
  hoursSinceLastInteraction?: number;
  pageViews?: number;
  lastChannelUsed?: string;
}

// ============================================
// ALGORITHME PRINCIPAL
// ============================================

/**
 * Calcule le score d'un lead (0-100)
 */
export function calculateLeadScore(
  lead: Lead,
  context: ScoringContext = {}
): LeadScoreBreakdown {
  const {
    interactionCount = 0,
    hoursSinceLastInteraction = 9999,
    pageViews = 1,
    lastChannelUsed = '',
  } = context;

  // 1. Score source (normaliser la clé)
  const sourceKey = normalizeSourceKey(lead.source);
  const sourceScore = LEAD_SCORING_WEIGHTS.source[sourceKey] ?? LEAD_SCORING_WEIGHTS.source.unknown;

  // 2. Score engagement canal
  let channelEngagementScore = 0;
  if (lastChannelUsed) {
    channelEngagementScore = LEAD_SCORING_WEIGHTS.channelEngagement[lastChannelUsed] ?? 0;
  } else if (lead.channels_optin) {
    // Prendre le canal avec le poids le plus élevé parmi les opt-ins
    const optinChannels = Object.entries(lead.channels_optin)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (optinChannels.length > 0) {
      channelEngagementScore = Math.max(
        ...optinChannels.map((c) => LEAD_SCORING_WEIGHTS.channelEngagement[c] ?? 0)
      );
    }
  }

  // 3. Score récence
  const recencyScore = LEAD_SCORING_WEIGHTS.recency(hoursSinceLastInteraction);

  // 4. Score fréquence
  const frequencyScore = LEAD_SCORING_WEIGHTS.frequency(interactionCount);

  // 5. Score complétude profil
  const profileScore = LEAD_SCORING_WEIGHTS.profileCompleteness(lead);

  // 6. Score profondeur navigation
  const pageDepthScore = LEAD_SCORING_WEIGHTS.pageDepth(pageViews);

  const total = Math.round(
    sourceScore +
    channelEngagementScore +
    recencyScore +
    frequencyScore +
    profileScore +
    pageDepthScore
  );

  // Déterminer le tier
  let tier: LeadScoreBreakdown['tier'];
  if (total >= 70) tier = 'hot';
  else if (total >= 40) tier = 'warm';
  else if (hoursSinceLastInteraction > 720 && interactionCount === 0) tier = 'churned';
  else tier = 'cold';

  // Facteurs explicatifs (pour UI)
  const factors: string[] = [];
  if (sourceScore >= 20) factors.push(`Source qualifiée (${sourceScore}pts)`);
  if (channelEngagementScore >= 10) factors.push(`Canal engagé (${channelEngagementScore}pts)`);
  if (recencyScore >= 15) factors.push(`Interaction récente (${recencyScore}pts)`);
  if (frequencyScore >= 10) factors.push(`Interactions fréquentes (${frequencyScore}pts)`);
  if (profileScore >= 7) factors.push(`Profil complet (${profileScore}pts)`);
  if (pageDepthScore >= 3) factors.push(`Navigation approfondie (${pageDepthScore}pts)`);
  if (tier === 'churned') factors.push('⚠️ Lead inactif 30j+');

  return {
    total: Math.min(total, 100),
    source: sourceScore,
    channelEngagement: channelEngagementScore,
    recency: recencyScore,
    frequency: frequencyScore,
    profileCompleteness: profileScore,
    pageDepth: pageDepthScore,
    tier,
    factors,
  };
}

// ============================================
// UTILITAIRES
// ============================================

function normalizeSourceKey(source: string): string {
  const s = source.toLowerCase().trim();
  // Mapping variantes courantes
  if (s.includes('landing') || s.includes('lp_')) return 'landing_page';
  if (s.includes('referral') || s.includes('parrain')) return 'referral';
  if (s.includes('form') || s.includes('web')) return 'web_form';
  if (s.includes('phone') || s.includes('call') || s.includes('appel')) return 'phone_call';
  if (s.includes('walk') || s.includes('physique') || s.includes('agence')) return 'walk_in';
  if (s.includes('social') || s.includes('facebook') || s.includes('instagram') || s.includes('linkedin')) return 'social_media';
  if (s.includes('email') || s.includes('newsletter') || s.includes('campaign')) return 'email_campaign';
  if (s.includes('direct') || s.includes('organic')) return 'direct';
  return 'unknown';
}

/**
 * Calcule les heures depuis la dernière interaction
 */
export function getHoursSinceLastInteraction(lastInteractionAt: string | null): number {
  if (!lastInteractionAt) return 9999;
  const diff = Date.now() - new Date(lastInteractionAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60));
}

/**
 * Obtient le label et couleur du tier
 */
export function getTierConfig(tier: LeadScoreBreakdown['tier']) {
  const configs = {
    hot: { label: '🔥 Chaud', color: 'bg-red-100 text-red-700', emoji: '🔥' },
    warm: { label: '🌡️ Tiède', color: 'bg-orange-100 text-orange-700', emoji: '🌡️' },
    cold: { label: '❄️ Froid', color: 'bg-blue-100 text-blue-700', emoji: '❄️' },
    churned: { label: '💀 Perdu', color: 'bg-gray-100 text-gray-600', emoji: '💀' },
  };
  return configs[tier];
}

/**
 * Trie les leads par score décroissant
 */
export function sortLeadsByScore(leads: Lead[], contexts: Map<string, ScoringContext> = new Map()): Lead[] {
  return [...leads].sort((a, b) => {
    const scoreA = calculateLeadScore(a, contexts.get(a.id));
    const scoreB = calculateLeadScore(b, contexts.get(b.id));
    return scoreB.total - scoreA.total;
  });
}

/**
 * Filtre les leads par tier
 */
export function filterLeadsByTier(
  leads: Lead[],
  tier: LeadScoreBreakdown['tier'],
  contexts: Map<string, ScoringContext> = new Map()
): Lead[] {
  return leads.filter((lead) => 
    calculateLeadScore(lead, contexts.get(lead.id)).tier === tier
  );
}

// ============================================
// EXPORT DEFAUT
// ============================================

export default {
  calculateLeadScore,
  getHoursSinceLastInteraction,
  getTierConfig,
  sortLeadsByScore,
  filterLeadsByTier,
  LEAD_SCORING_WEIGHTS,
};

// ============================================
// PIPELINE STAGE TYPES (re-exported from types)
// ============================================

export type PipelineStage = 
  | 'nouveau' 
  | 'qualifie' 
  | 'proposition' 
  | 'negociation' 
  | 'gagne' 
  | 'perdu';

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  'nouveau': 'Nouveau',
  'qualifie': 'Qualifié',
  'proposition': 'Proposition',
  'negociation': 'Négociation',
  'gagne': 'Gagné',
  'perdu': 'Perdu',
};

export const PIPELINE_STAGE_ORDER: PipelineStage[] = [
  'nouveau', 'qualifie', 'proposition', 'negociation', 'gagne', 'perdu'
];
