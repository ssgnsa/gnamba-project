#!/usr/bin/env bash
set -Eeuo pipefail

###############################################################################
# GNAMBA / EGS
# AUDIT GLOBAL ERP — READ ONLY
#
# Objectif :
#   Cartographier et auditer l'ERP complet sans modifier le projet.
#
# Mode :
#   READ-ONLY
#
# Modifications du projet :
#   AUCUNE
#
# Modifications DB :
#   AUCUNE
#
# Migrations :
#   AUCUNE
#
# Services redémarrés :
#   AUCUN
#
# Tests pouvant modifier l'environnement :
#   AUCUN test applicatif exécuté par défaut
#
# Auteur :
#   Audit global EGS / GNAMBA
###############################################################################

PROJECT="${PROJECT:-$HOME/gnamba-project}"
TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"

REPORT_ROOT="${REPORT_ROOT:-$PROJECT/audit-global-readonly-$TIMESTAMP}"

mkdir -p "$REPORT_ROOT"

LOG="$REPORT_ROOT/00_AUDIT_EXECUTION.log"
SUMMARY="$REPORT_ROOT/00_EXECUTIVE_SUMMARY.md"

exec > >(tee -a "$LOG") 2>&1

###############################################################################
# UTILITAIRES
###############################################################################

section() {
    echo
    echo "======================================================================"
    echo "$1"
    echo "======================================================================"
}

subsection() {
    echo
    echo "----------------------------------------------------------------------"
    echo "$1"
    echo "----------------------------------------------------------------------"
}

run() {
    local label="$1"
    shift

    echo
    echo "[COMMAND] $label"
    echo "+ $*"

    "$@" 2>&1 || {
        echo "[WARN] commande échouée : $label"
        return 0
    }
}

run_shell() {
    local label="$1"
    local command="$2"

    echo
    echo "[COMMAND] $label"
    echo "+ $command"

    bash -c "$command" 2>&1 || {
        echo "[WARN] commande échouée : $label"
        return 0
    }
}

save_cmd() {
    local outfile="$1"
    shift

    {
        echo "# Commande"
        printf '%q ' "$@"
        echo
        echo
        echo "# Résultat"
        "$@" 2>&1 || true
    } > "$outfile"
}

save_shell() {
    local outfile="$1"
    local command="$2"

    {
        echo "# Commande"
        echo
        echo "$command"
        echo
        echo "# Résultat"
        echo
        bash -c "$command" 2>&1 || true
    } > "$outfile"
}

count_files() {
    find "$PROJECT" -type f \
        ! -path "$PROJECT/.git/*" \
        ! -path "$PROJECT/node_modules/*" \
        ! -path "$PROJECT/.venv/*" \
        ! -path "$PROJECT/venv/*" \
        2>/dev/null | wc -l
}

###############################################################################
# PRÉAMBULE
###############################################################################

section "GNAMBA / EGS — AUDIT GLOBAL ERP READ-ONLY"

echo "Date        : $(date)"
echo "Serveur     : $(hostname)"
echo "Utilisateur : $(id -un)"
echo "Projet      : $PROJECT"
echo "Rapport     : $REPORT_ROOT"

if [[ ! -d "$PROJECT" ]]; then
    echo
    echo "[ERREUR] Projet introuvable : $PROJECT"
    exit 1
fi

if [[ ! -d "$PROJECT/.git" ]]; then
    echo
    echo "[WARN] Aucun répertoire .git détecté."
fi

###############################################################################
# 01 — SYSTÈME
###############################################################################

section "01 — SYSTÈME / ENVIRONNEMENT"

{
    echo "# Système"
    echo
    date
    echo
    echo "## Hostname"
    hostname
    echo
    echo "## Kernel"
    uname -a
    echo
    echo "## OS"
    cat /etc/os-release 2>/dev/null || true
    echo
    echo "## Uptime"
    uptime
    echo
    echo "## Mémoire"
    free -h 2>/dev/null || true
    echo
    echo "## Disques"
    df -h
    echo
    echo "## CPU"
    nproc 2>/dev/null || true
} > "$REPORT_ROOT/01_SYSTEME.md"

