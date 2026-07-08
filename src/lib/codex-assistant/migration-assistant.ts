import { ContextManager } from "./context-manager";
import type {
  CommandResult,
  MigrationPhase,
  MigrationPlan,
  MigrationTask,
  RollbackPoint,
  ServerContext,
} from "./types";

type PhaseDefinition = {
  id: MigrationPhase;
  name: string;
  tasks: string[];
};

const PHASES: PhaseDefinition[] = [
  { id: 0, name: "Preparation", tasks: ["freeze", "backup", "inventory"] },
  { id: 1, name: "Isolation", tasks: ["network", "setup-core"] },
  { id: 2, name: "Migration", tasks: ["schema", "data", "auth"] },
  { id: 3, name: "Cutover", tasks: ["switch-api", "disable-old"] },
  { id: 4, name: "Cleanup", tasks: ["remove-old", "optimize"] },
  { id: 5, name: "Validation", tasks: ["test-all", "document"] },
];

const TASK_DESCRIPTIONS: Record<string, string> = {
  "0-freeze": "Geler l'état actuel du serveur",
  "0-backup": "Créer un backup complet",
  "0-inventory": "Inventorier les services et données",
  "1-network": "Créer le réseau Docker isolé",
  "1-setup-core": "Installer API locale Core",
  "2-schema": "Migrer le schéma de base de données",
  "2-data": "Migrer les données",
  "2-auth": "Migrer l'authentification",
  "3-switch-api": "Basculer vers la nouvelle API",
  "3-disable-old": "Désactiver les anciens services",
  "4-remove-old": "Supprimer les anciens conteneurs",
  "4-optimize": "Optimiser les ressources",
  "5-test-all": "Tester tous les services",
  "5-document": "Documenter la migration",
};

const TASK_SCRIPTS: Record<string, string[]> = {
  "0-freeze": ["mkdir -p backups/freeze-$(date +%Y%m%d)"],
  "0-backup": [
    "docker exec egs-postgres-local pg_dump -U postgres > backups/freeze-$(date +%Y%m%d)/postgres_dump.sql",
  ],
  "0-inventory": ["bash .codex/scripts/inventory.sh"],
  "1-network": ["docker network create dbClient-core-net 2>/dev/null || true"],
  "1-setup-core": ["mkdir -p /mnt/data/dbClient-core/{db,storage,studio}"],
  "2-schema": [
    "docker exec -i dbClient-core-db psql -U postgres < migrations/schema.sql",
  ],
  "2-data": [
    "cat /tmp/data.sql | docker exec -i dbClient-core-db psql -U postgres",
  ],
  "2-auth": ["bash .codex/scripts/auth-cutover.sh"],
  "3-switch-api": ['sed -i "s/local-db:54322/local-api:8000/g" .env'],
  "3-disable-old": [
    "docker stop egs-postgrest egs-keycloak 2>/dev/null || true",
  ],
  "4-remove-old": ["docker rm egs-postgrest egs-keycloak 2>/dev/null || true"],
  "4-optimize": ["docker system prune -f"],
  "5-test-all": ["bash .codex/scripts/healthcheck.sh"],
  "5-document": ["bash .codex/scripts/generate-docs.sh"],
};

const TASK_VALIDATIONS: Record<string, string[]> = {
  "0-freeze": ["test -f backups/freeze-*/postgres_dump.sql"],
  "1-network": ["docker network inspect dbClient-core-net"],
  "2-schema": ['docker exec dbClient-core-db psql -U postgres -c "\\dt"'],
  "3-switch-api": ["curl -s http://local-api:8000/health"],
  "5-test-all": ["curl -s http://local-api:3000"],
};

const TASK_ROLLBACKS: Record<string, string[]> = {
  "3-switch-api": ['sed -i "s/local-api:8000/local-db:54322/g" .env'],
  "3-disable-old": [
    "docker start egs-postgrest egs-keycloak 2>/dev/null || true",
  ],
  "4-remove-old": [
    "docker start egs-postgrest egs-keycloak 2>/dev/null || true",
  ],
};

const createTask = (
  phase: MigrationPhase,
  taskName: string,
  completed: boolean,
): MigrationTask => {
  const id = `${phase}-${taskName}`;
  return {
    id,
    phase,
    name: taskName,
    description: TASK_DESCRIPTIONS[id] ?? `${taskName} (phase ${phase})`,
    status: completed ? "COMPLETED" : "PENDING",
    scripts: TASK_SCRIPTS[id] ? [...TASK_SCRIPTS[id]] : [],
    validation: TASK_VALIDATIONS[id] ? [...TASK_VALIDATIONS[id]] : [],
    rollback: TASK_ROLLBACKS[id] ? [...TASK_ROLLBACKS[id]] : [],
    completedAt: completed ? new Date().toISOString() : undefined,
  };
};

const getPhaseDefinition = (phase: MigrationPhase): PhaseDefinition =>
  PHASES.find((entry) => entry.id === phase) ?? PHASES[0];

