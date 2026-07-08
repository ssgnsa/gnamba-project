// PostgreSQL direct access (Phase 2: self-hosted mode)
import { from as queryFrom, executeQuery } from "../_shared/db.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Types
interface Lead {
  id: string;
  nom: string;
  telephone: string;
  source: string;
  statut: string;
  agent_id?: string;
  created_at: string;
}

interface Agent {
  id: string;
  nom: string;
  email: string;
  role: string;
  active: boolean;
}

interface AgentWorkload {
  agent_id: string;
  nom: string;
  total_leads: number;
  active_leads: number;
  nouveaux: number;
  qualifies: number;
  conversion_rate: number;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  record: Lead;
  schema: "public";
  old_record: Lead | null;
}

// ============================================
// Find agent with lowest workload
// ============================================
async function findBestAgent(excludeAgentId?: string): Promise<Agent | null> {
  // Get all active agents (gestionnaires and employés)
  const result = await queryFrom("user_profiles")
    .select("id, nom, email, role")
    .eq("active", true)
    .execute();

  const agents = result.data;
  const error = result.error;

  if (error || !agents || (Array.isArray(agents) && agents.length === 0)) {
    console.error("No active agents found:", error);
    return null;
  }

  // Get workload for each agent via SQL (replaces RPC)
  const agentIds = (Array.isArray(agents) ? agents : [agents])
    .map((a: Agent) => a.id)
    .filter((id) => !excludeAgentId || id !== excludeAgentId);

  if (agentIds.length === 0) {
    return null;
  }

  // Execute workload query via PostgreSQL direct (replaces .rpc() call)
  const workloadResult = await executeQuery(
    `SELECT 
      a.id as agent_id,
      p.nom,
      COUNT(l.id) as total_leads,
      COUNT(CASE WHEN l.statut = 'nouveau' THEN 1 END) as nouveaux,
      COUNT(CASE WHEN l.statut = 'qualifie' THEN 1 END) as qualifies,
      COALESCE(AVG(CASE WHEN l.statut = 'converti' THEN 1 ELSE 0 END) * 100, 0) as conversion_rate
    FROM user_profiles p
    LEFT JOIN leads l ON l.agent_id = p.id AND l.statut NOT IN ('archive', 'rejete')
    JOIN user_profiles a ON a.id = p.id
    WHERE p.id = ANY($1::uuid[])
    GROUP BY a.id, p.nom`,
    [agentIds],
  );

  if (workloadResult.error) {
    console.error("Error fetching workload:", workloadResult.error);
    // Fallback: return first agent
    return Array.isArray(agents) ? agents[0] : agents;
  }

  const workloadData = Array.isArray(workloadResult.data)
    ? workloadResult.data
    : workloadResult.data
      ? [workloadResult.data]
      : [];

  if (workloadData.length === 0) {
    return Array.isArray(agents) ? agents[0] : agents;
  }

  // Score each agent
  const scoredAgents = workloadData.map((workload: any) => {
    const totalScore =
      Math.max(0, 100 - (workload.total_leads || 0)) * 0.6 +
      (workload.conversion_rate || 0) * 0.4;

    return {
      ...workload,
      score: totalScore,
    };
  });

  // Sort by score (highest first)
  scoredAgents.sort((a: any, b: any) => b.score - a.score);

  // Return agent with best score
  const bestAgentId = scoredAgents[0].agent_id;
  const allAgents = Array.isArray(agents) ? agents : [agents];
  return allAgents.find((a: Agent) => a.id === bestAgentId) || allAgents[0];
}

// ============================================
// Create first contact task for agent (uses INSERT)
// ============================================
async function createFirstContactTask(lead: Lead, agent: Agent): Promise<void> {
  const taskResult = await executeQuery(
    `INSERT INTO taches (titre, description, type, priorite, date_echeance, assignee_a, lead_id, statut)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      `Premier contact - ${lead.nom}`,
      `Contacter ${lead.nom} au ${lead.telephone}. Lead reçu via ${lead.source}.`,
      "premier_contact",
      "haute",
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      agent.id,
      lead.id,
      "a_faire",
    ],
  );

  if (taskResult.error) {
    console.error("Error creating first contact task:", taskResult.error);
  } else {
    console.log(
      `✅ Task created for agent ${agent.nom} to contact ${lead.nom}`,
    );
  }
}

// ============================================
// Send notification to agent
// ============================================
async function notifyAgent(lead: Lead, agent: Agent): Promise<void> {
  console.log(`📧 Notification: New lead ${lead.nom} assigned to ${agent.nom}`);

  const notifResult = await executeQuery(
    `INSERT INTO notifications (user_id, type, title, message, data, read)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      agent.id,
      "new_lead_assigned",
      "Nouveau lead assigné",
      `${lead.nom} (${lead.telephone}) vous a été assigné.`,
      JSON.stringify({ lead_id: lead.id }),
      false,
    ],
  );

  if (notifResult.error) {
    console.error("Error creating notification:", notifResult.error);
  }
}

