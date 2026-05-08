#!/bin/bash
set -euo pipefail

# ============================================================================
# CONFIGURATION PARTAGES SMB/CIFS - FILEBROWSER
# Gnamba Services - Script de montage automatique des partages réseau
# ============================================================================

REPORT_DIR="/home/soma/gnamba-project/tmp"
mkdir -p "${REPORT_DIR}"
REPORT_FILE="${REPORT_DIR}/smb-mount-report-$(date +%F_%H%M%S).log"
touch "${REPORT_FILE}"
exec > >(tee -a "${REPORT_FILE}") 2>&1

echo "=============================================="
echo "  CONFIGURATION PARTAGES FILEBROWSER"
echo "  Gnamba Services"
echo "=============================================="
echo "Rapport: ${REPORT_FILE}"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ============================================================================
# Configuration
# ============================================================================

BASE_PARTAGE="/home/soma/partage"
BASE_RESEAU="/mnt/reseau"
SECRETS_DIR="/home/soma/secrets"

# Workgroup Windows
WORKGROUP="egs"

# Credentials par machine
# Format: "FICHIER_CREDS|USERNAME|PASSWORD"
CREDENTIALS=(
  "cifs-Poste2-egsdocuments.creds|DELL|gnambaservices"
  "cifs-Poste2-Users.creds|DELL|gnambaservices"
  "cifs-Poste2-Documents.creds|DELL|gnambaservices"
  "cifs-Poste3-Users.creds|Yasmine|gnambaservices"
  "cifs-Poste3-Yasmine.creds|Yasmine|gnambaservices"
  "cifs-SOMASOULEYMANE-Users.creds|ssgnsa|deadsoulja28@"
  "cifs-SOMASOULEYMANE-Documents.creds|ssgnsa|deadsoulja28@"
)

# Partages SMB à monter
# Format: "//IP/SHARE|/mnt/reseau/HOST/SHARE|FICHIER_CREDS"
# Basé sur l'inventaire SMB réel (smbclient -L)
SHARES=(
  # POSTE2 (192.168.1.115) - EN LIGNE
  "//192.168.1.115/EGSDOCUMENTS|${BASE_RESEAU}/Poste2/egsdocuments|cifs-Poste2-egsdocuments.creds"
  "//192.168.1.115/Documents|${BASE_RESEAU}/Poste2/Documents|cifs-Poste2-Documents.creds"
  # Partages Proxmox (optionnels)
  "//192.168.1.115/PROXMOX-BACKUPS|${BASE_RESEAU}/Poste2/Proxmox-Backups|cifs-Poste2-egsdocuments.creds"
  "//192.168.1.115/PROXMOX-ISOS|${BASE_RESEAU}/Poste2/Proxmox-ISOs|cifs-Poste2-egsdocuments.creds"
  # Partage Users (peut échouer - restriction Windows)
  "//192.168.1.115/Users|${BASE_RESEAU}/Poste2/Users|cifs-Poste2-Users.creds"
  
  # POSTE3 (192.168.1.110) - EN LIGNE
  # Partage Users racine (peut échouer - restriction Windows)
  "//192.168.1.110/Users|${BASE_RESEAU}/Poste3/Users|cifs-Poste3-Users.creds"
  
  # SOMASOULEYMANE (192.168.1.111) - EN LIGNE
  "//192.168.1.111/Documents|${BASE_RESEAU}/SOMASOULEYMANE/Documents|cifs-SOMASOULEYMANE-Documents.creds"
  # Partage Users racine (peut échouer - restriction Windows)
  "//192.168.1.111/Users|${BASE_RESEAU}/SOMASOULEYMANE/Users|cifs-SOMASOULEYMANE-Users.creds"
)

# Options de montage à tester (ordre de préférence)
MOUNT_OPTIONS_LIST=(
  "iocharset=utf8,uid=1000,gid=1000,file_mode=0664,dir_mode=0775,vers=3.0"
  "iocharset=utf8,uid=1000,gid=1000,file_mode=0664,dir_mode=0775,vers=3.0,sec=ntlmv2"
  "iocharset=utf8,uid=1000,gid=1000,file_mode=0664,dir_mode=0775,vers=2.0"
  "iocharset=utf8,uid=1000,gid=1000,file_mode=0664,dir_mode=0775,vers=3.0,sec=ntlmssp"
)

# ============================================================================
# Fonctions utilitaires
# ============================================================================

log_info() { echo "[INFO] $1"; }
log_success() { echo "[OK] $1"; }
log_warning() { echo "[WARN] $1"; }
log_error() { echo "[ERROR] $1"; }

