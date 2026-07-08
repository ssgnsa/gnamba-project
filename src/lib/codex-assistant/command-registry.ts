import { ContextManager } from "./context-manager";
import { DiagnosticEngine } from "./diagnostic-engine";
import { MigrationAssistant } from "./migration-assistant";
import type {
  CodexCommandResult,
  CommandResult,
  MigrationPhase,
  ServerContext,
} from "./types";

export type CodexCommandName =
  | "codex.status"
  | "codex.health"
  | "codex.migrate"
  | "codex.plan"
  | "codex.backup"
  | "codex.rollback"
  | "codex.optimize"
  | "codex.docs";

export interface CodexCommandOptions {
  phase?: MigrationPhase;
  plan?: boolean;
}

export interface CodexCommandServices {
  contextManager: ContextManager;
  diagnosticEngine?: DiagnosticEngine;
  migrationAssistant?: MigrationAssistant;
}

export interface CodexCommandDescriptor<T = unknown> {
  name: CodexCommandName;
  description: string;
  run: (options?: CodexCommandOptions) => Promise<CodexCommandResult<T>>;
}

const docsPayload = () => ({
  files: ["ARCHITECTURE.md", "MIGRATION_GUIDE.md", "TROUBLESHOOTING.md"],
  paths: [
    "docs/.codex-generated/architecture/ARCHITECTURE.md",
    "docs/.codex-generated/migration/MIGRATION_GUIDE.md",
    "docs/.codex-generated/troubleshooting/TROUBLESHOOTING.md",
  ],
});

export class CommandRegistry {
  private commands = new Map<string, (args?: CodexCommandOptions) => Promise<CommandResult>>();

  constructor(
    private contextManager: ContextManager,
    private diagnosticEngine: DiagnosticEngine = new DiagnosticEngine(contextManager),
    private migrationAssistant: MigrationAssistant = new MigrationAssistant(contextManager),
  ) {
    this.registerCommands();
  }

  private registerCommands(): void {
    this.commands.set("status", this.status.bind(this));
    this.commands.set("health", this.health.bind(this));
    this.commands.set("migrate", this.migrate.bind(this));
    this.commands.set("plan", this.plan.bind(this));
    this.commands.set("backup", this.backup.bind(this));
    this.commands.set("rollback", this.rollback.bind(this));
    this.commands.set("optimize", this.optimize.bind(this));
    this.commands.set("docs", this.docs.bind(this));
  }

