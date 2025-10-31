#!/bin/bash

# Script de restauration de la base de données
# Restaure les sauvegardes PostgreSQL

set -e

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

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

# Aide
show_help() {
    echo -e "${CYAN}
Script de restauration de la base de données PostgreSQL
Usage: $0 [OPTIONS] <fichier_sauvegarde>

OPTIONS:
    -h, --help              Affiche cette aide
    -f, --file FILE         Fichier de sauvegarde à restaurer
    -d, --database DB       Base de données cible
    --create-database       Créer la base si elle n'existe pas
    --drop-database         Supprimer et recréer la base
    --list-backups          Lister les sauvegardes disponibles
    --download-from-s3 URL  Télécharger depuis S3
    --decrypt               Déchiffrer avec GPG
    --verbose               Mode verbeux

EXEMPLES:
    $0 -f backup.sql.gz                    # Restauration standard
    $0 -f backup.sql.gz --drop-database    # Recréation complète
    $0 -f backup.sql.gpg --decrypt         # Restauration chiffrée
    $0 --list-backups                     # Lister les sauvegardes
    $0 --download-from-s3 s3://bucket/backup.sql.gz  # Télécharger depuis S3

VARIABLES D'ENVIRONNEMENT:
    DATABASE_URL               URL de connexion PostgreSQL
    BACKUP_DIR                 Dossier de sauvegarde (défaut: ./backups)
    GPG_PASSPHRASE            Passphrase pour déchiffrement
${NC}"
}

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RESTORE_DB=""
CREATE_DB=false
DROP_DB=false
LIST_BACKUPS=false
DOWNLOAD_S3=""
DECRYPT=false
VERBOSE=false
BACKUP_FILE=""

# Parse des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -d|--database)
            RESTORE_DB="$2"
            shift 2
            ;;
        --create-database)
            CREATE_DB=true
            shift
            ;;
        --drop-database)
            DROP_DB=true
            CREATE_DB=true
            shift
            ;;
        --list-backups)
            LIST_BACKUPS=true
            shift
            ;;
        --download-from-s3)
            DOWNLOAD_S3="$2"
            shift 2
            ;;
        --decrypt)
            DECRYPT=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        *)
            if [ -z "$BACKUP_FILE" ] && [[ "$1" != --* ]]; then
                BACKUP_FILE="$1"
            else
                log_error "Option inconnue: $1"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Vérification des dépendances
check_dependencies() {
    local deps=("pg_restore" "psql")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "Dépendance manquante: $dep"
            exit 1
        fi
    done
    
    if [ "$DECRYPT" = true ] && ! command -v "gpg" &> /dev/null; then
        log_error "GPG requis pour le déchiffrement"
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

# Lister les sauvegardes disponibles
list_backups() {
    log "Sauvegardes disponibles dans: $BACKUP_DIR"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Dossier de sauvegarde non trouvé: $BACKUP_DIR"
        exit 1
    fi
    
    local backup_files=$(find "$BACKUP_DIR" -name "*.sql" -o -name "*.sql.gz" -o -name "*.sql.gpg" | sort -r)
    
    if [ -z "$backup_files" ]; then
        log_warn "Aucune sauvegarde trouvée"
        return 0
    fi
    
    echo -e "${CYAN}"
    printf "%-30s %-12s %-20s\n" "Fichier" "Taille" "Date"
    printf "%-30s %-12s %-20s\n" "-------" "-----" "----"
    
    while IFS= read -r file; do
        local size=$(du -h "$file" 2>/dev/null | cut -f1 || echo "N/A")
        local date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || echo "N/A")
        local filename=$(basename "$file")
        printf "%-30s %-12s %-20s\n" "$filename" "$size" "$date"
    done <<< "$backup_files"
    
    echo -e "${NC}"
}

# Téléchargement depuis S3
download_from_s3() {
    local s3_url="$1"
    local filename=$(basename "$s3_url")
    local local_path="/tmp/$filename"
    
    log "Téléchargement depuis S3: $s3_url"
    
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        log_error "Configuration AWS manquante"
        exit 1
    fi
    
    if aws s3 cp "$s3_url" "$local_path"; then
        log "✓ Téléchargement réussi: $local_path"
        BACKUP_FILE="$local_path"
    else
        log_error "Échec du téléchargement S3"
        exit 1
    fi
}

