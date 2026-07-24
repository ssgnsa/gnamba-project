#!/usr/bin/env python3
"""
scripts/loop_report.py

Lit le JSON de sortie d'un cycle `claude -p ... --output-format json`,
met a jour loop_state.json (cycle_count, last_run, last_stop_reason)
et journalise le cycle dans loop-run-log.md.

Usage:
    python3 scripts/loop_report.py <result.json> <loop_state.json> <loop-run-log.md> <cycle_n>

Sort avec un code != 0 si la lecture/ecriture d'un fichier echoue, pour
que l'orchestrateur bash puisse s'arreter proprement plutot que de
continuer sur un etat corrompu.
"""
import json
import sys
from datetime import datetime, timezone

STOP_MARKERS = [
    "secret detecte",
    "secret détecté",
    "arret dur",
    "arrêt dur",
    "stop_hard",
]


def main() -> int:
    if len(sys.argv) != 5:
        print(
            "Usage: loop_report.py <result.json> <loop_state.json> "
            "<loop-run-log.md> <cycle_n>",
            file=sys.stderr,
        )
        return 2

    result_path, state_path, log_path, cycle_n = sys.argv[1:5]

    try:
        with open(result_path, "r", encoding="utf-8") as f:
            result = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"[loop_report] impossible de lire {result_path}: {e}", file=sys.stderr)
        return 1

    try:
        with open(state_path, "r", encoding="utf-8") as f:
            state = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"[loop_report] impossible de lire {state_path}: {e}", file=sys.stderr)
        return 1

    now = datetime.now(timezone.utc).isoformat()

    cost = result.get("total_cost_usd")
    session_id = result.get("session_id")
    is_error = bool(result.get("is_error", False))
    summary = (result.get("result") or "").strip()

    state["cycle_count"] = int(state.get("cycle_count", 0)) + 1
    state["last_run"] = now

    triggered = next(
        (m for m in STOP_MARKERS if m.lower() in summary.lower()), None
    )
    state["last_stop_reason"] = triggered

    try:
        with open(state_path, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
            f.write("\n")
    except OSError as e:
        print(f"[loop_report] impossible d'écrire {state_path}: {e}", file=sys.stderr)
        return 1

    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"\n## Cycle {cycle_n} — {now}\n")
            f.write(f"- session_id: {session_id}\n")
            f.write(f"- cout_usd: {cost}\n")
            f.write(f"- erreur: {is_error}\n")
            if triggered:
                f.write(f"- **ARRET DUR signalé**: {triggered}\n")
            f.write("- résumé:\n\n")
            f.write(f"{summary}\n")
    except OSError as e:
        print(f"[loop_report] impossible d'écrire {log_path}: {e}", file=sys.stderr)
        return 1

    print(
        f"[loop_report] cycle {cycle_n} enregistré "
        f"(session={session_id}, coût={cost}$, erreur={is_error})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
