#!/bin/bash

################################################################################
# EGS PRODUCTION DEPLOYMENT VALIDATOR
# ============================================================
# Phase 2: Sécurité & Versions - Validation pré-déploiement
# Date: 2026-06-03
# Rôle: Enterprise Architect
#
# OBJECTIF:
# Valider que tous les prérequis de déploiement production sont réunis:
#  ✅ Variables d'environnement requises
#  ✅ Certificats TLS en place
#  ✅ Fichiers docker-compose valides
#  ✅ Images Docker accessibles
#  ✅ Volumes/données appropriés
#  ✅ Connectivité BD
#
# USAGE:
#   bash scripts/validate-prod-deployment.sh [--dry-run] [--fix]
#
# OPTIONS:
#   --dry-run     Simuler sans modifier
#   --fix         Tenter corrections automatiques des problèmes mineurs
#   --verbose     Affichage détaillé
#
################################################################################

set -euo pipefail

# ============================================================
# Configuration
# ============================================================

PROJECT_ROOT="${PROJECT_ROOT:-.}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DRY_RUN=0
FIX_MODE=0
VERBOSE=0
ERRORS=0
WARNINGS=0
PASS=0

# ============================================================
# Parsing Arguments
# ============================================================

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --fix)
      FIX_MODE=1
      shift
      ;;
    --verbose)
      VERBOSE=1
      shift
      ;;
    *)
      echo "Usage: $0 [--dry-run] [--fix] [--verbose]"
      exit 1
      ;;
  esac
done

# ============================================================
# Utility Functions
# ============================================================

log_pass() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASS++))
}

log_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNINGS++))
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
  ((ERRORS++))
}

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_section() {
  echo
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
}

# ============================================================
# Validation Functions
# ============================================================

check_docker() {
  log_section "1. VÉRIFIER DOCKER"

  if ! command -v docker &>/dev/null; then
    log_error "Docker n'est pas installé"
    return 1
  fi
  log_pass "Docker installé"

  if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
    log_error "Docker Compose n'est pas installé"
    return 1
  fi
  log_pass "Docker Compose installé"

  return 0
}

check_env_file() {
  log_section "2. VÉRIFIER FICHIER .env.server"

  if [[ ! -f "$PROJECT_ROOT/.env.server" ]]; then
    log_error ".env.server manquant"
    log_info "Copier depuis .env.template et configurer avec les secrets"
    return 1
  fi
  log_pass ".env.server existe"

  # Vérifier les variables obligatoires
  local required_vars=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "VITE_SUPABASE_MODE"
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "WOPI_JWT_SECRET"
    "WOPI_API_KEY"
    "N8N_USER"
    "N8N_PASSWORD"
    "N8N_ENCRYPTION_KEY"
    "N8N_DB_PASSWORD"
    "SAMBA_USERNAME"
    "SAMBA_PASSWORD"
    "COLLABORA_ADMIN_PASSWORD"
  )

  local missing=()
  for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" "$PROJECT_ROOT/.env.server"; then
      missing+=("$var")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    log_error "Variables manquantes: ${missing[*]}"
    return 1
  fi
  log_pass "Toutes les variables obligatoires sont définies"

  # Vérifier les secrets ne sont pas vides
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" =~ ^# ]] && continue
    if [[ -z "$value" ]]; then
      log_warn "Variable vide: $key"
    fi
  done < "$PROJECT_ROOT/.env.server"

  return 0
}

check_docker_compose() {
  log_section "3. VÉRIFIER docker-compose.prod.secure.yml"

  if [[ ! -f "$PROJECT_ROOT/docker-compose.prod.secure.yml" ]]; then
    log_error "docker-compose.prod.secure.yml manquant"
    return 1
  fi
  log_pass "docker-compose.prod.secure.yml existe"

  # Valider la syntaxe
  if ! docker compose -f "$PROJECT_ROOT/docker-compose.prod.secure.yml" config >/dev/null 2>&1; then
    log_error "Erreur de syntaxe dans docker-compose.prod.secure.yml"
    docker compose -f "$PROJECT_ROOT/docker-compose.prod.secure.yml" config 2>&1 | head -20
    return 1
  fi
  log_pass "Syntaxe docker-compose valide"

  return 0
}