const estimateDuration = (remainingTasks: number): string => {
  const minutes = remainingTasks * 5;
  if (minutes < 60) {
    return `${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const createRollbackChecklist = (context: ServerContext): string[] => {
  const latestRollback = context.migration.rollbackPoints.slice(-1)[0];

  if (!latestRollback) {
    return [
      "Créer un snapshot avant de tenter une coupure",
      "Conserver le dump PostgreSQL et les volumes persistants",
    ];
  }

  return [
    `Point de retour disponible: ${latestRollback.description}`,
    "Vérifier que le snapshot est restaurable",
    "Valider le périmètre de données couvert",
  ];
};

export class MigrationAssistant {
  constructor(private contextManager: ContextManager = new ContextManager()) {}

  planMigration(
    context: ServerContext = this.contextManager.getSnapshot(),
    phase?: MigrationPhase,
  ): MigrationPlan {
    const currentPhase = phase ?? context.migration.phase ?? 0;
    const tasks: MigrationTask[] = [];

    for (const definition of PHASES) {
      for (const taskName of definition.tasks) {
        const id = `${definition.id}-${taskName}`;
        const completed = context.migration.completed.includes(id);
        tasks.push(createTask(definition.id, taskName, completed));
      }
    }

    const totalTasks = tasks.filter(
      (task) => task.status !== "COMPLETED",
    ).length;
    const phaseDefinition = getPhaseDefinition(currentPhase);

    return {
      currentPhase,
      totalPhases: PHASES.length,
      tasks,
      estimatedDuration: estimateDuration(totalTasks),
      prerequisites: this.getPrerequisites(currentPhase),
      phaseName: phaseDefinition.name,
      nextPhase:
        currentPhase < 5 ? ((currentPhase + 1) as MigrationPhase) : null,
      rollbackChecklist: createRollbackChecklist(context),
    };
  }

  getRoadmap(): PhaseDefinition[] {
    return PHASES.map((phase) => ({
      id: phase.id,
      name: phase.name,
      tasks: [...phase.tasks],
    }));
  }

  async executeTask(taskId: string): Promise<CommandResult> {
    const plan = this.planMigration();
    const task = plan.tasks.find((entry) => entry.id === taskId);

    if (!task) {
      return {
        success: false,
        message: `Tâche ${taskId} non trouvée`,
        error: "INVALID_TASK",
      };
    }

    try {
      for (const script of task.scripts) {
        await this.executeScript(script);
      }

      for (const validation of task.validation) {
        const valid = await this.executeScript(validation);
        if (!valid) {
          throw new Error(`Validation échouée: ${validation}`);
        }
      }

      const context = await this.contextManager.loadContext();
      const completed = new Set(context.migration.completed);
      completed.add(taskId);
      await this.contextManager.updateContext({
        migration: {
          phase: Math.max(
            context.migration.phase,
            task.phase,
          ) as MigrationPhase,
          tasks: context.migration.tasks,
          completed: Array.from(completed),
          rollbackPoints: context.migration.rollbackPoints,
        },
      });

      return {
        success: true,
        message: `Tâche ${taskId} terminée avec succès`,
        nextSteps: this.getNextSteps(task),
      };
    } catch (error) {
      for (const rollback of task.rollback) {
        await this.executeScript(rollback);
      }

      return {
        success: false,
        message: `Échec de la tâche ${taskId}`,
        error:
          error instanceof Error ? error.message : "Unknown migration error",
        nextSteps: ["Exécuter le rollback", "Vérifier les logs"],
      };
    }
  }

  getLatestRollbackPoint(
    context: ServerContext = this.contextManager.getSnapshot(),
  ): RollbackPoint | null {
    return context.migration.rollbackPoints.slice(-1)[0] ?? null;
  }

  private async executeScript(script: string): Promise<boolean> {
    // Le scaffold ne parle pas encore à Docker ou au shell.
    // On journalise simplement les scripts pour préparer l'intégration future.
    console.log(`📝 Exécution: ${script}`);
    return true;
  }

  private getNextSteps(task: MigrationTask): string[] {
    const nextSteps: Record<string, string[]> = {
      "0-freeze": ['Exécuter "codex migrate --phase 1"'],
      "1-setup-core": ['Exécuter "codex migrate --phase 2"'],
      "2-auth": ['Exécuter "codex migrate --phase 3"'],
      "3-disable-old": ['Exécuter "codex migrate --phase 4"'],
      "4-optimize": ['Exécuter "codex migrate --phase 5"'],
    };

    return nextSteps[task.id] ?? ["Continuer avec la prochaine tâche"];
  }

  private getPrerequisites(phase: MigrationPhase): string[] {
    const prerequisites: Record<MigrationPhase, string[]> = {
      0: ["Docker en cours d'exécution"],
      1: ["Phase 0 terminée", "Backup disponible"],
      2: ["Phase 1 terminée", "API locale Core installé"],
      3: ["Phase 2 terminée", "Données migrées"],
      4: ["Phase 3 terminée"],
      5: ["Phase 4 terminée"],
    };

    return prerequisites[phase] ?? ["Phase précédente terminée"];
  }
}