###############################################################################
# 02 — GIT
###############################################################################

section "02 — GIT / ÉTAT DU PROJET"

if [[ -d "$PROJECT/.git" ]]; then

    save_shell \
        "$REPORT_ROOT/02_GIT_STATUS.txt" \
        "cd '$PROJECT' && git status --short --branch"

    save_shell \
        "$REPORT_ROOT/02_GIT_BRANCH.txt" \
        "cd '$PROJECT' && git branch -vv"

    save_shell \
        "$REPORT_ROOT/02_GIT_LOG.txt" \
        "cd '$PROJECT' && git log --oneline --decorate -30"

    save_shell \
        "$REPORT_ROOT/02_GIT_DIFF_STAT.txt" \
        "cd '$PROJECT' && git diff --stat"

    save_shell \
        "$REPORT_ROOT/02_GIT_UNTRACKED.txt" \
        "cd '$PROJECT' && git ls-files --others --exclude-standard"

else
    echo "Git non disponible dans le projet." \
        > "$REPORT_ROOT/02_GIT_STATUS.txt"
fi

###############################################################################
# 03 — CARTOGRAPHIE DES FICHIERS
###############################################################################

section "03 — CARTOGRAPHIE DU PROJET"

save_shell \
    "$REPORT_ROOT/03_FILE_TREE.txt" \
    "cd '$PROJECT' && find . -maxdepth 3 -type f \
      ! -path './node_modules/*' \
      ! -path './.git/*' \
      ! -path './.venv/*' \
      ! -path './venv/*' \
      | sort | head -10000"

save_shell \
    "$REPORT_ROOT/03_DIRECTORIES.txt" \
    "cd '$PROJECT' && find . -maxdepth 3 -type d \
      ! -path './node_modules*' \
      ! -path './.git*' \
      ! -path './.venv*' \
      ! -path './venv*' \
      | sort"

save_shell \
    "$REPORT_ROOT/03_FILE_COUNT.txt" \
    "find '$PROJECT' -type f \
      ! -path '$PROJECT/.git/*' \
      ! -path '$PROJECT/node_modules/*' \
      ! -path '$PROJECT/.venv/*' \
      ! -path '$PROJECT/venv/*' \
      | wc -l"

###############################################################################
# 04 — TECHNOLOGIES / DEPENDANCES
###############################################################################

section "04 — STACK / DÉPENDANCES"

for f in \
    package.json \
    package-lock.json \
    yarn.lock \
    pnpm-lock.yaml \
    pyproject.toml \
    requirements.txt \
    requirements-dev.txt \
    Pipfile \
    Pipfile.lock \
    docker-compose.yml \
    docker-compose.yaml \
    compose.yml \
    compose.yaml \
    alembic.ini
do
    if [[ -f "$PROJECT/$f" ]]; then
        cp "$PROJECT/$f" "$REPORT_ROOT/04_$f" 2>/dev/null || true
    fi
done

save_shell \
    "$REPORT_ROOT/04_NODE_VERSION.txt" \
    "node --version 2>/dev/null || true"

save_shell \
    "$REPORT_ROOT/04_NPM_VERSION.txt" \
    "npm --version 2>/dev/null || true"

save_shell \
    "$REPORT_ROOT/04_PYTHON_VERSION.txt" \
    "python3 --version 2>/dev/null || true"

save_shell \
    "$REPORT_ROOT/04_DOCKER_VERSION.txt" \
    "docker --version 2>/dev/null || true"

###############################################################################
# 05 — STRUCTURE BACKEND
###############################################################################

section "05 — BACKEND"

