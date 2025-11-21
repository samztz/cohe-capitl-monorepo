#!/bin/bash

# ============================================
# One-Click Deployment Script
# Cohe Capital Insurance Platform
# ============================================
#
# PREREQUISITES:
# - Docker and Docker Compose installed
# - Git repository cloned
# - .env file configured (copy from .env.example)
#
# USAGE:
#   ./deploy.sh              # Full deployment
#   ./deploy.sh --build      # Rebuild images before deployment
#   ./deploy.sh --migrate    # Run database migrations ONLY (no deployment)
#   ./deploy.sh --logs       # View logs after deployment
#
# This script should be run from the project root directory
# ============================================

set -e  # Exit immediately if any command fails
set -u  # Treat unset variables as errors
set -o pipefail  # Prevent errors in pipelines from being masked

# ============================================
# Configuration
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="cohe-capital"

# Environment configuration (can be overridden via --env or --prod flag)
ENVIRONMENT="${ENVIRONMENT:-local}"  # local or production

# Docker Compose file configuration (三文件方案)
DOCKER_COMPOSE_BASE="docker-compose.yml"
DOCKER_COMPOSE_OVERRIDE="docker-compose.override.yml"  # 自动加载（本地开发）
DOCKER_COMPOSE_PROD="docker-compose.prod.yml"
DOCKER_COMPOSE_FILES=""  # Will be set based on environment

# Git configuration (customize based on your setup)
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-main}"

# Deployment options (can be overridden via command line)
BUILD_IMAGES=false
RUN_MIGRATIONS=true
SHOW_LOGS=false
PULL_CODE=true
MIGRATE_ONLY=false  # New flag for migration-only mode

# ============================================
# Helper Functions
# ============================================

