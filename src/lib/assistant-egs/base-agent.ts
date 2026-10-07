import type { Agent, AgentMessage, AgentAction, AssistantContext, AgentRole } from "./types";

export abstract class BaseAgent implements Agent {
  abstract role: AgentRole;
  abstract name: string;
  abstract description: string;

  protected context: AssistantContext | null = null;

  async initialize(context: AssistantContext): Promise<void> {
    this.context = context;
  }

  abstract getGreeting(): Promise<AgentMessage>;
  abstract processQuery(query: string): Promise<AgentMessage>;
  abstract detectAnomalies(): Promise<string[]>;
  abstract generateRecommendations(): Promise<string[]>;
  abstract suggestActions(): Promise<AgentAction[]>;

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
}
