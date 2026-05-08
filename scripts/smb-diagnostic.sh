#!/bin/bash
#
# Script de Diagnostic SMB
# Scan, credentials, et vérification des droits d'accès
#
# Usage: ./smb-diagnostic.sh [OPTIONS]
#
# Options:
#   -t, --target <host>     Cible (IP ou hostname)
#   -u, --username <user>   Nom d'utilisateur
#   -p, --password <pass>   Mot de passe
#   -d, --domain <domain>   Domaine (optionnel)
#   -s, --share <share>     Partage spécifique à tester
#   -v, --verbose           Mode verbeux
#   -h, --help              Afficher l'aide
#

set -e

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables globales
TARGET=""
USERNAME=""
PASSWORD=""
DOMAIN=""
SHARE=""
VERBOSE=false
RESULTS_DIR="smb-diagnostic-$(date +%Y%m%d-%H%M%S)"

# ============================================================================
# Fonctions utilitaires
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

show_help() {
    cat << EOF
Script de Diagnostic SMB - Gnamba Services

Usage: $0 [OPTIONS]

Options:
  -t, --target <host>       Cible (IP ou hostname) - Requis
  -u, --username <user>     Nom d'utilisateur - Requis
  -p, --password <pass>     Mot de passe - Requis
  -d, --domain <domain>     Domaine (optionnel)
  -s, --share <share>       Partage spécifique à tester (optionnel)
  -v, --verbose             Mode verbeux (affiche plus de détails)
  -h, --help                Afficher cette aide

Exemples:
  $0 -t 192.168.1.100 -u admin -p secret
  $0 -t fileserver -u john -p pass123 -d DOMAIN
  $0 -t 192.168.1.100 -u admin -p secret -s shared -v

EOF
    exit 0
}

check_dependencies() {
    log_info "Vérification des dépendances..."
    
    local missing=()
    
    for cmd in smbclient nmap; do
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$cmd")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Dépendances manquantes: ${missing[*]}"
        log_info "Installez-les avec:"
        echo "  Ubuntu/Debian: sudo apt-get install smbclient nmap"
        echo "  RHEL/CentOS: sudo yum install samba-common-tools nmap"
        exit 1
    fi
    
    log_success "Toutes les dépendances sont installées"
}

setup_results_dir() {
    mkdir -p "$RESULTS_DIR"
    log_verbose "Répertoire de résultats: $RESULTS_DIR"
}

# ============================================================================
# Fonctions de diagnostic
# ============================================================================

scan_smb_ports() {
    log_info "Scan des ports SMB sur $TARGET..."
    
    local output_file="$RESULTS_DIR/port-scan.txt"
    
    nmap -p 139,445 --open -oN "$output_file" "$TARGET" 2>/dev/null || true
    
    if grep -q "open" "$output_file" 2>/dev/null; then
        log_success "Ports SMB détectés"
        cat "$output_file"
        return 0
    else
        log_error "Aucun port SMB ouvert détecté (139, 445)"
        return 1
    fi
}

enumerate_shares() {
    log_info "Énumération des partages SMB..."
    
    local output_file="$RESULTS_DIR/shares-list.txt"
    local domain_opt=""
    
    if [ -n "$DOMAIN" ]; then
        domain_opt="-W $DOMAIN"
    fi
    
    # Utilisation de smbclient pour lister les partages
    smbclient -L "//${TARGET}" -U "${USERNAME}%${PASSWORD}" $domain_opt -m SMB3 2>&1 | tee "$output_file"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "Liste des partages récupérée"
        return 0
    else
        log_warning "Impossible de lister les partages (vérifiez les credentials)"
        return 1
    fi
}

test_share_access() {
    local share_name="$1"
    log_info "Test d'accès au partage: $share_name..."
    
    local output_file="$RESULTS_DIR/share-${share_name}-access.txt"
    local domain_opt=""
    
    if [ -n "$DOMAIN" ]; then
        domain_opt="-W $DOMAIN"
    fi
    
    # Tester la connexion et lister le contenu
    {
        echo "=== Test de connexion ==="
        smbclient "//${TARGET}/${share_name}" -U "${USERNAME}%${PASSWORD}" $domain_opt -m SMB3 -c "ls" 2>&1
        
        echo ""
        echo "=== Informations du partage ==="
        smbclient "//${TARGET}/${share_name}" -U "${USERNAME}%${PASSWORD}" $domain_opt -m SMB3 -c "prompt OFF; dir" 2>&1
    } | tee "$output_file"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "Accès au partage '$share_name' réussi"
        return 0
    else
        log_error "Échec de l'accès au partage '$share_name'"
        return 1
    fi
}

