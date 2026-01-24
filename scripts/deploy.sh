#!/bin/bash

# TaskFlow Pro Deployment Script
set -e

echo "🚀 TaskFlow Pro Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are installed"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        log_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        log_warning "Please edit .env file with your configuration before continuing."
        read -p "Press Enter to continue after editing .env file..."
    fi
    log_success ".env file found"
}

# Validate environment variables
validate_env() {
    log_info "Validating environment variables..."
    
    required_vars=(
        "POSTGRES_PASSWORD"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    log_success "Environment variables validated"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    docker-compose build --no-cache
    log_success "Docker images built successfully"
}

# Start services
start_services() {
    log_info "Starting services..."
    docker-compose up -d
    log_success "Services started"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    log_info "Waiting for PostgreSQL..."
    timeout=60
    while ! docker-compose exec -T postgres pg_isready -U taskflow -d taskflow_pro > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            log_error "PostgreSQL failed to start within 60 seconds"
            exit 1
        fi
    done
    log_success "PostgreSQL is ready"
    
    # Wait for Redis
    log_info "Waiting for Redis..."
    timeout=30
    while ! docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            log_error "Redis failed to start within 30 seconds"
            exit 1
        fi
    done
    log_success "Redis is ready"
    
    # Wait for Backend
    log_info "Waiting for Backend API..."
    timeout=120
    while ! curl -f http://localhost:3001/api/v1/health > /dev/null 2>&1; do
        sleep 5
        timeout=$((timeout - 5))
        if [ $timeout -le 0 ]; then
            log_error "Backend API failed to start within 120 seconds"
            docker-compose logs backend
            exit 1
        fi
    done
    log_success "Backend API is ready"
    
    # Wait for Frontend
    log_info "Waiting for Frontend..."
    timeout=60
    while ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; do
        sleep 5
        timeout=$((timeout - 5))
        if [ $timeout -le 0 ]; then
            log_error "Frontend failed to start within 60 seconds"
            docker-compose logs frontend
            exit 1
        fi
    done
    log_success "Frontend is ready"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    docker-compose exec backend npm run db:migrate
    log_success "Database migrations completed"
}

# Seed database
seed_database() {
    log_info "Seeding database with demo data..."
    docker-compose exec backend npm run db:seed
    log_success "Database seeded successfully"
}

# Show deployment summary
show_summary() {
    echo ""
    echo "🎉 TaskFlow Pro Deployment Complete!"
    echo "====================================="
    echo ""
    echo "Services are running at:"
    echo "  📱 Frontend:  http://localhost:3000"
    echo "  🔧 Backend:   http://localhost:3001"
    echo "  📚 API Docs:  http://localhost:3001/api/docs"
    echo ""
    echo "Demo Account:"
    echo "  📧 Email:     demo@taskflowpro.com"
    echo "  🔑 Password:  Demo123!"
    echo ""
    echo "Useful Commands:"
    echo "  📊 View logs:     docker-compose logs -f"
    echo "  🛑 Stop services: docker-compose down"
    echo "  🔄 Restart:       docker-compose restart"
    echo "  💾 Backup DB:     make backup"
    echo ""
}

# Main deployment process
main() {
    echo "Starting TaskFlow Pro deployment..."
    echo ""
    
    # Pre-deployment checks
    check_docker
    check_env
    validate_env
    
    # Deployment steps
    build_images
    start_services
    wait_for_services
    run_migrations
    seed_database
    
    # Post-deployment
    show_summary
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "update")
        log_info "Updating TaskFlow Pro..."
        docker-compose down
        git pull origin main
        build_images
        start_services
        wait_for_services
        run_migrations
        log_success "Update completed"
        ;;
    "stop")
        log_info "Stopping TaskFlow Pro..."
        docker-compose down
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting TaskFlow Pro..."
        docker-compose restart
        wait_for_services
        log_success "Services restarted"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "health")
        log_info "Checking service health..."
        curl -f http://localhost:3001/api/v1/health | jq '.' || log_error "Backend health check failed"
        curl -f http://localhost:3000/api/health | jq '.' || log_error "Frontend health check failed"
        ;;
    *)
        echo "Usage: $0 {deploy|update|stop|restart|logs|health}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (default)"
        echo "  update   - Update and redeploy"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - Show service logs"
        echo "  health   - Check service health"
        exit 1
        ;;
esac