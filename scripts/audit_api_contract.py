#!/usr/bin/env python3

"""
EGS / GNAMBA ERP - API Contract Auditor

Analyse :
- Frontend React/TypeScript
- Backend FastAPI
- Dépendances Supabase restantes

Génère :
docs/AUDIT_API_CONTRACT.md
"""

from pathlib import Path
import re
from datetime import datetime


ROOT = Path(__file__).resolve().parent.parent

FRONTEND = ROOT / "frontend" / "src"
BACKEND = ROOT / "backend"
DOCS = ROOT / "docs"


REPORT = DOCS / "AUDIT_API_CONTRACT.md"


# -----------------------------
# Utilitaires
# -----------------------------

def read_files(folder, extensions):
    files = []

    if not folder.exists():
        return files

    for ext in extensions:
        files.extend(folder.rglob(f"*{ext}"))

    return files


def normalize(path):
    if not path:
        return ""

    path = path.strip()
    path = path.replace('"', "")
    path = path.replace("'", "")
    path = path.replace("`", "")

    if not path.startswith("/"):
        return ""

    return path.rstrip("/")


# -----------------------------
# FRONTEND
# -----------------------------

def scan_frontend():

    endpoints = {}
    supabase = []

    files = read_files(
        FRONTEND,
        [
            ".ts",
            ".tsx",
            ".js",
            ".jsx"
        ]
    )

    patterns = [

        r"""fetch\(\s*["'`](\/[^"'`]+)""",

        r"""axios\.(get|post|put|delete|patch)\(\s*["'`](\/[^"'`]+)""",

        r"""apiClient\.(get|post|put|delete|patch)\(\s*["'`](\/[^"'`]+)""",

    ]


    for file in files:

        try:
            content = file.read_text(
                encoding="utf-8",
                errors="ignore"
            )

        except:
            continue


        for pattern in patterns:

            for match in re.findall(
                pattern,
                content
            ):

                endpoint = (
                    match
                    if isinstance(match, str)
                    else match[-1]
                )

                endpoint = normalize(endpoint)

                if endpoint:

                    endpoints.setdefault(
                        endpoint,
                        []
                    ).append(
                        str(file.relative_to(ROOT))
                    )


        if "supabase." in content:

            supabase.append(
                str(file.relative_to(ROOT))
            )


    return endpoints, supabase



# -----------------------------
# BACKEND FASTAPI
# -----------------------------

def scan_backend():

    routes = {}

    files = read_files(
        BACKEND,
        [
            ".py"
        ]
    )


    prefixes = {}

    for file in files:

        try:
            content = file.read_text(
                encoding="utf-8",
                errors="ignore"
            )

        except:
            continue


        prefix_match = re.search(
            r'APIRouter\(\s*.*?prefix\s*=\s*["\']([^"\']+)',
            content,
            re.S
        )


        prefix = ""

        if prefix_match:
            prefix = prefix_match.group(1)


        decorators = re.findall(
            r'@router\.(get|post|put|delete|patch)\(\s*["\']([^"\']+)',
            content
        )


        for method, path in decorators:

            full = normalize(
                prefix + path
            )

            if full:

                routes.setdefault(
                    full,
                    []
                ).append(
                    str(file.relative_to(ROOT))
                )


    return routes



# -----------------------------
# RAPPORT
# -----------------------------

def generate_report(front, back, supabase):

    DOCS.mkdir(
        exist_ok=True
    )


    lines = []

    lines.append(
        "# GNAMBA ERP - API Contract Audit\n"
    )

    lines.append(
        f"Date : {datetime.now()}\n"
    )


    lines.append(
        "## Résumé\n"
    )


    matches = 0
    missing = []


    for endpoint in sorted(front):

        if endpoint in back:
            matches += 1

        else:
            missing.append(endpoint)


    lines.append(
        f"""
- Frontend endpoints détectés : **{len(front)}**
- Backend routes détectées : **{len(back)}**
- Correspondances : **{matches}**
- Frontend sans backend : **{len(missing)}**
- Fichiers utilisant Supabase : **{len(supabase)}**

"""
    )


    lines.append(
        "## Frontend ↔ Backend\n\n"
    )


    lines.append(
        "| Frontend | Backend | Etat |\n"
    )

    lines.append(
        "|---|---|---|\n"
    )


    for endpoint in sorted(front):

        if endpoint in back:

            status = "✅"

        else:

            status = "❌"


        backend = (
            endpoint
            if endpoint in back
            else "-"
        )


        lines.append(
            f"| `{endpoint}` | `{backend}` | {status} |\n"
        )


    lines.append(
        "\n## Routes Backend inutilisées\n\n"
    )


    lines.append(
        "| Route | Fichier |\n"
    )

    lines.append(
        "|---|---|\n"
    )


    for route in sorted(back):

        if route not in front:

            for file in back[route]:

                lines.append(
                    f"| `{route}` | `{file}` |\n"
                )


    lines.append(
        "\n## Supabase restant dans le frontend\n\n"
    )


    if supabase:

        for file in supabase:

            lines.append(
                f"- ❌ `{file}`\n"
            )

    else:

        lines.append(
            "✅ Aucun appel Supabase détecté\n"
        )


    REPORT.write_text(
        "".join(lines),
        encoding="utf-8"
    )


# -----------------------------
# MAIN
# -----------------------------

def main():

    print("🔍 Scan frontend...")

    frontend, supabase = scan_frontend()


    print(
        f"   {len(frontend)} endpoints trouvés"
    )


    print("🔍 Scan backend FastAPI...")

    backend = scan_backend()


    print(
        f"   {len(backend)} routes trouvées"
    )


    generate_report(
        frontend,
        backend,
        supabase
    )


    print("\n✅ Audit terminé")
    print(
        f"📄 Rapport : {REPORT}"
    )



if __name__ == "__main__":
    main()