check_permissions() {
    local share_name="$1"
    log_info "Vérification des permissions pour: $share_name..."
    
    local output_file="$RESULTS_DIR/share-${share_name}-permissions.txt"
    local domain_opt=""
    
    if [ -n "$DOMAIN" ]; then
        domain_opt="-W $DOMAIN"
    fi
    
    {
        echo "=== Test d'écriture ==="
        # Créer un fichier test
        local test_file="smb_test_$(date +%s).txt"
        
        if smbclient "//${TARGET}/${share_name}" -U "${USERNAME}%${PASSWORD}" $domain_opt -m SMB3 -c "put /dev/null ${test_file}" 2>&1; then
            echo "✓ Permission d'écriture: OUI"
            # Nettoyer le fichier test
            smbclient "//${TARGET}/${share_name}" -U "${USERNAME}%${PASSWORD}" $domain_opt -m SMB3 -c "rm ${test_file}" 2>&1
        else
            echo "✗ Permission d'écriture: NON"
        fi
        
        echo ""
        echo "=== Test de lecture ==="
        if smbclient "//${TARGET}/${share_name}" -U "${USERNAME}%${PASSWORD}" $domain_opt -m SMB3 -c "ls" 2>&1 | grep -q "."; then
            echo "✓ Permission de lecture: OUI"
        else
            echo "✗ Permission de lecture: NON"
        fi
        
        echo ""
        echo "=== Test de suppression ==="
        # Créer un fichier pour tester la suppression
        if smbclient "//${TARGET}/${share_name}" -U "${USERNAME}%${PASSWORD}" $domain_opt -m SMB3 -c "put /dev/null ${test_file}" 2>&1; then
            if smbclient "//${TARGET}/${share_name}" -U "${USERNAME}%${PASSWORD}" $domain_opt -m SMB3 -c "rm ${test_file}" 2>&1; then
                echo "✓ Permission de suppression: OUI"
            else
                echo "✗ Permission de suppression: NON"
            fi
        else
            echo "⚠ Impossible de tester la suppression (pas d'écriture)"
        fi
        
    } | tee "$output_file"
}

test_credentials() {
    log_info "Test des credentials..."
    
    local output_file="$RESULTS_DIR/credentials-test.txt"
    local domain_opt=""
    
    if [ -n "$DOMAIN" ]; then
        domain_opt="-W $DOMAIN"
    fi
    
    {
        echo "=== Test de connexion basique ==="
        if smbclient -L "//${TARGET}" -U "${USERNAME}%${PASSWORD}" $domain_opt -m SMB3 >/dev/null 2>&1; then
            echo "✓ Credentials valides"
            echo "  Utilisateur: $USERNAME"
            [ -n "$DOMAIN" ] && echo "  Domaine: $DOMAIN"
            echo "  Cible: $TARGET"
        else
            echo "✗ Credentials invalides ou accès refusé"
            return 1
        fi
        
        echo ""
        echo "=== Informations de session ==="
        # Tenter d'obtenir des infos sur l'utilisateur
        smbclient "//${TARGET}/${USERNAME}" -U "${USERNAME}%${PASSWORD}" $domain_opt -m SMB3 -c "!" 2>&1 || true
        
    } | tee "$output_file"
    
    log_success "Test des credentials terminé"
}

security_audit() {
    log_info "Audit de sécurité SMB..."
    
    local output_file="$RESULTS_DIR/security-audit.txt"
    
    {
        echo "=== Version SMB supportée ==="
        # Tester SMB1 (déconseillé)
        if smbclient -L "//${TARGET}" -U "${USERNAME}%${PASSWORD}" -m SMB1 >/dev/null 2>&1; then
            echo "⚠ SMBv1 activé (DÉCONSEILLÉ - vulnérable)"
        else
            echo "✓ SMBv1 désactivé"
        fi
        
        # Tester SMB2
        if smbclient -L "//${TARGET}" -U "${USERNAME}%${PASSWORD}" -m SMB2 >/dev/null 2>&1; then
            echo "✓ SMBv2 activé"
        fi
        
        # Tester SMB3
        if smbclient -L "//${TARGET}" -U "${USERNAME}%${PASSWORD}" -m SMB3 >/dev/null 2>&1; then
            echo "✓ SMBv3 activé (recommandé)"
        fi
        
        echo ""
        echo "=== Signature SMB ==="
        # Vérifier si la signature est requise
        echo "⚠ Vérifiez manuellement la configuration de signature SMB"
        
        echo ""
        echo "=== Partages invités (guest) ==="
        # Tester l'accès anonyme
        if smbclient -L "//${TARGET}" -N >/dev/null 2>&1; then
            echo "⚠ Accès anonyme/guest ACTIVÉ (risque de sécurité)"
        else
            echo "✓ Accès anonyme/guest désactivé"
        fi
        
    } | tee "$output_file"
}

