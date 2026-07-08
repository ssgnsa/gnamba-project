import { codex } from "./index";
import type { CommandResult } from "./types";

type MigrationPhase = 0 | 1 | 2 | 3 | 4 | 5;

declare const process: {
  argv: string[];
  exit(code?: number): never;
};

const HELP_TEXT = `
🤖 Codex Assistant - Commandes disponibles:

  status     - Affiche l'état du serveur
  health     - Affiche le diagnostic de santé
  plan       - Affiche le plan de migration
  migrate    - Lance la migration
  backup     - Crée un backup
  rollback   - Annule la dernière migration
  optimize   - Optimise les ressources
  docs       - Génère la documentation

Exemples:
  codex status
  codex health
  codex plan
  codex migrate --phase 1
  codex backup
  codex rollback
  codex optimize
  codex docs
`;

const defaultArgv = (): string[] => {
  if (typeof process === "undefined" || !Array.isArray(process.argv)) {
    return [];
  }

  return process.argv.slice(2);
};

const printResult = (result: CommandResult): void => {
  console.log(JSON.stringify(result, null, 2));
};

const parsePhase = (args: string[]): MigrationPhase | undefined => {
  const phaseIndex = args.indexOf("--phase");
  if (phaseIndex === -1 || phaseIndex === args.length - 1) {
    return undefined;
  }

  const value = Number.parseInt(args[phaseIndex + 1] ?? "", 10);
  if (Number.isNaN(value) || value < 0 || value > 5) {
    return undefined;
  }

  return value as MigrationPhase;
};

export async function runCli(argv: string[] = defaultArgv()): Promise<{
  command: string;
  result?: CommandResult;
  helpText?: string;
}> {
  const [command = "help", ...commandArgs] = argv;

  switch (command) {
    case "status":
      return { command, result: await codex.status() };
    case "health":
      return { command, result: await codex.health() };
    case "plan":
      return { command, result: await codex.plan() };
    case "migrate":
      if (commandArgs.includes("--plan")) {
        return { command, result: await codex.plan() };
      }

      return { command, result: await codex.migrate(parsePhase(commandArgs)) };
    case "backup":
      return { command, result: await codex.backup() };
    case "rollback":
      return { command, result: await codex.rollback() };
    case "optimize":
      return { command, result: await codex.optimize() };
    case "docs":
      return { command, result: await codex.docs() };
    case "help":
    default:
      return { command: "help", helpText: HELP_TEXT };
  }
}

export async function main(argv: string[] = defaultArgv()): Promise<void> {
  try {
    const output = await runCli(argv);

    if (output.helpText) {
      console.log(output.helpText.trim());
      return;
    }

    if (output.result) {
      printResult(output.result);
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

const shouldAutoRun =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1]?.includes("cli");

if (shouldAutoRun) {
  void main();
}