check_dependencies() {
  log_info "Vérification des dépendances..."
  
  local missing=()
  
  if ! dpkg -s cifs-utils >/dev/null 2>&1; then
    missing+=("cifs-utils")
  fi
  
  if ! command -v nc >/dev/null 2>&1; then
    missing+=("netcat-openbsd")
  fi
  
  if ! command -v smbclient >/dev/null 2>&1; then
    missing+=("smbclient")
  fi
  
  if [ ${#missing[@]} -ne 0 ]; then
    log_info "Installation des dépendances manquantes: ${missing[*]}"
    sudo apt update -y
    for pkg in "${missing[@]}"; do
      sudo apt install -y "$pkg"
    done
    log_success "Dépendances installées"
  else
    log_success "Toutes les dépendances sont installées"
  fi
}

create_credentials_files() {
  log_info "Création des fichiers de credentials..."
  
  sudo mkdir -p "${SECRETS_DIR}"
  sudo chmod 700 "${SECRETS_DIR}"
  
  for cred_entry in "${CREDENTIALS[@]}"; do
    IFS="|" read -r filename username password <<< "${cred_entry}"
    local creds_file="${SECRETS_DIR}/${filename}"
    
    if [ -f "${creds_file}" ]; then
      log_info "Fichier existe déjà: ${filename}"
      continue
    fi
    
    log_info "Création: ${filename} (user: ${username})"
    
    sudo tee "${creds_file}" > /dev/null << EOF
username=${username}
password=${password}
workgroup=${WORKGROUP}
EOF
    
    sudo chmod 600 "${creds_file}"
  done
  
  log_success "Fichiers de credentials créés"
}

test_smb_share() {
  local host="$1"
  local share="$2"
  local creds_file="$3"
  
  if smbclient "//${host}/${share}" -A "${creds_file}" -m SMB3 -c 'ls' >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

scan_port() {
  local host="$1"
  nc -z -w2 "${host}" 445 >/dev/null 2>&1
}

# ============================================================================
# Main
# ============================================================================

check_dependencies
create_credentials_files

# Backup fstab
timestamp="$(date +%F_%H%M%S)"
sudo cp /etc/fstab "/etc/fstab.bak.${timestamp}" 2>/dev/null || true
sudo systemctl daemon-reload

RESULTS=()
OK_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

echo ""
echo "=============================================="
echo "  TRAITEMENT DES PARTAGES"
echo "=============================================="

for entry in "${SHARES[@]}"; do
  IFS="|" read -r SMB_PATH MOUNT_POINT CREDS_FILENAME <<< "${entry}"
  CREDS_FILE="${SECRETS_DIR}/${CREDS_FILENAME}"
  
  HOST="$(echo "${SMB_PATH}" | awk -F/ '{print $3}')"
  SHARE_NAME="$(echo "${SMB_PATH}" | awk -F/ '{print $4}')"
  
  echo ""
  echo "----------------------------------------------"
  echo "Partage: ${SMB_PATH}"
  echo "Montage: ${MOUNT_POINT}"
  echo "Credentials: ${CREDS_FILENAME}"
  
  # Créer le point de montage
  sudo mkdir -p "${MOUNT_POINT}"
  
  # Vérifier si le fichier de credentials existe et est valide
  if [ ! -f "${CREDS_FILE}" ]; then
    log_error "Fichier de credentials manquant: ${CREDS_FILE}"
    sudo sed -i "\\|${MOUNT_POINT}|d" /etc/fstab
    sudo sed -i "\\|${SMB_PATH}|d" /etc/fstab
    RESULTS+=("FAIL|${SMB_PATH}|${MOUNT_POINT}|Credentials manquants")
    FAIL_COUNT=$((FAIL_COUNT + 1))
    continue
  fi
  
  if grep -q "CHANGER\|username=$\|password=$" "${CREDS_FILE}"; then
    log_error "Credentials incomplets dans: ${CREDS_FILE}"
    sudo sed -i "\\|${MOUNT_POINT}|d" /etc/fstab
    sudo sed -i "\\|${SMB_PATH}|d" /etc/fstab
    RESULTS+=("FAIL|${SMB_PATH}|${MOUNT_POINT}|Credentials incomplets")
    FAIL_COUNT=$((FAIL_COUNT + 1))
    continue
  fi
  
  # Scan du port 445
  echo "   Scan port 445..."
  if ! scan_port "${HOST}"; then
    log_warning "Port 445 fermé sur ${HOST}"
    sudo sed -i "\\|${MOUNT_POINT}|d" /etc/fstab
    sudo sed -i "\\|${SMB_PATH}|d" /etc/fstab
    RESULTS+=("SKIP|${SMB_PATH}|${MOUNT_POINT}|Port 445 fermé")
    SKIP_COUNT=$((SKIP_COUNT + 1))
    continue
  fi
  log_success "Port 445 ouvert"
  
  # Test d'authentification SMB
  echo "   Test authentification SMB..."
  if ! test_smb_share "${HOST}" "${SHARE_NAME}" "${CREDS_FILE}"; then
    log_error "Authentification SMB refusée"
    echo "   Vérifiez les credentials dans: ${CREDS_FILE}"
    sudo sed -i "\\|${MOUNT_POINT}|d" /etc/fstab
    sudo sed -i "\\|${SMB_PATH}|d" /etc/fstab
    RESULTS+=("FAIL|${SMB_PATH}|${MOUNT_POINT}|Auth SMB échouée")
    FAIL_COUNT=$((FAIL_COUNT + 1))
    continue
  fi
  log_success "Authentification SMB réussie"
  
  # Démontage préalable si déjà monté
  if mountpoint -q "${MOUNT_POINT}"; then
    echo "   Démontage préalable..."
    sudo umount "${MOUNT_POINT}" 2>/dev/null || true
  fi
  
  # Test des options de montage
  echo "   Test des options de montage..."
  MOUNT_OK=0
  USED_OPTS=""
  
  for opts in "${MOUNT_OPTIONS_LIST[@]}"; do
    full_opts="credentials=${CREDS_FILE},${opts},addr=${HOST}"
    
    if sudo mount -t cifs "${SMB_PATH}" "${MOUNT_POINT}" -o "${full_opts}" 2>/dev/null; then
      MOUNT_OK=1
      USED_OPTS="${full_opts}"
      log_success "Montage réussi avec: ${opts}"
      break
    fi
  done
  
  # Résultat du montage
  if [ "${MOUNT_OK}" -eq 1 ]; then
    log_success "Partage monté: ${MOUNT_POINT}"
    
    # Mise à jour de /etc/fstab
    sudo sed -i "\\|${MOUNT_POINT}|d" /etc/fstab
    sudo sed -i "\\|${SMB_PATH}|d" /etc/fstab
    
    fstab_opts="credentials=${CREDS_FILE},iocharset=utf8,uid=1000,gid=1000,file_mode=0664,dir_mode=0775,vers=3.0,addr=${HOST},nofail,x-systemd.automount"
    echo "${SMB_PATH} ${MOUNT_POINT} cifs ${fstab_opts} 0 0" | sudo tee -a /etc/fstab >/dev/null
    
    RESULTS+=("OK|${SMB_PATH}|${MOUNT_POINT}|")
    OK_COUNT=$((OK_COUNT + 1))
  else
    log_error "Échec du montage"
    echo "   Erreurs kernel récentes:"
    sudo dmesg | tail -n 3 || true
    
    sudo sed -i "\\|${MOUNT_POINT}|d" /etc/fstab
    sudo sed -i "\\|${SMB_PATH}|d" /etc/fstab
    RESULTS+=("FAIL|${SMB_PATH}|${MOUNT_POINT}|Échec montage")
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
done

# ============================================================================
# Rapport final
# ============================================================================

echo ""
echo "=============================================="
echo "  RAPPORT FINAL"
echo "=============================================="
echo ""

# Rechargement systemd
log_info "Rechargement systemd (fstab)..."
sudo systemctl daemon-reload

# Liste des montages actifs
echo ""
echo "Montages actifs:"
mount | grep -E "/mnt/reseau" || echo "  Aucun montage actif"

# Tableau récapitulatif
echo ""
printf "%-6s %-35s %-40s %s\n" "ETAT" "PARTAGE" "MONTAGE" "DETAIL"
printf "%s\n" "--------------------------------------------------------------------------------"

for r in "${RESULTS[@]}"; do
  IFS="|" read -r state share mountpoint detail <<< "${r}"
  
  case "${state}" in
    OK)    color="\033[0;32m";;  # Vert
    FAIL)  color="\033[0;31m";;  # Rouge
    SKIP)  color="\033[1;33m";;  # Jaune
    *)     color="\033[0m";;
  esac
  
  printf "${color}%-6s\033[0m %-35s %-40s %s\n" "${state}" "${share}" "${mountpoint}" "${detail}"
done

echo ""
echo "=============================================="
echo "  STATISTIQUES"
echo "=============================================="
echo "  ✅ Succès:  ${OK_COUNT}"
echo "  ❌ Échecs:  ${FAIL_COUNT}"
echo "  ⚠️  Ignorés: ${SKIP_COUNT}"
echo "  Total:      $((OK_COUNT + FAIL_COUNT + SKIP_COUNT))"
echo "=============================================="

# Code de retour
if [ "${FAIL_COUNT}" -gt 0 ]; then
  echo ""
  log_warning "Certains partages ont échoué. Vérifiez le rapport: ${REPORT_FILE}"
  exit 1
else
  echo ""
  log_success "Configuration terminée avec succès!"
  exit 0
fi