save_shell \
    "$REPORT_ROOT/05_BACKEND_STRUCTURE.txt" \
    "cd '$PROJECT' && find backend src app api -maxdepth 4 -type f \
      2>/dev/null | sort | head -10000"

save_shell \
    "$REPORT_ROOT/05_PYTHON_FILES.txt" \
    "cd '$PROJECT' && find . -type f -name '*.py' \
      ! -path './.git/*' \
      ! -path './.venv/*' \
      ! -path './venv/*' \
      ! -path './node_modules/*' \
      | sort"

###############################################################################
# 06 — FRONTEND
###############################################################################

section "06 — FRONTEND"

save_shell \
    "$REPORT_ROOT/06_FRONTEND_STRUCTURE.txt" \
    "cd '$PROJECT' && find src -maxdepth 5 -type f \
      2>/dev/null | sort | head -20000"

save_shell \
    "$REPORT_ROOT/06_TS_TSX_FILES.txt" \
    "cd '$PROJECT' && find . -type f \( -name '*.ts' -o -name '*.tsx' \) \
      ! -path './node_modules/*' \
      ! -path './.git/*' \
      | sort"

###############################################################################
# 07 — ROUTES FRONTEND
###############################################################################

section "07 — ROUTES FRONTEND"

save_shell \
    "$REPORT_ROOT/07_FRONTEND_ROUTES.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(createBrowserRouter|createRoutesFromElements|<Route|path:|router)\" \
     src \
     --include='*.ts' \
     --include='*.tsx' \
     2>/dev/null | head -20000"

###############################################################################
# 08 — API ROUTES BACKEND
###############################################################################

section "08 — ROUTES API"

save_shell \
    "$REPORT_ROOT/08_API_ROUTES.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(@router\\.|@app\\.|APIRouter|include_router|FastAPI\\()\" \
     . \
     --include='*.py' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -30000"

###############################################################################
# 09 — RBAC / AUTH
###############################################################################

section "09 — AUTHENTIFICATION / RBAC"

save_shell \
    "$REPORT_ROOT/09_AUTH_RBAC_SEARCH.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(RBAC|role|roles|permission|permissions|authorize|authorization|acl|ACL|current_user|Depends\\(|UserVillageAccess|admin|gestionnaire|employe|guest)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     --include='*.sql' \
     --include='*.md' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -50000"

###############################################################################
# 10 — DANGEREUX / DELETE / PURGE
###############################################################################

section "10 — ACTIONS DESTRUCTIVES"

save_shell \
    "$REPORT_ROOT/10_DESTRUCTIVE_ACTIONS.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(DELETE FROM|\\.delete\\(|delete\\(|hard_delete|hardDelete|purge|permanent.?delete|destroy\\(|DROP TABLE|TRUNCATE)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     --include='*.sql' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -30000"

###############################################################################
# 11 — ARCHIVAGE / RESTAURATION
###############################################################################

section "11 — ARCHIVAGE / RESTAURATION"

save_shell \
    "$REPORT_ROOT/11_ARCHIVE_RESTORE.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(archive|archived|restore|restored|soft.?delete|softDelete|is_deleted|deleted_at)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     --include='*.sql' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -30000"

###############################################################################
# 12 — PAGINATION
###############################################################################

section "12 — PAGINATION / LIMITS"

save_shell \
    "$REPORT_ROOT/12_PAGINATION.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(limit.?=|LIMIT|offset|page_size|pageSize|pagination|paginate|max.?limit|LIST_LIMIT|fetchAllPaged)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -30000"

###############################################################################
# 13 — MEDIA / UPLOAD
###############################################################################

section "13 — MÉDIAS / UPLOADS"

save_shell \
    "$REPORT_ROOT/13_MEDIA_UPLOADS.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(upload|multipart|UploadFile|MediaUploader|media\\.upload|content_hash|mime|filename|storage|/media|/storage)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     --include='*.sql' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -40000"

###############################################################################
# 14 — MIGRATIONS
###############################################################################

section "14 — MIGRATIONS DATABASE"

