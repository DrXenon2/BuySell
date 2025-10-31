#!/bin/bash

# Script de déploiement automatisé
# Gère le déploiement en staging et production

set -e

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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

log_debug() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] 🔍 $1${NC}"
    fi
}

# Aide
show_help() {
    echo -e "${CYAN}
Script de déploiement - Plateforme Buy/Sell
Usage: $0 [OPTIONS] [ENVIRONMENT]

ENVIRONMENTS:
    staging          Déploiement en staging (défaut)
    production       Déploiement en production

OPTIONS:
    -h, --help              Affiche cette aide
    -v, --verbose           Mode verbeux
    --dry-run               Simulation sans exécution
    --migrate               Exécuter les migrations DB
    --rollback              Rollback vers version précédente
    --version VERSION       Version spécifique à déployer
    --skip-tests           Sauter les tests
    --skip-backup          Sauter la sauvegarde
    --notify               Envoyer les notifications

EXEMPLES:
    $0                          # Déploiement staging
    $0 production              # Déploiement production
    $0 staging --dry-run       # Simulation déploiement staging
    $0 --migrate --notify      # Déploiement + migrations + notifications
    $0 --rollback             # Rollback version précédente

VARIABLES D'ENVIRONNEMENT:
    NODE_ENV                  Environnement (staging/production)
    DEPLOY_SSH_HOST          Hôte SSH pour déploiement
    DEPLOY_SSH_USER          Utilisateur SSH
    DEPLOY_PATH              Chemin de déploiement distant
    SLACK_WEBHOOK            Webhook Slack pour notifications
${NC}"
}

# Configuration
ENVIRONMENT="staging"
DRY_RUN=false
VERBOSE=false
RUN_MIGRATIONS=false
ROLLBACK=false
SKIP_TESTS=false
SKIP_BACKUP=false
SEND_NOTIFICATIONS=false
VERSION=""

# Parse des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --migrate)
            RUN_MIGRATIONS=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --notify)
            SEND_NOTIFICATIONS=true
            shift
            ;;
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "Argument inconnu: $1"
            show_help
            exit 1
            ;;
    esac
done

# Chargement de la configuration d'environnement
load_environment_config() {
    local env_file=".env.${ENVIRONMENT}"
    
    if [ -f "$env_file" ]; then
        log "Chargement configuration: $env_file"
        set -a
        source "$env_file"
        set +a
    else
        log_warn "Fichier de configuration non trouvé: $env_file"
    fi
    
    # Configuration par défaut
    DEPLOY_SSH_HOST="${DEPLOY_SSH_HOST:-$SSH_HOST}"
    DEPLOY_SSH_USER="${DEPLOY_SSH_USER:-$SSH_USER}"
    DEPLOY_PATH="${DEPLOY_PATH:-/var/www/buysell-platform}"
    DOCKER_COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
    
    log "Environnement: $ENVIRONMENT"
    log "Hôte: $DEPLOY_SSH_USER@$DEPLOY_SSH_HOST"
    log "Chemin: $DEPLOY_PATH"
}

# Vérification des prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    local missing_deps=()
    
    # Vérification des commandes requises
    local required_commands=("ssh" "git" "docker" "docker-compose")
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Dépendances manquantes: ${missing_deps[*]}"
        exit 1
    fi
    
    # Vérification des variables d'environnement
    if [ -z "$DEPLOY_SSH_HOST" ]; then
        log_error "DEPLOY_SSH_HOST non configuré"
        exit 1
    fi
    
    # Vérification de la connexion SSH
    if [ "$DRY_RUN" = false ]; then
        log "Test de connexion SSH..."
        if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}" "echo 'Connexion SSH OK'"; then
            log_error "Échec connexion SSH vers $DEPLOY_SSH_HOST"
            exit 1
        fi
    fi
    
    log "✓ Prérequis vérifiés"
}

# Exécution de commande locale ou distante
run_command() {
    local description="$1"
    local command="$2"
    local remote="${3:-false}"
    
    log_info "$description"
    log_debug "Commande: $command"
    
    if [ "$DRY_RUN" = true ]; then
        log "[DRY-RUN] $command"
        return 0
    fi
    
    if [ "$remote" = true ]; then
        ssh "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}" "cd $DEPLOY_PATH && $command"
    else
        eval "$command"
    fi
    
    if [ $? -ne 0 ]; then
        log_error "Échec: $description"
        exit 1
    fi
}

