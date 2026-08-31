#!/usr/bin/env python3

from pathlib import Path
import re
import json


ROOT = Path.home() / "gnamba-project"
API = ROOT / "backend/app/api"

results=[]


for file in API.rglob("*.py"):

    content=file.read_text(errors="ignore")

    for line in content.splitlines():

        if "include_router" in line:

            results.append({
                "file":str(file.relative_to(ROOT)),
                "line":line.strip()
            })


out=ROOT/"reports/api_audit_v2/include_router_map.json"

out.write_text(
    json.dumps(
        results,
        indent=2
    )
)


md=[]

md.append("# INCLUDE ROUTER MAP\n\n")

for r in results:

    md.append(
        f"""
## {r['file']}

"""
    )


(ROOT/"reports/api_audit_v2/include_router_map.md").write_text(
    "".join(md)
)


print("include_router trouvés :",len(results))

print(
    "Rapport :",
    ROOT/"reports/api_audit_v2/include_router_map.md"
)