save_shell \
    "$REPORT_ROOT/14_MIGRATIONS.txt" \
    "cd '$PROJECT' && find . -type f \
      \\( -path '*/alembic/*' -o -path '*/migrations/*' \\) \
      ! -path './.git/*' \
      | sort"

save_shell \
    "$REPORT_ROOT/14_ALEMBIC_HEAD.txt" \
    "cd '$PROJECT' && \
     if command -v alembic >/dev/null 2>&1; then \
       alembic heads; \
     else \
       echo 'alembic non disponible dans PATH'; \
     fi"

###############################################################################
# 15 — MODELES / TABLES
###############################################################################

section "15 — MODÈLES / TABLES"

save_shell \
    "$REPORT_ROOT/15_MODELS_TABLES.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(__tablename__|class .*Base|DeclarativeBase|Table\\()\" \
     . \
     --include='*.py' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -40000"

###############################################################################
# 16 — AUDIT TRAIL / LOGS
###############################################################################

section "16 — TRAÇABILITÉ / AUDIT LOG"

save_shell \
    "$REPORT_ROOT/16_AUDIT_LOG_SEARCH.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(audit.?log|AuditLog|audit_log|activity.?log|journal|history|historique|created_by|updated_by|validated_by)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     --include='*.sql' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -40000"

###############################################################################
# 17 — CONSERVATION DES DONNÉES
###############################################################################

section "17 — CONSERVATION / RETENTION"

save_shell \
    "$REPORT_ROOT/17_RETENTION_SEARCH.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(retention|retention.?period|conservation|purge|expires|expiration|expires_at|deleted_at|anonymi[sz]|privacy|RGPD|GDPR|IP address|user.?agent)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     --include='*.sql' \
     --include='*.md' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -40000"

###############################################################################
# 18 — SECRETS / CONFIGURATION
###############################################################################

section "18 — CONFIGURATION / SECRETS"

{
    echo "# Fichiers de configuration détectés"
    echo

    find "$PROJECT" -maxdepth 4 -type f \
        \( -name '.env' \
        -o -name '.env.*' \
        -o -name '*config*.py' \
        -o -name '*config*.ts' \
        -o -name '*settings*.py' \
        -o -name 'docker-compose*.yml' \
        -o -name 'docker-compose*.yaml' \) \
        ! -path '*/.git/*' \
        ! -path '*/node_modules/*' \
        ! -path '*/.venv/*' \
        ! -path '*/venv/*' \
        2>/dev/null | sort

    echo
    echo "# ATTENTION"
    echo
    echo "Les valeurs de secrets ne sont volontairement PAS affichées."
} > "$REPORT_ROOT/18_CONFIGURATION.md"

save_shell \
    "$REPORT_ROOT/18_SECRET_PATTERNS.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(SECRET_KEY|API_KEY|PRIVATE_KEY|ACCESS_TOKEN|REFRESH_TOKEN|PASSWORD=|DATABASE_URL=|AWS_SECRET|OPENAI_API_KEY|ANTHROPIC_API_KEY)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     --include='*.env*' \
     --include='*.yml' \
     --include='*.yaml' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null \
     | sed -E 's/(=|:)[[:space:]]*[^[:space:]]+$/\\1 [REDACTED]/' \
     | head -20000"

###############################################################################
# 19 — TESTS DISPONIBLES
###############################################################################

section "19 — TESTS DISPONIBLES"

save_shell \
    "$REPORT_ROOT/19_TEST_FILES.txt" \
    "cd '$PROJECT' && find . -type f \
      \\( -name '*.test.ts' \
      -o -name '*.test.tsx' \
      -o -name '*.spec.ts' \
      -o -name '*.spec.tsx' \
      -o -name 'test_*.py' \
      -o -name '*_test.py' \\) \
      ! -path './.git/*' \
      ! -path './node_modules/*' \
      ! -path './.venv/*' \
      ! -path './venv/*' \
      | sort"

