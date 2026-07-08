import { ContextManager, createDefaultServerContext } from "./context-manager";
import type {
  CheckResult,
  Conflict,
  HealthCheck,
  HealthIssue,
  Issue,
  Recommendation,
  ServerContext,
  ServiceStatus,
} from "./types";

const severityOrder: Record<CheckResult["severity"], number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const severityPriority: Record<CheckResult["severity"], Recommendation["priority"]> = {
  CRITICAL: "HIGH",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

const hasRunning = (service: ServiceStatus): boolean => service.status === "running" && service.healthy;

const getPseudoStack = (context: ServerContext): ServerContext["services"]["pseudoStack"] =>
  context.services?.pseudoStack ?? context.dbClient?.pseudoStack ?? createDefaultServerContext().services.pseudoStack;

const getCoreStack = (context: ServerContext): ServerContext["services"]["coreStack"] =>
  context.services?.coreStack ?? context.dbClient?.coreStack ?? createDefaultServerContext().services.coreStack;

const getRamSnapshot = (context: ServerContext): { total: number; used: number; available: number } => {
  const resources = context.resources;
  if (resources.ram) {
    return resources.ram;
  }

  if (resources.ramMb) {
    return resources.ramMb;
  }

  return { total: 0, used: 0, available: 0 };
};

export class DiagnosticEngine {
  constructor(private contextManager: ContextManager = new ContextManager()) {}

  healthCheck(context: ServerContext = this.contextManager.getSnapshot()): HealthCheck {
    const normalized = this.normalizeContext(context);
    const checks = {
      docker: this.checkDocker(normalized),
      postgres: this.checkPostgres(normalized),
      ports: this.checkPorts(normalized),
      auth: this.checkAuth(normalized),
      api: this.checkAPI(normalized),
      resources: this.checkResources(normalized),
      studio: this.checkStudio(normalized),
      migration: this.checkMigration(normalized),
    };

    const conflicts = this.detectConflicts(normalized);
    const issues = this.collectIssues(checks);
    const healthIssues = this.collectHealthIssues(normalized, checks, conflicts);
    const recommendations = this.generateRecommendations(issues, conflicts, healthIssues);

    return {
      score: this.calculateScore(checks, conflicts),
      checks,
      issues,
      conflicts,
      recommendations,
      healthIssues,
      timestamp: new Date().toISOString(),
    };
  }

  private normalizeContext(context: ServerContext): ServerContext {
    const services = context.services ?? context.dbClient ?? createDefaultServerContext().services;

    return {
      ...createDefaultServerContext(),
      ...context,
      services,
      dbClient: services,
    };
  }

  private checkDocker(context: ServerContext): CheckResult {
    if (context.docker.containers.length > 0) {
      return {
        healthy: true,
        severity: "LOW",
        message: `${context.docker.containers.length} conteneurs actifs`,
      };
    }

    return {
      healthy: false,
      severity: "CRITICAL",
      message: "Docker ne tourne pas ou aucun conteneur",
      recommendation: "sudo systemctl start docker",
    };
  }

  private checkPostgres(context: ServerContext): CheckResult {
    const pg = getPseudoStack(context).postgres;
    if (hasRunning(pg)) {
      return {
        healthy: true,
        severity: "LOW",
        message: "PostgreSQL actif sur port 54322",
      };
    }

    return {
      healthy: false,
      severity: "CRITICAL",
      message: "PostgreSQL non actif",
      recommendation: "npm run db:local:start",
    };
  }

  private checkPorts(context: ServerContext): CheckResult {
    const usedPorts = context.docker.containers
      .flatMap((container) => {
        const matches = container.ports.match(/\d+/g);
        return matches ? matches.map(Number) : [];
      })
      .filter((port) => port > 0);

    const criticalPorts = [3000, 5432, 8000, 8080, 9999];
    const conflicts = criticalPorts.filter((port) => usedPorts.includes(port));

    if (conflicts.length === 0) {
      return {
        healthy: true,
        severity: "LOW",
        message: "Aucun conflit de ports",
      };
    }

    return {
      healthy: false,
      severity: "HIGH",
      message: `Conflit de ports: ${conflicts.join(", ")}`,
      recommendation: `Vérifier l'utilisation des ports ${conflicts.join(", ")}`,
    };
  }

  private checkAuth(context: ServerContext): CheckResult {
    const pseudoStack = getPseudoStack(context);
    const coreStack = getCoreStack(context);
    const hasKeycloak = pseudoStack.keycloak.status === "running";
    const hasGoTrue = coreStack.auth.status === "running";

    if (hasKeycloak && hasGoTrue) {
      return {
        healthy: false,
        severity: "HIGH",
        message: "Double système d'auth (Keycloak + GoTrue)",
        recommendation: "Migrer vers GoTrue uniquement",
      };
    }

    if (hasKeycloak || hasGoTrue) {
      return {
        healthy: true,
        severity: "LOW",
        message: "Un système d'auth présent",
      };
    }

    return {
      healthy: false,
      severity: "MEDIUM",
      message: "Aucun système d'auth détecté",
      recommendation: "Installer GoTrue ou Keycloak",
    };
  }

  private checkAPI(context: ServerContext): CheckResult {
    const pseudoStack = getPseudoStack(context);
    const coreStack = getCoreStack(context);
    const hasPostgrest = pseudoStack.postgrest.status === "running";
    const hasKong = coreStack.kong.status === "running";

    if (hasPostgrest && hasKong) {
      return {
        healthy: false,
        severity: "HIGH",
        message: "Double API (PostgREST + Kong)",
        recommendation: "Migrer vers Kong uniquement",
      };
    }

    if (hasKong || hasPostgrest) {
      return {
        healthy: true,
        severity: "LOW",
        message: "API présente",
      };
    }

    return {
      healthy: false,
      severity: "MEDIUM",
      message: "Aucune API détectée",
      recommendation: "Installer Kong ou PostgREST",
    };
  }

  private checkResources(context: ServerContext): CheckResult {
    const ram = getRamSnapshot(context);
    const usagePercent = ram.total > 0 ? (ram.used / ram.total) * 100 : 0;

    if (usagePercent < 70) {
      return {
        healthy: true,
        severity: "LOW",
        message: `RAM: ${ram.used}MB/${ram.total}MB (${Math.round(usagePercent)}%)`,
      };
    }

    if (usagePercent < 85) {
      return {
        healthy: false,
        severity: "MEDIUM",
        message: `RAM élevée: ${Math.round(usagePercent)}% utilisé`,
        recommendation: "Optimiser les conteneurs",
      };
    }

    return {
      healthy: false,
      severity: "CRITICAL",
      message: `RAM critique: ${Math.round(usagePercent)}% utilisé`,
      recommendation: "Urgent: optimiser ou augmenter la RAM",
    };
  }

  private checkStudio(context: ServerContext): CheckResult {
    const pseudoStack = getPseudoStack(context);
    const coreStack = getCoreStack(context);
    const studio = pseudoStack.studio;
    const coreStudio = coreStack.studio;

    if (studio.status === "unhealthy" || coreStudio.status === "unhealthy") {
      return {
        healthy: false,
        severity: "MEDIUM",
        message: "API locale Studio unhealthy",
        recommendation: "Redémarrer API locale Studio ou vérifier les logs",
      };
    }

    return {
      healthy: true,
      severity: "LOW",
      message: "API locale Studio sain",
    };
  }

  private checkMigration(context: ServerContext): CheckResult {
    const hasBackup = context.migration.rollbackPoints.length > 0;

    if (!hasBackup) {
      return {
        healthy: false,
        severity: "HIGH",
        message: "Aucun point de restauration",
        recommendation: "Créer un snapshot de sécurité",
      };
    }

    return {
      healthy: true,
      severity: "LOW",
      message: `${context.migration.rollbackPoints.length} points de restauration`,
    };
  }

  private detectConflicts(context: ServerContext): Conflict[] {
    const conflicts: Conflict[] = [];
    const pseudoStack = getPseudoStack(context);
    const coreStack = getCoreStack(context);

    if (pseudoStack.postgrest.status === "running" && coreStack.kong.status === "running") {
      conflicts.push({
        id: "api-conflict",
        type: "API_CONFLICT",
        severity: "HIGH",
        details:
          "PostgREST manuel et composants API API locale cible sont actifs en parallèle.",
        remediation:
          "Conserver un seul chemin API pendant la migration, puis couper le service redondant.",
      });
    }

    if (pseudoStack.keycloak.status === "running" && coreStack.auth.status === "running") {
      conflicts.push({
        id: "auth-conflict",
        type: "AUTH_CONFLICT",
        severity: "HIGH",
        details: "Keycloak et GoTrue sont tous les deux actifs.",
        remediation:
          "Choisir une seule stratégie d'authentification avant la bascule.",
      });
    }

    if (pseudoStack.studio.status === "unhealthy") {
      conflicts.push({
        id: "studio-unhealthy",
        type: "STACK_FRAGMENTATION",
        severity: "MEDIUM",
        details: "API locale Studio est signalé unhealthy.",
        remediation:
          "Redémarrer ou isoler Studio après avoir vérifié les données persistantes.",
      });
    }

    const ram = getRamSnapshot(context);
    if (ram.available > 0 && ram.available < 2048) {
      conflicts.push({
        id: "ram-pressure",
        type: "RESOURCE_PRESSURE",
        severity: "MEDIUM",
        details: "La mémoire disponible est faible pour une double stack.",
        remediation:
          "Réduire le nombre de services actifs avant de déployer la stack officielle.",
      });
    }

    const usedPorts = context.docker.containers
      .flatMap((container) => {
        const matches = container.ports.match(/\d+/g);
        return matches ? matches.map(Number) : [];
      })
      .filter((port) => port > 0);

    const duplicates = usedPorts.filter(
      (port, index) => usedPorts.indexOf(port) !== index,
    );

    if (duplicates.length > 0) {
      conflicts.push({
        id: "port-conflict",
        type: "PORT_CONFLICT",
        severity: "HIGH",
        details: `Ports dupliqués détectés: ${Array.from(new Set(duplicates)).join(", ")}`,
        remediation: "Réattribuer les ports avant la bascule",
      });
    }

    return conflicts;
  }

  private collectIssues(checks: Record<string, CheckResult>): Issue[] {
    const issues: Issue[] = [];

    for (const [service, result] of Object.entries(checks)) {
      if (!result.healthy) {
        issues.push({
          service,
          severity: result.severity,
          message: result.message,
          recommendation: result.recommendation,
        });
      }
    }

    return issues.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
  }

  private collectHealthIssues(
    context: ServerContext,
    checks: Record<string, CheckResult>,
    conflicts: Conflict[],
  ): HealthIssue[] {
    const issues: HealthIssue[] = [];

    for (const [service, result] of Object.entries(checks)) {
      if (result.healthy) {
        continue;
      }

      issues.push({
        id: `${service}-issue`,
        severity: this.toLegacySeverity(result.severity),
        area: this.mapArea(service),
        title: this.titleForService(service),
        details: result.message,
        remediation: result.recommendation ?? "Vérifier le service concerné",
      });
    }

    for (const conflict of conflicts) {
      issues.push({
        id: conflict.id,
        severity: this.toLegacySeverity(conflict.severity),
        area: this.mapConflictArea(conflict.type),
        title: this.titleForConflict(conflict.type),
        details: conflict.details,
        remediation: conflict.remediation,
      });
    }

    if (context.migration.rollbackPoints.length === 0) {
      issues.push({
        id: "rollback-missing",
        severity: "medium",
        area: "migration",
        title: "Point de rollback non matérialisé",
        details: "Aucun point de restauration n'est référencé dans le contexte.",
        remediation: "Enregistrer un snapshot avant toute opération de migration.",
      });
    }

    return issues;
  }

  private generateRecommendations(
    issues: Issue[],
    conflicts: Conflict[],
    healthIssues: HealthIssue[],
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const issue of issues) {
      if (issue.recommendation) {
        recommendations.push({
          action: issue.service,
          description: issue.recommendation,
          priority: severityPriority[issue.severity],
        });
      }
    }

    for (const conflict of conflicts) {
      recommendations.push({
        action: conflict.type,
        description: conflict.remediation,
        priority: severityPriority[conflict.severity],
      });
    }

    if (healthIssues.some((issue) => issue.severity === "critical")) {
      recommendations.unshift({
        action: "Sécurité",
        description: "Créer un snapshot de sécurité avant toute modification",
        priority: "HIGH",
      });
    }

    return recommendations;
  }

  private calculateScore(
    checks: Record<string, CheckResult>,
    conflicts: Conflict[],
  ): number {
    const weights: Record<string, number> = {
      docker: 15,
      postgres: 15,
      ports: 10,
      auth: 15,
      api: 15,
      resources: 15,
      studio: 10,
      migration: 5,
    };

    let score = 0;
    let totalWeight = 0;

    for (const [key, result] of Object.entries(checks)) {
      const weight = weights[key] ?? 10;
      totalWeight += weight;
      if (result.healthy) {
        score += weight;
      }
    }

    const conflictPenalty = conflicts.reduce(
      (total, conflict) => total + severityOrder[conflict.severity] * 2,
      0,
    );

    if (totalWeight === 0) {
      return 0;
    }

    const rawScore = Math.round((score / totalWeight) * 100) - conflictPenalty;
    return Math.max(0, Math.min(100, rawScore));
  }

  private mapArea(service: string): HealthIssue["area"] {
    switch (service) {
      case "docker":
        return "docker";
      case "postgres":
        return "postgres";
      case "ports":
      case "studio":
        return "docker";
      case "auth":
        return "auth";
      case "api":
        return "api";
      case "resources":
        return "resources";
      case "migration":
        return "migration";
      default:
        return "docker";
    }
  }

  private mapConflictArea(conflictType: Conflict["type"]): HealthIssue["area"] {
    switch (conflictType) {
      case "AUTH_CONFLICT":
        return "auth";
      case "API_CONFLICT":
      case "PORT_CONFLICT":
        return "api";
      case "RESOURCE_PRESSURE":
        return "resources";
      case "STACK_FRAGMENTATION":
      default:
        return "docker";
    }
  }

  private titleForService(service: string): string {
    switch (service) {
      case "docker":
        return "Docker indisponible";
      case "postgres":
        return "PostgreSQL non actif";
      case "ports":
        return "Conflit de ports";
      case "auth":
        return "Conflit d'authentification";
      case "api":
        return "API indisponible ou redondante";
      case "resources":
        return "Pression ressource";
      case "studio":
        return "API locale Studio unhealthy";
      case "migration":
        return "Rollback manquant";
      default:
        return service;
    }
  }

  private titleForConflict(type: Conflict["type"]): string {
    switch (type) {
      case "AUTH_CONFLICT":
        return "Double système d'auth";
      case "API_CONFLICT":
        return "Double API";
      case "PORT_CONFLICT":
        return "Conflit de ports";
      case "STACK_FRAGMENTATION":
        return "Stack fragmentée";
      case "RESOURCE_PRESSURE":
      default:
        return "Pression ressource";
    }
  }

  private toLegacySeverity(severity: CheckResult["severity"]): HealthIssue["severity"] {
    switch (severity) {
      case "CRITICAL":
        return "critical";
      case "HIGH":
        return "high";
      case "MEDIUM":
        return "medium";
      case "LOW":
      default:
        return "low";
    }
  }
}
