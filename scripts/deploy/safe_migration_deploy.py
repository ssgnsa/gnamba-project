#!/usr/bin/env python3
"""Safe migration deployment script with backup, validation, and rollback support.

Usage: 
  PYTHONPATH=. .venv/bin/python3 scripts/deploy/safe_migration_deploy.py --help
  PYTHONPATH=. .venv/bin/python3 scripts/deploy/safe_migration_deploy.py --dry-run
  PYTHONPATH=. .venv/bin/python3 scripts/deploy/safe_migration_deploy.py --apply
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[2]

# Load migration analysis
MIGRATION_ANALYSIS_PATH = ROOT / "backend" / "reports" / "migration_analysis.json"
BACKUP_DIR = ROOT / "backups" / "migration_backups"


def load_migration_order() -> list[dict]:
    """Load recommended migration order from analysis report."""
    if not MIGRATION_ANALYSIS_PATH.exists():
        print(f"❌ Migration analysis not found. Run scripts/audit/migration_dependency_analysis.py first")
        sys.exit(1)
    
    data = json.loads(MIGRATION_ANALYSIS_PATH.read_text(encoding="utf-8"))
    return data.get("migrations", [])


def find_migration_file(migration_name: str) -> Path | None:
    """Locate the SQL file for a given migration."""
    # Search supabase/migrations
    for f in (ROOT / "supabase" / "migrations").glob("*.sql") if (ROOT / "supabase" / "migrations").exists() else []:
        if migration_name in f.stem:
            return f
    
    # Search backups
    for f in ROOT.glob("**/migrations/*.sql"):
        if "node_modules" not in str(f) and ".venv" not in str(f):
            if migration_name in f.stem:
                return f
    
    return None


def run_sql_file(db_url: str, sql_file: Path) -> tuple[bool, str]:
    """Execute SQL file against database."""
    try:
        result = subprocess.run(
            ["psql", db_url, "-f", str(sql_file), "-v", "ON_ERROR_STOP=1"],
            capture_output=True,
            text=True,
            timeout=300,
        )
        if result.returncode != 0:
            return False, result.stderr or result.stdout
        return True, result.stdout
    except Exception as e:
        return False, str(e)


def create_backup(db_url: str) -> Path | None:
    """Create a full database backup."""
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"backup_{timestamp}.sql"
    
    try:
        result = subprocess.run(
            ["pg_dump", db_url, "-Fp", "-f", str(backup_file)],
            capture_output=True,
            text=True,
            timeout=600,
        )
        if result.returncode == 0:
            print(f"✓ Backup created: {backup_file}")
            return backup_file
        else:
            print(f"❌ Backup failed: {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ Backup error: {e}")
        return None


def get_applied_migrations(db_url: str) -> set[str]:
    """Get list of migrations already applied to the database."""
    try:
        result = subprocess.run(
            ["psql", db_url, "-tc", "SELECT version FROM schema_migrations ORDER BY version;"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            return set(line.strip() for line in result.stdout.split("\n") if line.strip())
    except Exception:
        pass
    return set()


def deployment_plan(migrations: list[dict], db_url: str, dry_run: bool = False) -> bool:
    """Generate and optionally execute deployment plan."""
    
    print("\n" + "=" * 80)
    print("MIGRATION DEPLOYMENT PLAN")
    print("=" * 80)
    
    # Get already-applied migrations
    applied = get_applied_migrations(db_url)
    print(f"\nAlready applied: {len(applied)} migrations")
    
    # Filter to missing migrations
    to_apply = []
    for mig in migrations:
        mig_name = mig.get("name", "")
        # Extract timestamp from name (e.g., "20260324000000_create_foncier_base_tables_and_rpc")
        match = re.match(r"(\d+)_", mig_name)
        if match:
            timestamp = match.group(1)
            if timestamp not in applied:
                to_apply.append(mig)
    
    print(f"To apply: {len(to_apply)} migrations")
    
    if not to_apply:
        print("✓ All migrations already applied!")
        return True
    
    # Plan
    print("\nExecution Plan (in order):\n")
    for i, mig in enumerate(to_apply, 1):
        risk = mig.get("risk_level", "UNKNOWN")
        risk_emoji = "🔴" if risk == "HIGH" else "🟡" if risk == "MEDIUM" else "🟢"
        print(f"{i:3d}. {mig['name']:<60s} {risk_emoji}")
        if mig.get("tables_created"):
            print(f"      └─ Creates tables: {', '.join(mig['tables_created'][:3])}")
        if mig.get("metadata", {}).get("run manually"):
            print(f"      └─ ⚠️  Manual review recommended")
    
    if dry_run:
        print("\n[DRY-RUN MODE] No migrations applied.")
        return True
    
    # Confirm
    print(f"\n{'=' * 80}")
    response = input(f"Apply {len(to_apply)} migrations? (yes/no) > ")
    if response.lower() != "yes":
        print("Cancelled.")
        return False
    
    # Backup
    print("\nCreating backup...")
    backup = create_backup(db_url)
    if not backup:
        print("❌ Backup failed. Aborting.")
        return False
    
    # Apply
    print(f"\nApplying {len(to_apply)} migrations...\n")
    failed = []
    for i, mig in enumerate(to_apply, 1):
        mig_name = mig["name"]
        sql_file = find_migration_file(mig_name)
        if not sql_file:
            print(f"{i}/{len(to_apply)} ❌ {mig_name:<60s} [SQL FILE NOT FOUND]")
            failed.append((mig_name, "SQL file not found"))
            continue
        
        success, output = run_sql_file(db_url, sql_file)
        if success:
            print(f"{i}/{len(to_apply)} ✓ {mig_name:<60s} [OK]")
        else:
            print(f"{i}/{len(to_apply)} ❌ {mig_name:<60s} [FAILED]")
            print(f"       Error: {output[:200]}")
            failed.append((mig_name, output[:500]))
    
    # Summary
    print(f"\n{'=' * 80}")
    if failed:
        print(f"❌ {len(failed)} migrations failed:")
        for name, error in failed:
            print(f"  - {name}: {error[:100]}")
        print(f"\nBackup available at: {backup}")
        print("To rollback, restore from backup and re-run this script.")
        return False
    else:
        print(f"✓ All {len(to_apply)} migrations applied successfully!")
        return True


def main():
    parser = argparse.ArgumentParser(
        description="Safe migration deployment with backup & validation"
    )
    parser.add_argument("--db-url", default=None, help="Database URL (default: from DATABASE_URL env or config)")
    parser.add_argument("--dry-run", action="store_true", help="Plan without applying")
    parser.add_argument("--apply", action="store_true", help="Apply migrations (interactive)")
    
    args = parser.parse_args()
    
    # Get database URL
    db_url = args.db_url or os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/egs_local")
    
    # Verify connection
    try:
        subprocess.run(
            ["psql", db_url, "-c", "SELECT 1;"],
            capture_output=True,
            timeout=5,
            check=True,
        )
    except Exception as e:
        print(f"❌ Cannot connect to database: {e}")
        sys.exit(1)
    
    # Load plan
    migrations = load_migration_order()
    print(f"Loaded {len(migrations)} migrations from analysis report")
    
    # Execute
    success = deployment_plan(migrations, db_url, dry_run=args.dry_run)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    import os
    main()
