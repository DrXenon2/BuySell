#!/bin/bash

# Script de sauvegarde de la base de données
# Sauvegarde PostgreSQL avec compression et gestion des versions

set -e  # Arrêt en cas d'erreur

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Fonctions de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠ $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗ $1${NC}"
}

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ $1${NC}"
}

# Fonction d'affichage de l'aide
show_help() {
    echo -e "${CYAN}
Script de sauvegarde de la base de données PostgreSQL
Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help              Affiche cette aide
    -d, --database DB       Base de données spécifique (défaut: toutes)
    -f, --file FILE         Fichier de sauvegarde personnalisé
    -c, --compress          Compression avec gzip
    --no-compress           Pas de compression
    -r, --retention DAYS    Jours de rétention (défaut: 30)
    --upload                Upload vers cloud storage
    --encrypt               Chiffrement avec GPG
    --verbose               Mode verbeux

EXEMPLES:
    $0                          # Sauvegarde complète avec paramètres par défaut
    $0 -d mydb -c              # Sauvegarde spécifique avec compression
    $0 -r 7 --upload           # 7 jours rétention + upload cloud
    $0 --encrypt --verbose     # Sauvegarde chiffrée en mode verbeux

VARIABLES D'ENVIRONNEMENT:
    DATABASE_URL               URL de connexion PostgreSQL
    BACKUP_DIR                 Dossier de sauvegarde (défaut: ./backups)
    AWS_ACCESS_KEY_ID          Clé AWS pour S3
    AWS_SECRET_ACCESS_KEY      Secret AWS pour S3
    S3_BUCKET                  Bucket S3 pour upload
    GPG_RECIPIENT              Email pour chiffrement GPG
${NC}"
}

# Configuration par défaut
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS=30
COMPRESS=true
UPLOAD_CLOUD=false
ENCRYPT=false
VERBOSE=false
DATABASE=""

# Parse des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--database)
            DATABASE="$2"
            shift 2
            ;;
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -c|--compress)
            COMPRESS=true
            shift
            ;;
        --no-compress)
            COMPRESS=false
            shift
            ;;
        -r|--retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --upload)
            UPLOAD_CLOUD=true
            shift
            ;;
        --encrypt)
            ENCRYPT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Vérification des dépendances
check_dependencies() {
    local deps=("pg_dump" "psql")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "Dépendance manquante: $dep"
            exit 1
        fi
    done
    
    if [ "$COMPRESS" = true ] && ! command -v "gzip" &> /dev/null; then
        log_error "gzip requis pour la compression"
        exit 1
    fi
    
    if [ "$ENCRYPT" = true ] && ! command -v "gpg" &> /dev/null; then
        log_error "GPG requis pour le chiffrement"
        exit 1
    fi
    
    log "✓ Dépendances vérifiées"
}

# Vérification de la connexion à la base de données
check_database_connection() {
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL non définie"
        exit 1
    fi
    
    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Impossible de se connecter à la base de données"
        exit 1
    fi
    
    log "✓ Connexion à la base de données établie"
}

# Extraction des infos de la base de données
get_database_info() {
    local db_url="$1"
    
    # Extraction du nom de la base
    DB_NAME=$(echo "$db_url" | sed -e 's/.*\/\([^?]*\).*/\1/')
    
    # Extraction du host
    DB_HOST=$(echo "$db_url" | grep -oP 'postgresql://[^:]+@\K[^:/]+')
    
    # Taille de la base de données
    if [ -n "$DATABASE" ]; then
        DB_SIZE=$(psql "$db_url" -t -c "SELECT pg_size_pretty(pg_database_size('$DATABASE'));" | tr -d ' ')
    else
        DB_SIZE=$(psql "$db_url" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | tr -d ' ')
    fi
    
    log "Base de données: ${DATABASE:-$DB_NAME} (Taille: $DB_SIZE)"
}

# Création du dossier de sauvegarde
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Dossier de sauvegarde créé: $BACKUP_DIR"
    fi
    
    # Sous-dossier par date
    DATE_DIR=$(date +'%Y/%m/%d')
    FULL_BACKUP_DIR="$BACKUP_DIR/$DATE_DIR"
    mkdir -p "$FULL_BACKUP_DIR"
    
    log "Dossier de sauvegarde du jour: $FULL_BACKUP_DIR"
}

# Génération du nom de fichier de sauvegarde
generate_backup_filename() {
    local timestamp=$(date +'%Y%m%d_%H%M%S')
    local db_suffix=""
    
    if [ -n "$DATABASE" ]; then
        db_suffix="_${DATABASE}"
    fi
    
    local base_name="backup${db_suffix}_${timestamp}.sql"
    
    if [ "$COMPRESS" = true ]; then
        base_name="${base_name}.gz"
    fi
    
    if [ "$ENCRYPT" = true ]; then
        base_name="${base_name}.gpg"
    fi
    
    echo "$base_name"
}

