#!/bin/bash

set -e

# Configuration
BACKUP_DIR="./backups"
RESTORE_DIR="./restore_temp"
LOG_DIR="./logs"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
}

check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v pg_restore &> /dev/null; then
        error "pg_restore is not installed"
    fi
    
    if ! command -v tar &> /dev/null; then
        error "tar is not installed"
    fi
}

select_backup_file() {
    local backup_files=($(ls -t "$BACKUP_DIR"/buysell_backup_*.tar.gz 2>/dev/null))
    
    if [ ${#backup_files[@]} -eq 0 ]; then
        error "No backup files found in $BACKUP_DIR"
    fi
    
    echo "Available backup files:"
    for i in "${!backup_files[@]}"; do
        echo "  $((i+1)). $(basename "${backup_files[$i]}")"
    done
    
    read -p "Select backup file to restore (1-${#backup_files[@]}): " selection
    
    if [[ ! "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#backup_files[@]} ]; then
        error "Invalid selection"
    fi
    
    BACKUP_FILE="${backup_files[$((selection-1))]}"
    log "Selected backup file: $(basename "$BACKUP_FILE")"
}

extract_backup() {
    log "Extracting backup file..."
    mkdir -p "$RESTORE_DIR"
    
    if ! tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"; then
        error "Failed to extract backup file"
    fi
    
    local extracted_dir=$(find "$RESTORE_DIR" -maxdepth 1 -type d -name "buysell_backup_*" | head -1)
    if [ -z "$extracted_dir" ]; then
        error "Could not find extracted backup directory"
    fi
    
    RESTORE_CONTENT="$extracted_dir"
    log "Backup extracted to: $RESTORE_CONTENT"
}

stop_services() {
    log "Stopping services..."
    
    # Stop using PM2 if available
    if command -v pm2 &> /dev/null; then
        pm2 stop all || warn "Failed to stop PM2 services"
    fi
    
    # Stop backend if running
    if [ -f .backend.pid ] && kill -0 $(cat .backend.pid) 2>/dev/null; then
        kill $(cat .backend.pid)
        rm .backend.pid
    fi
    
    # Stop frontend if running
    if [ -f .frontend.pid ] && kill -0 $(cat .frontend.pid) 2>/dev/null; then
        kill $(cat .frontend.pid)
        rm .frontend.pid
    fi
    
    # Wait a moment for services to stop
    sleep 5
}

restore_database() {
    log "Restoring PostgreSQL database..."
    
    if [ ! -f "$RESTORE_CONTENT/database.dump" ]; then
        error "Database dump file not found in backup"
    fi
    
    # Load database configuration
    if [ -f ./backend/.env ]; then
        source ./backend/.env
    else
        error "Backend .env file not found"
    fi
    
    local DB_HOST=${DB_HOST:-localhost}
    local DB_PORT=${DB_PORT:-5432}
    local DB_NAME=${DB_NAME:-buysell_platform}
    local DB_USER=${DB_USER:-postgres}
    
    # Drop and recreate database (be careful!)
    read -p "This will DELETE all current data. Are you sure? (yes/no): " confirmation
    if [ "$confirmation" != "yes" ]; then
        error "Restoration cancelled by user"
    fi
    
    # Terminate existing connections and drop database
    PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';" \
        -c "DROP DATABASE IF EXISTS $DB_NAME;" \
        -c "CREATE DATABASE $DB_NAME;"
    
    # Restore database
    PGPASSWORD=$DB_PASSWORD pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        "$RESTORE_CONTENT/database.dump"
    
    if [ $? -eq 0 ]; then
        log "Database restoration completed"
    else
        error "Database restoration failed"
    fi
}

restore_redis() {
    if [ -f "$RESTORE_CONTENT/redis.rdb" ] && command -v redis-cli &> /dev/null; then
        log "Restoring Redis data..."
        
        # Load Redis configuration
        if [ -f ./backend/.env ]; then
            source ./backend/.env
        fi
        
        local REDIS_HOST=${REDIS_HOST:-localhost}
        local REDIS_PORT=${REDIS_PORT:-6379}
        
        # Stop Redis, replace RDB file, and restart
        # Note: This requires Redis to be configured to load from this RDB file
        warn "Redis restoration requires manual intervention. Please replace the RDB file in your Redis data directory."
        log "Redis RDB file location: $RESTORE_CONTENT/redis.rdb"
    else
        warn "Skipping Redis restoration"
    fi
}

restore_uploads() {
    if [ -f "$RESTORE_CONTENT/uploads.tar.gz" ]; then
        log "Restoring uploads directory..."
        
        # Remove existing uploads
        rm -rf "./backend/uploads"
        
        # Extract uploads
        tar -xzf "$RESTORE_CONTENT/uploads.tar.gz" -C "./backend"
        
        log "Uploads restoration completed"
    else
        warn "Uploads backup not found in backup"
    fi
}

restore_logs() {
    if [ -f "$RESTORE_CONTENT/logs.tar.gz" ]; then
        log "Restoring logs..."
        
        # Extract logs
        tar -xzf "$RESTORE_CONTENT/logs.tar.gz" -C "."
        
        log "Logs restoration completed"
    else
        warn "Logs backup not found in backup"
    fi
}

restore_configurations() {
    if [ -f "$RESTORE_CONTENT/configs.tar.gz" ]; then
        log "Restoring configurations..."
        
        # Extract configurations
        tar -xzf "$RESTORE_CONTENT/configs.tar.gz" -C "."
        
        log "Configurations restoration completed"
    else
        warn "Configurations backup not found in backup"
    fi
}

start_services() {
    log "Starting services..."
    
    # Use PM2 if available
    if command -v pm2 &> /dev/null; then
        pm2 start ecosystem.config.js
        pm2 save
        log "Services started with PM2"
    else
        warn "PM2 not available, please start services manually"
    fi
}

cleanup() {
    log "Cleaning up temporary files..."
    rm -rf "$RESTORE_DIR"
}

main() {
    log "Starting restoration process..."
    
    check_dependencies
    select_backup_file
    extract_backup
    stop_services
    restore_database
    restore_redis
    restore_uploads
    restore_logs
    restore_configurations
    start_services
    cleanup
    
    log "Restoration completed successfully!"
    log "Please verify that all services are running correctly."
}

# Run main function
main