save_shell \
    "$REPORT_ROOT/19_TEST_CONFIG.txt" \
    "cd '$PROJECT' && find . -maxdepth 4 -type f \
      \\( -iname '*jest*' \
      -o -iname '*vitest*' \
      -o -iname '*playwright*' \
      -o -iname '*pytest*' \\) \
      ! -path './.git/*' \
      ! -path './node_modules/*' \
      | sort"

###############################################################################
# 20 — TODO / FIXME / TEMP
###############################################################################

section "20 — DETTE TECHNIQUE / TODO / FIXME"

save_shell \
    "$REPORT_ROOT/20_TECH_DEBT.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(TODO|FIXME|XXX|HACK|TEMP|temporary|workaround|not.?implemented|throw new Error\\(['\\\"]Not implemented)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     --include='*.sql' \
     --include='*.md' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -50000"

###############################################################################
# 21 — DONNÉES FICTIVES / MOCK
###############################################################################

section "21 — MOCK / DONNÉES DE TEST"

save_shell \
    "$REPORT_ROOT/21_MOCK_TEST_DATA.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(mock|fixture|fake|faker|dummy|seed|TEST-|test-data|demo-data|sample-data)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     --include='*.sql' \
     --include='*.json' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -30000"

###############################################################################
# 22 — MODULES METIER
###############################################################################

section "22 — CARTOGRAPHIE MODULES MÉTIER"

MODULES=(
    "dashboard"
    "clients"
    "registre"
    "crm"
    "lead"
    "commercial"
    "finance"
    "comptabil"
    "projet"
    "immobilier"
    "foncier"
    "document"
    "media"
    "assistant"
    "vitrine"
    "message"
    "employ"
    "presence"
    "activit"
    "journal"
    "parties"
    "notification"
)

{
    echo "# Modules métier détectés"
    echo

    for module in "${MODULES[@]}"; do
        echo "## $module"
        grep -RilE "$module" "$PROJECT/src" "$PROJECT/backend" "$PROJECT/app" \
            --include='*.py' \
            --include='*.ts' \
            --include='*.tsx' \
            2>/dev/null | head -100 || true
        echo
    done
} > "$REPORT_ROOT/22_MODULES_METIER.md"

###############################################################################
# 23 — DOCKER / SERVICES
###############################################################################

section "23 — DOCKER / SERVICES"

save_shell \
    "$REPORT_ROOT/23_DOCKER_PS.txt" \
    "docker ps --all 2>/dev/null || true"

save_shell \
    "$REPORT_ROOT/23_DOCKER_IMAGES.txt" \
    "docker images 2>/dev/null || true"

save_shell \
    "$REPORT_ROOT/23_DOCKER_NETWORKS.txt" \
    "docker network ls 2>/dev/null || true"

save_shell \
    "$REPORT_ROOT/23_SYSTEMD_SERVICES.txt" \
    "systemctl list-units --type=service --state=running 2>/dev/null || true"

###############################################################################
# 24 — PORTS / PROCESSUS
###############################################################################

section "24 — PROCESSUS / PORTS"

save_shell \
    "$REPORT_ROOT/24_PROCESSES.txt" \
    "ps auxww"

save_shell \
    "$REPORT_ROOT/24_PORTS.txt" \
    "ss -lntup 2>/dev/null || true"

###############################################################################
# 25 — NGINX
###############################################################################

section "25 — NGINX / ROUTAGE"

save_shell \
    "$REPORT_ROOT/25_NGINX.txt" \
    "nginx -T 2>/dev/null || true"

###############################################################################
# 26 — HEALTH API
###############################################################################

section "26 — HEALTH CHECKS"

