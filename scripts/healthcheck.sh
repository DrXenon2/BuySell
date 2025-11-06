#!/bin/bash

set -e

# Configuration
APP_NAME="buy-sell-platform"
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
LOG_DIR="./logs"
HEALTH_LOG="$LOG_DIR/healthcheck_$(date +%Y%m%d_%H%M%S).log"
ALERT_THRESHOLD=3

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
FAILED_CHECKS=0
TOTAL_CHECKS=0

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$HEALTH_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$HEALTH_LOG"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1" | tee -a "$HEALTH_LOG"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$HEALTH_LOG"
}

check_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$HEALTH_LOG"
}

check_failure() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$HEALTH_LOG"
    return 1
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$HEALTH_LOG"
}

setup_directories() {
    mkdir -p "$LOG_DIR"
}

check_system_health() {
    log "Checking system health..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 5))
    
    # CPU Load
    local load
    load=$(awk '{print $1}' /proc/loadavg)
    local cores
    cores=$(nproc)
    
    if (( $(echo "$load < $cores" | bc -l) )); then
        check_success "CPU Load: $load (Cores: $cores)"
    else
        check_warning "CPU Load: $load (Cores: $cores) - High load detected"
    fi
    
    # Memory Usage
    local mem_total mem_used mem_percent
    mem_total=$(free -m | awk 'NR==2{print $2}')
    mem_used=$(free -m | awk 'NR==2{print $3}')
    mem_percent=$((mem_used * 100 / mem_total))
    
    if [ "$mem_percent" -lt 85 ]; then
        check_success "Memory: ${mem_used}MB/${mem_total}MB (${mem_percent}%)"
    else
        check_warning "Memory: ${mem_used}MB/${mem_total}MB (${mem_percent}%) - High memory usage"
    fi
    
    # Disk Usage
    local disk_usage
    disk_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 90 ]; then
        check_success "Disk Usage: ${disk_usage}%"
    else
        error "Disk Usage: ${disk_usage}% - Critical disk usage"
    fi
    
    # Swap Usage
    local swap_used
    swap_used=$(free -m | awk 'NR==3{print $3}')
    if [ "$swap_used" -eq 0 ]; then
        check_success "Swap: Not used"
    else
        check_warning "Swap: ${swap_used}MB used"
    fi
    
    # Uptime
    local uptime
    uptime=$(uptime -p)
    check_success "Uptime: $uptime"
}

check_service_health() {
    log "Checking service health..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 6))
    
    # Nginx
    if systemctl is-active --quiet nginx; then
        check_success "Nginx: Running"
    else
        error "Nginx: Not running"
    fi
    
    # PostgreSQL
    if systemctl is-active --quiet postgresql; then
        check_success "PostgreSQL: Running"
    else
        error "PostgreSQL: Not running"
    fi
    
    # Redis
    if systemctl is-active --quiet redis; then
        check_success "Redis: Running"
    else
        error "Redis: Not running"
    fi
    
    # PM2
    if command -v pm2 &> /dev/null && pm2 ping &> /dev/null; then
        check_success "PM2: Running"
        
        # Check PM2 processes
        local pm2_processes
        pm2_processes=$(pm2 list | grep -c "online")
        if [ "$pm2_processes" -ge 2 ]; then
            check_success "PM2 Processes: $pm2_processes services online"
        else
            check_warning "PM2 Processes: Only $pm2_processes services online"
        fi
    else
        error "PM2: Not running or not installed"
    fi
    
    # Fail2Ban
    if systemctl is-active --quiet fail2ban; then
        check_success "Fail2Ban: Running"
    else
        check_warning "Fail2Ban: Not running"
    fi
}

