#!/bin/bash

set -e

# Configuration
SERVER_IP="${1:-$(curl -s ifconfig.me)}"
SERVER_USER="${2:-ubuntu}"
APP_NAME="buy-sell-platform"
APP_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
LOG_DIR="/var/log/$APP_NAME"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

check_ssh_connection() {
    log "Checking SSH connection to $SERVER_USER@$SERVER_IP..."
    
    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'"; then
        error "SSH connection failed to $SERVER_USER@$SERVER_IP"
    fi
}

update_system() {
    log "Updating system packages..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        sudo apt update && sudo apt upgrade -y
        sudo apt autoremove -y
        sudo apt clean
    "
}

install_dependencies() {
    log "Installing system dependencies..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        sudo apt install -y \
            curl \
            wget \
            git \
            build-essential \
            nginx \
            certbot \
            python3-certbot-nginx \
            postgresql \
            postgresql-contrib \
            redis-server \
            fail2ban \
            ufw \
            htop \
            nload \
            tree \
            jq
    "
}

setup_firewall() {
    log "Configuring firewall..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        sudo ufw --force reset
        sudo ufw default deny incoming
        sudo ufw default allow outgoing
        sudo ufw allow ssh
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw --force enable
        sudo ufw status verbose
    "
}

setup_ssh_security() {
    log "Configuring SSH security..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        # Backup original sshd_config
        sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
        
        # Configure SSH
        sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        sudo sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
        sudo sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 300/' /etc/ssh/sshd_config
        sudo sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 2/' /etc/ssh/sshd_config
        
        echo 'AllowUsers $SERVER_USER' | sudo tee -a /etc/ssh/sshd_config
        
        sudo systemctl restart ssh
    "
    
    warn "SSH password authentication disabled. Ensure you have SSH key access!"
}

install_nodejs() {
    log "Installing Node.js 18..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
        
        # Install PM2 globally
        sudo npm install -g pm2
        sudo pm2 startup
    "
}

setup_directories() {
    log "Setting up application directories..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        sudo mkdir -p $APP_DIR
        sudo mkdir -p $BACKUP_DIR
        sudo mkdir -p $LOG_DIR
        sudo mkdir -p $APP_DIR/backend/uploads
        sudo mkdir -p $APP_DIR/backend/logs
        
        sudo chown -R $SERVER_USER:$SERVER_USER $APP_DIR
        sudo chown -R $SERVER_USER:$SERVER_USER $BACKUP_DIR
        sudo chown -R $SERVER_USER:$SERVER_USER $LOG_DIR
        
        sudo chmod 755 $APP_DIR
        sudo chmod 755 $BACKUP_DIR
        sudo chmod 755 $LOG_DIR
    "
}

