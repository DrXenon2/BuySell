#!/bin/bash

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="buysell_backup_${TIMESTAMP}"
LOG_DIR="./logs"
RETENTION_DAYS=7

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
    
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump is not installed"
    fi
    
    if ! command -v redis-cli &> /dev/null; then
        warn "redis-cli is not installed - Redis backup will be skipped"
    fi
    
    if ! command -v tar &> /dev/null; then
        error "tar is not installed"
    fi
}

create_backup_directories() {
    log "Creating backup directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
}

backup_database() {
    log "Backing up PostgreSQL database..."
    
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
    
    # Backup using pg_dump
    PGPASSWORD=$DB_PASSWORD pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --format=custom \
        --verbose \
        --file="$BACKUP_DIR/$BACKUP_NAME/database.dump"
    
    if [ $? -eq 0 ]; then
        log "Database backup completed: $BACKUP_DIR/$BACKUP_NAME/database.dump"
    else
        error "Database backup failed"
    fi
}

backup_redis() {
    if command -v redis-cli &> /dev/null; then
        log "Backing up Redis data..."
        
        # Load Redis configuration
        if [ -f ./backend/.env ]; then
            source ./backend/.env
        fi
        
        local REDIS_HOST=${REDIS_HOST:-localhost}
        local REDIS_PORT=${REDIS_PORT:-6379}
        local REDIS_PASSWORD=${REDIS_PASSWORD:-}
        
        # Create Redis backup
        if [ -n "$REDIS_PASSWORD" ]; then
            redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --rdb "$BACKUP_DIR/$BACKUP_NAME/redis.rdb"
        else
            redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --rdb "$BACKUP_DIR/$BACKUP_NAME/redis.rdb"
        fi
        
        if [ $? -eq 0 ]; then
            log "Redis backup completed: $BACKUP_DIR/$BACKUP_NAME/redis.rdb"
        else
            warn "Redis backup failed or not available"
        fi
    else
        warn "Skipping Redis backup - redis-cli not available"
    fi
}

backup_uploads() {
    log "Backing up uploads directory..."
    
    if [ -d "./backend/uploads" ]; then
        tar -czf "$BACKUP_DIR/$BACKUP_NAME/uploads.tar.gz" -C "./backend" "uploads"
        log "Uploads backup completed: $BACKUP_DIR/$BACKUP_NAME/uploads.tar.gz"
    else
        warn "Uploads directory not found"
    fi
}

backup_logs() {
    log "Backing up logs..."
    
    if [ -d "./logs" ]; then
        tar -czf "$BACKUP_DIR/$BACKUP_NAME/logs.tar.gz" -C "." "logs"
        log "Logs backup completed: $BACKUP_DIR/$BACKUP_NAME/logs.tar.gz"
    else
        warn "Logs directory not found"
    fi
}

backup_configurations() {
    log "Backing up configurations..."
    
    # Backup environment files
    tar -czf "$BACKUP_DIR/$BACKUP_NAME/configs.tar.gz" \
        "./backend/.env" \
        "./frontend/.env" \
        "./docker-compose.yml" \
        "./docker-compose.prod.yml" \
        "./nginx.conf" \
        "./ecosystem.config.js" 2>/dev/null || warn "Some configuration files missing"
    
    log "Configurations backup completed: $BACKUP_DIR/$BACKUP_NAME/configs.tar.gz"
}

create_backup_archive() {
    log "Creating backup archive..."
    
    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    cd - > /dev/null
    
    # Remove temporary directory
    rm -rf "$BACKUP_DIR/$BACKUP_NAME"
    
    log "Backup archive created: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
}

clean_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "buysell_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    log "Old backups cleanup completed"
}

generate_backup_report() {
    local report_file="$BACKUP_DIR/${BACKUP_NAME}_report.txt"
    
    {
        echo "Backup Report - $TIMESTAMP"
        echo "=========================="
        echo "Backup Name: $BACKUP_NAME"
        echo "Date: $(date)"
        echo "Size: $(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)"
        echo ""
        echo "Contents:"
        echo "- Database: PostgreSQL dump"
        echo "- Redis: RDB file (if available)"
        echo "- Uploads: Compressed archive"
        echo "- Logs: Compressed archive"
        echo "- Configurations: Environment and config files"
        echo ""
        echo "Checksum:"
        md5sum "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" 2>/dev/null || echo "MD5 checksum not available"
    } > "$report_file"
    
    log "Backup report generated: $report_file"
}

main() {
    log "Starting backup process..."
    
    check_dependencies
    create_backup_directories
    backup_database
    backup_redis
    backup_uploads
    backup_logs
    backup_configurations
    create_backup_archive
    clean_old_backups
    generate_backup_report
    
    log "Backup completed successfully!"
    log "Backup location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
}

# Run main function
main
