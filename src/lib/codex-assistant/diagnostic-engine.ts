import { ContextManager, createDefaultServerContext } from "./context-manager";
import type {
  CheckResult,
  Conflict,
  HealthCheck,
  HealthIssue,
  Issue,
  Recommendation,
  ServerContext,
} from "./types";
import { spawnSync } from "node:child_process";

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

// Helper functions for real health checks
const runCommand = (command: string, args: string[], timeout = 5000): { success: boolean; output: string } => {
  try {
    const result = spawnSync(command, args, {
      encoding: "utf8",
      timeout,
      stdio: "pipe",
    });
    return { success: result.status === 0, output: (result.stdout || "") + (result.stderr || "") };
  } catch {
    return { success: false, output: "Command failed" };
  }
};

const checkHttpHealth = (url: string, timeout = 3000): Promise<{ success: boolean; output: string }> => {
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetch(url, { signal: controller.signal, method: "GET" })
      .then((response) => {
        clearTimeout(timeoutId);
        resolve({ success: response.ok, output: `HTTP ${response.status}` });
      })
      .catch(() => {
        clearTimeout(timeoutId);
        resolve({ success: false, output: "Connection failed" });
      });
  });
};

const checkDockerDaemon = (): { success: boolean; output: string } => {
  return runCommand("docker", ["version", "--format", "{{.Server.Version}}"]);
};

const checkPostgresHealth = (port: number): { success: boolean; output: string } => {
  return runCommand("pg_isready", ["-h", "localhost", "-p", String(port)]);
};

const checkServiceHealth = async (port: number, path = "/health"): Promise<{ success: boolean; output: string }> => {
  const url = `http://localhost:${port}${path}`;
  return checkHttpHealth(url);
};

export class DiagnosticEngine {
  constructor(private contextManager: ContextManager = new ContextManager()) {}

  async healthCheck(context: ServerContext = this.contextManager.getSnapshot()): Promise<HealthCheck> {
    const normalized = this.normalizeContext(context);
    
    // Run sync checks first
    const dockerCheck = this.checkDocker(normalized);
    const portsCheck = this.checkPorts(normalized);
    const resourcesCheck = this.checkResources(normalized);
    const migrationCheck = this.checkMigration(normalized);
    
    // Run async checks in parallel
    const [postgresCheck, authCheck, apiCheck, studioCheck] = await Promise.all([
      this.checkPostgres(normalized),
      this.checkAuth(normalized),
      this.checkAPI(normalized),
      this.checkStudio(normalized),
    ]);

    const checks = {
      docker: dockerCheck,
      postgres: postgresCheck,
      ports: portsCheck,
      auth: authCheck,
      api: apiCheck,
      resources: resourcesCheck,
      studio: studioCheck,
      migration: migrationCheck,
    };

    const conflicts = this.detectConflicts(normalized, checks);
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
    // Try to connect to Docker daemon
    const dockerCheck = checkDockerDaemon();
    if (dockerCheck.success) {
      const containerCount = context.docker.containers.length;
      return {
        healthy: true,
        severity: "LOW",
        message: `Docker actif (${containerCount} conteneurs)`,
      };
    }

    return {
      healthy: false,
      severity: "CRITICAL",
      message: "Docker daemon inaccessible",
      recommendation: "sudo systemctl start docker",
    };
  }

