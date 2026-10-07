export type ServiceHealth = "running" | "stopped" | "unhealthy" | "unknown";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type MigrationPhase = 0 | 1 | 2 | 3 | 4 | 5;

export interface Container {
  name: string;
  status: string;
  ports: string;
  image: string;
  running: boolean;
  portsList?: string[];
}

export interface Image {
  id: string;
  repository: string;
  tag: string;
  size: string;
}

export interface Volume {
  name: string;
  driver?: string;
  mountpoint?: string;
  sizeBytes?: number;
}

export interface Network {
  name: string;
  driver?: string;
  scope?: string;
}

export interface ServiceStatus {
  container: string;
  port: number;
  status: ServiceHealth;
  healthy: boolean;
  lastCheck: string;
  endpoint?: string;
  note?: string;
}

export interface PseudoStackServices {
  postgres: ServiceStatus;
  postgrest: ServiceStatus;
  keycloak: ServiceStatus;
  studio: ServiceStatus;
  adminer: ServiceStatus;
}

export interface CoreStackServices {
  db: ServiceStatus;
  kong: ServiceStatus;
  auth: ServiceStatus;
  storage: ServiceStatus;
  realtime: ServiceStatus;
  studio: ServiceStatus;
  meta: ServiceStatus;
}

export interface ResourceSnapshot {
  ram: {
    total: number;
    used: number;
    available: number;
  };
  cpu: {
    cores: number;
    usage: number;
  };
  disk: {
    total: string;
    used: string;
    available: string;
    usePercent: string;
  };
  ramMb?: {
    total: number;
    used: number;
    available: number;
  };
  cpuLegacy?: {
    cores: number;
    usagePercent: number;
  };
  diskGb?: {
    total: number;
    used: number;
    available: number;
  };
}

export interface MigrationTask {
  id: string;
  phase: number;
  name: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  scripts: string[];
  validation: string[];
  rollback: string[];
  label?: string;
  details?: string;
  completedAt?: string;
}

export interface RollbackPoint {
  id: string;
  timestamp: string;
  description: string;
  files: string[];
  restored: boolean;
}

export interface ServerContext {
  server: {
    host: string;
    sshPort: number;
    user: string;
    lastUpdate: string;
  };
  docker: {
    containers: Container[];
    images: Image[];
    volumes: Volume[];
    networks: Network[];
  };
  resources: ResourceSnapshot;
  services: {
    pseudoStack: PseudoStackServices;
    coreStack: CoreStackServices;
  };
  migration: {
    phase: MigrationPhase;
    tasks: MigrationTask[];
    completed: string[];
    rollbackPoints: RollbackPoint[];
  };
  dbClient?: {
    pseudoStack: PseudoStackServices;
    coreStack: CoreStackServices;
  };
}

export interface CheckResult {
  healthy: boolean;
  severity: Severity;
  message: string;
  recommendation?: string;
}

export interface Issue {
  service: string;
  severity: Severity;
  message: string;
  recommendation?: string;
}

export interface HealthIssue {
  id: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  area: "docker" | "postgres" | "api" | "auth" | "resources" | "migration";
  title: string;
  details: string;
  remediation: string;
}

export interface Conflict {
  id: string;
  type:
    | "PORT_CONFLICT"
    | "AUTH_CONFLICT"
    | "API_CONFLICT"
    | "STACK_FRAGMENTATION"
    | "RESOURCE_PRESSURE";
  severity: Severity;
  details: string;
  remediation: string;
}

export interface Recommendation {
  action: string;
  description: string;
  command?: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface HealthCheck {
  score: number;
  checks: Record<string, CheckResult>;
  issues: Issue[];
  conflicts: Conflict[];
  recommendations: Recommendation[];
  timestamp: string;
  healthIssues?: HealthIssue[];
}

export type HealthReport = HealthCheck;

export interface MigrationPlan {
  currentPhase: MigrationPhase;
  totalPhases: number;
  tasks: MigrationTask[];
  estimatedDuration: string;
  prerequisites: string[];
  phaseName?: string;
  nextPhase?: MigrationPhase | null;
  rollbackChecklist?: string[];
}

export interface MigrationTaskStatus extends Omit<MigrationTask, "status"> {
  status: "pending" | "done" | "blocked";
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  nextSteps?: string[];
}

export interface CodexCommandResult<T = unknown> {
  command: string;
  ok: boolean;
  data?: T;
  error?: string;
}