# Sauvegarde de la base de données
backup_database() {
    local backup_file="$1"
    local backup_path="$FULL_BACKUP_DIR/$backup_file"
    
    log "Début de la sauvegarde..."
    
    # Options pg_dump
    local dump_options=(
        "--verbose"
        "--no-password"
        "--format=custom"
        "--blobs"
        "--encoding=UTF8"
    )
    
    if [ -n "$DATABASE" ]; then
        dump_options+=("--dbname=$DATABASE_URL/$DATABASE")
    else
        dump_options+=("--dbname=$DATABASE_URL")
    fi
    
    # Compression pendant le dump si demandée
    if [ "$COMPRESS" = true ] && [ "$ENCRYPT" = false ]; then
        if pg_dump "${dump_options[@]}" | gzip > "$backup_path"; then
            log "Sauvegarde compressée créée: $backup_path"
        else
            log_error "Échec de la sauvegarde"
            exit 1
        fi
    # Chiffrement pendant le dump si demandé
    elif [ "$ENCRYPT" = true ]; then
        if [ -z "$GPG_RECIPIENT" ]; then
            log_error "GPG_RECIPIENT requis pour le chiffrement"
            exit 1
        fi
        
        if pg_dump "${dump_options[@]}" | gzip | gpg --encrypt --recipient "$GPG_RECIPIENT" --output "$backup_path"; then
            log "Sauvegarde chiffrée créée: $backup_path"
        else
            log_error "Échec de la sauvegarde chiffrée"
            exit 1
        fi
    # Sauvegarde normale
    else
        if pg_dump "${dump_options[@]}" > "$backup_path"; then
            log "Sauvegarde créée: $backup_path"
        else
            log_error "Échec de la sauvegarde"
            exit 1
        fi
    fi
    
    # Vérification de la sauvegarde
    if [ -f "$backup_path" ]; then
        local file_size=$(du -h "$backup_path" | cut -f1)
        log "✓ Sauvegarde terminée: $backup_path (Taille: $file_size)"
        echo "$backup_path"
    else
        log_error "Fichier de sauvegarde non créé"
        exit 1
    fi
}

# Nettoyage des anciennes sauvegardes
clean_old_backups() {
    log "Nettoyage des sauvegardes de plus de $RETENTION_DAYS jours..."
    
    local deleted_count=0
    local current_time=$(date +%s)
    local retention_seconds=$((RETENTION_DAYS * 24 * 60 * 60))
    
    # Trouver et supprimer les anciens dossiers
    find "$BACKUP_DIR" -type d -name "*" -mtime "+$RETENTION_DAYS" | while read -r old_dir; do
        if [ -d "$old_dir" ]; then
            log_info "Suppression: $old_dir"
            rm -rf "$old_dir"
            ((deleted_count++))
        fi
    done
    
    log "✓ Nettoyage terminé: $deleted_count vieux dossiers supprimés"
}

# Upload vers cloud storage (AWS S3)
upload_to_cloud() {
    local backup_file="$1"
    
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$S3_BUCKET" ]; then
        log_warn "Configuration cloud manquante - skip upload"
        return 0
    fi
    
    log "Début de l'upload vers S3..."
    
    local s3_path="s3://$S3_BUCKET/backups/$(date +'%Y/%m/%d')/$(basename "$backup_file")"
    
    if aws s3 cp "$backup_file" "$s3_path" --quiet; then
        log "✓ Upload réussi: $s3_path"
    else
        log_error "Échec de l'upload S3"
        return 1
    fi
}

# Création d'un rapport de sauvegarde
create_backup_report() {
    local backup_file="$1"
    local report_file="$FULL_BACKUP_DIR/backup_report.txt"
    
    cat > "$report_file" << EOF
Rapport de Sauvegarde - Plateforme Buy/Sell
===========================================

Date: $(date)
Base de données: ${DATABASE:-"Toutes"}
Fichier: $(basename "$backup_file")
Taille: $(du -h "$backup_file" | cut -f1)
Compression: $COMPRESS
Chiffrement: $ENCRYPT
Upload Cloud: $UPLOAD_CLOUD

Informations Base de Données:
- Nom: ${DATABASE:-$DB_NAME}
- Hôte: $DB_HOST
- Taille: $DB_SIZE

Statistiques:
- Temps d'exécution: ${SECONDS} secondes
- Réussite: OUI

Conservation: $RETENTION_DAYS jours
Prochain nettoyage: $(date -d "+$RETENTION_DAYS days" +'%Y-%m-%d %H:%M:%S')

EOF

    log "Rapport créé: $report_file"
}

# Fonction principale
main() {
    local start_time=$SECONDS
    
    log "${CYAN}
    💾 Script de Sauvegarde - Plateforme Buy/Sell
    ${NC}"
    
    # Vérifications initiales
    check_dependencies
    check_database_connection
    get_database_info "$DATABASE_URL"
    create_backup_dir
    
    # Génération du nom de fichier
    if [ -z "$BACKUP_FILE" ]; then
        BACKUP_FILE=$(generate_backup_filename)
    fi
    
    # Sauvegarde
    backup_path=$(backup_database "$BACKUP_FILE")
    
    # Upload cloud si demandé
    if [ "$UPLOAD_CLOUD" = true ]; then
        upload_to_cloud "$backup_path"
    fi
    
    # Nettoyage des anciennes sauvegardes
    clean_old_backups
    
    # Rapport
    create_backup_report "$backup_path"
    
    local duration=$((SECONDS - start_time))
    log "✅ Sauvegarde terminée avec succès en ${duration}s"
    log "📁 Fichier: $backup_path"
}

# Gestion des signaux
trap 'log_error "Sauvegarde interrompue"; exit 1' INT TERM

# Point d'entrée
main "$@"
