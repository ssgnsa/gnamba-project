#!/bin/bash
# Régénère les sections <AUTO> de AI-MEMORY.md
set -e
cd "$(dirname "$0")/.."

MEMORY="AI-MEMORY.md"
GIT_BRANCH=$(git branch --show-current)
GIT_LOG=$(git log --oneline -3)
GIT_BRANCHES=$(git branch -a | sed 's/^/  /')
NODE_V=$(node --version 2>/dev/null || echo "N/A")
NPM_V=$(npm --version 2>/dev/null || echo "N/A")
VITE_V=$(grep -oP '"vite":\s*"\^?\K[\d.]+' package.json 2>/dev/null || echo "N/A")

SIZES=$(cat <<EOF
| Fichier | Lignes |
|---|---|
| src/pages/Foncier.tsx | $(wc -l < src/pages/Foncier.tsx 2>/dev/null || echo "?") |
| src/components/foncier/parts/LotFormModal.tsx | $(wc -l < src/components/foncier/parts/LotFormModal.tsx 2>/dev/null || echo "?") |
| backend/app/api/v1/foncier/router.py | $(wc -l < backend/app/api/v1/foncier/router.py 2>/dev/null || echo "?") |
EOF
)

python3 <<PYEOF
import re
from datetime import datetime

with open("$MEMORY") as f:
    content = f.read()

def replace_auto(tag, new):
    return re.sub(rf'<!-- AUTO:{tag} -->.*?<!-- /AUTO:{tag} -->', new, content, flags=re.DOTALL)

content = replace_auto("git", f'''<!-- AUTO:git -->
### Branche active
\`$GIT_BRANCH\`

### Derniers commits
\`\`\`
$GIT_LOG
\`\`\`

### Branches
$GIT_BRANCHES
<!-- /AUTO:git -->''')

content = replace_auto("versions", f'''<!-- AUTO:versions -->
### Versions
- Node : $NODE_V
- npm : $NPM_V
- Vite : $VITE_V
<!-- /AUTO:versions -->''')

content = replace_auto("sizes", f'''<!-- AUTO:sizes -->
### Tailles fichiers clés
$SIZES
<!-- /AUTO:sizes -->''')

content = re.sub(
    r'\*Dernière mise à jour : .*\*',
    f'*Dernière mise à jour : {datetime.now().strftime("%Y-%m-%d %H:%M")} — \`$GIT_BRANCH\`*',
    content
)

with open("$MEMORY", "w") as f:
    f.write(content)

print("✅ AI-MEMORY.md régénéré")
PYEOF