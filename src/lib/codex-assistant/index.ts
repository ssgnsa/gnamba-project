export * from "./types";
export * from "./context-manager";
export * from "./diagnostic-engine";
export * from "./migration-assistant";
export * from "./command-registry";

import { ContextManager } from "./context-manager";
import { DiagnosticEngine } from "./diagnostic-engine";
import { MigrationAssistant } from "./migration-assistant";
import { CommandRegistry } from "./command-registry";
import type { CommandResult, MigrationPhase, ServerContext } from "./types";

export class CodexAssistant {
  private contextManager: ContextManager;
  private diagnosticEngine: DiagnosticEngine;
  private migrationAssistant: MigrationAssistant;
  private commandRegistry: CommandRegistry;

  constructor(initialContext?: ServerContext) {
    this.contextManager = new ContextManager(initialContext);
    this.diagnosticEngine = new DiagnosticEngine(this.contextManager);
    this.migrationAssistant = new MigrationAssistant(this.contextManager);
    this.commandRegistry = new CommandRegistry(
      this.contextManager,
      this.diagnosticEngine,
      this.migrationAssistant,
    );
  }

  async execute(
    command: string,
    args: { phase?: MigrationPhase; plan?: boolean } = {},
  ): Promise<CommandResult> {
    return this.commandRegistry.execute(command, args);
  }

  getCommands(): string[] {
    return this.commandRegistry.getCommands();
  }

  async status(): Promise<CommandResult> {
    return this.execute("status");
  }

  async health(): Promise<CommandResult> {
    return this.execute("health");
  }

  async migrate(phase?: MigrationPhase): Promise<CommandResult> {
    return this.execute("migrate", { phase });
  }

  async plan(): Promise<CommandResult> {
    return this.execute("plan");
  }

  async backup(): Promise<CommandResult> {
    return this.execute("backup");
  }

  async rollback(): Promise<CommandResult> {
    return this.execute("rollback");
  }

  async optimize(): Promise<CommandResult> {
    return this.execute("optimize");
  }

  async docs(): Promise<CommandResult> {
    return this.execute("docs");
  }
}

export const codex = new CodexAssistant();