check_application_health() {
    log "Checking application health..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 4))
    
    # Backend Health Check
    if curl -f -s "$BACKEND_URL/health" > /dev/null; then
        check_success "Backend API: Healthy"
        
        # Extended backend health check
        local backend_response
        backend_response=$(curl -s "$BACKEND_URL/health")
        
        if echo "$backend_response" | grep -q "database"; then
            check_success "Backend Database: Connected"
        else
            check_warning "Backend Database: Connection status unknown"
        fi
        
        if echo "$backend_response" | grep -q "redis"; then
            check_success "Backend Redis: Connected"
        else
            check_warning "Backend Redis: Connection status unknown"
        fi
    else
        error "Backend API: Unhealthy or unreachable"
    fi
    
    # Frontend Health Check
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        check_success "Frontend: Accessible"
    else
        error "Frontend: Unreachable"
    fi
    
    # API Endpoints Check
    if curl -f -s "$BACKEND_URL/api/products" > /dev/null; then
        check_success "API Products: Accessible"
    else
        check_warning "API Products: Unreachable"
    fi
}

check_database_health() {
    log "Checking database health..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 3))
    
    # Database connection
    if psql -l > /dev/null 2>&1; then
        check_success "PostgreSQL: Connection successful"
    else
        error "PostgreSQL: Connection failed"
        return
    fi
    
    # Database size
    local db_size
    db_size=$(psql -d "$APP_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$APP_NAME'));" 2>/dev/null | tr -d ' ')
    
    if [ -n "$db_size" ]; then
        check_success "Database Size: $db_size"
    else
        check_warning "Database Size: Unknown"
    fi
    
    # Active connections
    local connections
    connections=$(psql -d "$APP_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$APP_NAME';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$connections" ]; then
        if [ "$connections" -lt 20 ]; then
            check_success "Active Connections: $connections"
        else
            check_warning "Active Connections: $connections - High connection count"
        fi
    fi
}

