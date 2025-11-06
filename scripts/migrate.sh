#!/bin/bash

set -e

# Configuration
BACKEND_DIR="./backend"
LOG_DIR="./logs"
MIGRATION_LOG="$LOG_DIR/migration_$(date +%Y%m%d_%H%M%S).log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$MIGRATION_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$MIGRATION_LOG"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1" | tee -a "$MIGRATION_LOG"
}

check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
}

setup_directories() {
    log "Setting up directories..."
    mkdir -p "$LOG_DIR"
}

check_database_connection() {
    log "Checking database connection..."
    
    cd "$BACKEND_DIR"
    if node -e "
        const db = require('./src/config/database');
        db.raw('SELECT 1')
            .then(() => {
                console.log('Database connection successful');
                process.exit(0);
            })
            .catch(err => {
                console.error('Database connection failed:', err.message);
                process.exit(1);
            });
    "; then
        log "Database connection successful"
    else
        error "Database connection failed"
    fi
    cd ..
}

run_migrations() {
    log "Running database migrations..."
    
    cd "$BACKEND_DIR"
    if npx knex migrate:latest; then
        log "Database migrations completed successfully"
    else
        error "Database migrations failed"
    fi
    cd ..
}

run_seeds() {
    local run_seeds=${1:-false}
    
    if [ "$run_seeds" = "true" ]; then
        log "Running database seeds..."
        
        cd "$BACKEND_DIR"
        if npx knex seed:run; then
            log "Database seeds completed successfully"
        else
            warn "Database seeds failed or partially completed"
        fi
        cd ..
    else
        log "Skipping database seeds (use --seed to run seeds)"
    fi
}

show_migration_status() {
    log "Current migration status:"
    
    cd "$BACKEND_DIR"
    npx knex migrate:status
    cd ..
}

rollback_migration() {
    local steps=${1:-1}
    
    log "Rolling back $steps migration(s)..."
    
    cd "$BACKEND_DIR"
    if npx knex migrate:rollback -- --all; then
        log "Rollback completed successfully"
    else
        error "Rollback failed"
    fi
    cd ..
}

create_migration() {
    local name=$1
    
    if [ -z "$name" ]; then
        error "Migration name is required"
    fi
    
    log "Creating new migration: $name"
    
    cd "$BACKEND_DIR"
    npx knex migrate:make "$name"
    cd ..
    
    log "Migration file created in backend/migrations/"
}

main() {
    local action=${1:-"run"}
    local option=${2:-""}
    
    case $action in
        "run")
            check_dependencies
            setup_directories
            check_database_connection
            run_migrations
            if [ "$option" = "--seed" ]; then
                run_seeds true
            fi
            show_migration_status
            ;;
        "status")
            show_migration_status
            ;;
        "rollback")
            rollback_migration "$option"
            ;;
        "create")
            create_migration "$option"
            ;;
        "seed")
            run_seeds true
            ;;
        *)
            error "Invalid action: $action. Use: run, status, rollback, create, seed"
            ;;
    esac
    
    log "Migration process completed"
}

# Run main function
main "$@"
