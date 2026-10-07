import type { Agent, AssistantContext, AgentRole, AgentMessage } from "./types";
import { PAGE_TO_AGENT_ROLE } from "./types";
import {
  InfrastructureAgent,
  FoncierAgent,
  ComptabilityAgent,
  ImmobilierAgent,
  CommercialAgent,
  RHAgent,
  AnalyticsAgent,
  ProjectManagerAgent,
  DefaultAgent,
} from "./agents";

export class AssistantCore {
  private agents: Map<AgentRole, Agent> = new Map();
  private currentAgent: Agent | null = null;
  private currentContext: AssistantContext | null = null;

  constructor() {
    this.registerAgent(new InfrastructureAgent());
    this.registerAgent(new FoncierAgent());
    this.registerAgent(new ComptabilityAgent());
    this.registerAgent(new ImmobilierAgent());
    this.registerAgent(new CommercialAgent());
    this.registerAgent(new RHAgent());
    this.registerAgent(new AnalyticsAgent());
    this.registerAgent(new ProjectManagerAgent());
    this.registerAgent(new DefaultAgent());
  }

  private registerAgent(agent: Agent): void {
    this.agents.set(agent.role, agent);
  }

  async setContext(context: AssistantContext): Promise<void> {
    this.currentContext = context;

    const role = PAGE_TO_AGENT_ROLE[context.currentPage] ?? "admin";
    const agent = this.agents.get(role) ?? this.agents.get("admin");

    if (agent && agent !== this.currentAgent) {
      this.currentAgent = agent;
      await agent.initialize(context);
    }
  }

  async getGreeting(): Promise<AgentMessage> {
    if (!this.currentAgent) {
      throw new Error("Assistant not initialized");
    }
    return this.currentAgent.getGreeting();
  }

  async processQuery(query: string): Promise<AgentMessage> {
    if (!this.currentAgent) {
      throw new Error("Assistant not initialized");
    }
    return this.currentAgent.processQuery(query);
  }

  async detectAnomalies(): Promise<string[]> {
    if (!this.currentAgent) {
      throw new Error("Assistant not initialized");
    }
    return this.currentAgent.detectAnomalies();
  }

  async generateRecommendations(): Promise<string[]> {
    if (!this.currentAgent) {
      throw new Error("Assistant not initialized");
    }
    return this.currentAgent.generateRecommendations();
  }

  async suggestActions() {
    if (!this.currentAgent) {
      throw new Error("Assistant not initialized");
    }
    return this.currentAgent.suggestActions();
  }

  getCurrentAgent(): Agent | null {
    return this.currentAgent;
  }

  getCurrentContext(): AssistantContext | null {
    return this.currentContext;
  }
}

export const assistantCore = new AssistantCore();

export type { Agent, AssistantContext, AgentRole, AgentMessage, AgentAction } from "./types";