check_redis_health() {
    log "Checking Redis health..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 2))
    
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping | grep -q "PONG"; then
            check_success "Redis: Responsive"
            
            # Redis memory usage
            local redis_memory
            redis_memory=$(redis-cli info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
            check_success "Redis Memory: $redis_memory"
        else
            error "Redis: Unresponsive"
        fi
    else
        check_warning "Redis: redis-cli not available"
    fi
}

check_network_health() {
    log "Checking network health..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 3))
    
    # Internet connectivity
    if ping -c 1 -W 3 8.8.8.8 > /dev/null 2>&1; then
        check_success "Internet: Connected"
    else
        error "Internet: No connectivity"
    fi
    
    # DNS resolution
    if nslookup google.com > /dev/null 2>&1; then
        check_success "DNS: Working"
    else
        error "DNS: Resolution failed"
    fi
    
    # Port checks
    if netstat -tuln | grep -q ":3000 "; then
        check_success "Port 3000: Listening (Frontend)"
    else
        error "Port 3000: Not listening"
    fi
    
    if netstat -tuln | grep -q ":3001 "; then
        check_success "Port 3001: Listening (Backend)"
    else
        error "Port 3001: Not listening"
    fi
}

check_security_health() {
    log "Checking security health..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 3))
    
    # Fail2Ban status
    if systemctl is-active --quiet fail2ban; then
        local banned_ips
        banned_ips=$(fail2ban-client status sshd | grep "Currently banned" | awk '{print $4}')
        check_success "Fail2Ban: Active (Banned IPs: $banned_ips)"
    else
        check_warning "Fail2Ban: Not active"
    fi
    
    # UFW status
    if command -v ufw &> /dev/null; then
        if ufw status | grep -q "Status: active"; then
            check_success "UFW: Active"
        else
            check_warning "UFW: Not active"
        fi
    fi
    
    # SSL certificate (if domain is configured)
    local domain
    domain=$(grep -r "server_name" /etc/nginx/sites-enabled/ 2>/dev/null | grep -v "_\|localhost" | awk '{print $2}' | head -1 | tr -d ';')
    
    if [ -n "$domain" ] && [ "$domain" != "localhost" ]; then
        local cert_expiry
        cert_expiry=$(openssl s_client -connect "$domain:443" -servername "$domain" < /dev/null 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
        
        if [ -n "$cert_expiry" ]; then
            check_success "SSL Certificate: Valid until $cert_expiry"
        else
            check_warning "SSL Certificate: Status unknown"
        fi
    fi
}

check_performance_metrics() {
    log "Checking performance metrics..."
    TOTAL_CHECKS=$((TOTAL_CHECKS + 4))
    
    # Response time check
    local response_time
    response_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$BACKEND_URL/health")
    
    if (( $(echo "$response_time < 1" | bc -l) )); then
        check_success "Response Time: ${response_time}s"
    else
        check_warning "Response Time: ${response_time}s - Slow response"
    fi
    
    # Memory usage by Node processes
    local node_memory
    node_memory=$(ps -o pid,user,%mem,command ax | grep node | grep -v grep | awk '{SUM += $3} END {print SUM}')
    
    if [ -n "$node_memory" ]; then
        if (( $(echo "$node_memory < 80" | bc -l) )); then
            check_success "Node.js Memory: ${node_memory}%"
        else
            check_warning "Node.js Memory: ${node_memory}% - High memory usage"
        fi
    fi
    
    # Check for zombie processes
    local zombies
    zombies=$(ps aux | awk '{print $8}' | grep -c Z)
    
    if [ "$zombies" -eq 0 ]; then
        check_success "Zombie Processes: None"
    else
        check_warning "Zombie Processes: $zombies found"
    fi
    
    # Check load average
    local load
    load=$(awk '{print $1}' /proc/loadavg)
    local cores
    cores=$(nproc)
    
    if (( $(echo "$load < $cores * 0.7" | bc -l) )); then
        check_success "Load Average: $load"
    else
        check_warning "Load Average: $load - System under heavy load"
    fi
}

generate_health_report() {
    log "Generating health report..."
    
    local success_checks=$((TOTAL_CHECKS - FAILED_CHECKS))
    local health_percentage=$((success_checks * 100 / TOTAL_CHECKS))
    
    echo ""
    echo "=== HEALTH CHECK SUMMARY ===" | tee -a "$HEALTH_LOG"
    echo "Total Checks: $TOTAL_CHECKS" | tee -a "$HEALTH_LOG"
    echo "Successful: $success_checks" | tee -a "$HEALTH_LOG"
    echo "Failed: $FAILED_CHECKS" | tee -a "$HEALTH_LOG"
    echo "Health Score: $health_percentage%" | tee -a "$HEALTH_LOG"
    
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        echo "Overall Status: ✅ HEALTHY" | tee -a "$HEALTH_LOG"
    elif [ "$FAILED_CHECKS" -le 2 ]; then
        echo "Overall Status: ⚠️  DEGRADED" | tee -a "$HEALTH_LOG"
    else
        echo "Overall Status: ❌ UNHEALTHY" | tee -a "$HEALTH_LOG"
    fi
    
    echo "Log File: $HEALTH_LOG" | tee -a "$HEALTH_LOG"
    
    # Alert if unhealthy
    if [ "$FAILED_CHECKS" -ge "$ALERT_THRESHOLD" ]; then
        echo ""
        echo "🚨 ALERT: System is unhealthy! $FAILED_CHECKS checks failed." | tee -a "$HEALTH_LOG"
        # Here you could add notification logic (email, Slack, etc.)
    fi
}

main() {
    local check_type=${1:-"full"}
    
    log "Starting health check for $APP_NAME..."
    setup_directories
    
    case $check_type in
        "full")
            check_system_health
            check_service_health
            check_application_health
            check_database_health
            check_redis_health
            check_network_health
            check_security_health
            check_performance_metrics
            ;;
        "quick")
            check_application_health
            check_service_health
            ;;
        "system")
            check_system_health
            check_performance_metrics
            ;;
        "services")
            check_service_health
            check_application_health
            ;;
        *)
            error "Invalid check type: $check_type. Use: full, quick, system, services"
            ;;
    esac
    
    generate_health_report
    
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        log "Health check completed successfully!"
        exit 0
    else
        warn "Health check completed with $FAILED_CHECKS failures"
        exit 1
    fi
}

# Run main function
main "$@"