check_nginx_config() {
  log_section "4. VÉRIFIER Configuration Nginx"

  if [[ ! -f "$PROJECT_ROOT/nginx/nginx-production.conf" ]]; then
    log_error "nginx-production.conf manquant"
    return 1
  fi
  log_pass "nginx-production.conf existe"

  # Vérifier la syntaxe (via docker)
  if command -v docker &>/dev/null; then
    if ! docker run --rm -v "$PROJECT_ROOT/nginx:/etc/nginx:ro" nginx:alpine nginx -t >/dev/null 2>&1; then
      log_error "Erreur de syntaxe Nginx"
      docker run --rm -v "$PROJECT_ROOT/nginx:/etc/nginx:ro" nginx:alpine nginx -t 2>&1 | tail -10
      return 1
    fi
    log_pass "Syntaxe Nginx valide"
  fi

  return 0
}

check_ssl_certificates() {
  log_section "5. VÉRIFIER Certificats TLS"

  local ssl_dir="$PROJECT_ROOT/nginx/ssl"

  if [[ ! -d "$ssl_dir" ]]; then
    log_error "Répertoire $ssl_dir manquant"
    log_info "Créer le répertoire et copier les certificats Let's Encrypt ou auto-signés"
    if [[ $FIX_MODE -eq 1 && $DRY_RUN -eq 0 ]]; then
      mkdir -p "$ssl_dir"
      chmod 700 "$ssl_dir"
      log_info "Répertoire $ssl_dir créé"
    fi
    return 1
  fi

  if [[ ! -f "$ssl_dir/fullchain.pem" ]]; then
    log_error "Certificat $ssl_dir/fullchain.pem manquant"
    log_info "Obtenir un certificat Let's Encrypt ou générer auto-signé"
    return 1
  fi
  log_pass "$ssl_dir/fullchain.pem existe"

  if [[ ! -f "$ssl_dir/privkey.pem" ]]; then
    log_error "Clé privée $ssl_dir/privkey.pem manquante"
    return 1
  fi
  log_pass "$ssl_dir/privkey.pem existe"

  # Vérifier les permissions (clé privée: 600)
  local key_perm=$(stat -c %a "$ssl_dir/privkey.pem" 2>/dev/null || stat -f %A "$ssl_dir/privkey.pem" 2>/dev/null || echo "unknown")
  if [[ "$key_perm" != "600" ]]; then
    log_warn "Permissions clé privée: $key_perm (recommandé: 600)"
    if [[ $FIX_MODE -eq 1 && $DRY_RUN -eq 0 ]]; then
      chmod 600 "$ssl_dir/privkey.pem"
      log_info "Permissions corrigées"
    fi
  else
    log_pass "Permissions clé privée correctes (600)"
  fi

  # Vérifier l'expiration
  if command -v openssl &>/dev/null; then
    local expiry=$(openssl x509 -enddate -noout -in "$ssl_dir/fullchain.pem" 2>/dev/null | cut -d= -f2)
    local expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %T %Z %Y" "$expiry" +%s 2>/dev/null || echo "0")
    local now=$(date +%s)
    local days_left=$(( (expiry_epoch - now) / 86400 ))

    if [[ $days_left -lt 0 ]]; then
      log_error "Certificat expiré!"
      return 1
    elif [[ $days_left -lt 30 ]]; then
      log_warn "Certificat expire dans $days_left jours (renouvellement recommandé)"
    else
      log_pass "Certificat valide jusqu'à: $expiry"
    fi
  fi

  return 0
}

check_postgresql_migration() {
  log_section "6. VÉRIFIER Migration PostgreSQL"

  # Vérifier la version dans docker-compose.prod.secure.yml
  if grep -q "postgres:16" "$PROJECT_ROOT/docker-compose.prod.secure.yml"; then
    log_pass "PostgreSQL 16 configuré dans docker-compose.prod.secure.yml"
  else
    log_warn "Version PostgreSQL non confirmée comme 16+ dans docker-compose.prod.secure.yml"
  fi

  return 0
}

check_database_backups() {
  log_section "7. VÉRIFIER Sauvegarde Base de Données"

  local backup_dir="$PROJECT_ROOT/backups/postgres"

  if [[ ! -d "$backup_dir" ]]; then
    log_warn "Répertoire backups non créé: $backup_dir"
    log_info "Le répertoire sera créé automatiquement au premier déploiement"
  else
    log_pass "Répertoire $backup_dir existe"

    # Vérifier les backups existants
    local backup_count=$(find "$backup_dir" -type f -name "*.sql*" 2>/dev/null | wc -l)
    if [[ $backup_count -gt 0 ]]; then
      log_pass "$backup_count fichier(s) de sauvegarde détecté(s)"
    else
      log_warn "Aucun fichier de sauvegarde détecté (nouveau déploiement)"
    fi
  fi

  return 0
}