{
    echo "# Health checks"
    echo

    echo "## localhost:5173"
    curl -sS -I --max-time 10 \
        http://localhost:5173/ 2>&1 || true

    echo
    echo "## API health"
    curl -sS --max-time 10 \
        http://localhost/api/v1/health 2>&1 || true

    echo
    echo "## Domaine public"
    curl -sS -I --max-time 10 \
        https://gnambaservices.ci/ 2>&1 || true

} > "$REPORT_ROOT/26_HEALTH_CHECKS.txt"

###############################################################################
# 27 — ENDPOINTS API PUBLICS
###############################################################################

section "27 — EXPOSITION API"

save_shell \
    "$REPORT_ROOT/27_API_EXPOSURE.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(@(app|router)\\.(get|post|put|patch|delete)|APIRouter\\()\" \
     . \
     --include='*.py' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -50000"

###############################################################################
# 28 — ERREURS POTENTIELLES
###############################################################################

section "28 — PATTERNS À RISQUE"

save_shell \
    "$REPORT_ROOT/28_RISK_PATTERNS.txt" \
    "cd '$PROJECT' && \
     grep -RniE \
     \"(except:[[:space:]]*$|except Exception|pass[[:space:]]*$|verify=False|allow_origins=[*]|CORS|shell=True|subprocess|eval\\(|exec\\(|innerHTML|dangerouslySetInnerHTML)\" \
     . \
     --include='*.py' \
     --include='*.ts' \
     --include='*.tsx' \
     ! --exclude-dir='.git' \
     ! --exclude-dir='node_modules' \
     ! --exclude-dir='.venv' \
     ! --exclude-dir='venv' \
     2>/dev/null | head -40000"

###############################################################################
# 29 — DUPLICATIONS / SERVICES
###############################################################################

section "29 — DUPLICATIONS / ARCHITECTURE"

save_shell \
    "$REPORT_ROOT/29_REPOSITORIES_SERVICES.txt" \
    "cd '$PROJECT' && find . -type f \
      \\( -iname '*repository*' \
      -o -iname '*service*' \
      -o -iname '*controller*' \
      -o -iname '*manager*' \
      -o -iname '*hook*' \\) \
      ! -path './.git/*' \
      ! -path './node_modules/*' \
      ! -path './.venv/*' \
      ! -path './venv/*' \
      | sort"

###############################################################################
# 30 — DOCUMENTATION
###############################################################################

section "30 — DOCUMENTATION EXISTANTE"

save_shell \
    "$REPORT_ROOT/30_DOCUMENTATION.txt" \
    "cd '$PROJECT' && find . -type f \
      \\( -iname '*.md' \
      -o -iname '*.rst' \
      -o -iname '*.txt' \\) \
      ! -path './.git/*' \
      ! -path './node_modules/*' \
      ! -path './.venv/*' \
      ! -path './venv/*' \
      | sort"

###############################################################################
# 31 — RAPPORT SYNTHÉTIQUE
###############################################################################

section "31 — GÉNÉRATION DU RAPPORT GLOBAL"

TOTAL_FILES="$(count_files)"

GIT_DIRTY="INCONNU"
if [[ -d "$PROJECT/.git" ]]; then
    if [[ -n "$(cd "$PROJECT" && git status --short 2>/dev/null)" ]]; then
        GIT_DIRTY="OUI"
    else
        GIT_DIRTY="NON"
    fi
fi

TEST_COUNT="$(
    find "$PROJECT" -type f \
        \( -name '*.test.ts' \
        -o -name '*.test.tsx' \
        -o -name '*.spec.ts' \
        -o -name '*.spec.tsx' \
        -o -name 'test_*.py' \
        -o -name '*_test.py' \) \
        ! -path "$PROJECT/node_modules/*" \
        ! -path "$PROJECT/.git/*" \
        ! -path "$PROJECT/.venv/*" \
        ! -path "$PROJECT/venv/*" \
        2>/dev/null | wc -l
)"

MIGRATION_COUNT="$(
    find "$PROJECT" -type f \
        \( -path '*/alembic/versions/*' -o -path '*/migrations/*' \) \
        ! -path "$PROJECT/.git/*" \
        2>/dev/null | wc -l
)"

