#!/usr/bin/env python3

import os
import re
import json
from pathlib import Path
from collections import defaultdict


ROOT = Path.home() / "gnamba-project"
API_DIR = ROOT / "backend/app/api/v1"
REPORT_DIR = ROOT / "reports/api_audit_v2"

REPORT_DIR.mkdir(parents=True, exist_ok=True)


routers = []
routes = []
imports = defaultdict(list)


def scan_python_files():

    for file in API_DIR.rglob("*.py"):

        content = file.read_text(errors="ignore")

        if "APIRouter" in content:

            routers.append(str(file))

            prefixes = re.findall(
                r'prefix\s*=\s*["\']([^"\']+)',
                content
            )

            for p in prefixes:

                routes.append({
                    "file": str(file.relative_to(ROOT)),
                    "prefix": p
                })


        for imp in re.findall(
            r'(?:from|import)\s+([\w\.]+)',
            content
        ):
            imports[imp].append(
                str(file.relative_to(ROOT))
            )



def detect_duplicates():

    result = defaultdict(list)

    for r in routes:

        result[r["prefix"]].append(
            r["file"]
        )


    return {
        k:v
        for k,v in result.items()
        if len(v)>1
    }



def orphan_files():

    output=[]

    for file in API_DIR.rglob("*.py"):

        if file.name=="__init__.py":
            continue

        module = ".".join(
            file.relative_to(ROOT)
            .with_suffix("")
            .parts
        )

        used=False

        for key in imports:

            if module in key:
                used=True


        if not used:
            output.append(
                str(file.relative_to(ROOT))
            )

    return output



def generate():

    data={

        "routers":len(routers),

        "prefixes":routes,

        "duplicate_prefixes":
            detect_duplicates(),

        "orphan_python_files":
            orphan_files()

    }


    with open(
        REPORT_DIR/"audit_v2.json",
        "w"
    ) as f:

        json.dump(
            data,
            f,
            indent=2
        )


    md=[]

    md.append(
        "# API ARCHITECTURE AUDIT V2\n"
    )


    md.append(
        f"""
## Résumé

Routers : {len(routers)}

Prefixes : {len(routes)}

"""
    )


    md.append(
        "\n## DUPLICATIONS\n"
    )


    for k,v in detect_duplicates().items():

        md.append(
            f"""
### {k}

"""
        )

        for x in v:
            md.append(
                f"- {x}\n"
            )


    md.append(
        "\n## Fichiers potentiellement orphelins\n"
    )


    for x in orphan_files():

        md.append(
            f"- {x}\n"
        )


    (REPORT_DIR/"API_ANALYSIS_REPORT_V2.md").write_text(
        "".join(md)
    )



if __name__=="__main__":

    print("="*60)
    print("GNAMBA ERP API ARCHITECTURE AUDIT V2")
    print("="*60)

    scan_python_files()

    generate()

    print()
    print("Audit terminé")
    print()
    print(
        "Rapport :",
        REPORT_DIR
    )
