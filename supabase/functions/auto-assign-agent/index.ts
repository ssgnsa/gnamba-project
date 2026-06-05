// ============================================
// EGS - Edge Function: Auto-Assign Agent
// Trigger: After INSERT on leads table
// Assigns lead to agent with lowest workload
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types
interface Lead {
  id: string
  nom: string
  telephone: string
  source: string
  statut: string
  agent_id?: string
  created_at: string
}

interface Agent {
  id: string
  nom: string
  email: string
  role: string
  active: boolean
}

interface AgentWorkload {
  agent_id: string
  nom: string
  total_leads: number
  active_leads: number
  nouveaux: number
  qualifies: number
  conversion_rate: number
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE'
  table: string
  record: Lead
  schema: 'public'
  old_record: Lead | null
}

// ============================================
// Find agent with lowest workload
// ============================================
async function findBestAgent(
  supabaseClient: any,
  excludeAgentId?: string
): Promise<Agent | null> {
  
  // Get all active agents (gestionnaires and employés)
  const { data: agents, error: agentsError } = await supabaseClient
    .from('user_profiles')
    .select('id, nom, email, role')
    .in('role', ['gestionnaire', 'employe'])
    .eq('active', true)

  if (agentsError || !agents || agents.length === 0) {
    console.error('No active agents found:', agentsError)
    return null
  }

  // Get workload for each agent
  const agentIds = agents.map((a: Agent) => a.id)
  
  const { data: workloadData, error: workloadError } = await supabaseClient
    .rpc('get_agent_workload', { agent_ids: agentIds })

  if (workloadError) {
    console.error('Error fetching workload:', workloadError)
    // Fallback: return first agent
    return agents[0]
  }

  // Filter out excluded agent
  let availableAgents = workloadData || []
  if (excludeAgentId) {
    availableAgents = availableAgents.filter((w: AgentWorkload) => w.agent_id !== excludeAgentId)
  }

  if (availableAgents.length === 0) {
    return agents[0] // Fallback
  }

  // Score each agent
  // Factors: total leads (lower is better), conversion rate (higher is better)
  const scoredAgents = availableAgents.map((workload: AgentWorkload) => {
    // Score: (100 - total_leads) * 0.6 + conversion_rate * 0.4
    const totalScore = Math.max(0, 100 - workload.total_leads) * 0.6 + 
                       (workload.conversion_rate || 0) * 0.4
    
    return {
      ...workload,
      score: totalScore,
    }
  })

  // Sort by score (highest first)
  scoredAgents.sort((a: any, b: any) => b.score - a.score)

  // Return agent with best score
  const bestAgentId = scoredAgents[0].agent_id
  return agents.find((a: Agent) => a.id === bestAgentId) || agents[0]
}

// ============================================
// Create first contact task for agent
// ============================================
async function createFirstContactTask(
  supabaseClient: any,
  lead: Lead,
  agent: Agent
): Promise<void> {
  
  const { error: taskError } = await supabaseClient
    .from('taches')
    .insert({
      titre: `Premier contact - ${lead.nom}`,
      description: `Contacter ${lead.nom} au ${lead.telephone}. Lead reçu via ${lead.source}.`,
      type: 'premier_contact',
      priorite: 'haute',
      date_echeance: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +24h
      assignee_a: agent.id,
      lead_id: lead.id,
      statut: 'a_faire',
    })

  if (taskError) {
    console.error('Error creating first contact task:', taskError)
  } else {
    console.log(`✅ Task created for agent ${agent.nom} to contact ${lead.nom}`)
  }
}

