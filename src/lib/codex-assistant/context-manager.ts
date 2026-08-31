import Docker from "dockerode";
import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
  Container,
  Image,
  MigrationTask,
  Network,
  ResourceSnapshot,
  RollbackPoint,
  ServerContext,
  ServiceStatus,
  Volume,
} from "./types";

const docker = new Docker();

const createServiceStatus = (
  status: ServiceStatus["status"] = "unknown",
  overrides: Partial<ServiceStatus> = {},
): ServiceStatus => ({
  container: "",
  port: 0,
  status,
  healthy: false,
  lastCheck: "",
  ...overrides,
});

const cloneServiceStatus = (service: ServiceStatus): ServiceStatus => ({
  ...service,
});

const cloneDockerContainer = (container: Container): Container => ({
  ...container,
});

const cloneImage = (image: Image): Image => ({
  ...image,
});

const cloneVolume = (volume: Volume): Volume => ({
  ...volume,
});

const cloneNetwork = (network: Network): Network => ({
  ...network,
});

const cloneServices = (
  services: ServerContext["services"],
): ServerContext["services"] => ({
  pseudoStack: {
    postgres: cloneServiceStatus(services.pseudoStack.postgres),
    postgrest: cloneServiceStatus(services.pseudoStack.postgrest),
    keycloak: cloneServiceStatus(services.pseudoStack.keycloak),
    studio: cloneServiceStatus(services.pseudoStack.studio),
    adminer: cloneServiceStatus(services.pseudoStack.adminer),
  },
  coreStack: {
    db: cloneServiceStatus(services.coreStack.db),
    kong: cloneServiceStatus(services.coreStack.kong),
    auth: cloneServiceStatus(services.coreStack.auth),
    storage: cloneServiceStatus(services.coreStack.storage),
    realtime: cloneServiceStatus(services.coreStack.realtime),
    studio: cloneServiceStatus(services.coreStack.studio),
    meta: cloneServiceStatus(services.coreStack.meta),
  },
});

const cloneResources = (resources: ResourceSnapshot): ResourceSnapshot => ({
  ram: { ...resources.ram },
  cpu: { ...resources.cpu },
  disk: { ...resources.disk },
  ...(resources.ramMb ? { ramMb: { ...resources.ramMb } } : {}),
  ...(resources.cpuLegacy ? { cpuLegacy: { ...resources.cpuLegacy } } : {}),
  ...(resources.diskGb ? { diskGb: { ...resources.diskGb } } : {}),
});

const cloneRollbackPoint = (point: RollbackPoint): RollbackPoint => ({
  ...point,
  files: [...point.files],
});

const cloneMigrationTask = (task: MigrationTask): MigrationTask => ({
  ...task,
  scripts: [...task.scripts],
  validation: [...task.validation],
  rollback: [...task.rollback],
});

const createEmptyResources = (): ResourceSnapshot => ({
  ram: { total: 8192, used: 0, available: 8192 },
  cpu: { cores: 4, usage: 0 },
  disk: { total: "0", used: "0", available: "0", usePercent: "0%" },
  ramMb: { total: 8192, used: 0, available: 8192 },
  cpuLegacy: { cores: 4, usagePercent: 0 },
  diskGb: { total: 0, used: 0, available: 0 },
});

const createEmptyServices = (): ServerContext["services"] => ({
  pseudoStack: {
    postgres: createServiceStatus(),
    postgrest: createServiceStatus(),
    keycloak: createServiceStatus(),
    studio: createServiceStatus(),
    adminer: createServiceStatus(),
  },
  coreStack: {
    db: createServiceStatus(),
    kong: createServiceStatus(),
    auth: createServiceStatus(),
    storage: createServiceStatus(),
    realtime: createServiceStatus(),
    studio: createServiceStatus(),
    meta: createServiceStatus(),
  },
});

const syncAliases = (context: ServerContext): ServerContext => {
  context.dbClient = context.services;
  return context;
};

const cloneContext = (context: ServerContext): ServerContext => {
  const services = cloneServices(context.services);

  return syncAliases({
    server: { ...context.server },
    docker: {
      containers: context.docker.containers.map(cloneDockerContainer),
      images: context.docker.images.map(cloneImage),
      volumes: context.docker.volumes.map(cloneVolume),
      networks: context.docker.networks.map(cloneNetwork),
    },
    resources: cloneResources(context.resources),
    services,
    migration: {
      phase: context.migration.phase,
      tasks: context.migration.tasks.map(cloneMigrationTask),
      completed: [...context.migration.completed],
      rollbackPoints: context.migration.rollbackPoints.map(cloneRollbackPoint),
    },
    dbClient: services,
  });
};

