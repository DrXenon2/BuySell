#!/bin/bash

set -e

# Configuration
SERVER_IP="${1:-$(curl -s ifconfig.me)}"
SERVER_USER="${2:-ubuntu}"
DOMAIN="${3:-}"
EMAIL="${4:-admin@example.com}"
APP_NAME="buy-sell-platform"

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

check_prerequisites() {
    log "Checking prerequisites..."
    
    if [ -z "$DOMAIN" ]; then
        error "Domain name is required. Usage: $0 <server_ip> <user> <domain> <email>"
    fi
    
    if [ -z "$EMAIL" ]; then
        error "Email is required for SSL certificate"
    fi
    
    # Check if domain resolves to server IP
    local domain_ip
    domain_ip=$(dig +short "$DOMAIN" | head -1)
    
    if [ "$domain_ip" != "$SERVER_IP" ]; then
        warn "Domain $DOMAIN does not resolve to $SERVER_IP (resolves to: $domain_ip)"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "SSL setup cancelled"
        fi
    fi
    
    # Check SSH connection
    if ! ssh -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "echo 'SSH OK'" &> /dev/null; then
        error "SSH connection failed to $SERVER_USER@$SERVER_IP"
    fi
}

update_nginx_config() {
    log "Updating Nginx configuration for domain: $DOMAIN"
    
    # Create new Nginx configuration with SSL
    cat > /tmp/nginx-ssl-$APP_NAME.conf << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$host\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN/chain.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 1.1.1.1 valid=300s;
    resolver_timeout 5s;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Root location
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
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # API location
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
        
        # Rate limiting for API
        limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
        limit_req zone=api burst=20 nodelay;
    }
    
    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }
    
    location /static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
    
    # Security - Block sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ /(README|CHANGELOG|LICENSE|package\.json) {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Let's Encrypt renewal
    location ~ /\.well-known/acme-challenge {
        root /var/www/html;
        allow all;
    }
}
EOF

    # Upload new configuration
    scp /tmp/nginx-ssl-$APP_NAME.conf "$SERVER_USER@$SERVER_IP:/tmp/nginx-ssl-$APP_NAME.conf"
    
    ssh "$SERVER_USER@$SERVER_IP" "
        sudo mv /tmp/nginx-ssl-$APP_NAME.conf /etc/nginx/sites-available/$APP_NAME
        sudo nginx -t
        sudo systemctl reload nginx
    "
    
    rm -f /tmp/nginx-ssl-$APP_NAME.conf
}

obtain_ssl_certificate() {
    log "Obtaining SSL certificate from Let's Encrypt..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        # Ensure webroot exists for ACME challenges
        sudo mkdir -p /var/www/html/.well-known/acme-challenge
        sudo chown -R www-data:www-data /var/www/html
        
        # Obtain certificate
        sudo certbot certonly --nginx \
            -d $DOMAIN \
            -d www.$DOMAIN \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            --force-renewal \
            --non-interactive
        
        if [ \$? -eq 0 ]; then
            echo 'SSL certificate obtained successfully'
        else
            echo 'Failed to obtain SSL certificate'
            exit 1
        fi
    " || error "Failed to obtain SSL certificate"
}

