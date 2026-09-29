import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  ContextManager,
  DiagnosticEngine,
  MigrationAssistant,
  createDefaultServerContext,
  runCodexCommand,
} from "../index";

describe("Codex assistant scaffold", () => {
  it("calculates a health report for the current pseudo stack", async () => {
    const context = createDefaultServerContext();
    if (context.dbClient) {
      context.dbClient.pseudoStack.postgres.status = "running";
      context.dbClient.pseudoStack.postgrest.status = "running";
      context.dbClient.pseudoStack.keycloak.status = "running";
      context.dbClient.pseudoStack.studio.status = "unhealthy";
    }

    const report = await new DiagnosticEngine().healthCheck(context);

    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.conflicts.some((conflict: { type: string }) => conflict.type === "STACK_FRAGMENTATION")).toBe(true);
  });

  it("builds a migration plan from phase 0", () => {
    const context = createDefaultServerContext();
    const plan = new MigrationAssistant().planMigration(context);

    expect(plan.currentPhase).toBe(0);
    expect(plan.phaseName).toBe("Preparation");
    expect(plan.totalPhases).toBe(6);
    expect(plan.tasks.map((task) => task.id)).toEqual([
      "0-freeze",
      "0-backup",
      "0-inventory",
      "1-network",
      "1-setup-core",
      "2-schema",
      "2-data",
      "2-auth",
      "3-switch-api",
      "3-disable-old",
      "4-remove-old",
      "4-optimize",
      "5-test-all",
      "5-document",
    ]);
  });

  it("runs the codex status command", async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "egs-codex-context-"));
    try {
      const manager = new ContextManager(undefined, path.join(tempDirectory, "server-context.json"));
      const result = await runCodexCommand("codex.status", {
        contextManager: manager,
      });

      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  });
});