const createSimulatedDockerContainers = (): Container[] => [
  {
    name: "egs-postgres-local",
    status: "Up 2 hours",
    ports: "0.0.0.0:54322->5432/tcp",
    image: "postgres:15-alpine",
    running: true,
  },
  {
    name: "egs-postgrest",
    status: "Up 2 hours",
    ports: "0.0.0.0:3001->3000/tcp",
    image: "postgrest/postgrest:v12.0.2",
    running: true,
  },
  {
    name: "egs-keycloak",
    status: "Up 2 hours",
    ports: "0.0.0.0:8080->8080/tcp",
    image: "quay.io/keycloak/keycloak:latest",
    running: true,
  },
  {
    name: "egs-dbClient-studio",
    status: "Up 2 hours (unhealthy)",
    ports: "0.0.0.0:3000->3000/tcp",
    image: "dbClient/studio:latest",
    running: true,
  },
  {
    name: "egs-adminer",
    status: "Up 2 hours",
    ports: "0.0.0.0:8081->8080/tcp",
    image: "adminer:latest",
    running: true,
  },
];

const createSimulatedImages = (): Image[] => [
  {
    id: "sha256:egs-postgres-local",
    repository: "postgres",
    tag: "15-alpine",
    size: "376MB",
  },
  {
    id: "sha256:egs-postgrest",
    repository: "postgrest/postgrest",
    tag: "v12.0.2",
    size: "88MB",
  },
  {
    id: "sha256:egs-keycloak",
    repository: "quay.io/keycloak/keycloak",
    tag: "latest",
    size: "510MB",
  },
];

const createSimulatedVolumes = (): Volume[] => [
  {
    name: "egs_postgres_data",
    driver: "local",
    mountpoint: "/var/lib/docker/volumes/egs_postgres_data/_data",
  },
  {
    name: "egs_studio_data",
    driver: "local",
    mountpoint: "/var/lib/docker/volumes/egs_studio_data/_data",
  },
];

const createSimulatedNetworks = (): Network[] => [
  {
    name: "bridge",
    driver: "bridge",
    scope: "local",
  },
  {
    name: "egs_default",
    driver: "bridge",
    scope: "local",
  },
];

const createSimulatedResources = (): ResourceSnapshot => ({
  ram: { total: 8192, used: 4400, available: 3792 },
  cpu: { cores: 4, usage: 30 },
  disk: { total: "916G", used: "44K", available: "870G", usePercent: "1%" },
  ramMb: { total: 8192, used: 4400, available: 3792 },
  cpuLegacy: { cores: 4, usagePercent: 30 },
  diskGb: { total: 916, used: 0, available: 870 },
});

const createSimulatedServices = (): ServerContext["services"] => ({
  pseudoStack: {
    postgres: {
      container: "egs-postgres-local",
      port: 54322,
      status: "running",
      healthy: true,
      lastCheck: new Date().toISOString(),
    },
    postgrest: {
      container: "egs-postgrest",
      port: 3001,
      status: "running",
      healthy: true,
      lastCheck: new Date().toISOString(),
    },
    keycloak: {
      container: "egs-keycloak",
      port: 8080,
      status: "running",
      healthy: true,
      lastCheck: new Date().toISOString(),
    },
    studio: {
      container: "egs-dbClient-studio",
      port: 3000,
      status: "unhealthy",
      healthy: false,
      lastCheck: new Date().toISOString(),
    },
    adminer: {
      container: "egs-adminer",
      port: 8081,
      status: "running",
      healthy: true,
      lastCheck: new Date().toISOString(),
    },
  },
  coreStack: {
    db: {
      container: "dbClient-core-db",
      port: 5432,
      status: "stopped",
      healthy: false,
      lastCheck: new Date().toISOString(),
    },
    kong: {
      container: "dbClient-core-kong",
      port: 8000,
      status: "stopped",
      healthy: false,
      lastCheck: new Date().toISOString(),
    },
    auth: {
      container: "dbClient-core-auth",
      port: 9999,
      status: "stopped",
      healthy: false,
      lastCheck: new Date().toISOString(),
    },
    storage: {
      container: "dbClient-core-storage",
      port: 5000,
      status: "stopped",
      healthy: false,
      lastCheck: new Date().toISOString(),
    },
    realtime: {
      container: "dbClient-core-realtime",
      port: 4000,
      status: "stopped",
      healthy: false,
      lastCheck: new Date().toISOString(),
    },
    studio: {
      container: "dbClient-core-studio",
      port: 3000,
      status: "stopped",
      healthy: false,
      lastCheck: new Date().toISOString(),
    },
    meta: {
      container: "dbClient-core-meta",
      port: 8080,
      status: "stopped",
      healthy: false,
      lastCheck: new Date().toISOString(),
    },
  },
});

