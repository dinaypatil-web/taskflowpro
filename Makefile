# TaskFlow Pro Makefile

.PHONY: help install dev build start stop clean logs test migrate seed

# Default target
help:
	@echo "TaskFlow Pro - Available Commands:"
	@echo ""
	@echo "  install     Install dependencies for all services"
	@echo "  dev         Start development environment"
	@echo "  build       Build all Docker images"
	@echo "  start       Start production environment"
	@echo "  stop        Stop all services"
	@echo "  clean       Clean up containers and volumes"
	@echo "  logs        Show logs from all services"
	@echo "  migrate     Run database migrations"
	@echo "  seed        Seed database with demo data"
	@echo "  test        Run tests"
	@echo "  backup      Create database backup"
	@echo "  restore     Restore database from backup"
	@echo ""

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install
	cd backend && npm install
	cd frontend && npm install

# Development environment
dev:
	@echo "Starting development environment..."
	docker-compose up -d postgres redis
	@echo "Waiting for services to be ready..."
	sleep 10
	cd backend && npm run db:migrate && npm run db:seed
	npm run dev

# Build Docker images
build:
	@echo "Building Docker images..."
	docker-compose build

# Start production environment
start:
	@echo "Starting production environment..."
	cp .env.example .env
	@echo "Please edit .env file with your configuration"
	@echo "Then run: docker-compose up -d"

# Stop all services
stop:
	@echo "Stopping all services..."
	docker-compose down

# Clean up
clean:
	@echo "Cleaning up containers and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Show logs
logs:
	docker-compose logs -f

# Database migrations
migrate:
	@echo "Running database migrations..."
	docker-compose exec backend npm run db:migrate

# Seed database
seed:
	@echo "Seeding database with demo data..."
	docker-compose exec backend npm run db:seed

# Run tests
test:
	@echo "Running tests..."
	cd backend && npm test
	cd frontend && npm test

# Database backup
backup:
	@echo "Creating database backup..."
	mkdir -p backups
	docker-compose exec postgres pg_dump -U taskflow taskflow_pro > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/ directory"

# Restore database
restore:
	@echo "Restoring database..."
	@read -p "Enter backup file path: " backup_file; \
	docker-compose exec -T postgres psql -U taskflow taskflow_pro < $$backup_file

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:3001/api/v1/health || echo "Backend: DOWN"
	@curl -f http://localhost:3000/api/health || echo "Frontend: DOWN"

# Setup production
setup-prod:
	@echo "Setting up production environment..."
	cp .env.example .env
	@echo "Please configure .env file for production"
	@echo "Generate SSL certificates if needed"
	@echo "Then run: make start-prod"

# Start production with SSL
start-prod:
	@echo "Starting production environment with SSL..."
	docker-compose --profile production up -d

# Monitor logs in production
monitor:
	@echo "Monitoring production logs..."
	docker-compose logs -f --tail=100

# Update application
update:
	@echo "Updating TaskFlow Pro..."
	git pull origin main
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	docker-compose exec backend npm run db:migrate
	@echo "Update completed"