# Sauvegarde avant déploiement
create_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        log "Sauvegarde ignorée (--skip-backup)"
        return 0
    fi
    
    log "Création de la sauvegarde..."
    
    local backup_name="backup_pre_deploy_$(date +'%Y%m%d_%H%M%S')"
    
    # Sauvegarde de la base de données
    run_command "Sauvegarde base de données" \
        "docker-compose -f $DOCKER_COMPOSE_FILE exec -T db pg_dumpall -U postgres > ${backup_name}.sql" \
        true
    
    # Sauvegarde des fichiers uploads
    run_command "Sauvegarde des uploads" \
        "tar -czf ${backup_name}_uploads.tar.gz ./uploads 2>/dev/null || true" \
        true
    
    # Compression de la sauvegarde
    run_command "Compression des sauvegardes" \
        "tar -czf ${backup_name}.tar.gz ${backup_name}.sql ${backup_name}_uploads.tar.gz 2>/dev/null && rm -f ${backup_name}.sql ${backup_name}_uploads.tar.gz" \
        true
    
    log "✓ Sauvegarde créée: ${backup_name}.tar.gz"
}

# Exécution des tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log "Tests ignorés (--skip-tests)"
        return 0
    fi
    
    log "Exécution des tests..."
    
    # Tests unitaires
    run_command "Tests unitaires" "npm run test:unit"
    
    # Tests d'intégration
    run_command "Tests d'intégration" "npm run test:integration"
    
    # Tests E2E si en staging
    if [ "$ENVIRONMENT" = "staging" ]; then
        run_command "Tests E2E" "npm run test:e2e"
    fi
    
    log "✓ Tous les tests passent"
}

# Build de l'application
build_application() {
    log "Build de l'application..."
    
    # Build des images Docker
    run_command "Build Docker images" "docker-compose -f $DOCKER_COMPOSE_FILE build"
    
    # Build de l'application Node.js
    run_command "Build application" "npm run build"
    
    log "✓ Build terminé"
}

# Déploiement de la nouvelle version
deploy_new_version() {
    log "Déploiement de la nouvelle version..."
    
    # Arrêt des services existants
    run_command "Arrêt des services" \
        "docker-compose -f $DOCKER_COMPOSE_FILE down" \
        true
    
    # Pull des dernières images si utilisant un registry
    if [ -n "$DOCKER_REGISTRY" ]; then
        run_command "Pull des images" \
            "docker-compose -f $DOCKER_COMPOSE_FILE pull" \
            true
    fi
    
    # Démarrage des services
    run_command "Démarrage des services" \
        "docker-compose -f $DOCKER_COMPOSE_FILE up -d" \
        true
    
    # Attente que les services soient ready
    run_command "Attente démarrage services" \
        "sleep 30" \
        true
    
    # Vérification du statut
    run_command "Vérification statut services" \
        "docker-compose -f $DOCKER_COMPOSE_FILE ps" \
        true
    
    log "✓ Nouvelle version déployée"
}

# Exécution des migrations
run_migrations() {
    if [ "$RUN_MIGRATIONS" = false ]; then
        log "Migrations ignorées (--migrate non spécifié)"
        return 0
    fi
    
    log "Exécution des migrations de base de données..."
    
    run_command "Exécution des migrations" \
        "docker-compose -f $DOCKER_COMPOSE_FILE exec -T backend node scripts/migrate.js" \
        true
    
    log "✓ Migrations exécutées"
}

# Rollback vers version précédente
rollback_version() {
    log "Rollback vers version précédente..."
    
    # Arrêt des services actuels
    run_command "Arrêt services actuels" \
        "docker-compose -f $DOCKER_COMPOSE_FILE down" \
        true
    
    # Restauration de la sauvegarde
    local latest_backup=$(ssh "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}" "ls -t ${DEPLOY_PATH}/backup_pre_deploy_*.tar.gz | head -1")
    
    if [ -n "$latest_backup" ]; then
        run_command "Restauration sauvegarde" \
            "tar -xzf $latest_backup && docker-compose -f $DOCKER_COMPOSE_FILE exec -T db psql -U postgres -f ${latest_backup%.tar.gz}.sql" \
            true
    else
        log_warn "Aucune sauvegarde trouvée pour rollback"
    fi
    
    # Démarrage de l'ancienne version
    run_command "Démarrage ancienne version" \
        "docker-compose -f $DOCKER_COMPOSE_FILE up -d" \
        true
    
    log "✓ Rollback effectué"
}