export const createDefaultServerContext = (): ServerContext => {
  const services = createEmptyServices();

  return syncAliases({
    server: {
      host: "",
      sshPort: 2222,
      user: "soma",
      lastUpdate: new Date().toISOString(),
    },
    docker: {
      containers: [],
      images: [],
      volumes: [],
      networks: [],
    },
    resources: createEmptyResources(),
    services,
    migration: {
      phase: 0,
      tasks: [],
      completed: [],
      rollbackPoints: [],
    },
    dbClient: services,
  });
};

const mergeServiceStatus = (
  base: ServiceStatus,
  patch?: Partial<ServiceStatus>,
): ServiceStatus => ({
  ...base,
  ...patch,
});

const mergeServices = (
  base: ServerContext["services"],
  patch?: Partial<ServerContext["services"]>,
): ServerContext["services"] => ({
  pseudoStack: {
    postgres: mergeServiceStatus(
      base.pseudoStack.postgres,
      patch?.pseudoStack?.postgres,
    ),
    postgrest: mergeServiceStatus(
      base.pseudoStack.postgrest,
      patch?.pseudoStack?.postgrest,
    ),
    keycloak: mergeServiceStatus(
      base.pseudoStack.keycloak,
      patch?.pseudoStack?.keycloak,
    ),
    studio: mergeServiceStatus(
      base.pseudoStack.studio,
      patch?.pseudoStack?.studio,
    ),
    adminer: mergeServiceStatus(
      base.pseudoStack.adminer,
      patch?.pseudoStack?.adminer,
    ),
  },
  coreStack: {
    db: mergeServiceStatus(base.coreStack.db, patch?.coreStack?.db),
    kong: mergeServiceStatus(base.coreStack.kong, patch?.coreStack?.kong),
    auth: mergeServiceStatus(base.coreStack.auth, patch?.coreStack?.auth),
    storage: mergeServiceStatus(
      base.coreStack.storage,
      patch?.coreStack?.storage,
    ),
    realtime: mergeServiceStatus(
      base.coreStack.realtime,
      patch?.coreStack?.realtime,
    ),
    studio: mergeServiceStatus(base.coreStack.studio, patch?.coreStack?.studio),
    meta: mergeServiceStatus(base.coreStack.meta, patch?.coreStack?.meta),
  },
});

const mergeResources = (
  base: ResourceSnapshot,
  patch?: Partial<ResourceSnapshot>,
): ResourceSnapshot => ({
  ram: {
    ...base.ram,
    ...patch?.ram,
    ...(patch?.ramMb ? patch.ramMb : {}),
  },
  cpu: {
    ...base.cpu,
    ...patch?.cpu,
    ...(patch?.cpuLegacy
      ? { usage: patch.cpuLegacy.usagePercent, cores: patch.cpuLegacy.cores }
      : {}),
  },
  disk: {
    ...base.disk,
    ...patch?.disk,
    ...(patch?.diskGb
      ? {
          total: String(patch.diskGb.total),
          used: String(patch.diskGb.used),
          available: String(patch.diskGb.available),
        }
      : {}),
  },
  ramMb: patch?.ramMb
    ? { ...patch.ramMb }
    : base.ramMb
      ? { ...base.ramMb }
      : undefined,
  cpuLegacy: patch?.cpuLegacy
    ? { ...patch.cpuLegacy }
    : base.cpuLegacy
      ? { ...base.cpuLegacy }
      : undefined,
  diskGb: patch?.diskGb
    ? { ...patch.diskGb }
    : base.diskGb
      ? { ...base.diskGb }
      : undefined,
});

