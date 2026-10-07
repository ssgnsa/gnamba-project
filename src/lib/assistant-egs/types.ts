export type AgentRole =
  | "infrastructure"
  | "foncier"
  | "comptabilité"
  | "immobilier"
  | "commercial"
  | "rh"
  | "documents"
  | "compliance"
  | "analytics"
  | "project-manager"
  | "admin";

export interface AssistantMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  category?: "alert" | "info" | "recommendation" | "action";
  metadata?: Record<string, unknown>;
}

export interface AssistantContext {
  currentPage: string;
  currentRole: AgentRole;
  userData?: {
    name?: string;
    role?: string;
    permissions?: string[];
  };
  moduleData?: Record<string, unknown>;
}

export interface AgentMessage {
  greeting?: string;
  summary?: string;
  alerts?: string[];
  recommendations?: string[];
  actions?: AgentAction[];
}

export interface AgentAction {
  id: string;
  label: string;
  description: string;
  action: () => Promise<void> | void;
  variant?: "default" | "primary" | "destructive";
}

export interface Agent {
  role: AgentRole;
  name: string;
  description: string;
  initialize(context: AssistantContext): Promise<void>;
  getGreeting(): Promise<AgentMessage>;
  processQuery(query: string): Promise<AgentMessage>;
  detectAnomalies(): Promise<string[]>;
  generateRecommendations(): Promise<string[]>;
  suggestActions(): Promise<AgentAction[]>;
}

export const PAGE_TO_AGENT_ROLE: Record<string, AgentRole> = {
  dashboard: "analytics",
  clients: "commercial",
  projets: "project-manager",
  immobilier: "immobilier",
  foncier: "foncier",
  "catalogue-lots": "foncier",
  fournitures: "analytics",
  finances: "comptabilité",
  employes: "rh",
  utilisateurs: "admin",
  fournisseurs: "commercial",
  documents: "documents",
  taches: "project-manager",
  statistiques: "analytics",
  parametres: "infrastructure",
  "codex-assistant": "infrastructure",
  "site-editor": "admin",
  media: "documents",
  registre: "commercial",
  leads: "commercial",
};