// ============================================
// Main handler
// ============================================
serve(async (req) => {
  try {
    const ALLOWED_ORIGINS = [
      "https://gnambaservices.ci",
      "https://www.gnambaservices.ci",
      "https://portal.gnambaservices.ci",
      "http://localhost:5173",
      "http://localhost:8080",
    ];

    const getCorsHeaders = (req: Request): Record<string, string> => {
      const origin = req.headers.get("origin") || "";
      const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
        ? origin
        : "https://gnambaservices.ci";
      return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        Vary: "Origin",
      };
    };

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: getCorsHeaders(req) });
    }

    // Only accept POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // PostgreSQL connection is handled by db.ts (no manual client init needed)

    // Parse request
    const payload: WebhookPayload = await req.json();

    // ============================================
    // Webhook mode (triggered by database)
    // ============================================
    if (payload.type && payload.table === "leads") {
      // Only process INSERT with no agent assigned
      if (payload.type !== "INSERT" || payload.record.agent_id) {
        return new Response(
          JSON.stringify({ message: "Skipped: not a new unassigned lead" }),
          {
            status: 200,
            headers: {
              ...getCorsHeaders(req),
              "Content-Type": "application/json",
            },
          },
        );
      }

      const lead = payload.record;

      // Skip if lead is already assigned
      if (lead.agent_id) {
        return new Response(
          JSON.stringify({ message: "Skipped: lead already has agent" }),
          {
            status: 200,
            headers: {
              ...getCorsHeaders(req),
              "Content-Type": "application/json",
            },
          },
        );
      }

      // Find best agent (now uses PostgreSQL directly)
      const agent = await findBestAgent();

      if (!agent) {
        return new Response(
          JSON.stringify({ error: "No agent available for assignment" }),
          {
            status: 500,
            headers: {
              ...getCorsHeaders(req),
              "Content-Type": "application/json",
            },
          },
        );
      }

      // Assign agent to lead (PostgreSQL direct UPDATE)
      const updateResult = await executeQuery(
        "UPDATE leads SET agent_id = $1 WHERE id = $2 RETURNING id",
        [agent.id, lead.id],
      );

      if (updateResult.error) {
        return new Response(
          JSON.stringify({
            error: "Failed to assign agent",
            details: updateResult.error,
          }),
          {
            status: 500,
            headers: {
              ...getCorsHeaders(req),
              "Content-Type": "application/json",
            },
          },
        );
      }

      // Create follow-up task (now uses PostgreSQL directly)
      await createFirstContactTask(lead, agent);

      // Notify agent (now uses PostgreSQL directly)
      await notifyAgent(lead, agent);

      console.log(`✅ Lead ${lead.id} assigned to agent ${agent.nom}`);

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
        {
          status: 200,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    // ============================================
    // Manual assignment mode (API call)
    // ============================================
    const body = await req.json();
    const { lead_id, agent_id, auto_assign = false } = body;

    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id is required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Fetch lead (PostgreSQL query)
    const leadResult = await queryFrom("leads")
      .select("id, nom, telephone, source, agent_id")
      .eq("id", lead_id)
      .maybeSingle();

    const lead = leadResult.data;
    const leadError = leadResult.error;

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead not found", details: leadError }),
        {
          status: 404,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    let assignedAgent: Agent;

    // Mode 1: Manual assignment with specific agent
    if (agent_id && !auto_assign) {
      const agentResult = await queryFrom("user_profiles")
        .select("id, nom, email, role")
        .eq("id", agent_id)
        .maybeSingle();

      const agent = agentResult.data;
      const agentError = agentResult.error;

      if (agentError || !agent) {
        return new Response(
          JSON.stringify({ error: "Agent not found", details: agentError }),
          {
            status: 404,
            headers: {
              ...getCorsHeaders(req),
              "Content-Type": "application/json",
            },
          },
        );
      }

      assignedAgent = agent as Agent;
    }
    // Mode 2: Auto-assign (round-robin based on workload)
    else if (auto_assign) {
      const agent = await findBestAgent(lead.agent_id); // Exclude current agent

      if (!agent) {
        return new Response(JSON.stringify({ error: "No agent available" }), {
          status: 500,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        });
      }

      assignedAgent = agent;
    } else {
      return new Response(
        JSON.stringify({
          error: "Either agent_id or auto_assign=true is required",
        }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Update lead (PostgreSQL direct UPDATE)
    const updateResult = await executeQuery(
      "UPDATE leads SET agent_id = $1 WHERE id = $2 RETURNING id",
      [assignedAgent.id, lead_id],
    );

    if (updateResult.error) {
      return new Response(
        JSON.stringify({
          error: "Failed to assign agent",
          details: updateResult.error,
        }),
        {
          status: 500,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Create task (PostgreSQL direct INSERT)
    await createFirstContactTask(lead, assignedAgent);

    // Notify (PostgreSQL direct INSERT)
    await notifyAgent(lead, assignedAgent);

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
      {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in auto-assign-agent:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