setup_auto_renewal() {
    log "Setting up automatic SSL certificate renewal..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        # Test renewal
        sudo certbot renew --dry-run
        
        if [ \$? -eq 0 ]; then
            echo 'Certificate renewal test successful'
        else
            echo 'Certificate renewal test failed'
            exit 1
        fi
        
        # Add to crontab for automatic renewal
        (crontab -l 2>/dev/null | grep -v 'certbot renew'; echo \"0 12 * * * /usr/bin/certbot renew --quiet\") | crontab -
        
        echo 'Automatic renewal configured in crontab'
    " || warn "Certificate renewal setup had issues"
}

setup_ssl_monitoring() {
    log "Setting up SSL certificate monitoring..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        # Create SSL monitoring script
        sudo cat > /usr/local/bin/check-ssl.sh << 'SSL_SCRIPT'
#!/bin/bash
DOMAIN=\"$DOMAIN\"
EXPIRY=\$(openssl x509 -in /etc/letsencrypt/live/\$DOMAIN/cert.pem -noout -dates | grep notAfter | cut -d= -f2)
EXPIRY_EPOCH=\$(date -d \"\$EXPIRY\" +%s)
CURRENT_EPOCH=\$(date +%s)
DAYS_LEFT=\$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

echo \"SSL Certificate for \$DOMAIN\"
echo \"Expires: \$EXPIRY\"
echo \"Days left: \$DAYS_LEFT\"

if [ \$DAYS_LEFT -lt 30 ]; then
    echo \"⚠️  WARNING: Certificate expires in \$DAYS_LEFT days\"
    exit 1
elif [ \$DAYS_LEFT -lt 7 ]; then
    echo \"🚨 CRITICAL: Certificate expires in \$DAYS_LEFT days\"
    exit 2
else
    echo \"✅ OK: Certificate valid for \$DAYS_LEFT days\"
    exit 0
fi
SSL_SCRIPT
        
        sudo chmod +x /usr/local/bin/check-ssl.sh
        
        # Add to crontab for daily checks
        (crontab -l 2>/dev/null; echo \"0 8 * * * /usr/local/bin/check-ssl.sh\") | crontab -
    "
}

test_ssl_configuration() {
    log "Testing SSL configuration..."
    
    # Test HTTPS access
    if curl -f -I "https://$DOMAIN" --max-time 10 &> /dev/null; then
        log "HTTPS access test: ✅ SUCCESS"
    else
        warn "HTTPS access test: ⚠️  May take a few minutes to propagate"
    fi
    
    # Test SSL labs (if ssllabs-scan is available)
    if command -v ssllabs-scan &> /dev/null; then
        info "Running SSL Labs test (this may take a few minutes)..."
        ssllabs-scan --grade "$DOMAIN" || warn "SSL Labs test unavailable"
    fi
    
    # Test SSL certificate
    if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" < /dev/null 2>/dev/null | openssl x509 -noout -dates; then
        log "SSL certificate test: ✅ VALID"
    else
        error "SSL certificate test: ❌ INVALID"
    fi
}

configure_ssl_security() {
    log "Configuring additional SSL security..."
    
    ssh "$SERVER_USER@$SERVER_IP" "
        # Generate Diffie-Hellman parameters
        if [ ! -f /etc/ssl/certs/dhparam.pem ]; then
            sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
        fi
        
        # Create SSL configuration snippet
        sudo cat > /etc/nginx/snippets/ssl-params.conf << 'SSL_PARAMS'
# From https://cipherli.st/
# and https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_dhparam /etc/ssl/certs/dhparam.pem;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_ecdh_curve secp384r1;
ssl_session_timeout  10m;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 1.1.1.1 valid=300s;
resolver_timeout 5s;
add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\";
add_header X-Frame-Options SAMEORIGIN;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection \"1; mode=block\";
SSL_PARAMS
        
        # Update Nginx configuration to include SSL params
        sudo sed -i '/ssl_certificate_key/a include /etc/nginx/snippets/ssl-params.conf;' /etc/nginx/sites-available/$APP_NAME
        
        sudo nginx -t
        sudo systemctl reload nginx
    "
}

generate_ssl_report() {
    log "Generating SSL setup report..."
    
    local report_file="/tmp/ssl_setup_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "SSL Setup Report"
        echo "================"
        echo "Date: $(date)"
        echo "Domain: $DOMAIN"
        echo "Server: $SERVER_IP"
        echo "Email: $EMAIL"
        echo ""
        echo "SSL Certificate:"
        echo "- Provider: Let's Encrypt"
        echo "- Auto-renewal: Enabled (cron)"
        echo "- Monitoring: Daily checks"
        echo ""
        echo "Security Features:"
        echo "- TLS 1.2 & 1.3 only"
        echo "- Strong cipher suites"
        echo "- HSTS enabled with preload"
        echo "- OCSP stapling"
        echo "- Security headers"
        echo ""
        echo "Next Steps:"
        echo "1. Test website at https://$DOMAIN"
        echo "2. Submit HSTS preload (optional)"
        echo "3. Monitor certificate expiration"
        echo "4. Setup uptime monitoring"
        echo ""
        echo "Testing Commands:"
        echo "curl -I https://$DOMAIN"
        echo "openssl s_client -connect $DOMAIN:443 -servername $DOMAIN"
        echo "/usr/local/bin/check-ssl.sh"
    } > "$report_file"
    
    log "SSL setup report saved to: $report_file"
    
    # Display summary
    info "SSL setup completed successfully!"
    info "Domain: https://$DOMAIN"
    info "Certificate: Let's Encrypt (auto-renewing)"
    info "Security: A+ configuration applied"
}

main() {
    log "Starting SSL setup for $DOMAIN on $SERVER_IP..."
    
    check_prerequisites
    update_nginx_config
    obtain_ssl_certificate
    configure_ssl_security
    setup_auto_renewal
    setup_ssl_monitoring
    test_ssl_configuration
    generate_ssl_report
    
    log "SSL setup completed!"
    log "Your site is now available at: https://$DOMAIN"
}

# Run main function
main "$@"
