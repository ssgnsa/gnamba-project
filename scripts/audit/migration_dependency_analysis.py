#!/usr/bin/env python3
"""Analyze SQL migrations to determine apply order, dependencies, and risks.

Usage: PYTHONPATH=. .venv/bin/python3 scripts/audit/migration_dependency_analysis.py
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple

ROOT = Path(__file__).resolve().parents[2]

# Regex patterns for SQL object extraction
RE_FILE_NAME = re.compile(r"(\d{14})_([a-z0-9_]+)\.sql")
RE_CREATE_TABLE = re.compile(r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?['\"]?([a-zA-Z0-9_]+)['\"]?", re.IGNORECASE)
RE_CREATE_FUNCTION = re.compile(r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?['\"]?([a-zA-Z0-9_]+)['\"]?", re.IGNORECASE)
RE_ENABLE_RLS = re.compile(r"ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?['\"]?([a-zA-Z0-9_]+)['\"]?\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY", re.IGNORECASE)
RE_CREATE_POLICY = re.compile(r"CREATE\s+POLICY\s+['\"]?([a-zA-Z0-9_\-]+)['\"]?\s+ON\s+(?:public\.)?['\"]?([a-zA-Z0-9_]+)['\"]?", re.IGNORECASE)
RE_CREATE_INDEX = re.compile(r"CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?['\"]?([a-zA-Z0-9_]+)['\"]?\s+ON\s+(?:public\.)?['\"]?([a-zA-Z0-9_]+)['\"]?", re.IGNORECASE)
RE_ADD_CONSTRAINT = re.compile(r"ALTER\s+TABLE\s+(?:public\.)?['\"]?([a-zA-Z0-9_]+)['\"]?\s+ADD\s+(?:CONSTRAINT\s+['\"]?[a-zA-Z0-9_]+['\"]?\s+)?([A-Z]+)\s+", re.IGNORECASE)
RE_COMMENT = re.compile(r"--\s*(Purpose|Impact|Risk|RUN MANUALLY):\s*(.+)", re.IGNORECASE)

class Migration:
    def __init__(self, path: Path):
        self.path = path
        self.name = path.stem
        m = RE_FILE_NAME.match(self.name)
        self.timestamp = m.group(1) if m else ""
        self.description = m.group(2) if m else ""
        
        self.content = path.read_text(encoding="utf-8")
        
        # Parse metadata
        self.tables_created: Set[str] = set()
        self.functions_created: Set[str] = set()
        self.policies_created: Set[Tuple[str, str]] = set()
        self.tables_with_rls: Set[str] = set()
        self.indexes_created: Set[str] = set()
        self.constraints_added: Dict[str, List[str]] = defaultdict(list)
        self.metadata: Dict[str, str] = {}
        
        self._parse()
    
    def _parse(self):
        for m in RE_CREATE_TABLE.finditer(self.content):
            self.tables_created.add(m.group(1))
        
        for m in RE_CREATE_FUNCTION.finditer(self.content):
            self.functions_created.add(m.group(1))
        
        for m in RE_ENABLE_RLS.finditer(self.content):
            self.tables_with_rls.add(m.group(1))
        
        for m in RE_CREATE_POLICY.finditer(self.content):
            policy = m.group(1)
            table = m.group(2)
            self.policies_created.add((policy, table))
        
        for m in RE_CREATE_INDEX.finditer(self.content):
            self.indexes_created.add(m.group(1))
        
        for m in RE_ADD_CONSTRAINT.finditer(self.content):
            table = m.group(1)
            constraint_type = m.group(2).upper()
            self.constraints_added[table].append(constraint_type)
        
        for m in RE_COMMENT.finditer(self.content):
            key = m.group(1).lower()
            val = m.group(2).strip()
            self.metadata[key] = val
    
    def to_dict(self):
        return {
            "name": self.name,
            "timestamp": self.timestamp,
            "description": self.description,
            "tables_created": sorted(list(self.tables_created)),
            "functions_created": sorted(list(self.functions_created)),
            "tables_with_rls": sorted(list(self.tables_with_rls)),
            "policies_on_tables": sorted(list(set(t for _, t in self.policies_created))),
            "indexes_created": sorted(list(self.indexes_created)),
            "constraints_added": {k: sorted(v) for k, v in self.constraints_added.items()},
            "metadata": self.metadata,
            "risk_level": self._assess_risk(),
        }
    
    def _assess_risk(self) -> str:
        """Assess risk level: LOW, MEDIUM, HIGH"""
        if self.metadata.get("risk") and "high" in self.metadata.get("risk", "").lower():
            return "HIGH"
        
        # High risk: many tables, RLS, constraints
        num_objects = len(self.tables_created) + len(self.functions_created) + len(self.policies_created)
        if num_objects > 5 or self.tables_with_rls:
            return "MEDIUM"
        
        if "rls" in self.description.lower() or "constraint" in self.description.lower():
            return "MEDIUM"
        
        return "LOW"


def find_migration_files() -> List[Migration]:
    migrations = []
    
    # Search in supabase/migrations
    if (ROOT / "supabase" / "migrations").exists():
        for f in (ROOT / "supabase" / "migrations").glob("*.sql"):
            migrations.append(Migration(f))
    
    # Search in backups
    for f in ROOT.glob("**/migrations/*.sql"):
        if "node_modules" not in str(f) and ".venv" not in str(f):
            mig = Migration(f)
            # avoid duplicates
            if not any(m.name == mig.name for m in migrations):
                migrations.append(mig)
    
    # Sort by timestamp
    return sorted(migrations, key=lambda m: m.timestamp)


def infer_dependency_order(migrations: List[Migration]) -> List[Migration]:
    """Attempt to infer a safe execution order based on object creation patterns."""
    
    # Basic heuristic: 
    # 1. Functions/helpers first (if not dependent on tables)
    # 2. Tables
    # 3. RLS/Policies
    # 4. Indexes/Constraints
    
    function_migs = [m for m in migrations if m.functions_created and not m.tables_created]
    table_migs = [m for m in migrations if m.tables_created]
    policy_migs = [m for m in migrations if m.policies_created or m.tables_with_rls]
    index_migs = [m for m in migrations if m.indexes_created and m not in table_migs and m not in policy_migs]
    other_migs = [m for m in migrations if m not in function_migs and m not in table_migs and m not in policy_migs and m not in index_migs]
    
    # Within each category, maintain timestamp order
    return sorted(function_migs, key=lambda m: m.timestamp) + \
           sorted(table_migs, key=lambda m: m.timestamp) + \
           sorted(policy_migs, key=lambda m: m.timestamp) + \
           sorted(index_migs, key=lambda m: m.timestamp) + \
           sorted(other_migs, key=lambda m: m.timestamp)


def main():
    migrations = find_migration_files()
    ordered = infer_dependency_order(migrations)
    
    # Prepare output
    out = {
        "total_migrations": len(migrations),
        "applied_order_strategy": "functions → tables → policies/rls → indexes → other",
        "migrations": [m.to_dict() for m in ordered],
    }
    
    repo_reports = ROOT / "backend" / "reports"
    repo_reports.mkdir(parents=True, exist_ok=True)
    
    json_path = repo_reports / "migration_analysis.json"
    json_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    
    # Write markdown summary
    md = ["# Migration Dependency & Risk Analysis\n"]
    md.append(f"- Total migrations found: {len(migrations)}\n")
    md.append("## Apply Order (Recommended Sequence)\n\n")
    
    current_category = None
    for i, mig in enumerate(ordered, 1):
        # Categorize
        if mig.functions_created and not mig.tables_created:
            cat = "Functions"
        elif mig.tables_created:
            cat = "Tables"
        elif mig.policies_created or mig.tables_with_rls:
            cat = "RLS/Policies"
        elif mig.indexes_created:
            cat = "Indexes"
        else:
            cat = "Other"
        
        if cat != current_category:
            md.append(f"\n### {cat}\n")
            current_category = cat
        
        risk_emoji = "🔴" if mig.to_dict()["risk_level"] == "HIGH" else "🟡" if mig.to_dict()["risk_level"] == "MEDIUM" else "🟢"
        md.append(f"\n{i}. **{mig.name}**  {risk_emoji}")
        md.append(f"   - Timestamp: {mig.timestamp}")
        md.append(f"   - Creates: {len(mig.tables_created)} tables, {len(mig.functions_created)} functions, {len(mig.policies_created)} policies")
        if mig.tables_created:
            md.append(f"   - Tables: {', '.join(sorted(mig.tables_created))}")
        if mig.tables_with_rls:
            md.append(f"   - RLS enabled on: {', '.join(sorted(mig.tables_with_rls))}")
        if mig.to_dict()["risk_level"] != "LOW":
            md.append(f"   - ⚠️ Risk: {mig.to_dict()['risk_level']}")
        if mig.metadata.get("purpose"):
            md.append(f"   - Purpose: {mig.metadata['purpose']}")
        if mig.metadata.get("run manually"):
            md.append(f"   - ⚠️ Manual: {mig.metadata['run manually']}")
    
    md.append("\n---\nFull JSON: backend/reports/migration_analysis.json")
    
    md_path = repo_reports / "migration_analysis.md"
    md_path.write_text("\n".join(md), encoding="utf-8")
    
    print(f"✓ Analysis complete: {len(migrations)} migrations analyzed")
    print(f"  JSON: {json_path}")
    print(f"  Markdown: {md_path}")


if __name__ == "__main__":
    main()