ROUTE_COUNT="$(
    grep -RhoE \
        '(@(app|router)\.(get|post|put|patch|delete)|<Route|path:)' \
        "$PROJECT" \
        --include='*.py' \
        --include='*.ts' \
        --include='*.tsx' \
        --exclude-dir=.git \
        --exclude-dir=node_modules \
        --exclude-dir=.venv \
        --exclude-dir=venv \
        2>/dev/null | wc -l
)"

cat > "$SUMMARY" <<EOF
# GNAMBA / EGS — AUDIT GLOBAL ERP

## Statut

**MODE : READ-ONLY**

**Aucune correction appliquée.**

**Aucune migration exécutée.**

**Aucune donnée métier modifiée.**

**Aucun service redémarré.**

---

## Identité de l'audit

| Élément | Valeur |
|---|---|
| Date | $(date) |
| Serveur | $(hostname) |
| Utilisateur | $(id -un) |
| Projet | $PROJECT |
| Rapport | $REPORT_ROOT |
| Git dirty | $GIT_DIRTY |
| Fichiers projet | $TOTAL_FILES |
| Fichiers de tests | $TEST_COUNT |
| Migrations détectées | $MIGRATION_COUNT |
| Occurrences routes | $ROUTE_COUNT |

---

# 1. Objectif

Cet audit constitue une photographie technique et fonctionnelle de l'ERP EGS / GNAMBA.

Il couvre :

- architecture ;
- frontend ;
- backend ;
- API ;
- base de données ;
- migrations ;
- authentification ;
- RBAC ;
- modules métier ;
- workflows ;
- médias ;
- tests ;
- sécurité ;
- pagination ;
- traçabilité ;
- conservation ;
- infrastructure ;
- documentation ;
- dette technique.

---

# 2. Règle de sécurité

Cet audit ne doit pas être interprété comme une validation fonctionnelle.

Les recherches de code identifient des zones à examiner.

Elles ne prouvent pas à elles seules qu'une fonctionnalité fonctionne correctement.

---

# 3. Dossiers produits

- 01_SYSTEME.md
- 02_GIT_*.txt
- 03_FILE_*.txt
- 04_*.*
- 05_BACKEND_STRUCTURE.txt
- 06_FRONTEND_STRUCTURE.txt
- 07_FRONTEND_ROUTES.txt
- 08_API_ROUTES.txt
- 09_AUTH_RBAC_SEARCH.txt
- 10_DESTRUCTIVE_ACTIONS.txt
- 11_ARCHIVE_RESTORE.txt
- 12_PAGINATION.txt
- 13_MEDIA_UPLOADS.txt
- 14_MIGRATIONS.txt
- 15_MODELS_TABLES.txt
- 16_AUDIT_LOG_SEARCH.txt
- 17_RETENTION_SEARCH.txt
- 18_CONFIGURATION.md
- 19_TEST_*.txt
- 20_TECH_DEBT.txt
- 21_MOCK_TEST_DATA.txt
- 22_MODULES_METIER.md
- 23_DOCKER_*.txt
- 24_*.txt
- 25_NGINX.txt
- 26_HEALTH_CHECKS.txt
- 27_API_EXPOSURE.txt
- 28_RISK_PATTERNS.txt
- 29_REPOSITORIES_SERVICES.txt
- 30_DOCUMENTATION.txt

---

# 4. État initial

Le présent document ne déclare pas l'ERP GO.

La décision GO / NO-GO doit être prise après analyse des preuves recueillies.

---

# 5. Prochaine étape

Analyser les rapports dans l'ordre :

1. architecture ;
2. Git ;
3. backend/API ;
4. frontend ;
5. base de données ;
6. RBAC ;
7. modules métier ;
8. sécurité ;
9. tests ;
10. workflows ;
11. infrastructure ;
12. GO / NO-GO.

EOF