# Print colored message
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Print section header
print_header() {
    echo ""
    echo "============================================"
    echo "$1"
    echo "============================================"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Set Docker Compose files based on environment
set_compose_files() {
    if [ "$ENVIRONMENT" = "production" ]; then
        # 生产环境：显式指定 base + prod（覆盖 override）
        DOCKER_COMPOSE_FILES="-f $DOCKER_COMPOSE_BASE -f $DOCKER_COMPOSE_PROD"
        log_info "🚀 Environment: PRODUCTION"
        log_info "📁 Using: $DOCKER_COMPOSE_BASE + $DOCKER_COMPOSE_PROD"
        log_info "   (override.yml will be ignored)"
    else
        # 本地开发：只指定 base（会自动加载 override）
        DOCKER_COMPOSE_FILES="-f $DOCKER_COMPOSE_BASE"
        log_info "💻 Environment: LOCAL/DEVELOPMENT"
        log_info "📁 Using: $DOCKER_COMPOSE_BASE + $DOCKER_COMPOSE_OVERRIDE (auto-loaded)"
    fi
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Set compose files based on environment
    set_compose_files

    # Check Docker
    if ! command_exists docker; then
        log_error "Docker is not installed. Please install Docker first."
        log_info "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    log_success "Docker is installed"

    # Check Docker Compose
    if ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose is not available."
        log_info "Please install Docker Compose or update Docker to a version that includes it."
        exit 1
    fi
    log_success "Docker Compose is available"

    # Check if base compose file exists
    if [ ! -f "$DOCKER_COMPOSE_BASE" ]; then
        log_error "Base compose file not found: $DOCKER_COMPOSE_BASE"
        exit 1
    fi
    log_success "Base compose file exists: $DOCKER_COMPOSE_BASE"

    # Check if production compose file exists (when in production mode)
    if [ "$ENVIRONMENT" = "production" ] && [ ! -f "$DOCKER_COMPOSE_PROD" ]; then
        log_error "Production compose file not found: $DOCKER_COMPOSE_PROD"
        exit 1
    fi

    # Check if appropriate .env file exists
    if [ "$ENVIRONMENT" = "production" ]; then
        if [ ! -f .env.production ]; then
            log_warning ".env.production file not found!"
            log_info "Using .env file (ensure it has production values)"
            if [ ! -f .env ]; then
                log_error ".env file also not found!"
                log_info "Please create .env.production or .env from example:"
                log_info "  cp .env.production.example .env.production"
                log_info "  nano .env.production  # Edit with PRODUCTION values"
                exit 1
            fi
        else
            log_success ".env.production exists"
            # Create temporary symlink for Docker Compose
            if [ -L .env ] || [ -f .env ]; then
                log_info "Backing up existing .env to .env.backup"
                mv .env .env.backup
            fi
            ln -s .env.production .env
            log_success "Using .env.production"
        fi
    else
        if [ ! -f .env ]; then
            log_warning ".env file not found!"
            log_info "Please create .env file from .env.local.example:"
            log_info "  cp .env.local.example .env"
            log_info "  nano .env  # Edit with your local configuration"
            exit 1
        fi
        log_success ".env file exists (local development)"
    fi

    # Check if Docker daemon is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    log_success "Docker daemon is running"
}

# Pull latest code from Git
pull_code() {
    if [ "$PULL_CODE" = true ]; then
        print_header "Pulling Latest Code"

        # Check if we're in a Git repository
        if [ ! -d .git ]; then
            log_warning "Not a Git repository. Skipping code pull."
            return
        fi

        log_info "Fetching from remote: $GIT_REMOTE"
        git fetch "$GIT_REMOTE" || {
            log_warning "Failed to fetch from remote. Continuing with local code."
            return
        }

        log_info "Pulling branch: $GIT_BRANCH"
        git pull "$GIT_REMOTE" "$GIT_BRANCH" || {
            log_warning "Failed to pull latest code. Continuing with current state."
            return
        }

        log_success "Code updated successfully"
    else
        log_info "Skipping code pull (--no-pull flag used)"
    fi
}

# Build Docker images
build_images() {
    print_header "Building Docker Images"

    log_info "Building all service images..."
    log_info "This may take several minutes on first run..."

    # Build with no cache if explicitly requested
    if [ "$BUILD_IMAGES" = true ]; then
        docker compose $DOCKER_COMPOSE_FILES build --no-cache || {
            log_error "Failed to build Docker images"
            exit 1
        }
    else
        docker compose $DOCKER_COMPOSE_FILES build || {
            log_error "Failed to build Docker images"
            exit 1
        }
    fi

    log_success "Docker images built successfully"
}

# Run database migrations
run_migrations() {
    if [ "$RUN_MIGRATIONS" = true ]; then
        print_header "Running Database Migrations"

        # Ensure database is running
        log_info "Ensuring database is running..."
        docker compose -f "$DOCKER_COMPOSE_FILE" up -d db

        # Wait for database to be healthy
        log_info "Waiting for database to be ready..."
        local max_attempts=30
        local attempt=0

        while [ $attempt -lt $max_attempts ]; do
            if docker compose -f "$DOCKER_COMPOSE_FILE" exec -T db pg_isready >/dev/null 2>&1; then
                log_success "Database is ready"
                break
            fi
            attempt=$((attempt + 1))
            if [ $attempt -eq $max_attempts ]; then
                log_error "Database failed to become ready after ${max_attempts} attempts"
                exit 1
            fi
            sleep 2
        done

        log_info "Executing Prisma migrations..."

        # Use `docker compose run --rm` for one-off migration task
        # This is safer than exec as it doesn't require API container to be running
        docker compose -f "$DOCKER_COMPOSE_FILE" run --rm api sh -c "cd /app/apps/api && pnpm prisma migrate deploy" || {
            log_error "Migration failed. Check the error output above."
            log_info "Troubleshooting tips:"
            log_info "  1. Check database connection: docker compose logs db"
            log_info "  2. Verify DATABASE_URL in .env is correct"
            log_info "  3. Check if migrations exist: ls apps/api/prisma/migrations/"
            exit 1
        }

        log_success "Database migrations completed successfully"
    else
        log_info "Skipping database migrations"
    fi
}

# Deploy services
deploy_services() {
    print_header "Deploying Services"

    log_info "Starting all services in detached mode..."

    docker compose -f "$DOCKER_COMPOSE_FILE" up -d || {
        log_error "Failed to start services"
        exit 1
    }

    log_success "All services started successfully"

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 5

    # Display service status
    docker compose $DOCKER_COMPOSE_FILES ps
}

# Show deployment summary
show_summary() {
    print_header "Deployment Summary"

    # Get service URLs from .env or use defaults
    # Temporarily disable errexit to safely source .env
    set +e
    source .env 2>/dev/null
    set -e

    WEB_PORT="${WEB_PORT:-3000}"
    ADMIN_PORT="${ADMIN_PORT:-3002}"
    API_PORT="${API_PORT:-3001}"
    NGINX_HTTP_PORT="${NGINX_HTTP_PORT:-80}"

    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo ""
    log_info "Environment: $ENVIRONMENT"
    echo ""
    echo "📍 Service Access URLs:"

    if [ "$ENVIRONMENT" = "production" ]; then
        echo "  Web (User):     http://localhost:${NGINX_HTTP_PORT} (via Nginx)"
        echo "                  http://localhost:${WEB_PORT} (direct)"
        echo "  Admin Panel:    http://localhost:${ADMIN_PORT} (direct)"
        echo "  API:            http://localhost:${NGINX_HTTP_PORT}/api (via Nginx)"
        echo "                  http://localhost:${API_PORT}/api (direct)"
        echo "  API Docs:       http://localhost:${API_PORT}/api-docs"
        echo ""
        log_warning "⚠️  Production mode - database port is NOT exposed for security"
        log_info "💡 Use subdomain (admin.domain.com) for Admin panel in production"
    else
        echo "  Web (User):     http://localhost:${WEB_PORT}  (or http://localhost/ via Nginx)"
        echo "  Admin Panel:    http://localhost:${ADMIN_PORT}"
        echo "  API:            http://localhost:${API_PORT}/api"
        echo "  API Docs:       http://localhost:${API_PORT}/api-docs"
        echo "  Database:       localhost:${DB_PORT:-5432} (Prisma Studio, pgAdmin)"
        echo ""
        log_info "💻 Local development mode - all ports exposed for debugging"
    fi

    echo ""
    echo "📝 Useful Commands:"
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "  View logs:      docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
        echo "  Stop services:  docker compose -f docker-compose.yml -f docker-compose.prod.yml down"
        echo "  Restart:        docker compose -f docker-compose.yml -f docker-compose.prod.yml restart [service]"
    else
        echo "  View logs:      docker compose logs -f [service_name]"
        echo "  Stop services:  docker compose down"
        echo "  Restart:        docker compose restart [service_name]"
    fi
    echo "  Shell access:   docker compose exec [service_name] sh"
    echo "  Check status:   docker compose ps"
    echo ""
}

# View logs
view_logs() {
    if [ "$SHOW_LOGS" = true ]; then
        print_header "Service Logs"
        log_info "Press Ctrl+C to exit logs"
        sleep 2

        # Temporarily disable ERR trap to prevent cleanup on Ctrl+C
        trap - ERR
        set +e

        docker compose $DOCKER_COMPOSE_FILES logs -f

        # Re-enable ERR trap
        set -e
        trap cleanup_on_error ERR
    fi
}

# Cleanup on error (safer version - no auto-down)
cleanup_on_error() {
    log_error "Deployment failed!"
    echo ""
    log_warning "Services may be in a partial state."
    log_info "Please check the status with:"
    log_info "  docker compose ps"
    log_info "  docker compose logs [service_name]"
    echo ""
    log_info "To manually clean up (if needed):"
    log_info "  docker compose down     # Stop all services"
    log_info "  docker compose down -v  # Stop and remove volumes (⚠️ deletes data)"
    echo ""
    exit 1
}

# ============================================
# Parse Command Line Arguments
# ============================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --prod|--production)
                ENVIRONMENT="production"
                shift
                ;;
            --local|--dev)
                ENVIRONMENT="local"
                shift
                ;;
            --build)
                BUILD_IMAGES=true
                shift
                ;;
            --no-pull)
                PULL_CODE=false
                shift
                ;;
            --migrate)
                # Migration-only mode: only run migrations, skip deployment
                MIGRATE_ONLY=true
                RUN_MIGRATIONS=true
                PULL_CODE=false
                BUILD_IMAGES=false
                shift
                ;;
            --logs)
                SHOW_LOGS=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --prod, --production   Deploy in production mode (uses docker-compose.prod.yml)"
                echo "  --local, --dev         Deploy in local mode (default, uses docker-compose.override.yml)"
                echo "  --build                Rebuild Docker images with --no-cache"
                echo "  --no-pull              Skip pulling latest code from Git"
                echo "  --migrate              Run database migrations ONLY (no deployment)"
                echo "  --logs                 Show logs after deployment"
                echo "  --help                 Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                          # Local deployment (auto-loads override.yml)"
                echo "  $0 --prod                   # Production deployment (uses prod.yml)"
                echo "  $0 --prod --build           # Production with image rebuild"
                echo "  $0 --migrate                # Only run migrations"
                echo "  $0 --no-pull --logs         # Deploy without git pull, then show logs"
                echo ""
                echo "Three-file architecture:"
                echo "  docker-compose.yml          → Base configuration (shared)"
                echo "  docker-compose.override.yml → Local development (auto-loaded)"
                echo "  docker-compose.prod.yml     → Production (explicit with --prod)"
                echo ""
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                log_info "Use --help to see available options"
                exit 1
                ;;
        esac
    done
}

# ============================================
# Main Deployment Flow
# ============================================

main() {
    # Parse command line arguments
    parse_arguments "$@"

    # Set error trap (safer version - no auto-down)
    trap cleanup_on_error ERR

    # Deployment steps
    print_header "Starting Deployment: $PROJECT_NAME"

    # Always check prerequisites
    check_prerequisites

    # Migration-only mode: skip full deployment
    if [ "$MIGRATE_ONLY" = true ]; then
        log_info "Running in MIGRATION ONLY mode"
        log_warning "This will NOT deploy/restart services, only run migrations"
        echo ""
        run_migrations
        log_success "Migrations completed (migration-only mode) ✅"
        exit 0
    fi

    # Full deployment flow
    pull_code
    build_images
    deploy_services
    run_migrations
    show_summary
    view_logs

    log_success "Deployment completed successfully! 🚀"
}

# Run main function
main "$@"