const mergeMigrationTasks = (
  base: MigrationTask[],
  patch?: MigrationTask[],
): MigrationTask[] =>
  patch ? patch.map(cloneMigrationTask) : base.map(cloneMigrationTask);

const mergeRollbackPoints = (
  base: RollbackPoint[],
  patch?: RollbackPoint[],
): RollbackPoint[] =>
  patch ? patch.map(cloneRollbackPoint) : base.map(cloneRollbackPoint);

export class ContextManager {
  private context: ServerContext | null = null;

  private contextPath = ".codex/context/server-context.json";

  constructor(initialContext?: ServerContext) {
    if (initialContext) {
      this.context = cloneContext(initialContext);
    }

    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    // Create the directory for persistence
    // Note: We can't use fs.mkdirSync here because this might run in browser context
    // The actual directory creation happens in loadFromDisk/saveToDisk
  }

  getSnapshot(): ServerContext {
    return cloneContext(this.context ?? createDefaultServerContext());
  }

  replace(nextContext: ServerContext): void {
    this.context = cloneContext(nextContext);
    void this.saveToDisk();
  }

  update(patch: Partial<ServerContext>): ServerContext {
    const current = this.getSnapshot();

    if (patch.server) {
      current.server = { ...current.server, ...patch.server };
    }

    if (patch.docker) {
      current.docker = {
        containers: patch.docker.containers
          ? patch.docker.containers.map(cloneDockerContainer)
          : current.docker.containers,
        images: patch.docker.images
          ? patch.docker.images.map(cloneImage)
          : current.docker.images,
        volumes: patch.docker.volumes
          ? patch.docker.volumes.map(cloneVolume)
          : current.docker.volumes,
        networks: patch.docker.networks
          ? patch.docker.networks.map(cloneNetwork)
          : current.docker.networks,
      };
    }

    if (patch.resources) {
      current.resources = mergeResources(current.resources, patch.resources);
    }

    if (patch.services || patch.dbClient) {
      current.services = mergeServices(
        current.services,
        (patch.services ?? patch.dbClient) as
          | Partial<ServerContext["services"]>
          | undefined,
      );
    }

    if (patch.migration) {
      current.migration = {
        phase: patch.migration.phase ?? current.migration.phase,
        tasks: mergeMigrationTasks(
          current.migration.tasks,
          patch.migration.tasks,
        ),
        completed: patch.migration.completed
          ? [...patch.migration.completed]
          : [...current.migration.completed],
        rollbackPoints: mergeRollbackPoints(
          current.migration.rollbackPoints,
          patch.migration.rollbackPoints,
        ),
      };
    }

    this.context = syncAliases(current);
    void this.saveToDisk();
    return this.getSnapshot();
  }

  async loadContext(): Promise<ServerContext> {
    if (this.context) {
      await this.refreshLiveData();
      return this.getSnapshot();
    }

    const saved = await this.loadFromDisk();
    if (saved) {
      this.context = cloneContext(saved);
      await this.refreshLiveData();
      return this.getSnapshot();
    }

    this.context = createDefaultServerContext();
    await this.saveToDisk();
    return this.getSnapshot();
  }

  async updateContext(updates: Partial<ServerContext>): Promise<void> {
    this.update(updates);
  }

  private async refreshLiveData(): Promise<void> {
    if (!this.context) {
      return;
    }

    this.context.docker.containers = await this.getDockerContainers();
    this.context.docker.images = await this.getDockerImages();
    this.context.docker.volumes = await this.getDockerVolumes();
    this.context.docker.networks = await this.getDockerNetworks();
    this.context.resources = await this.getResources();
    this.context.services = createSimulatedServices();
    this.context.dbClient = this.context.services;
    this.context.server.lastUpdate = new Date().toISOString();

    await this.saveToDisk();
  }

  private async loadFromDisk(): Promise<ServerContext | null> {
    try {
      const content = await fs.readFile(this.contextPath, "utf8");
      return JSON.parse(content) as ServerContext;
    } catch {
      // File doesn't exist or invalid JSON - return null to use defaults
      return null;
    }
  }

  private async saveToDisk(): Promise<void> {
    if (!this.context) {
      return;
    }

    try {
      const dir = path.dirname(this.contextPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.contextPath, JSON.stringify(this.context, null, 2), "utf8");
    } catch (error) {
      console.warn("Codex assistant: impossible de sauvegarder le contexte sur disque.", error);
    }
  }

