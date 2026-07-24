/**
 * DATA LAYER — Bot Repository
 */

import { dbClient, withRetry } from "./client";
import type { QueryResult } from "./client";

type WorkflowAction = {
  delay_minutes?: number | null;
  [key: string]: unknown;
};

type BotWorkflowRow = {
  id: string;
  trigger_type?: string | null;
  trigger_config?: { event?: string; [key: string]: unknown } | null;
  actions?: WorkflowAction[] | null;
  execution_count?: number | null;
  [key: string]: unknown;
};

type CampaignSegmentFilter = {
  tags?: string[];
  min_score?: number | string;
  source?: string;
  repeat?: boolean;
  [key: string]: unknown;
};

type CampaignStats = {
  sent?: number;
  failed?: number;
  [key: string]: unknown;
};

type CampaignRow = {
  id: string;
  name?: string;
  started_at?: string | null;
  channels?: string[];
  template_content?: Record<string, string> | null;
  segment_filter?: CampaignSegmentFilter | null;
  stats?: CampaignStats | null;
  [key: string]: unknown;
};

export const botRepository = {
  async logInteraction(
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("lead_interactions").insert(payload),
    )) as QueryResult<null>;
  },

  async updateLead(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("leads").update(payload).eq("id", id),
    )) as QueryResult<null>;
  },

  async getWorkflows(): Promise<QueryResult<BotWorkflowRow[]>> {
    return (await withRetry(() =>
      dbClient.from("bot_workflows").select("*").eq("status", "active"),
    )) as QueryResult<BotWorkflowRow[]>;
  },

  async getCampaignById(id: string): Promise<QueryResult<CampaignRow>> {
    return (await withRetry(() =>
      dbClient.from("lead_campaigns").select("*").eq("id", id).single(),
    )) as QueryResult<CampaignRow>;
  },

  async updateWorkflow(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("bot_workflows").update(payload).eq("id", id),
    )) as QueryResult<null>;
  },

  async updateCampaign(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<QueryResult<null>> {
    return (await withRetry(() =>
      dbClient.from("lead_campaigns").update(payload).eq("id", id),
    )) as QueryResult<null>;
  },
};