generate_report() {
    log_info "Génération du rapport..."
    
    local report_file="$RESULTS_DIR/rapport-diagnostic.txt"
    
    {
        echo "=============================================="
        echo "  RAPPORT DE DIAGNOSTIC SMB"
        echo "  Gnamba Services"
        echo "=============================================="
        echo ""
        echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "Cible: $TARGET"
        echo "Utilisateur: $USERNAME"
        [ -n "$DOMAIN" ] && echo "Domaine: $DOMAIN"
        echo ""
        echo "=============================================="
        echo "  RÉSULTATS"
        echo "=============================================="
        echo ""
        
        # Inclure tous les fichiers de résultats
        for file in "$RESULTS_DIR"/*.txt; do
            if [ "$file" != "$report_file" ]; then
                echo "--- $(basename "$file") ---"
                cat "$file"
                echo ""
            fi
        done
        
        echo "=============================================="
        echo "  FIN DU RAPPORT"
        echo "=============================================="
        
    } > "$report_file"
    
    log_success "Rapport généré: $report_file"
}

# ============================================================================
# Parse des arguments
# ============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--target)
                TARGET="$2"
                shift 2
                ;;
            -u|--username)
                USERNAME="$2"
                shift 2
                ;;
            -p|--password)
                PASSWORD="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -s|--share)
                SHARE="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                ;;
            *)
                log_error "Option inconnue: $1"
                show_help
                ;;
        esac
    done
    
    # Validation des arguments requis
    if [ -z "$TARGET" ] || [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
        log_error "Les options --target, --username et --password sont requises"
        show_help
    fi
}

# ============================================================================
# Main
# ============================================================================

main() {
    parse_args "$@"
    
    echo ""
    echo "=============================================="
    echo "  DIAGNOSTIC SMB - Gnamba Services"
    echo "=============================================="
    echo ""
    
    check_dependencies
    setup_results_dir
    
    log_info "Cible: $TARGET"
    log_info "Utilisateur: $USERNAME"
    [ -n "$DOMAIN" ] && log_info "Domaine: $DOMAIN"
    [ -n "$SHARE" ] && log_info "Partage spécifique: $SHARE"
    echo ""
    
    # 1. Scan des ports
    scan_smb_ports || true
    echo ""
    
    # 2. Test des credentials
    test_credentials || true
    echo ""
    
    # 3. Audit de sécurité
    security_audit || true
    echo ""
    
    # 4. Énumération des partages
    enumerate_shares || true
    echo ""
    
    # 5. Test des partages
    if [ -n "$SHARE" ]; then
        # Tester un partage spécifique
        test_share_access "$SHARE"
        check_permissions "$SHARE"
    else
        # Tester tous les partages trouvés
        log_info "Recherche des partages accessibles..."
        
        # Extraire la liste des partages depuis la sortie précédente
        local shares_file="$RESULTS_DIR/shares-list.txt"
        if [ -f "$shares_file" ]; then
            # Parser les noms de partages (format simplifié)
            grep -E "^\s*\w" "$shares_file" | grep -v "Sharename" | grep -v "Comment" | grep -v "---------" | while read -r share_line; do
                share_name=$(echo "$share_line" | awk '{print $1}')
                if [ -n "$share_name" ] && [ "$share_name" != "IPC$" ]; then
                    test_share_access "$share_name" || true
                    check_permissions "$share_name" || true
                fi
            done
        fi
    fi
    echo ""
    
    # 6. Génération du rapport
    generate_report
    
    echo ""
    echo "=============================================="
    log_success "Diagnostic terminé!"
    echo "  Résultats complets dans: $RESULTS_DIR/"
    echo "=============================================="
    echo ""
}

# Lancer le script
main "$@"
