# TaskFlow Pro Deployment Guide

This guide covers deploying TaskFlow Pro in various environments.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

## Quick Start with Docker

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd taskflow-pro
   cp .env.example .env
   ```

2. **Configure Environment**
   Edit `.env` file with your settings:
   ```bash
   # Required: Change these for production
   POSTGRES_PASSWORD=your_secure_password
   REDIS_PASSWORD=your_redis_password
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
   
   # Optional: Email and SMS configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Start Services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize Database**
   ```bash
   docker-compose exec backend npm run db:migrate
   docker-compose exec backend npm run db:seed
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs

## Production Deployment

### 1. Environment Configuration

Create production `.env`:
```bash
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1

# Use strong passwords
POSTGRES_PASSWORD=very_secure_production_password
REDIS_PASSWORD=very_secure_redis_password
JWT_SECRET=production-jwt-secret-minimum-32-characters-long
JWT_REFRESH_SECRET=production-refresh-secret-minimum-32-characters-long

# Production email settings
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Production SMS settings
TWILIO_ACCOUNT_SID=your-production-twilio-sid
TWILIO_AUTH_TOKEN=your-production-twilio-token
```

### 2. SSL Configuration

1. **Obtain SSL Certificate**
   ```bash
   # Using Let's Encrypt
   certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
   ```

2. **Copy certificates to nginx/ssl/**
   ```bash
   mkdir -p nginx/ssl
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
   ```

3. **Enable HTTPS in nginx.conf**
   Uncomment the HTTPS server block in `nginx/nginx.conf`

### 3. Deploy with Production Profile

```bash
docker-compose --profile production up -d
```

## Cloud Deployment

### AWS Deployment

1. **EC2 Instance Setup**
   ```bash
   # Launch Ubuntu 22.04 LTS instance
   # Install Docker and Docker Compose
   sudo apt update
   sudo apt install docker.io docker-compose-plugin
   sudo usermod -aG docker ubuntu
   ```

2. **RDS PostgreSQL**
   - Create RDS PostgreSQL instance
   - Update `DATABASE_URL` in `.env`

3. **ElastiCache Redis**
   - Create ElastiCache Redis cluster
   - Update Redis configuration in `.env`

4. **Application Load Balancer**
   - Configure ALB for HTTPS termination
   - Route traffic to EC2 instances

### Docker Swarm Deployment

1. **Initialize Swarm**
   ```bash
   docker swarm init
   ```

2. **Deploy Stack**
   ```bash
   docker stack deploy -c docker-compose.yml taskflow
   ```

### Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests.

## Monitoring and Logging

### 1. Application Logs

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Log files location
./backend/logs/error.log
./backend/logs/combined.log
```

### 2. Health Checks

- Backend: `GET /api/v1/health`
- Frontend: `GET /api/health`
- Database: Built-in Docker health checks

### 3. Monitoring Setup

Add monitoring services to `docker-compose.yml`:

```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Backup and Recovery

### 1. Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U taskflow taskflow_pro > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U taskflow taskflow_pro < backup.sql
```

### 2. Redis Backup

```bash
# Redis automatically creates snapshots in /data volume
docker-compose exec redis redis-cli BGSAVE
```

### 3. Automated Backups

Create backup script:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U taskflow taskflow_pro > "backups/db_backup_$DATE.sql"
# Upload to S3 or other storage
```

## Scaling

### 1. Horizontal Scaling

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
  
  frontend:
    deploy:
      replicas: 2
```

### 2. Load Balancing

Configure nginx upstream with multiple backend instances:

```nginx
upstream backend {
    server backend_1:3001;
    server backend_2:3001;
    server backend_3:3001;
}
```

## Security Checklist

- [ ] Change default passwords
- [ ] Use HTTPS in production
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Environment variable security

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose ps postgres
   docker-compose logs postgres
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   docker-compose ps redis
   docker-compose exec redis redis-cli ping
   ```

3. **Email Not Sending**
   - Verify SMTP credentials
   - Check firewall rules for port 587/465
   - Test with telnet: `telnet smtp.gmail.com 587`

4. **SMS Not Sending**
   - Verify Twilio credentials
   - Check account balance
   - Verify phone number format

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
   CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_at);
   ```

2. **Redis Caching**
   - Enable Redis persistence
   - Configure memory limits
   - Monitor cache hit rates

3. **Frontend Optimization**
   - Enable gzip compression
   - Configure CDN for static assets
   - Implement service worker caching

## Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Test network connectivity
4. Review security groups/firewall rules

## Updates

To update TaskFlow Pro:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations if needed
docker-compose exec backend npm run db:migrate
```