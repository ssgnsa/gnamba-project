
## Autonomous Operation (Loop Engineering)

Ce projet fonctionne avec un loop autonome documenté dans :

- `LOOP.md` — contrat de loop (objectif, vérificateurs, état, conditions d'arrêt)
- `AUTONOMY_POLICY.md` — décisions par défaut pour ne jamais s'arrêter sur une question ouverte
- `loop-constraints.md`, `loop-budget.md` — contraintes et budget déjà en place sur ce repo
- `loop_state.json` — état persistant des tâches
- `loop-run-log.md` — journal des cycles

**Règle d'or pour tout agent (Claude Code, sous-agent, ou humain lisant ce fichier) :** en cas d'ambiguïté ou de blocage pendant un cycle autonome, consulter `AUTONOMY_POLICY.md` et appliquer la décision par défaut correspondante plutôt que d'interrompre le cycle pour poser une question. La seule exception est la détection d'un secret dans un diff (`AUTONOMY_POLICY.md` §F) : c'est le seul cas d'arrêt dur.

Lancement d'un cycle autonome :

```bash
bash scripts/run-loop.sh 5   # 5 cycles maximum pour cette session
```

Le script utilise `claude -p` en mode `--permission-mode acceptEdits` avec une liste explicite d'outils autorisés (build, lint, tests, `scripts/check-erp.sh`, `scripts/deploy-production.sh`) — jamais `--dangerously-skip-permissions`. Chaque cycle met à jour `loop_state.json` et journalise dans `loop-run-log.md` via `scripts/loop_report.py`.