# Vérification du fichier de sauvegarde
check_backup_file() {
    if [ -z "$BACKUP_FILE" ]; then
        log_error "Fichier de sauvegarde non spécifié"
        show_help
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Fichier de sauvegarde non trouvé: $BACKUP_FILE"
        exit 1
    fi
    
    local file_size=$(du -h "$BACKUP_FILE" | cut -f1)
    log "Fichier de sauvegarde: $BACKUP_FILE (Taille: $file_size)"
    
    # Vérification du type de fichier
    if [[ "$BACKUP_FILE" == *.gpg ]]; then
        DECRYPT=true
        log "Fichier chiffré détecté - déchiffrement activé"
    fi
}

# Déchiffrement du fichier
decrypt_backup() {
    local encrypted_file="$1"
    local decrypted_file="${encrypted_file%.gpg}"
    
    log "Déchiffrement du fichier..."
    
    if [ -n "$GPG_PASSPHRASE" ]; then
        echo "$GPG_PASSPHRASE" | gpg --batch --passphrase-fd 0 --decrypt "$encrypted_file" > "$decrypted_file"
    else
        gpg --decrypt "$encrypted_file" > "$decrypted_file"
    fi
    
    if [ $? -eq 0 ] && [ -f "$decrypted_file" ]; then
        log "✓ Fichier déchiffré: $decrypted_file"
        BACKUP_FILE="$decrypted_file"
    else
        log_error "Échec du déchiffrement"
        exit 1
    fi
}

# Décompression si nécessaire
decompress_backup() {
    local compressed_file="$1"
    
    if [[ "$compressed_file" == *.gz ]]; then
        log "Décompression du fichier..."
        local decompressed_file="${compressed_file%.gz}"
        
        if gzip -dc "$compressed_file" > "$decompressed_file"; then
            log "✓ Fichier décompressé: $decompressed_file"
            BACKUP_FILE="$decompressed_file"
        else
            log_error "Échec de la décompression"
            exit 1
        fi
    fi
}

# Gestion de la base de données cible
setup_target_database() {
    # Extraction du nom de la base depuis DATABASE_URL si non spécifié
    if [ -z "$RESTORE_DB" ]; then
        RESTORE_DB=$(echo "$DATABASE_URL" | sed -e 's/.*\/\([^?]*\).*/\1/')
        log "Base de données cible: $RESTORE_DB (depuis DATABASE_URL)"
    fi
    
    # Vérification si la base existe
    local db_exists=$(psql "$DATABASE_URL" -t -c "SELECT 1 FROM pg_database WHERE datname = '$RESTORE_DB';" | tr -d ' ')
    
    if [ "$db_exists" = "1" ]; then
        if [ "$DROP_DB" = true ]; then
            log_warn "Suppression de la base existante: $RESTORE_DB"
            psql "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $RESTORE_DB;"
        else
            log "Base existante détectée: $RESTORE_DB"
        fi
    fi
    
    # Création si nécessaire
    if [ "$CREATE_DB" = true ] || [ -z "$db_exists" ] || [ "$db_exists" != "1" ]; then
        log "Création de la base: $RESTORE_DB"
        psql "$DATABASE_URL" -c "CREATE DATABASE $RESTORE_DB;"
    fi
    
    # URL de connexion pour la base cible
    TARGET_URL=$(echo "$DATABASE_URL" | sed -e "s|/[^/?]*|/$RESTORE_DB|")
}

# Vérification avant restauration
pre_restore_checks() {
    log "Vérifications pré-restauration..."
    
    # Avertissement pour la production
    if [ "$NODE_ENV" = "production" ] && [ "$DROP_DB" = false ]; then
        log_warn "⚠️  MODE PRODUCTION DÉTECTÉ"
        read -p "Confirmez la restauration en production (oui/non): " confirm
        if [ "$confirm" != "oui" ]; then
            log "Restauration annulée"
            exit 0
        fi
    fi
    
    # Sauvegarde des données existantes si en production
    if [ "$NODE_ENV" = "production" ] && [ "$DROP_DB" = true ]; then
        log_warn "Création d'une sauvegarde de secours..."
        local emergency_backup="./backups/emergency_backup_$(date +'%Y%m%d_%H%M%S').sql"
        if pg_dump --dbname="$TARGET_URL" --format=custom > "$emergency_backup"; then
            log "✓ Sauvegarde de secours créée: $emergency_backup"
        else
            log_error "Échec de la sauvegarde de secours"
            exit 1
        fi
    fi
}