  private checkPostgres(context: ServerContext): CheckResult {
    // Try pg_isready on the pseudo-stack postgres port
    const pg = getPseudoStack(context).postgres;
    const port = pg.port || 54322;
    const pgCheck = checkPostgresHealth(port);
    
    if (pgCheck.success) {
      return {
        healthy: true,
        severity: "LOW",
        message: `PostgreSQL actif sur port ${port}`,
      };
    }

    return {
      healthy: false,
      severity: "CRITICAL",
      message: `PostgreSQL non accessible sur port ${port}`,
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

  private async checkAuth(context: ServerContext): Promise<CheckResult> {
    const pseudoStack = getPseudoStack(context);
    const coreStack = getCoreStack(context);
    
    // Check Keycloak health
    const keycloakPort = pseudoStack.keycloak.port || 8080;
    const keycloakHealth = await checkServiceHealth(keycloakPort, "/realms/master");
    
    // Check GoTrue health (Supabase Auth)
    const gotruePort = coreStack.auth.port || 9999;
    const gotrueHealth = await checkServiceHealth(gotruePort, "/health");
    
    const hasKeycloak = keycloakHealth.success;
    const hasGoTrue = gotrueHealth.success;

    if (hasKeycloak && hasGoTrue) {
      return {
        healthy: false,
        severity: "HIGH",
        message: "Double système d'auth (Keycloak + GoTrue) détecté",
        recommendation: "Migrer vers GoTrue uniquement",
      };
    }

    if (hasKeycloak || hasGoTrue) {
      const active = hasKeycloak ? "Keycloak" : "GoTrue";
      return {
        healthy: true,
        severity: "LOW",
        message: `${active} accessible`,
      };
    }

    return {
      healthy: false,
      severity: "MEDIUM",
      message: "Aucun système d'auth accessible",
      recommendation: "Installer GoTrue ou Keycloak",
    };
  }

  private async checkAPI(context: ServerContext): Promise<CheckResult> {
    const pseudoStack = getPseudoStack(context);
    const coreStack = getCoreStack(context);
    
    // Check PostgREST health
    const postgrestPort = pseudoStack.postgrest.port || 3001;
    const postgrestHealth = await checkServiceHealth(postgrestPort, "/");
    
    // Check Kong health
    const kongPort = coreStack.kong.port || 8000;
    const kongHealth = await checkServiceHealth(kongPort, "/health");
    
    const hasPostgrest = postgrestHealth.success;
    const hasKong = kongHealth.success;

    if (hasPostgrest && hasKong) {
      return {
        healthy: false,
        severity: "HIGH",
        message: "Double API (PostgREST + Kong) détectée",
        recommendation: "Migrer vers Kong uniquement",
      };
    }

    if (hasKong || hasPostgrest) {
      const active = hasKong ? "Kong" : "PostgREST";
      return {
        healthy: true,
        severity: "LOW",
        message: `${active} accessible`,
      };
    }

    return {
      healthy: false,
      severity: "MEDIUM",
      message: "Aucune API accessible",
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

  private async checkStudio(context: ServerContext): Promise<CheckResult> {
    const pseudoStack = getPseudoStack(context);
    const coreStack = getCoreStack(context);
    
    // Check pseudo-stack Studio health
    const studioPort = pseudoStack.studio.port || 3000;
    const studioHealth = await checkServiceHealth(studioPort, "/api/health");
    
    // Check core-stack Studio health
    const coreStudioPort = coreStack.studio.port || 3000;
    const coreStudioHealth = await checkServiceHealth(coreStudioPort, "/api/health");

    if (!studioHealth.success && !coreStudioHealth.success) {
      return {
        healthy: false,
        severity: "MEDIUM",
        message: "Studio inaccessible (pseudo + core)",
        recommendation: "Redémarrer Studio ou vérifier les logs",
      };
    }

    const active = studioHealth.success ? "pseudo" : "core";
    return {
      healthy: true,
      severity: "LOW",
      message: `Studio (${active}) accessible`,
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

  private detectConflicts(context: ServerContext, checks: Record<string, CheckResult>): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check if both PostgREST and Kong are accessible via our health checks
    // The api check tells us if there's a conflict
    const apiCheck = checks.api;
    if (apiCheck && !apiCheck.healthy && apiCheck.message.includes("Double API")) {
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

    // Check auth conflict from auth check results
    const authCheck = checks.auth;
    if (authCheck && !authCheck.healthy && authCheck.message.includes("Double système d'auth")) {
      conflicts.push({
        id: "auth-conflict",
        type: "AUTH_CONFLICT",
        severity: "HIGH",
        details: "Keycloak et GoTrue sont tous les deux actifs.",
        remediation:
          "Choisir une seule stratégie d'authentification avant la bascule.",
      });
    }

    // Check studio from studio check results
    const studioCheck = checks.studio;
    if (studioCheck && !studioCheck.healthy) {
      conflicts.push({
        id: "studio-unhealthy",
        type: "STACK_FRAGMENTATION",
        severity: "MEDIUM",
        details: "Studio est signalé unhealthy.",
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