setup_database() {
    log "Setting up PostgreSQL database..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        sudo -u postgres psql -c \"CREATE USER $APP_NAME WITH PASSWORD 'temp_password123';\"
        sudo -u postgres psql -c \"CREATE DATABASE $APP_NAME OWNER $APP_NAME;\"
        sudo -u postgres psql -c \"ALTER USER $APP_NAME CREATEDB;\"
        
        # Enable pg_stat_statements for monitoring
        echo 'shared_preload_libraries = '\''pg_stat_statements'\''' | sudo tee -a /etc/postgresql/*/main/postgresql.conf
        echo 'pg_stat_statements.track = all' | sudo tee -a /etc/postgresql/*/main/postgresql.conf
        
        sudo systemctl restart postgresql
    "
    
    warn "Database user created with temporary password. Update in production!"
}

setup_redis() {
    log "Configuring Redis..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        # Configure Redis to require password
        sudo sed -i 's/# requirepass foobared/requirepass redis_temp_password123/' /etc/redis/redis.conf
        
        # Enable persistence
        sudo sed -i 's/save 900 1/save 900 1/' /etc/redis/redis.conf
        sudo sed -i 's/save 300 10/save 300 10/' /etc/redis/redis.conf
        sudo sed -i 's/save 60 10000/save 60 10000/' /etc/redis/redis.conf
        
        sudo systemctl restart redis
    "
    
    warn "Redis configured with temporary password. Update in production!"
}

setup_nginx() {
    log "Setting up Nginx..."
    
    # Create Nginx configuration
    cat > /tmp/nginx-$APP_NAME.conf << EOF
server {
    listen 80;
    server_name $SERVER_IP;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    scp /tmp/nginx-$APP_NAME.conf "$SERVER_USER@$SERVER_IP:/tmp/nginx-$APP_NAME.conf"
    
    ssh "$SERVER_USER@$SERVER_IP" "
        sudo mv /tmp/nginx-$APP_NAME.conf /etc/nginx/sites-available/$APP_NAME
        sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test Nginx configuration
        sudo nginx -t
        
        sudo systemctl enable nginx
        sudo systemctl restart nginx
    "
    
    rm -f /tmp/nginx-$APP_NAME.conf
}

setup_fail2ban() {
    log "Configuring Fail2Ban..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        # Create Fail2Ban jail for SSH
        sudo cat > /etc/fail2ban/jail.local << 'FAIL2BAN_CONFIG'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[sshd-ddos]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 5

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 10
FAIL2BAN_CONFIG
        
        sudo systemctl enable fail2ban
        sudo systemctl restart fail2ban
    "
}

setup_monitoring() {
    log "Setting up basic monitoring..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        # Install and configure netdata
        bash <(curl -Ss https://my-netdata.io/kickstart.sh) --non-interactive
        
        # Create basic monitoring script
        sudo cat > /usr/local/bin/server-stats.sh << 'MONITOR_SCRIPT'
#!/bin/bash
echo '=== Server Statistics ==='
echo 'Uptime:' \$(uptime -p)
echo 'Load Average:' \$(cat /proc/loadavg | awk '{print \$1, \$2, \$3}')
echo 'Memory Usage:' \$(free -h | awk 'NR==2{printf \"%s/%s (%.2f%%)\", \$3, \$2, \$3*100/\$2}')
echo 'Disk Usage:' \$(df -h / | awk 'NR==2{printf \"%s/%s (%s)\", \$3, \$2, \$5}')
echo 'Active Connections:' \$(netstat -an | grep -c ESTABLISHED)
echo '=== Service Status ==='
systemctl is-active nginx && echo 'Nginx: ✅' || echo 'Nginx: ❌'
systemctl is-active postgresql && echo 'PostgreSQL: ✅' || echo 'PostgreSQL: ❌'
systemctl is-active redis && echo 'Redis: ✅' || echo 'Redis: ❌'
systemctl is-active fail2ban && echo 'Fail2Ban: ✅' || echo 'Fail2Ban: ❌'
MONITOR_SCRIPT
        
        sudo chmod +x /usr/local/bin/server-stats.sh
    "
}

create_deploy_user() {
    log "Creating deployment user..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        if ! id -u deploy >/dev/null 2>&1; then
            sudo useradd -m -s /bin/bash deploy
            sudo usermod -aG sudo deploy
            sudo mkdir -p /home/deploy/.ssh
            sudo chmod 700 /home/deploy/.ssh
            
            # Copy SSH keys from current user
            sudo cp /home/$SERVER_USER/.ssh/authorized_keys /home/deploy/.ssh/
            sudo chown -R deploy:deploy /home/deploy/.ssh
            sudo chmod 600 /home/deploy/.ssh/authorized_keys
            
            echo 'deploy user created successfully'
        else
            echo 'deploy user already exists'
        fi
    "
}

setup_backups() {
    log "Setting up backup system..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        # Create backup script
        sudo cat > /usr/local/bin/backup-$APP_NAME.sh << 'BACKUP_SCRIPT'
#!/bin/bash
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=\"$BACKUP_DIR\"
BACKUP_NAME=\"${APP_NAME}_backup_\$TIMESTAMP\"

mkdir -p \"\$BACKUP_DIR/\$BACKUP_NAME\"

# Backup PostgreSQL
sudo -u postgres pg_dump $APP_NAME > \"\$BACKUP_DIR/\$BACKUP_NAME/database.sql\"

# Backup Redis
sudo redis-cli -a redis_temp_password123 --rdb \"\$BACKUP_DIR/\$BACKUP_NAME/dump.rdb\"

# Backup application files
tar -czf \"\$BACKUP_DIR/\$BACKUP_NAME/uploads.tar.gz\" -C $APP_DIR/backend uploads
tar -czf \"\$BACKUP_DIR/\$BACKUP_NAME/logs.tar.gz\" -C $APP_DIR logs

# Create final archive
tar -czf \"\$BACKUP_DIR/\$BACKUP_NAME.tar.gz\" -C \"\$BACKUP_DIR\" \"\$BACKUP_NAME\"
rm -rf \"\$BACKUP_DIR/\$BACKUP_NAME\"

# Cleanup old backups (keep 7 days)
find \"\$BACKUP_DIR\" -name \"${APP_NAME}_backup_*.tar.gz\" -mtime +7 -delete

echo \"Backup created: \$BACKUP_DIR/\$BACKUP_NAME.tar.gz\"
BACKUP_SCRIPT
        
        sudo chmod +x /usr/local/bin/backup-$APP_NAME.sh
        
        # Add to crontab for daily backups at 2 AM
        (crontab -l 2>/dev/null; echo \"0 2 * * * /usr/local/bin/backup-$APP_NAME.sh\") | crontab -
    "
}

generate_setup_report() {
    log "Generating setup report..."
    
    local report_file="/tmp/server_setup_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Server Setup Report"
        echo "==================="
        echo "Date: $(date)"
        echo "Server: $SERVER_IP"
        echo "Application: $APP_NAME"
        echo ""
        echo "Services Installed:"
        echo "- Nginx (Ports: 80, 443)"
        echo "- PostgreSQL (Port: 5432)"
        echo "- Redis (Port: 6379)"
        echo "- Fail2Ban (Security)"
        echo "- Node.js 18 + PM2"
        echo "- UFW Firewall"
        echo ""
        echo "Directories:"
        echo "- Application: $APP_DIR"
        echo "- Backups: $BACKUP_DIR"
        echo "- Logs: $LOG_DIR"
        echo ""
        echo "Security Notes:"
        echo "- SSH password authentication disabled"
        echo "- Firewall configured (SSH, HTTP, HTTPS only)"
        echo "- Fail2Ban enabled for SSH and Nginx"
        echo "- Database and Redis have temporary passwords"
        echo ""
        echo "Next Steps:"
        echo "1. Update database password in production"
        echo "2. Update Redis password in production"
        echo "3. Setup SSL certificates (run ssl-setup.sh)"
        echo "4. Deploy application code"
        echo "5. Configure domain name in Nginx"
        echo ""
        echo "Access:"
        echo "- SSH: ssh $SERVER_USER@$SERVER_IP"
        echo "- HTTP: http://$SERVER_IP"
        echo "- Netdata: http://$SERVER_IP:19999 (if installed)"
    } > "$report_file"
    
    log "Setup report saved to: $report_file"
    
    # Display summary
    info "Server setup completed successfully!"
    info "Server IP: $SERVER_IP"
    info "Application directory: $APP_DIR"
    info "Backup directory: $BACKUP_DIR"
    warn "Remember to update database and Redis passwords!"
    warn "Configure domain name and SSL certificates next."
}

main() {
    log "Starting server setup for $APP_NAME on $SERVER_IP..."
    
    check_ssh_connection
    update_system
    install_dependencies
    setup_firewall
    setup_ssh_security
    install_nodejs
    setup_directories
    setup_database
    setup_redis
    setup_nginx
    setup_fail2ban
    setup_monitoring
    create_deploy_user
    setup_backups
    generate_setup_report
    
    log "Server setup completed!"
}

# Run main function
main "$@"
