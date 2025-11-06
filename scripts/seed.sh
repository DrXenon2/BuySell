#!/bin/bash

set -e

# Configuration
BACKEND_DIR="./backend"
LOG_DIR="./logs"
SEED_LOG="$LOG_DIR/seed_$(date +%Y%m%d_%H%M%S).log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$SEED_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$SEED_LOG"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1" | tee -a "$SEED_LOG"
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

run_seeds() {
    local seed_type=${1:-"all"}
    
    log "Running database seeds ($seed_type)..."
    
    cd "$BACKEND_DIR"
    
    case $seed_type in
        "all")
            npx knex seed:run
            ;;
        "users")
            npx knex seed:run --specific=01_users.js
            ;;
        "products")
            npx knex seed:run --specific=02_products.js
            ;;
        "categories")
            npx knex seed:run --specific=03_categories.js
            ;;
        "orders")
            npx knex seed:run --specific=04_orders.js
            ;;
        *)
            npx knex seed:run --specific="$seed_type"
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        log "Database seeds completed successfully"
    else
        warn "Database seeds failed or partially completed"
    fi
    cd ..
}

create_sample_data() {
    log "Creating additional sample data..."
    
    cd "$BACKEND_DIR"
    node scripts/createSampleData.js
    cd ..
}

validate_data() {
    log "Validating seeded data..."
    
    cd "$BACKEND_DIR"
    node scripts/validateData.js
    cd ..
}

show_seed_info() {
    log "Seed information:"
    
    cd "$BACKEND_DIR"
    echo "Available seed files:"
    find ./seeds -name "*.js" -exec basename {} \; | sort
    cd ..
}

main() {
    local seed_type=${1:-"all"}
    
    check_dependencies
    setup_directories
    check_database_connection
    run_seeds "$seed_type"
    create_sample_data
    validate_data
    show_seed_info
    
    log "Seeding process completed"
}

# Run main function
main "$@"