  private async getDockerContainers(): Promise<Container[]> {
    try {
      const containers = await docker.listContainers({ all: true });

      return containers.map((container) => ({
        name: container.Names?.[0]?.replace(/^\//, "") || "",
        status: container.Status || container.State || "unknown",
        ports:
          container.Ports?.length && container.Ports.length > 0
            ? container.Ports.map((port) => {
                const publicPort =
                  typeof port.PublicPort === "number" ? port.PublicPort : "";
                const privatePort =
                  typeof port.PrivatePort === "number" ? port.PrivatePort : "";
                const type = port.Type || "tcp";
                const ipPrefix = port.IP ? `${port.IP}:` : "";
                return publicPort
                  ? `${ipPrefix}${publicPort}->${privatePort}/${type}`
                  : `${privatePort}/${type}`;
              }).join(", ")
            : "",
        image: container.Image || "",
        running: container.State === "running",
        portsList:
          container.Ports?.map((port) => {
            const publicPort =
              typeof port.PublicPort === "number" ? port.PublicPort : undefined;
            const privatePort =
              typeof port.PrivatePort === "number"
                ? port.PrivatePort
                : undefined;
            const type = port.Type || "tcp";

            return publicPort !== undefined && privatePort !== undefined
              ? `${publicPort}->${privatePort}/${type}`
              : `${privatePort ?? "?"}/${type}`;
          }) || [],
      }));
    } catch (error) {
      console.warn(
        "Codex assistant: impossible de lire Docker, retour au pseudo-état.",
        error,
      );
      return createSimulatedDockerContainers();
    }
  }

  private async getDockerImages(): Promise<Image[]> {
    try {
      const images = await docker.listImages({ all: true });

      return images.map((image, index) => {
        const repoTag = image.RepoTags?.[0] ?? "unknown:latest";
        const lastSlash = repoTag.lastIndexOf("/");
        const lastColon = repoTag.lastIndexOf(":");
        const hasExplicitTag = lastColon > lastSlash;
        const repository = hasExplicitTag
          ? repoTag.slice(0, lastColon)
          : repoTag;
        const tag = hasExplicitTag ? repoTag.slice(lastColon + 1) : "latest";
        const sizeMb = image.Size ? image.Size / (1024 * 1024) : 0;

        return {
          id: image.Id || `image-${index}`,
          repository,
          tag,
          size: `${Math.round(sizeMb)}MB`,
        };
      });
    } catch (error) {
      console.warn(
        "Codex assistant: impossible de lire les images Docker, retour au pseudo-état.",
        error,
      );
      return createSimulatedImages();
    }
  }

  private async getDockerVolumes(): Promise<Volume[]> {
    try {
      const volumes = await docker.listVolumes();
      const items = volumes.Volumes ?? [];

      return items.map((volume) => ({
        name: volume.Name,
        driver: volume.Driver,
        mountpoint: volume.Mountpoint,
        sizeBytes: (volume as { Options?: Record<string, string> }).Options
          ?.size
          ? Number.parseInt(
              (volume as { Options?: Record<string, string> }).Options?.size ??
                "0",
              10,
            )
          : undefined,
      }));
    } catch (error) {
      console.warn(
        "Codex assistant: impossible de lire les volumes Docker, retour au pseudo-état.",
        error,
      );
      return createSimulatedVolumes();
    }
  }

  private async getDockerNetworks(): Promise<Network[]> {
    try {
      const networks = await docker.listNetworks();

      return networks.map((network) => ({
        name: network.Name,
        driver: network.Driver,
        scope: network.Scope,
      }));
    } catch (error) {
      console.warn(
        "Codex assistant: impossible de lire les réseaux Docker, retour au pseudo-état.",
        error,
      );
      return createSimulatedNetworks();
    }
  }

  private async getResources(): Promise<ResourceSnapshot> {
    try {
      const memInfo = await fs.readFile("/proc/meminfo", "utf8");
      const memTotalKb = this.extractProcMemValue(memInfo, "MemTotal");
      const memAvailableKb = this.extractProcMemValue(memInfo, "MemAvailable");
      const memUsedKb = Math.max(memTotalKb - memAvailableKb, 0);

      const cpuUsage = await this.getCpuUsagePercent();
      const disk = this.parseDiskUsage(
        execSync("df -h /mnt/data 2>/dev/null || df -h /", {
          encoding: "utf8",
        }),
      );

      return {
        ram: {
          total: Math.round(memTotalKb / 1024),
          used: Math.round(memUsedKb / 1024),
          available: Math.round(memAvailableKb / 1024),
        },
        cpu: {
          cores: os.cpus().length,
          usage: cpuUsage,
        },
        disk,
        ramMb: {
          total: Math.round(memTotalKb / 1024),
          used: Math.round(memUsedKb / 1024),
          available: Math.round(memAvailableKb / 1024),
        },
        cpuLegacy: {
          cores: os.cpus().length,
          usagePercent: cpuUsage,
        },
        diskGb: this.parseDiskGbFromDf(disk),
      };
    } catch (error) {
      console.warn(
        "Codex assistant: impossible de lire les ressources système, fallback simulé.",
        error,
      );
      return createSimulatedResources();
    }
  }

  private extractProcMemValue(memInfo: string, key: string): number {
    const line = memInfo
      .split("\n")
      .find((entry) => entry.startsWith(`${key}:`));

    if (!line) {
      return 0;
    }

    const match = line.match(/\d+/);
    return match ? Number.parseInt(match[0] ?? "0", 10) : 0;
  }

  private async getCpuUsagePercent(): Promise<number> {
    const first = await this.readCpuSnapshot();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const second = await this.readCpuSnapshot();

    const idleDiff = second.idle - first.idle;
    const totalDiff = second.total - first.total;

    if (totalDiff <= 0) {
      return 0;
    }

    const usage = 100 * (1 - idleDiff / totalDiff);
    return Math.max(0, Math.min(100, Math.round(usage)));
  }

  private async readCpuSnapshot(): Promise<{ idle: number; total: number }> {
    const stat = await fs.readFile("/proc/stat", "utf8");
    const cpuLine = stat.split("\n").find((entry) => entry.startsWith("cpu "));

    if (!cpuLine) {
      return { idle: 0, total: 0 };
    }

    const parts = cpuLine
      .trim()
      .split(/\s+/)
      .slice(1)
      .map((value) => Number.parseInt(value, 10));
    const user = parts[0] || 0;
    const nice = parts[1] || 0;
    const system = parts[2] || 0;
    const idle = parts[3] || 0;
    const iowait = parts[4] || 0;
    const irq = parts[5] || 0;
    const softirq = parts[6] || 0;
    const steal = parts[7] || 0;
    const idleAll = idle + iowait;
    const total = user + nice + system + idle + iowait + irq + softirq + steal;

    return {
      idle: idleAll,
      total,
    };
  }

  private parseDiskUsage(dfOutput: string): ResourceSnapshot["disk"] {
    const lines = dfOutput.trim().split("\n");
    const dataLine = lines[lines.length - 1] ?? "";
    const columns = dataLine.trim().split(/\s+/);

    if (columns.length < 6) {
      return {
        total: "0",
        used: "0",
        available: "0",
        usePercent: "0%",
      };
    }

    const [, total, used, available, usePercent] = columns;

    return {
      total: total || "0",
      used: used || "0",
      available: available || "0",
      usePercent: usePercent || "0%",
    };
  }

  private parseDiskGbFromDf(
    disk: ResourceSnapshot["disk"],
  ): { total: number; used: number; available: number } | undefined {
    const total = this.parseHumanReadableSize(disk.total);
    const used = this.parseHumanReadableSize(disk.used);
    const available = this.parseHumanReadableSize(disk.available);

    if (
      !Number.isFinite(total) &&
      !Number.isFinite(used) &&
      !Number.isFinite(available)
    ) {
      return undefined;
    }

    return {
      total: Number.isFinite(total) ? total : 0,
      used: Number.isFinite(used) ? used : 0,
      available: Number.isFinite(available) ? available : 0,
    };
  }

  private parseHumanReadableSize(value: string): number {
    const match = value.trim().match(/^([\d.]+)\s*([KMGTP]?)/i);
    if (!match) {
      return Number.NaN;
    }

    const amount = Number.parseFloat(match[1] || "0");
    const unit = (match[2] || "").toUpperCase();
    const multipliers: Record<string, number> = {
      "": 1,
      K: 1 / 1024 / 1024,
      M: 1 / 1024,
      G: 1,
      T: 1024,
      P: 1024 * 1024,
    };

    return amount * (multipliers[unit] ?? 1);
  }
}