# Vérification de la santé de l'application
health_check() {
    log "Vérification de la santé de l'application..."
    
    local max_attempts=10
    local attempt=1
    local health_endpoint="/api/health"
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Tentative $attempt/$max_attempts..."
        
        local health_status=$(ssh "${DEPLOY_SSH_USER}@${DEPLOY_SSH_HOST}" \
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001$health_endpoint || echo '000'")
        
        if [ "$health_status" = "200" ]; then
            log "✓ Application healthy"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "L'application ne répond pas après $max_attempts tentatives"
    return 1
}

# Nettoyage après déploiement
cleanup() {
    log "Nettoyage après déploiement..."
    
    # Nettoyage des containers Docker inutilisés
    run_command "Nettoyage Docker" "docker system prune -f" true
    
    # Nettoyage des anciennes sauvegardes (garder les 5 dernières)
    run_command "Nettoyage anciennes sauvegardes" \
        "ls -t backup_pre_deploy_*.tar.gz | tail -n +6 | xargs rm -f" \
        true
    
    log "✓ Nettoyage terminé"
}

# Notification du déploiement
send_notification() {
    if [ "$SEND_NOTIFICATIONS" = false ]; then
        return 0
    fi
    
    local status="$1"
    local message="$2"
    
    log "Envoi des notifications..."
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        local slack_payload=$(cat << EOF
{
    "text": "Déploiement $ENVIRONMENT - $status",
    "blocks": [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🚀 Déploiement $ENVIRONMENT - $status"
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": "*Environnement:*\n$ENVIRONMENT"
                },
                {
                    "type": "mrkdwn",
                    "text": "*Statut:*\n$status"
                },
                {
                    "type": "mrkdwn",
                    "text": "*Date:*\n$(date)"
                },
                {
                    "type": "mrkdwn",
                    "text": "*Version:*\n${VERSION:-$(git rev-parse --short HEAD)}"
                }
            ]
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "$message"
            }
        }
    ]
}
EOF
        )
        
        curl -s -X POST -H 'Content-type: application/json' \
            --data "$slack_payload" "$SLACK_WEBHOOK" > /dev/null || log_warn "Échec notification Slack"
    fi
    
    # Email notification (utilisant sendmail ou service similaire)
    if [ -n "$DEPLOY_NOTIFICATION_EMAIL" ]; then
        local email_subject="[BuySell] Déploiement $ENVIRONMENT - $status"
        local email_body="Déploiement $ENVIRONMENT terminé avec statut: $status\n\n$message\n\nDate: $(date)\nVersion: ${VERSION:-$(git rev-parse --short HEAD)}"
        
        echo -e "$email_body" | mail -s "$email_subject" "$DEPLOY_NOTIFICATION_EMAIL" 2>/dev/null || \
        log_warn "Échec notification email"
    fi
    
    log "✓ Notifications envoyées"
}

# Fonction principale de déploiement
deploy() {
    local start_time=$(date +%s)
    
    log "${MAGENTA}
    🚀 Déploiement $ENVIRONMENT - Plateforme Buy/Sell
    ${NC}"
    
    # Affichage configuration
    log_info "Configuration:"
    log_info "• Environnement: $ENVIRONMENT"
    log_info "• Version: ${VERSION:-$(git rev-parse --short HEAD)}"
    log_info "• Migration: $RUN_MIGRATIONS"
    log_info "• Tests: $([ "$SKIP_TESTS" = true ] && echo "Non" || echo "Oui")"
    log_info "• Backup: $([ "$SKIP_BACKUP" = true ] && echo "Non" || echo "Oui")"
    
    if [ "$DRY_RUN" = true ]; then
        log_warn "⚠️  MODE DRY-RUN - Aucune action ne sera exécutée"
    fi
    
    # Rollback si demandé
    if [ "$ROLLBACK" = true ]; then
        rollback_version
        send_notification "ROLLBACK" "Rollback effectué vers version précédente"
        return 0
    fi
    
    # Processus de déploiement
    check_prerequisites
    run_tests
    build_application
    create_backup
    deploy_new_version
    health_check
    run_migrations
    cleanup
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    local success_message="Déploiement réussi en ${duration}s"
    log "✅ $success_message"
    
    send_notification "SUCCÈS" "$success_message"
}

# Gestion des erreurs
error_handler() {
    local exit_code=$?
    local error_message="Échec du déploiement à l'étape: ${LAST_STEP:-inconnue}"
    
    log_error "$error_message"
    
    # Notification d'échec
    if [ "$DRY_RUN" = false ] && [ "$ROLLBACK" = false ]; then
        send_notification "ÉCHEC" "$error_message"
    fi
    
    exit $exit_code
}

# Configuration du trap pour les erreurs
trap error_handler ERR

# Variables pour le suivi des étapes
LAST_STEP=""

# Exécution
main() {
    local step="initialisation"
    LAST_STEP="$step"
    
    load_environment_config
    deploy
}

# Point d'entrée
main "$@"