// ============================================
// Send notification to agent
// ============================================
async function notifyAgent(
  supabaseClient: any,
  lead: Lead,
  agent: Agent
): Promise<void> {
  
  // TODO: Send email/SMS notification
  // For now, just log
  console.log(`📧 Notification: New lead ${lead.nom} assigned to ${agent.nom}`)

  // You could also create a notification record in a notifications table
  const { error: notifError } = await supabaseClient
    .from('notifications')
    .insert({
      user_id: agent.id,
      type: 'new_lead_assigned',
      title: 'Nouveau lead assigné',
      message: `${lead.nom} (${lead.telephone}) vous a été assigné.`,
      data: { lead_id: lead.id },
      read: false,
    })

  if (notifError) {
    console.error('Error creating notification:', notifError)
  }
}

// ============================================
// Main handler
// ============================================
serve(async (req) => {
  try {
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

    // Create Supabase client with service role for updates
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Parse request
    const payload: WebhookPayload = await req.json()

    // ============================================
    // Webhook mode (triggered by database)
    // ============================================
    if (payload.type && payload.table === 'leads') {
      
      // Only process INSERT with no agent assigned
      if (payload.type !== 'INSERT' || payload.record.agent_id) {
        return new Response(
          JSON.stringify({ message: 'Skipped: not a new unassigned lead' }),
          { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      const lead = payload.record

      // Skip if lead is already assigned
      if (lead.agent_id) {
        return new Response(
          JSON.stringify({ message: 'Skipped: lead already has agent' }),
          { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      // Find best agent
      const agent = await findBestAgent(supabaseClient)

      if (!agent) {
        return new Response(
          JSON.stringify({ error: 'No agent available for assignment' }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      // Assign agent to lead
      const { error: updateError } = await supabaseClient
        .from('leads')
        .update({ agent_id: agent.id })
        .eq('id', lead.id)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to assign agent', details: updateError }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      // Create follow-up task
      await createFirstContactTask(supabaseClient, lead, agent)

      // Notify agent
      await notifyAgent(supabaseClient, lead, agent)

      console.log(`✅ Lead ${lead.id} assigned to agent ${agent.nom}`)

      return new Response(
        JSON.stringify({
          success: true,
          lead_id: lead.id,
          assigned_to: {
            id: agent.id,
            nom: agent.nom,
          },
          message: `Lead assigned to ${agent.nom}`,
        }),
        { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // ============================================
    // Manual assignment mode (API call)
    // ============================================
    const body = await req.json()
    const { lead_id, agent_id, auto_assign = false } = body

    if (!lead_id) {
      return new Response(
        JSON.stringify({ error: 'lead_id is required' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Fetch lead
    const { data: lead, error: leadError } = await supabaseClient
      .from('leads')
      .select('id, nom, telephone, source, agent_id')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found', details: leadError }),
        { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    let assignedAgent: Agent

    // Mode 1: Manual assignment with specific agent
    if (agent_id && !auto_assign) {
      const { data: agent, error: agentError } = await supabaseClient
        .from('user_profiles')
        .select('id, nom, email, role')
        .eq('id', agent_id)
        .single()

      if (agentError || !agent) {
        return new Response(
          JSON.stringify({ error: 'Agent not found', details: agentError }),
          { status: 404, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      assignedAgent = agent
    }
    // Mode 2: Auto-assign (round-robin based on workload)
    else if (auto_assign) {
      const agent = await findBestAgent(supabaseClient, lead.agent_id) // Exclude current agent

      if (!agent) {
        return new Response(
          JSON.stringify({ error: 'No agent available' }),
          { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }

      assignedAgent = agent
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Either agent_id or auto_assign=true is required' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Update lead
    const { error: updateError } = await supabaseClient
      .from('leads')
      .update({ agent_id: assignedAgent.id })
      .eq('id', lead_id)

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to assign agent', details: updateError }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Create task
    await createFirstContactTask(supabaseClient, lead, assignedAgent)

    // Notify
    await notifyAgent(supabaseClient, lead, assignedAgent)

    return new Response(
      JSON.stringify({
        success: true,
        lead_id,
        assigned_to: {
          id: assignedAgent.id,
          nom: assignedAgent.nom,
          email: assignedAgent.email,
        },
        auto_assigned: auto_assign,
      }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in auto-assign-agent:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
