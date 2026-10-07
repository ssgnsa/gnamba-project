# Codex Assistant Scaffold

Ce dossier décrit l'ossature de départ du futur assistant.

## Code

- `src/lib/codex-assistant/types.ts`
- `src/lib/codex-assistant/context-manager.ts`
- `src/lib/codex-assistant/diagnostic-engine.ts`
- `src/lib/codex-assistant/migration-assistant.ts`
- `src/lib/codex-assistant/command-registry.ts`
- `src/lib/codex-assistant/index.ts`

## Utilité

- modéliser l'état serveur
- calculer un diagnostic de santé
- générer un plan de migration
- exposer des commandes logiques réutilisables

## Limite volontaire

Le scaffold ne parle pas encore à Docker, à VS Code ou au shell. Il fournit seulement la structure métier pour la suite.
