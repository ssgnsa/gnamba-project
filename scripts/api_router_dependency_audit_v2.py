#!/usr/bin/env python3

from pathlib import Path
import json


ROOT = Path.home() / "gnamba-project"
API = ROOT / "backend/app/api"


results = []


for file in API.rglob("*.py"):

    lines = file.read_text(errors="ignore").splitlines()

    for number, line in enumerate(lines, start=1):

        if "include_router" in line:

            results.append(
                {
                    "file": str(file.relative_to(ROOT)),
                    "line_number": number,
                    "content": line.strip()
                }
            )


report = ROOT / "reports/api_audit_v2/include_router_complete.json"

report.write_text(
    json.dumps(
        results,
        indent=2,
        ensure_ascii=False
    )
)


md = [
    "# INCLUDE ROUTER COMPLETE MAP\n\n"
]


for item in results:

    md.append(
        f"""
## {item['file']}:{item['line_number']}

```python
{item['content']}

"""
)

(ROOT/"reports/api_audit_v2/include_router_complete.md").write_text(
"".join(md)
)

print("="*60)
print("INCLUDE ROUTER COMPLETE AUDIT")
print("="*60)
print()
print("include_router trouvés :", len(results))
print()
print(
"Rapport :",
ROOT/"reports/api_audit_v2/include_router_complete.md"
)

