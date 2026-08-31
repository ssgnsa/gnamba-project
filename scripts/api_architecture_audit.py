#!/usr/bin/env python3
"""
GNAMBA ERP - API Architecture Audit
Version : 1.0
"""

import re
import json
from pathlib import Path
from collections import defaultdict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
API_DIR = PROJECT_ROOT / "backend" / "app" / "api"
REPORT_DIR = PROJECT_ROOT / "reports" / "api_audit"

REPORT_DIR.mkdir(parents=True, exist_ok=True)


class APIScanner:

    def __init__(self):
        self.router_files = []
        self.routes_files = []
        self.init_files = []
        self.prefixes = []
        self.tags = []
        self.apirouters = []
        self.include_router = []
        self.routes = []

    def scan(self):

        for file in API_DIR.rglob("*.py"):

            text = file.read_text(
                encoding="utf-8",
                errors="ignore"
            )

            rel = file.relative_to(PROJECT_ROOT)

            if file.name == "router.py":
                self.router_files.append(str(rel))

            if file.name == "routes.py":
                self.routes_files.append(str(rel))

            if file.name == "__init__.py":
                self.init_files.append(str(rel))

            for m in re.finditer(r'APIRouter\s*\(', text):
                self.apirouters.append(str(rel))

            for m in re.finditer(r'prefix\s*=\s*["\']([^"\']+)["\']', text):
                self.prefixes.append({
                    "file": str(rel),
                    "prefix": m.group(1)
                })

            for m in re.finditer(r'tags\s*=\s*\[([^\]]+)\]', text):
                self.tags.append({
                    "file": str(rel),
                    "tags": m.group(1)
                })

            for m in re.finditer(r'include_router\s*\(', text):
                self.include_router.append(str(rel))

            for method in [
                "get",
                "post",
                "put",
                "delete",
                "patch",
                "options",
                "head"
            ]:

                pattern = rf'@router\.{method}\(\s*["\']([^"\']+)'

                for r in re.finditer(pattern, text):

                    self.routes.append({
                        "method": method.upper(),
                        "path": r.group(1),
                        "file": str(rel)
                    })

    def markdown(self):

        md = []

        md.append("# API_ANALYSIS_REPORT")
        md.append("")
        md.append(f"Routers trouvés : {len(self.apirouters)}")
        md.append(f"Routes trouvées : {len(self.routes)}")
        md.append(f"include_router : {len(self.include_router)}")
        md.append("")

        md.append("## Router files")
        md.append("")

        for r in sorted(self.router_files):
            md.append(f"- {r}")

        md.append("")
        md.append("## Prefixes")
        md.append("")

        for p in self.prefixes:
            md.append(
                f"- `{p['prefix']}` → {p['file']}"
            )

        md.append("")
        md.append("## Routes")
        md.append("")

        for r in self.routes:
            md.append(
                f"- {r['method']:6} {r['path']} ({r['file']})"
            )

        return "\n".join(md)

    def save(self):

        (REPORT_DIR / "report.md").write_text(
            self.markdown(),
            encoding="utf-8"
        )

        (REPORT_DIR / "summary.json").write_text(
            json.dumps({
                "routers": self.apirouters,
                "routes": self.routes,
                "prefixes": self.prefixes
            }, indent=2),
            encoding="utf-8"
        )


def main():

    print()

    print("=" * 60)
    print("GNAMBA ERP API AUDIT")
    print("=" * 60)

    scanner = APIScanner()

    scanner.scan()

    scanner.save()

    print()

    print("Audit terminé")

    print()

    print(f"Routers : {len(scanner.apirouters)}")
    print(f"Routes  : {len(scanner.routes)}")
    print(f"Prefixes: {len(scanner.prefixes)}")

    print()

    print(f"Rapport : {REPORT_DIR}")


if __name__ == "__main__":
    main()
