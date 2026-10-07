#!/usr/bin/env python3
"""Compare SQL migration files with the live database schema and produce a report.

Usage: .venv/bin/python3 scripts/audit/schema_compare.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List, Set

from sqlalchemy import text

from backend.app.core.database import engine


ROOT = Path(__file__).resolve().parents[2]


def find_migration_sql_files() -> List[Path]:
    candidates = []
    for p in (ROOT / "supabase").rglob("*.sql") if (ROOT / "supabase").exists() else []:
        candidates.append(p)
    for p in (ROOT / "backups").rglob("migrations/*.sql"):
        candidates.append(p)
    # also include any top-level migrations directory
    for p in ROOT.rglob("**/migrations/*.sql"):
        if "node_modules" in str(p) or ".venv" in str(p):
            continue
        candidates.append(p)
    # unique
    uniq = sorted({p.resolve() for p in candidates})
    return uniq


RE_TABLE = re.compile(r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?\"?([a-zA-Z0-9_]+)\"?", re.IGNORECASE)
RE_FUNCTION = re.compile(r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?\"?([a-zA-Z0-9_]+)\"?", re.IGNORECASE)
RE_VIEW = re.compile(r"CREATE\s+VIEW\s+(?:public\.)?\"?([a-zA-Z0-9_]+)\"?", re.IGNORECASE)
RE_POLICY = re.compile(r"CREATE\s+POLICY\s+\"?([a-zA-Z0-9_\-]+)\"?\s+ON\s+(?:public\.)?\"?([a-zA-Z0-9_]+)\"?", re.IGNORECASE)


def parse_migration_objects(files: List[Path]) -> Dict[str, Set[str]]:
    tables = set()
    functions = set()
    views = set()
    policies = set()

    for f in files:
        try:
            txt = f.read_text(encoding="utf-8")
        except Exception:
            continue
        for m in RE_TABLE.finditer(txt):
            tables.add(m.group(1))
        for m in RE_FUNCTION.finditer(txt):
            functions.add(m.group(1))
        for m in RE_VIEW.finditer(txt):
            views.add(m.group(1))
        for m in RE_POLICY.finditer(txt):
            policies.add(m.group(2))

    return {
        "tables": tables,
        "functions": functions,
        "views": views,
        "policies_on_tables": policies,
    }


def collect_db_schema() -> Dict[str, List[Dict[str, str]]]:
    result = {}
    with engine.connect() as conn:
        def safe_query(q, default=None):
            try:
                return list(conn.execute(text(q)))
            except Exception:
                return default

        # tables
        rows = safe_query("SELECT tablename FROM pg_tables WHERE schemaname='public';", []) or []
        tables = [r[0] for r in rows]
        result["tables"] = sorted(tables)

        # columns per table
        cols = {}
        rows = safe_query("SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public';", []) or []
        for row in rows:
            t, c, dt, nullable = row
            cols.setdefault(t, []).append({"column": c, "type": dt, "nullable": nullable})
        result["columns"] = cols

        # indexes
        idx = {}
        rows = safe_query("SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public';", []) or []
        for r in rows:
            t, name, d = r
            idx.setdefault(t, []).append({"index": name, "def": d})
        result["indexes"] = idx

        # constraints
        constraints = {}
        rows = safe_query("SELECT tc.table_name, tc.constraint_type, tc.constraint_name FROM information_schema.table_constraints tc WHERE tc.table_schema='public';", []) or []
        for r in rows:
            t, ctype, cname = r
            constraints.setdefault(t, []).append({"type": ctype, "name": cname})
        result["constraints"] = constraints

        # functions
        rows = safe_query("SELECT proname FROM pg_proc JOIN pg_namespace ns ON pg_proc.pronamespace = ns.oid WHERE ns.nspname='public';", []) or []
        funcs = [r[0] for r in rows]
        result["functions"] = sorted(funcs)

        # views
        rows = safe_query("SELECT table_name FROM information_schema.views WHERE table_schema='public';", []) or []
        views = [r[0] for r in rows]
        result["views"] = sorted(views)

        # triggers
        rows = safe_query("SELECT event_object_table, trigger_name FROM information_schema.triggers WHERE trigger_schema='public';", []) or []
        triggers = []
        for r in rows:
            triggers.append({"table": r[0], "trigger": r[1]})
        result["triggers"] = triggers

        # policies
        rows = safe_query("SELECT polname, tablename FROM pg_policies WHERE schemaname='public';", []) or []
        policies = []
        for r in rows:
            policies.append({"policy": r[0], "table": r[1]})
        result["policies"] = policies

        # extensions
        rows = safe_query("SELECT extname FROM pg_extension;", []) or []
        ext = [r[0] for r in rows]
        result["extensions"] = sorted(ext)

        # detect migrations table if any
        mig_tables = [n for n in tables if "migration" in n or "schema_migrations" in n or "supabase" in n]
        result["migration_tables_detected"] = mig_tables
        if mig_tables:
            # attempt to read rows from first
            rows = safe_query(f"SELECT * FROM {mig_tables[0]} LIMIT 100", []) or []
            try:
                result["migration_table_sample"] = [dict(r._mapping) for r in rows]
            except Exception:
                result["migration_table_sample"] = []

    return result


def diff(parsed: Dict[str, Set[str]], db: Dict[str, object]):
    db_tables = set(db.get("tables", []))
    tables_missing = sorted(list(parsed["tables"] - db_tables))
    tables_extra = sorted(list(db_tables - parsed["tables"]))

    funcs_missing = sorted(list(parsed["functions"] - set(db.get("functions", []))))
    views_missing = sorted(list(parsed["views"] - set(db.get("views", []))))
    policies_missing = sorted(list(parsed["policies_on_tables"] - set([p["table"] for p in db.get("policies", [])])))

    return {
        "tables_missing": tables_missing,
        "tables_extra": tables_extra,
        "functions_missing": funcs_missing,
        "views_missing": views_missing,
        "policies_missing_tables": policies_missing,
    }


def main():
    files = find_migration_sql_files()
    print(f"Found {len(files)} migration SQL files")
    parsed = parse_migration_objects(files)
    db = collect_db_schema()
    diffs = diff(parsed, db)

    out = {
        "migration_files": [str(p) for p in files],
        "parsed_from_migrations": {k: sorted(list(v)) for k, v in parsed.items()},
        "db_snapshot": db,
        "diff": diffs,
    }

    repo_reports = Path(ROOT / "backend" / "reports")
    repo_reports.mkdir(parents=True, exist_ok=True)
    json_path = repo_reports / "schema_audit.json"
    md_path = repo_reports / "schema_audit.md"
    json_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")

    # write quick markdown summary
    md = ["# Schema audit report", "\n"]
    md.append(f"- migration files scanned: {len(files)}")
    md.append(f"- tables declared in migrations: {len(parsed['tables'])}")
    md.append(f"- tables in DB: {len(db.get('tables', []))}")
    md.append("\n## Missing tables (declared in migrations but not present in DB)")
    md.extend([f"- {t}" for t in diffs["tables_missing"]] or ["- (none)"])
    md.append("\n## Extra tables (present in DB but not declared in scanned migrations)")
    md.extend([f"- {t}" for t in diffs["tables_extra"]] or ["- (none)"])
    md.append("\n## Missing functions declared in migrations")
    md.extend([f"- {t}" for t in diffs["functions_missing"]] or ["- (none)"])
    md.append("\n## Missing views declared in migrations")
    md.extend([f"- {t}" for t in diffs["views_missing"]] or ["- (none)"])
    md.append("\n## Policies expected by migrations but missing tables")
    md.extend([f"- {t}" for t in diffs["policies_missing_tables"]] or ["- (none)"])

    md.append("\n---\nFull JSON report: backend/reports/schema_audit.json")
    md_path.write_text("\n".join(md), encoding="utf-8")

    print("Report written:")
    print(json_path)
    print(md_path)


if __name__ == "__main__":
    main()