check_docker_images() {
  log_section "8. VÉRIFIER Disponibilité Images Docker"

  # Images clés à vérifier
  local images=(
    "nginx:alpine"
    "postgres:16.13-alpine"
    "kong:2.8.1-alpine"
    "filebrowser/filebrowser"
    "collabora/code"
    "n8nio/n8n"
    "dperson/samba:4.19"
  )

  if [[ $VERBOSE -eq 1 ]]; then
    log_info "Vérification des images (peut prendre du temps)..."
  fi

  local missing_images=()
  for img in "${images[@]}"; do
    if docker pull "$img" >/dev/null 2>&1; then
      log_pass "Image disponible: $img"
    else
      missing_images+=("$img")
      log_warn "Image non accessible: $img (sera pullee au déploiement)"
    fi
  done

  return 0
}

check_volumes_mounts() {
  log_section "9. VÉRIFIER Points de Montage"

  local mounts=(
    "/home/soma/partage/egs-docs"
    "/home/soma/filebrowser/database"
    "/home/soma/filebrowser/config"
    "/data/postgres"
    "/data/backups/postgres"
  )

  for mount in "${mounts[@]}"; do
    if [[ ! -d "$mount" ]]; then
      log_warn "Répertoire manquant: $mount (sera créé par Docker)"
    else
      log_pass "Point de montage accessible: $mount"
    fi
  done

  return 0
}

check_network_connectivity() {
  log_section "10. VÉRIFIER Connectivité Réseau"

  # Tester la résolution DNS
  if command -v dig &>/dev/null; then
    if dig +short erp.gnambaservices.ci @8.8.8.8 >/dev/null 2>&1; then
      log_pass "DNS résolvable: erp.gnambaservices.ci"
    else
      log_warn "DNS non résolvable: erp.gnambaservices.ci (peut être normal en local)"
    fi
  fi

  # Tester la connectivité Supabase Cloud
  if command -v curl &>/dev/null; then
    if curl -sf "https://thykrnoqgylrbfupophs.supabase.co/rest/v1/" >/dev/null 2>&1; then
      log_pass "Supabase Cloud accessible"
    else
      log_warn "Supabase Cloud non accessible (vérifier firewall/VPN)"
    fi
  fi

  return 0
}

generate_report() {
  log_section "RÉSUMÉ DE VALIDATION"

  echo
  echo -e "  ${GREEN}✅ Validations réussies:${NC}       $PASS"
  echo -e "  ${YELLOW}⚠️  Avertissements:${NC}            $WARNINGS"
  echo -e "  ${RED}❌ Erreurs:${NC}                     $ERRORS"
  echo

  if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ VALIDATION RÉUSSIE - PRÊT POUR DÉPLOIEMENT${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    return 0
  else
    echo -e "${RED}════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ VALIDATION ÉCHOUÉE - CORRECTIONS REQUISES${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════${NC}"
    return 1
  fi
}

# ============================================================
# MAIN
# ============================================================

main() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════════════════════╗"
  echo "║   EGS PRODUCTION DEPLOYMENT VALIDATOR - Phase 2        ║"
  echo "║   Date: $(date '+%Y-%m-%d %H:%M:%S')                    ║"
  echo "╚════════════════════════════════════════════════════════╝"
  echo -e "${NC}"

  if [[ $DRY_RUN -eq 1 ]]; then
    log_info "Mode DRY-RUN activé (aucune modification)"
  fi

  if [[ $FIX_MODE -eq 1 ]]; then
    log_info "Mode FIX activé (corrections automatiques actives)"
  fi

  cd "$PROJECT_ROOT"

  # Exécuter les validations
  check_docker || true
  check_env_file || true
  check_docker_compose || true
  check_nginx_config || true
  check_ssl_certificates || true
  check_postgresql_migration || true
  check_database_backups || true
  check_docker_images || true
  check_volumes_mounts || true
  check_network_connectivity || true

  # Générer le rapport
  generate_report
}

# Exécuter main
main
exit $?