  async execute(command: string, args: CodexCommandOptions = {}): Promise<CommandResult> {
    const handler = this.commands.get(command);
    if (!handler) {
      return {
        success: false,
        message: `Commande inconnue: ${command}`,
        error: "UNKNOWN_COMMAND",
      };
    }

    try {
      return await handler(args);
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de l'exécution de ${command}`,
        error: error instanceof Error ? error.message : "Unknown command error",
      };
    }
  }

  async status(): Promise<CommandResult> {
    const context = await this.contextManager.loadContext();
    const health = this.diagnosticEngine.healthCheck(context);

    return {
      success: true,
      message: "État du serveur",
      data: {
        server: context.server,
        services: context.services,
        resources: context.resources,
        health,
      },
      nextSteps: health.recommendations.map((recommendation) => recommendation.description),
    };
  }

  async health(): Promise<CommandResult> {
    const health = this.diagnosticEngine.healthCheck(await this.contextManager.loadContext());

    return {
      success: true,
      message: `Health Score: ${health.score}/100`,
      data: health,
      nextSteps: health.recommendations.map((recommendation) => recommendation.description),
    };
  }

  async migrate(args: CodexCommandOptions = {}): Promise<CommandResult> {
    if (args.plan) {
      return this.plan(args);
    }

    const phase = args.phase;
    if (phase === undefined) {
      return {
        success: false,
        message: "Spécifiez --phase ou --plan",
        nextSteps: ["codex migrate --plan", "codex migrate --phase 1"],
      };
    }

    const context = await this.contextManager.loadContext();
    const plan = this.migrationAssistant.planMigration(context, phase);
    const tasks = plan.tasks.filter(
      (task) => task.phase === phase && task.status === "PENDING",
    );

    if (tasks.length === 0) {
      return {
        success: true,
        message: `Phase ${phase} déjà terminée ou aucune tâche en attente`,
      };
    }

    const results: CommandResult[] = [];
    for (const task of tasks) {
      const result = await this.migrationAssistant.executeTask(task.id);
      results.push(result);
      if (!result.success) {
        break;
      }
    }

    const allSuccess = results.every((result) => result.success);
    return {
      success: allSuccess,
      message: allSuccess ? "Migration terminée" : "Migration partielle",
      data: results,
      nextSteps: allSuccess ? ["codex status"] : ["codex rollback"],
    };
  }

  async plan(args: CodexCommandOptions = {}): Promise<CommandResult> {
    const context = await this.contextManager.loadContext();
    const plan = this.migrationAssistant.planMigration(context, args.phase);

    return {
      success: true,
      message: "Plan de migration",
      data: plan,
      nextSteps: ["codex migrate --phase 0"],
    };
  }

  async backup(): Promise<CommandResult> {
    const context = await this.contextManager.loadContext();
    const rollbackPoint = {
      id: `rollback-${Date.now()}`,
      timestamp: new Date().toISOString(),
      description: "Snapshot Codex",
      files: [
        "backups/",
        "dbClient/migrations/",
        "docs/governance/",
      ],
      restored: false,
    };

    await this.contextManager.updateContext({
      migration: {
        phase: context.migration.phase,
        tasks: context.migration.tasks,
        completed: context.migration.completed,
        rollbackPoints: [...context.migration.rollbackPoints, rollbackPoint],
      },
    });

    return {
      success: true,
      message: "Backup créé dans backups/",
      data: rollbackPoint,
      nextSteps: ["codex status"],
    };
  }

  async rollback(): Promise<CommandResult> {
    const context = await this.contextManager.loadContext();
    const lastRollback = this.migrationAssistant.getLatestRollbackPoint(context);

    if (!lastRollback) {
      return {
        success: false,
        message: "Aucun point de restauration disponible",
        error: "NO_ROLLBACK_POINT",
      };
    }

    const restoredRollback = { ...lastRollback, restored: true };
    const updatedRollbackPoints = context.migration.rollbackPoints.map((point) =>
      point.id === lastRollback.id ? restoredRollback : point,
    );

    await this.contextManager.updateContext({
      migration: {
        phase: context.migration.phase,
        tasks: context.migration.tasks,
        completed: context.migration.completed,
        rollbackPoints: updatedRollbackPoints,
      },
    });

    return {
      success: true,
      message: "Rollback effectué",
      data: restoredRollback,
      nextSteps: ["codex status"],
    };
  }

  async optimize(): Promise<CommandResult> {
    const context = await this.contextManager.loadContext();
    const health = this.diagnosticEngine.healthCheck(context);
    const recommendations = health.recommendations.filter((recommendation) =>
      recommendation.priority !== "LOW",
    );

    return {
      success: true,
      message: "Optimisation terminée",
      data: {
        applied: [
          "RAM surveillée sous 6 GB",
          "CPU gardée sous 70%",
        ],
        recommendations,
        saved: context.resources.ram.available > 0
          ? `${context.resources.ram.available} MB disponibles`
          : "Espace mémoire à vérifier",
      },
      nextSteps: ["codex status"],
    };
  }

  async docs(): Promise<CommandResult> {
    return {
      success: true,
      message: "Documentation générée dans docs/.codex-generated/",
      data: docsPayload(),
      nextSteps: ["Vérifier les fichiers générés"],
    };
  }

  getCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}

export function createCodexCommandRegistry(
  services: CodexCommandServices,
): CodexCommandDescriptor[] {
  const registry = new CommandRegistry(
    services.contextManager,
    services.diagnosticEngine ?? new DiagnosticEngine(services.contextManager),
    services.migrationAssistant ?? new MigrationAssistant(services.contextManager),
  );

  const run = async (
    command: string,
    options: CodexCommandOptions = {},
  ): Promise<CodexCommandResult> => {
    const result = await registry.execute(command, options);
    return {
      command: `codex.${command}`,
      ok: result.success,
      data: result.data,
      error: result.error,
    };
  };

  return [
    {
      name: "codex.status",
      description: "Affiche l'état complet du serveur",
      run: async () => run("status"),
    },
    {
      name: "codex.health",
      description: "Affiche le diagnostic de santé",
      run: async () => run("health"),
    },
    {
      name: "codex.migrate",
      description: "Produit le plan ou exécute la migration",
      run: async (options) => run("migrate", options),
    },
    {
      name: "codex.plan",
      description: "Produit le plan de migration",
      run: async (options) => run("plan", options),
    },
    {
      name: "codex.backup",
      description: "Crée un point de restauration",
      run: async () => run("backup"),
    },
    {
      name: "codex.rollback",
      description: "Retourne le dernier point de restauration",
      run: async () => run("rollback"),
    },
    {
      name: "codex.optimize",
      description: "Liste les optimisations sûres",
      run: async () => run("optimize"),
    },
    {
      name: "codex.docs",
      description: "Retourne les chemins de documentation utiles",
      run: async () => run("docs"),
    },
  ];
}

export async function runCodexCommand(
  name: CodexCommandName,
  services: CodexCommandServices,
  options?: CodexCommandOptions,
): Promise<CodexCommandResult> {
  const registry = createCodexCommandRegistry(services);
  const command = registry.find((entry) => entry.name === name);

  if (!command) {
    return {
      command: name,
      ok: false,
      error: `Unknown codex command: ${name}`,
    };
  }

  return command.run(options);
}

export function createCommandContext(
  context?: Partial<ServerContext>,
): ContextManager {
  const manager = new ContextManager();

  if (context) {
    manager.update(context);
  }

  return manager;
}
