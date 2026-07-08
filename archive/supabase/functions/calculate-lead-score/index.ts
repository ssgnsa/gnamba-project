// ============================================
// EGS - Edge Function: Calculate Lead Score
// Trigger: Called via HTTP or schedule
// Calculate lead qualification score (0-100)
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types
interface Lead {
  id: string
  reponses_campagnes: number
  visites_realisees: number
  budget_min?: number
  budget_max?: number
  terrain_interet_id?: string
  derniere_interaction: string
  statut: string
}

// Score configuration
const SCORE_RULES = {
  // Positif
  REPLY_CAMPAIGN: 10,        // +10 par réponse à une campagne
  VISIT_COMPLETED: 25,       // +25 par visite terrain réalisée
  BUDGET_DEFINED: 15,        // +15 si budget défini
  TERRAIN_SELECTED: 20,      // +20 si terrain spécifique choisi
  EMAIL_PROVIDED: 5,         // +5 si email fourni
  
  // Négatif (inactivité)
  INACTIVITY_DECAY: 0.5,     // Score *= 0.5 si inactif > 30 jours
  INACTIVITY_THRESHOLD: 30,  // Jours d'inactivité avant pénalité
  
  // Statut bonus
  STATUS_QUALIFIED: 10,      // +10 si statut = 'qualifie'
  STATUS_HOT: 20,            // +20 si statut = 'chaud'
  STATUS_CONVERTED: 50,      // +50 si statut = 'converti'
}

// ============================================
// Calculate score for a single lead
// ============================================
function calculateScore(lead: Lead): number {
  let score = 0
  
  // 1. Réponses aux campagnes
  score += (lead.reponses_campagnes || 0) * SCORE_RULES.REPLY_CAMPAIGN
  
  // 2. Visites réalisées
  score += (lead.visites_realisees || 0) * SCORE_RULES.VISIT_COMPLETED
  
  // 3. Budget défini
  if (lead.budget_min && lead.budget_max) {
    score += SCORE_RULES.BUDGET_DEFINED
  }
  
  // 4. Terrain choisi
  if (lead.terrain_interet_id) {
    score += SCORE_RULES.TERRAIN_SELECTED
  }
  
  // 5. Bonus selon statut
  switch (lead.statut) {
    case 'qualifie':
      score += SCORE_RULES.STATUS_QUALIFIED
      break
    case 'chaud':
      score += SCORE_RULES.STATUS_HOT
      break
    case 'converti':
      score += SCORE_RULES.STATUS_CONVERTED
      break
  }
  
  // 6. Décote pour inactivité
  const daysSinceLastContact = Math.floor(
    (Date.now() - new Date(lead.derniere_interaction).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysSinceLastContact > SCORE_RULES.INACTIVITY_THRESHOLD) {
    // Pénalité croissante avec l'inactivité
    const inactivityWeeks = Math.floor(daysSinceLastContact / 7)
    const decayFactor = Math.pow(SCORE_RULES.INACTIVITY_DECAY, inactivityWeeks)
    score = Math.floor(score * decayFactor)
  }
  
  // Cap à 100
  return Math.min(100, Math.max(0, score))
}

// ============================================
// Main handler
// ============================================
serve(async (req) => {
  try {
    // CORS headers
const ALLOWED_ORIGINS = [
  'https://gnambaservices.ci',
  'https://www.gnambaservices.ci',
  'https://portal.gnambaservices.ci',
  'http://localhost:5173',
  'http://localhost:8080',
]

const getCorsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : 'https://gnambaservices.ci'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  }
}

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: getCorsHeaders(req) })
    }

    // Only accept POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role for updates
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Parse request body
    const body = await req.json()
    const { lead_id, recalculate_all = false } = body

    let updatedLeads: Array<{ id: string; old_score: number; new_score: number }> = []

    // ============================================
    // Mode 1: Recalculate single lead
    // ============================================
    if (lead_id && !recalculate_all) {
      const { data: lead, error: fetchError } = await supabaseClient
        .from('leads')
        .select('id, reponses_campagnes, visites_realisees, budget_min, budget_max, terrain_interet_id, derniere_interaction, statut')
        .eq('id', lead_id)
        .single()

      if (fetchError || !lead) {
        return new Response(
          JSON.stringify({ error: 'Lead not found', details: fetchError }),
          { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      const oldScore = lead.score || 0
      const newScore = calculateScore(lead)

      // Update lead score
      const { error: updateError } = await supabaseClient
        .from('leads')
        .update({ score: newScore })
        .eq('id', lead_id)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update score', details: updateError }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      updatedLeads.push({
        id: lead_id,
        old_score: oldScore,
        new_score: newScore,
      })

      console.log(`✅ Score updated for lead ${lead_id}: ${oldScore} → ${newScore}`)
    }

    // ============================================
    // Mode 2: Recalculate all leads (batch)
    // ============================================
    else if (recalculate_all) {
      const { data: leads, error: fetchError } = await supabaseClient
        .from('leads')
        .select('id, score, reponses_campagnes, visites_realisees, budget_min, budget_max, terrain_interet_id, derniere_interaction, statut')
        .not('statut', 'eq', 'converti') // Ne pas recalculer les leads déjà convertis
        .not('statut', 'eq', 'perdu')    // Ne pas recalculer les leads perdus

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch leads', details: fetchError }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      // Calculate scores in batch
      const updates = leads!.map(lead => ({
        id: lead.id,
        score: calculateScore(lead),
      }))

      // Batch update
      const { error: batchError } = await supabaseClient
        .from('leads')
        .upsert(updates)

      if (batchError) {
        return new Response(
          JSON.stringify({ error: 'Failed to batch update scores', details: batchError }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      updatedLeads = leads!.map((lead, index) => ({
        id: lead.id,
        old_score: lead.score || 0,
        new_score: updates[index].score,
      }))

      console.log(`✅ Recalculated scores for ${leads!.length} leads`)
    }

    // ============================================
    // Mode 3: Invalid request
    // ============================================
    else {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          message: 'Provide lead_id for single update, or set recalculate_all=true for batch update' 
        }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        updated_count: updatedLeads.length,
        updated_leads: updatedLeads,
        score_rules: {
          reply_campaign: SCORE_RULES.REPLY_CAMPAIGN,
          visit_completed: SCORE_RULES.VISIT_COMPLETED,
          budget_defined: SCORE_RULES.BUDGET_DEFINED,
          terrain_selected: SCORE_RULES.TERRAIN_SELECTED,
          inactivity_decay: SCORE_RULES.INACTIVITY_DECAY,
          inactivity_threshold_days: SCORE_RULES.INACTIVITY_THRESHOLD,
        },
      }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in calculate-lead-score:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
