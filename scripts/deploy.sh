#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="buy-sell-platform"
ENVIRONMENT=${1:-production}
BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"
LOG_DIR="./logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_LOG="$LOG_DIR/deploy_${TIMESTAMP}.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$DEPLOY_LOG"
    exit 1
}

check_environment() {
    log "Checking deployment environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        production|staging|development)
            log "Environment $ENVIRONMENT is valid"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Use: production, staging, development"
            ;;
    esac
}

check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    log "Node.js version: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    log "npm version: $(npm --version)"
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        log "Docker is available"
    else
        warn "Docker is not available - some features may be limited"
    fi
}

setup_directories() {
    log "Setting up directories..."
    mkdir -p "$LOG_DIR"
    mkdir -p "./backend/uploads"
    mkdir -p "./backend/logs"
}

install_dependencies() {
    log "Installing dependencies..."
    
    # Backend dependencies
    log "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm ci --production
    if [ $? -ne 0 ]; then
        warn "npm ci failed, trying npm install..."
        npm install --production
    fi
    cd ..
    
    # Frontend dependencies
    log "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm ci --production
    if [ $? -ne 0 ]; then
        warn "npm ci failed, trying npm install..."
        npm install --production
    fi
    cd ..
}

run_tests() {
    log "Running tests..."
    
    # Backend tests
    log "Running backend tests..."
    cd "$BACKEND_DIR"
    if npm test; then
        log "Backend tests passed"
    else
        error "Backend tests failed"
    fi
    cd ..
    
    # Frontend tests
    log "Running frontend tests..."
    cd "$FRONTEND_DIR"
    if npm test; then
        log "Frontend tests passed"
    else
        error "Frontend tests failed"
    fi
    cd ..
}

build_applications() {
    log "Building applications..."
    
    # Build backend
    log "Building backend..."
    cd "$BACKEND_DIR"
    npm run build
    if [ $? -ne 0 ]; then
        error "Backend build failed"
    fi
    cd ..
    
    # Build frontend
    log "Building frontend..."
    cd "$FRONTEND_DIR"
    npm run build
    if [ $? -ne 0 ]; then
        error "Frontend build failed"
    fi
    cd ..
}

run_migrations() {
    log "Running database migrations..."
    cd "$BACKEND_DIR"
    npx knex migrate:latest
    if [ $? -ne 0 ]; then
        error "Database migrations failed"
    fi
    cd ..
}

seed_database() {
    if [ "$ENVIRONMENT" = "development" ] || [ "$ENVIRONMENT" = "staging" ]; then
        log "Seeding database with sample data..."
        cd "$BACKEND_DIR"
        npx knex seed:run
        if [ $? -ne 0 ]; then
            warn "Database seeding failed or partially completed"
        fi
        cd ..
    else
        log "Skipping database seeding for production environment"
    fi
}

start_services() {
    log "Starting services..."
    
    # Use PM2 if available
    if command -v pm2 &> /dev/null; then
        log "Starting services with PM2..."
        pm2 start ecosystem.config.js --env "$ENVIRONMENT"
        pm2 save
        log "Services started with PM2"
    else
        warn "PM2 not available, starting manually..."
        # Start backend
        cd "$BACKEND_DIR"
        npm start &
        BACKEND_PID=$!
        cd ..
        
        # Start frontend
        cd "$FRONTEND_DIR"
        npm start &
        FRONTEND_PID=$!
        cd ..
        
        echo $BACKEND_PID > .backend.pid
        echo $FRONTEND_PID > .frontend.pid
        log "Services started manually (PIDs: backend=$BACKEND_PID, frontend=$FRONTEND_PID)"
    fi
}

health_check() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
}

cleanup() {
    log "Cleaning up..."
    
    # Remove temporary files
    rm -f .backend.pid .frontend.pid
    
    # Clean up old logs (keep last 10)
    ls -t "$LOG_DIR"/deploy_*.log | tail -n +11 | xargs rm -f
}

main() {
    log "Starting deployment of $APP_NAME to $ENVIRONMENT environment"
    
    check_environment
    check_dependencies
    setup_directories
    install_dependencies
    run_tests
    build_applications
    run_migrations
    seed_database
    start_services
    health_check
    cleanup
    
    log "Deployment completed successfully!"
    log "Frontend: http://localhost:3000"
    log "Backend API: http://localhost:3001"
    log "Deployment log: $DEPLOY_LOG"
}

# Handle signals
trap 'error "Deployment interrupted"; cleanup; exit 1' INT TERM

# Run main function
main
