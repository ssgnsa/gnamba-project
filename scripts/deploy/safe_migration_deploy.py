#!/usr/bin/env python3
"""Controlled Alembic migration entry point.

The historical filename is retained for operators and automation that already
reference it. This wrapper intentionally does not execute the archived
Supabase SQL migration inventory. Alembic in ``backend/`` is the only active
schema path.

Examples::

    DATABASE_URL='postgresql://<role>@<host>/<db>' \
      python scripts/deploy/safe_migration_deploy.py --dry-run

    DATABASE_URL='postgresql://<role>@<host>/<db>' \
      EGS_BACKUP_VERIFIED=1 EGS_MIGRATION_APPROVED=1 \
      python scripts/deploy/safe_migration_deploy.py --apply
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
APPLY_SCRIPT = ROOT / "scripts" / "apply-migrations.sh"


def migration_python() -> str:
    candidate = BACKEND / ".venv" / "bin" / "python"
    if candidate.is_file() and os.access(candidate, os.X_OK):
        return str(candidate)
    return sys.executable


def require_database_url(explicit: str | None) -> str:
    value = explicit or os.environ.get("DATABASE_URL")
    if not value:
        raise SystemExit(
            "[ERROR] DATABASE_URL doit être fourni explicitement; "
            "aucun DSN implicite ni base postgres par défaut n'est autorisé"
        )
    return value


def run_alembic_check(db_url: str) -> int:
    environment = {**os.environ, "DATABASE_URL": db_url}
    python = migration_python()
    for command in (
        [python, "-m", "alembic", "heads"],
        [python, "-m", "alembic", "current"],
    ):
        result = subprocess.run(command, cwd=BACKEND, env=environment, check=False)
        if result.returncode != 0:
            return result.returncode
    print("[OK] Chaîne Alembic et révision courante vérifiées; aucune écriture effectuée")
    return 0


def run_controlled_apply(db_url: str) -> int:
    if not APPLY_SCRIPT.is_file():
        print(f"[ERROR] Script canonique absent: {APPLY_SCRIPT}", file=sys.stderr)
        return 1
    environment = {**os.environ, "DATABASE_URL": db_url}
    result = subprocess.run([str(APPLY_SCRIPT)], cwd=ROOT, env=environment, check=False)
    return result.returncode


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Préflight ou application contrôlée des migrations Alembic"
    )
    parser.add_argument(
        "--db-url",
        default=None,
        help="DSN explicite; sinon DATABASE_URL doit être défini",
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--dry-run",
        action="store_true",
        help="vérifie heads/current sans modifier la base",
    )
    mode.add_argument(
        "--apply",
        action="store_true",
        help="délègue au script Alembic avec ses gates backup/approbation",
    )
    args = parser.parse_args()
    db_url = require_database_url(args.db_url)
    if args.dry_run:
        return run_alembic_check(db_url)
    return run_controlled_apply(db_url)


if __name__ == "__main__":
    raise SystemExit(main())