# Restauration de la base de données
restore_database() {
    local backup_file="$1"
    
    log "Début de la restauration..."
    
    # Options pg_restore
    local restore_options=(
        "--verbose"
        "--no-password"
        "--dbname=$TARGET_URL"
        "--clean"
        "--if-exists"
        "--create"
    )
    
    # Détermination du format
    if file "$backup_file" | grep -q "PostgreSQL custom database dump"; then
        log "Format détecté: custom"
        restore_options+=("--format=custom")
    else
        log "Format détecté: plain SQL"
        restore_options=("--dbname=$TARGET_URL")
    fi
    
    # Exécution de la restauration
    if [ "${#restore_options[@]}" -gt 2 ]; then
        if pg_restore "${restore_options[@]}" "$backup_file"; then
            log "✓ Restauration pg_restore réussie"
        else
            log_error "Échec de la restauration pg_restore"
            exit 1
        fi
    else
        if psql "$TARGET_URL" < "$backup_file"; then
            log "✓ Restauration SQL réussie"
        else
            log_error "Échec de la restauration SQL"
            exit 1
        fi
    fi
}

# Vérification post-restauration
post_restore_checks() {
    log "Vérifications post-restauration..."
    
    # Vérification des tables essentielles
    local essential_tables=("users" "products" "categories")
    local missing_tables=()
    
    for table in "${essential_tables[@]}"; do
        local exists=$(psql "$TARGET_URL" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" | tr -d ' ')
        if [ "$exists" != "1" ]; then
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
        log "✓ Toutes les tables essentielles sont présentes"
    else
        log_warn "Tables manquantes: ${missing_tables[*]}"
    fi
    
    # Comptage des données
    local user_count=$(psql "$TARGET_URL" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    local product_count=$(psql "$TARGET_URL" -t -c "SELECT COUNT(*) FROM products;" | tr -d ' ')
    
    log "Données restaurées: $user_count utilisateur(s), $product_count produit(s)"
}

# Nettoyage des fichiers temporaires
cleanup_temp_files() {
    if [[ "$BACKUP_FILE" == /tmp/* ]] || [[ "$BACKUP_FILE" == *.gpg ]] || [[ "$BACKUP_FILE" == *.gz ]]; then
        log "Nettoyage des fichiers temporaires..."
        rm -f "$BACKUP_FILE"
        # Nettoyer aussi les fichiers déchiffrés/décompressés
        rm -f "${BACKUP_FILE%.gpg}" "${BACKUP_FILE%.gz}"
    fi
}

# Fonction principale
main() {
    local start_time=$SECONDS
    
    log "${CYAN}
    🔄 Script de Restauration - Plateforme Buy/Sell
    ${NC}"
    
    # Vérifications initiales
    check_dependencies
    check_database_connection
    
    # Lister les sauvegardes si demandé
    if [ "$LIST_BACKUPS" = true ]; then
        list_backups
        exit 0
    fi
    
    # Téléchargement depuis S3 si demandé
    if [ -n "$DOWNLOAD_S3" ]; then
        download_from_s3 "$DOWNLOAD_S3"
    fi
    
    # Vérification du fichier
    check_backup_file
    
    # Prétraitement du fichier
    if [ "$DECRYPT" = true ]; then
        decrypt_backup "$BACKUP_FILE"
    fi
    
    decompress_backup "$BACKUP_FILE"
    
    # Configuration de la base cible
    setup_target_database
    
    # Vérifications de sécurité
    pre_restore_checks
    
    # Restauration
    restore_database "$BACKUP_FILE"
    
    # Vérifications finales
    post_restore_checks
    
    # Nettoyage
    cleanup_temp_files
    
    local duration=$((SECONDS - start_time))
    log "✅ Restauration terminée avec succès en ${duration}s"
    log "📊 Base restaurée: $RESTORE_DB"
}

# Gestion des signaux
trap 'log_error "Restauration interrompue"; cleanup_temp_files; exit 1' INT TERM

# Point d'entrée
main "$@"
